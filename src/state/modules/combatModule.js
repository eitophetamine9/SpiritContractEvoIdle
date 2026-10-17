import {
  getScalingProfile,
  getSpiritUltimate,
  getElementalMultiplier,
  getSpiritRole
} from '../../data/spiritsData.js';
import { getEnemyForStage, getSwarmForStage } from '../../data/madnessZoneData.js';
import {
  GREEK_GOD_SETS,
  RELIC_SLOT_TYPES,
  createRelicInstance
} from '../../data/equipmentData.js';
import { ENERGY_ENTRY_COST } from '../constants.js';

export const combatMethods = {
  toggleMadnessEngagement() {
    const mz = this.state.madnessZone;
    mz.isEngaged = mz.isEngaged === false ? true : false;
    this.save();
    this.emit('madnessZoneUpdated', mz);
    return mz.isEngaged;
  },

  /**
   * Selects an enemy attack target from living party spirits:
   * 1. 100% priority to any spirit under active [TAUNT LOCK] (Tank aggro).
   * 2. Otherwise selects via weighted random according to Effective Threat score.
   */
  selectCombatTarget(livingSpirits) {
    if (!Array.isArray(livingSpirits) || livingSpirits.length === 0) return null;
    if (livingSpirits.length === 1) return livingSpirits[0];

    // 1. Check for Active Taunt Lock
    const tauntingSpirits = livingSpirits.filter(s => (s.tauntTimer || 0) > 0);
    if (tauntingSpirits.length > 0) {
      if (tauntingSpirits.length === 1) return tauntingSpirits[0];
      return tauntingSpirits[Math.floor(Math.random() * tauntingSpirits.length)];
    }

    // 2. Weighted Random by Effective Threat
    const weights = livingSpirits.map(spirit => {
      const stats = this.getSpiritCombatStats(spirit);
      return Math.max(1, stats ? stats.effectiveThreat : 50);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;

    for (let i = 0; i < livingSpirits.length; i++) {
      if (rand < weights[i]) {
        return livingSpirits[i];
      }
      rand -= weights[i];
    }

    return livingSpirits[0];
  },

  /**
   * Calculates DEF damage reduction: DamageTaken = RawDamage * (350 / (350 + DEF))
   */
  calculateDamageMitigation(rawDamage, def) {
    const safeDef = Math.max(0, def || 0);
    const mitigationMultiplier = 350 / (350 + safeDef);
    const mitigatedDamage = Math.max(1, Math.round(rawDamage * mitigationMultiplier));
    const defMitigated = Math.max(0, rawDamage - mitigatedDamage);
    return {
      mitigatedDamage,
      defMitigated,
      mitigationMultiplier
    };
  },

  /**
   * Activates Taunt Lock on a spirit
   */
  setSpiritTauntLock(spiritId, durationSec = 6.0) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;
    spirit.tauntTimer = durationSec;
    this.emit('tauntLockActivated', { spirit, duration: durationSec });
    return true;
  },

  /**
   * Madness Zone Two-Way Combat Loop
   * Living spirits attack living swarm enemies & accumulate Mana
   * At 100 MP, spirits unleash Ultimates (AoE, Heals, Shields, Executes)
   * Enemies fight back on cooldowns, targeting based on Threat and Taunt
   * DEF reduces incoming enemy damage according to 350 / (350 + DEF)
   * Revives whole party on Floor Boss Victory; Resets to Wave 1 on Party Wipeout
   */
  tickMadnessCombat(deltaSec) {
    const { madnessZone } = this.state;
    if (madnessZone.isEngaged === false) return;

    if (!madnessZone.currentSwarm || madnessZone.currentSwarm.length === 0) {
      this.spawnMadnessEnemy();
      return;
    }

    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    const livingEnemies = madnessZone.currentSwarm.filter(e => !e.isDefeated && e.hp > 0);

    // 1. Check for Party Wipeout (All party members fallen)
    if (livingSpirits.length === 0 && party.length > 0) {
      madnessZone.subStage = 1;
      const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
      const initShieldPct = (constBonuses.initialShieldPercent || 0) / 100;
      party.forEach(s => {
        s.currentHp = s.maxHp;
        s.currentMp = (s.ascensionLevel >= 3) ? 15 : 0;
        s.shieldHp = Math.round(s.maxHp * initShieldPct);
        s.isFallen = false;
        s.tauntTimer = 0;
      });
      this.spawnMadnessEnemy();
      this.emit('partyWiped', {
        stage: madnessZone.stage,
        message: 'Party wiped out! Regrouping at Wave 1...'
      });
      this.emit('madnessZoneUpdated', madnessZone);
      return;
    }

    // 2. Check if all enemies in swarm defeated
    if (livingEnemies.length === 0) {
      this.onSwarmCleared();
      return;
    }

    // Frontline target enemy
    const leadEnemy = livingEnemies[0];

    // 3. Spirits Attack, Mana Accumulation & 4-pc Set Bonus Procs
    for (const spirit of livingSpirits) {
      // Tick taunt decay
      if (spirit.tauntTimer > 0) {
        spirit.tauntTimer = Math.max(0, spirit.tauntTimer - deltaSec);
      }
      if (spirit._atlasShieldCooldown > 0) {
        spirit._atlasShieldCooldown = Math.max(0, spirit._atlasShieldCooldown - deltaSec);
      }

      // Effective power including weapons, relics, substats, and 2-pc set bonuses
      const effectivePower = this.getSpiritTotalPower(spirit);
      const elemMult = getElementalMultiplier(spirit.element, leadEnemy.element || 'EARTH');

      // Backline Sanctuary Perk: +15% ATK
      const stats = this.getSpiritCombatStats(spirit);
      const posAtkMult = (stats && stats.formationColumn === 'back') ? 1.15 : 1.0;

      const baseDps = Math.max(1, Math.round(effectivePower * 0.45 * elemMult * posAtkMult));
      const damageThisTick = baseDps * deltaSec;
      leadEnemy.hp = Math.max(0, leadEnemy.hp - damageThisTick);

      // Attack animation cadence (staggered ~1.1s - 1.5s so party members swing rhythmically)
      spirit._attackAnimTimer = (spirit._attackAnimTimer || (0.4 + Math.random() * 0.8)) - deltaSec;
      if (spirit._attackAnimTimer <= 0) {
        spirit._attackAnimTimer = 1.2 + Math.random() * 0.4;
        this.emit('combatStrike', {
          attackerType: 'spirit',
          spirit,
          targetEnemy: leadEnemy,
          zone: 'madness'
        });
      }

      // Mana Accumulation with Mana Replenish modifiers (Zeus 2pc, Hades 2pc, Apollo 2pc, Pendant relic)
      const activeBonuses = this.getSpiritActiveSetBonuses(spirit);
      let manaBonusMult = 1;
      for (const b of activeBonuses) {
        if (b.bonus.manaReplenishBonus) {
          manaBonusMult += b.bonus.manaReplenishBonus;
        }
      }
      const mpGain = 20 * manaBonusMult * deltaSec;
      spirit.currentMp = Math.min(spirit.maxMp || 100, (spirit.currentMp || 0) + mpGain);

      // Trigger Ultimate at 100 MP
      if (spirit.currentMp >= 100) {
        spirit.currentMp = 0;
        this.procSpiritUltimate(spirit);
      }

      // Check 4-piece Greek God Set Bonus procs
      for (const b of activeBonuses) {
        if (b.tier === '4pc') {
          const cdKey = `${spirit.id}_${b.setId}`;
          this.setBonusCooldowns[cdKey] = (this.setBonusCooldowns[cdKey] || 0) - deltaSec;
          if (this.setBonusCooldowns[cdKey] <= 0) {
            this.setBonusCooldowns[cdKey] = b.bonus.cooldownSec || 30;
            this.proc4PieceSetBonus(spirit, b);
          }
        }
      }

      // Check if lead enemy died from basic attack
      if (leadEnemy.hp <= 0 && !leadEnemy.isDefeated) {
        this.onIndividualEnemyKilled(leadEnemy);
        break;
      }
    }

    // Keep currentEnemy in sync with lead living enemy
    madnessZone.currentEnemy = livingEnemies.find(e => !e.isDefeated && e.hp > 0) || null;

    // 4. Enemies Fight Back (Counter-attacks on cooldown timers with Evasion check & Threat Targeting)
    for (const enemy of livingEnemies) {
      if (enemy.hp <= 0 || enemy.isDefeated) continue;

      enemy.attackTimer = (enemy.attackTimer || 2.0) - deltaSec;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackCooldown || 2.4;

        // Select target spirit using Threat Aggro & Taunt Lock algorithm
        let targetSpirit = this.selectCombatTarget(livingSpirits);
        if (targetSpirit) {
          // Atlas 4-pc Guardian Interception: Intercept low-HP ally attacks
          const partyBonuses = this.getPartyActiveSetBonuses();
          const atlasBearerBonus = partyBonuses.find(b => b.setId === 'atlas' && b.tier === '4pc' && b.spirit && !b.spirit.isFallen);

          if (atlasBearerBonus && atlasBearerBonus.spirit.id !== targetSpirit.id) {
            const allyStats = this.getSpiritCombatStats(targetSpirit);
            const allyHpMax = allyStats ? allyStats.maxHp : (targetSpirit.maxHp || 100);
            if ((targetSpirit.currentHp / allyHpMax) < 0.35) {
              targetSpirit = atlasBearerBonus.spirit;
              if (!targetSpirit._atlasShieldCooldown || targetSpirit._atlasShieldCooldown <= 0) {
                const atlasStats = this.getSpiritCombatStats(targetSpirit);
                const shieldAmt = Math.round((atlasStats ? atlasStats.maxHp : 300) * 0.30);
                targetSpirit.shieldHp = (targetSpirit.shieldHp || 0) + shieldAmt;
                targetSpirit._atlasShieldCooldown = 15.0;
                this.emit('combatEffect', { type: 'atlas_interception', spirit: targetSpirit, text: 'Atlas Interception!' });
              }
            }
          }

          // Check Evasion (Hermes 2pc +15% evasion, Feather relic)
          const targetBonuses = this.getSpiritActiveSetBonuses(targetSpirit);
          let evasionChance = 0.05;
          for (const b of targetBonuses) {
            if (b.bonus.evasionBonus) evasionChance += b.bonus.evasionBonus;
          }
          if (Math.random() < evasionChance) {
            this.emit('spiritEvaded', { spirit: targetSpirit });
            continue;
          }

          const enemyElemMult = getElementalMultiplier(enemy.element || 'EARTH', targetSpirit.element || 'EARTH');
          let rawEnemyDamage = Math.max(1, Math.round(enemy.power * enemyElemMult * (0.8 + Math.random() * 0.35)));

          // Atlas 4-pc Party-wide Damage Mitigation (-12% team damage taken)
          if (atlasBearerBonus) {
            rawEnemyDamage = Math.max(1, Math.round(rawEnemyDamage * 0.88));
          }

          // Constellation damage mitigation (Phoenix: Eternal Avatar)
          const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
          if (constBonuses.damageMitigationPercent) {
            rawEnemyDamage = Math.max(1, Math.round(rawEnemyDamage * (1 - constBonuses.damageMitigationPercent / 100)));
          }

          // Apply DEF Mitigation Formula (350 / (350 + DEF))
          const targetStats = this.getSpiritCombatStats(targetSpirit);
          const { mitigatedDamage, defMitigated } = this.calculateDamageMitigation(rawEnemyDamage, targetStats ? targetStats.def : 20);
          let finalDamage = mitigatedDamage;

          // Absorb damage with shield first
          let shieldAbsorbed = 0;
          if (targetSpirit.shieldHp > 0) {
            shieldAbsorbed = Math.min(targetSpirit.shieldHp, finalDamage);
            targetSpirit.shieldHp -= shieldAbsorbed;
            finalDamage -= shieldAbsorbed;
          }

          // Apply remaining damage to HP
          targetSpirit.currentHp = Math.max(0, targetSpirit.currentHp - finalDamage);
          if (targetSpirit.currentHp <= 0) {
            targetSpirit.isFallen = true;
            targetSpirit.currentHp = 0;
            this.emit('spiritDefeated', targetSpirit);
          }

          this.emit('enemyCounterAttack', {
            enemy,
            targetSpirit,
            damage: finalDamage,
            rawDamage: rawEnemyDamage,
            defMitigated,
            shieldAbsorbed,
            isTauntedTarget: (targetSpirit.tauntTimer || 0) > 0
          });

          this.emit('combatStrike', {
            attackerType: 'enemy',
            enemy,
            targetSpirit,
            damage: finalDamage,
            zone: 'madness'
          });
        }
      }
    }
  },

  /**
   * Spirit Ultimate Execution with Role-Specific Enhancements
   * - Tanks: Apply party-wide shields and activate 6s Taunt Lock
   * - Main DPS: Factor in Critical Strike (Crit Rate & Crit DMG)
   * - Healers: Factor in Heal Amplification (Backline Sanctuary +15%)
   */
  procSpiritUltimate(spirit) {
    const ult = getSpiritUltimate(spirit.speciesId);
    const { madnessZone } = this.state;
    const livingEnemies = (madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    const fallenSpirits = party.filter(s => s.isFallen || s.currentHp <= 0);

    const spiritStats = this.getSpiritCombatStats(spirit);
    const role = spiritStats ? spiritStats.role : getSpiritRole(spirit.speciesId);

    // TANK SPECIAL: Activate 6-second Taunt Lock and grant party shield
    const scaling = spiritStats?.scalingProfile || getScalingProfile(spirit.speciesId);
    const rebirthTier = spirit.ascensionLevel !== undefined ? spirit.ascensionLevel : (spirit.rebirthLevel || 0);
    const rebirthBurstMult = (rebirthTier >= 3) ? 1.25 : 1.0;
    const rebirthScalingRatioMult = (rebirthTier >= 5) ? 1.20 : 1.0;

    // TANK SPECIAL: Activate 6-second Taunt Lock and grant party shield
    if (role === 'TANK') {
      spirit.tauntTimer = 6.0;
      let tankShieldAmount = 40;
      if (scaling && scaling.primaryStat === 'def') {
        const tankDef = spiritStats ? spiritStats.def : 40;
        tankShieldAmount = Math.max(40, Math.round(tankDef * (scaling.shieldRatio || 2.5) * rebirthScalingRatioMult));
      } else {
        const tankHp = spiritStats ? spiritStats.maxHp : (spirit.maxHp || 400);
        tankShieldAmount = Math.max(40, Math.round(tankHp * (scaling.shieldRatio || 0.30) * rebirthScalingRatioMult));
      }
      for (const ally of livingSpirits) {
        ally.shieldHp = (ally.shieldHp || 0) + tankShieldAmount;
      }
      this.emit('tauntLockActivated', { spirit, duration: 6.0, shieldAmount: tankShieldAmount });
    }

    // CRITICAL STRIKE CHECK (for DPS roles)
    let isCrit = false;
    let critMult = 1.0;
    if (role === 'MAIN_DPS' || role === 'SUB_DPS') {
      const critRoll = Math.random() * 100;
      if (spiritStats && critRoll < spiritStats.critRate) {
        isCrit = true;
        critMult = spiritStats.critDmg / 100;
      }
    }

    // HEAL AMPLIFICATION (for Healer roles, e.g. Backline Sanctuary Perk)
    const healAmp = (spiritStats && spiritStats.healAmp) ? spiritStats.healAmp : 1.0;

    let totalDamageDealt = 0;
    let totalHealingDone = 0;
    const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
    const ultAmpMult = 1 + ((constBonuses.ultAmp || 0) / 100);
    let ascUltMult = ((spirit.ascensionLevel >= 5) ? 1.20 : 1.0) * ultAmpMult * critMult * rebirthBurstMult;

    switch (ult.type) {
      case 'AOE_DAMAGE': {
        const damagePerEnemy = Math.max(1, Math.round(spirit.power * ult.multiplier * ascUltMult));
        for (const enemy of livingEnemies) {
          enemy.hp = Math.max(0, enemy.hp - damagePerEnemy);
          totalDamageDealt += damagePerEnemy;
          if (enemy.hp <= 0) {
            this.onIndividualEnemyKilled(enemy);
          }
        }
        break;
      }
      case 'DAMAGE': {
        if (livingEnemies.length > 0) {
          const target = livingEnemies[0];
          let dmgMult = ascUltMult;
          if (role === 'MAIN_DPS' && target.maxHp && (target.hp / target.maxHp) <= 0.35) {
            dmgMult *= 1.35; // Execute bonus under 35% HP
            if (rebirthTier >= 6) dmgMult *= 1.35; // Rebirth VI Zenith Executioner
          }
          const damage = Math.max(1, Math.round(spirit.power * ult.multiplier * dmgMult));
          target.hp = Math.max(0, target.hp - damage);
          totalDamageDealt = damage;
          if (target.hp <= 0) {
            this.onIndividualEnemyKilled(target);
          }
        }
        break;
      }
      case 'EXECUTE': {
        if (livingEnemies.length > 0) {
          const sorted = [...livingEnemies].sort((a, b) => a.hp - b.hp);
          const target = sorted[0];
          let dmgMult = ascUltMult;
          if (target.maxHp && (target.hp / target.maxHp) <= 0.35) {
            dmgMult *= 1.35;
            if (rebirthTier >= 6) dmgMult *= 1.35;
          }
          const damage = Math.max(1, Math.round(spirit.power * ult.multiplier * dmgMult));
          target.hp = Math.max(0, target.hp - damage);
          totalDamageDealt = damage;
          if (target.hp <= 0) {
            this.onIndividualEnemyKilled(target);
          }
        }
        break;
      }
      case 'HEAL': {
        let baseHealAmount = null;
        if (scaling && scaling.primaryStat === 'hp') {
          const sourceHp = spiritStats ? spiritStats.maxHp : (spirit.maxHp || 500);
          const ratio = (scaling.healRatio || 0.14) * rebirthScalingRatioMult;
          baseHealAmount = Math.max(30, Math.round((sourceHp * ratio + (scaling.healBase || 100)) * healAmp * rebirthBurstMult));
        } else if (scaling && scaling.primaryStat === 'atk') {
          const sourceAtk = spiritStats ? spiritStats.atk : (spirit.power || 50);
          const ratio = (scaling.healRatio || 1.6) * rebirthScalingRatioMult;
          let critHealMult = 1.0;
          if (scaling.canCrit && spiritStats) {
            const critRoll = Math.random() * 100;
            if (critRoll < spiritStats.critRate) {
              critHealMult = (spiritStats.critDmg / 100) * (scaling.critHealMult || 1.0);
            }
          }
          baseHealAmount = Math.max(30, Math.round((sourceAtk * ratio + (scaling.healBase || 80)) * healAmp * critHealMult * rebirthBurstMult));
        }

        // Rebirth VI: Healer signature single-battle revive
        if (rebirthTier >= 6 && !spirit._rebirthReviveUsed && fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = Math.max(1, Math.round(allyToRevive.maxHp * 0.50));
          spirit._rebirthReviveUsed = true;
          totalHealingDone += allyToRevive.currentHp;
        } else if (fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = baseHealAmount ? Math.min(allyToRevive.maxHp, baseHealAmount) : Math.max(1, Math.round(allyToRevive.maxHp * 0.30));
          totalHealingDone += allyToRevive.currentHp;
        }

        for (const ally of livingSpirits) {
          const heal = baseHealAmount ? Math.min(ally.maxHp, baseHealAmount) : Math.round(ally.maxHp * ((ult.healPercent || 30) / 100) * healAmp);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
          totalHealingDone += heal;
        }
        break;
      }
      case 'SUPPORT': {
        let baseHealAmount = null;
        if (scaling && scaling.primaryStat === 'hp') {
          const sourceHp = spiritStats ? spiritStats.maxHp : (spirit.maxHp || 500);
          const ratio = (scaling.healRatio || 0.12) * rebirthScalingRatioMult;
          baseHealAmount = Math.max(20, Math.round((sourceHp * ratio + 50) * healAmp * rebirthBurstMult));
        } else if (scaling && scaling.primaryStat === 'atk') {
          const sourceAtk = spiritStats ? spiritStats.atk : (spirit.power || 50);
          const ratio = (scaling.healRatio || 1.2) * rebirthScalingRatioMult;
          baseHealAmount = Math.max(20, Math.round((sourceAtk * ratio + 50) * healAmp * rebirthBurstMult));
        }
        const shieldRatio = (ult.shieldPercent || 20) / 100;

        if (fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = baseHealAmount ? Math.min(allyToRevive.maxHp, baseHealAmount) : Math.max(1, Math.round(allyToRevive.maxHp * 0.20));
          totalHealingDone += allyToRevive.currentHp;
        }

        for (const ally of livingSpirits) {
          const effHeal = baseHealAmount ? Math.min(ally.maxHp, baseHealAmount) : Math.round(ally.maxHp * ((ult.healPercent || 20) / 100) * healAmp);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + effHeal);
          ally.shieldHp = (ally.shieldHp || 0) + Math.round(ally.maxHp * shieldRatio);
          totalHealingDone += effHeal;
        }

        // Rebirth VI: Support restores +15 MP to all allies
        if (rebirthTier >= 6) {
          for (const ally of livingSpirits) {
            ally.currentMp = Math.min(ally.maxMp || 100, (ally.currentMp || 0) + 15);
          }
        }
        break;
      }
      case 'AOE_DAMAGE_AND_HEAL': {
        const damagePerEnemy = Math.max(1, Math.round(spirit.power * (ult.multiplier || 3.0) * critMult));
        for (const enemy of livingEnemies) {
          enemy.hp = Math.max(0, enemy.hp - damagePerEnemy);
          totalDamageDealt += damagePerEnemy;
          if (enemy.hp <= 0) {
            this.onIndividualEnemyKilled(enemy);
          }
        }
        const healRatio = ((ult.healPercent || 25) / 100) * healAmp;
        if (fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = Math.max(1, Math.round(allyToRevive.maxHp * healRatio));
          totalHealingDone += allyToRevive.currentHp;
        }
        for (const ally of livingSpirits) {
          const heal = Math.round(ally.maxHp * healRatio);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
          totalHealingDone += heal;
        }
        break;
      }
    }

    this.emit('ultimateCast', {
      spirit,
      ult,
      totalDamageDealt,
      totalHealingDone,
      isCrit,
      role
    });

    this.emit('combatStrike', {
      attackerType: 'spirit',
      spirit,
      targetEnemy: livingEnemies[0] || null,
      isUltimate: true,
      zone: 'madness'
    });
  },

  /**
   * Manual Party Attack Click Action
   * Deals burst damage to frontline enemy and awards +10 MP to all living party spirits
   */
  attackEnemyWithPartyPower() {
    const { madnessZone } = this.state;
    if (!madnessZone.currentSwarm || madnessZone.currentSwarm.length === 0) {
      this.spawnMadnessEnemy();
      return { damage: 0, killed: false };
    }

    const livingEnemies = madnessZone.currentSwarm.filter(e => !e.isDefeated && e.hp > 0);
    if (livingEnemies.length === 0) {
      return { damage: 0, killed: false };
    }

    const enemy = livingEnemies[0];
    const partyPower = this.getTotalPartyPower();

    // Check if Main DPS in party triggers a Critical Click
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    let isCrit = false;
    let critMult = 1.0;
    const dpsSpirit = livingSpirits.find(s => getSpiritRole(s) === 'MAIN_DPS');
    if (dpsSpirit) {
      const dpsStats = this.getSpiritCombatStats(dpsSpirit);
      if (dpsStats && Math.random() * 100 < dpsStats.critRate) {
        isCrit = true;
        critMult = dpsStats.critDmg / 100;
      }
    }

    const damage = Math.max(1, Math.round(partyPower * 0.45 * critMult));
    enemy.hp = Math.max(0, enemy.hp - damage);

    // Active tapping charges +4 MP on all living party spirits
    party.forEach(s => {
      if (!s.isFallen) {
        s.currentMp = Math.min(s.maxMp || 100, (s.currentMp || 0) + 10);
        if (s.currentMp >= 100) {
          s.currentMp = 0;
          this.procSpiritUltimate(s);
        }
      }
    });

    let killed = false;
    if (enemy.hp <= 0) {
      this.onIndividualEnemyKilled(enemy);
      killed = true;
    }

    this.emit('partyAttack', {
      damage,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      killed,
      isCrit
    });

    this.emit('manualPartyStrike', {
      livingSpirits,
      leadEnemy: enemy,
      damage,
      isCrit,
      zone: 'madness'
    });

    return { damage, killed, remainingHp: enemy.hp, isCrit };
  },

  spawnMadnessEnemy() {
    const { stage, subStage } = this.state.madnessZone;
    const swarm = getSwarmForStage(stage, subStage);
    this.state.madnessZone.currentSwarm = swarm;
    this.state.madnessZone.currentEnemy = swarm[0] || null;
    this.emit('enemySpawned', this.state.madnessZone.currentEnemy);
    this.emit('swarmSpawned', this.state.madnessZone.currentSwarm);
  },

  onIndividualEnemyKilled(enemy) {
    if (enemy.isDefeated) return;
    enemy.isDefeated = true;
    enemy.hp = 0;

    const shardsGained = enemy.shardReward || 0;
    let essenceGained = enemy.essenceReward || 0;
    if (enemy.isBoss) {
      const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
      if (constBonuses.bonusAstralDropChance && Math.random() < (constBonuses.bonusAstralDropChance / 100)) {
        essenceGained += 1;
      }
    }

    this.state.resources.spiritShards += shardsGained;
    this.state.resources.soulEssence += essenceGained;
    this.state.stats.shardsEarnedTotal += shardsGained;
    this.state.stats.totalEnemiesDefeated += 1;

    this.emit('enemyDefeated', {
      enemy,
      shardsGained,
      essenceGained
    });

    // 35% chance for Overlord Boss to drop a random Greek God Relic
    if (enemy.isBoss && Math.random() < 0.35) {
      const godKeys = Object.keys(GREEK_GOD_SETS);
      const randomGod = godKeys[Math.floor(Math.random() * godKeys.length)];
      const randomSlot = RELIC_SLOT_TYPES[Math.floor(Math.random() * RELIC_SLOT_TYPES.length)];
      const rolledRelic = createRelicInstance({
        setId: randomGod,
        slotTypeId: randomSlot.id,
        rarity: Math.random() < 0.65 ? 'UNCOMMON' : 'RARE',
        level: Math.max(1, Math.min(4, Math.floor(this.state.madnessZone.stage / 25) + 1))
      });
      if (!this.state.inventory) this.state.inventory = { equipment: [] };
      this.state.inventory.equipment.push(rolledRelic);
      this.emit('relicDropped', rolledRelic);
    }

    // Check if the entire swarm is defeated
    const remaining = (this.state.madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    if (remaining.length === 0) {
      this.emit('enemyDefeated', {
        enemy,
        shardsGained,
        essenceGained,
        isSwarmCleared: true
      });
      this.onSwarmCleared();
    } else {
      this.state.madnessZone.currentEnemy = remaining[0];
      this.emit('enemyDefeated', {
        enemy,
        shardsGained,
        essenceGained,
        isSwarmCleared: false
      });
    }
  },

  onEnemyDefeated(enemy) {
    this.onIndividualEnemyKilled(enemy);
  },

  onSwarmCleared() {
    const mz = this.state.madnessZone;
    const isBossFloor = mz.subStage >= 5;

    if (isBossFloor) {
      // Zone Boss Defeated!
      const prevHighest = mz.highestStageCleared || 0;
      mz.highestStageCleared = Math.max(mz.highestStageCleared || 0, mz.stage);

      // First Clear Contractor EXP reward
      if (mz.stage > prevHighest) {
        const firstClearXp = 50 + mz.stage * 15;
        this.addContractorXp(firstClearXp, `Madness Floor ${mz.stage} First Clear`);
      } else {
        // Repeat boss clears provide baseline progression drip
        this.addContractorXp(5, `Madness Floor ${mz.stage} Boss Cleared`);
      }

      // Floor Victory: Revive ALL party spirits to 100% HP!
      const party = this.getPartySpirits();
      const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
      const initShieldPct = (constBonuses.initialShieldPercent || 0) / 100;
      party.forEach(s => {
        s.currentHp = s.maxHp;
        s.isFallen = false;
        s.shieldHp = Math.round(s.maxHp * initShieldPct);
      });
      this.emit('partyRevived', { reason: 'floor_victory' });

      // Check if next stage is already unlocked
      const nextStage = mz.stage + 1;
      const isNextUnlocked = mz.unlockedStages.includes(nextStage);

      if (mz.autoAdvance && !mz.farmMode && isNextUnlocked) {
        mz.stage = nextStage;
        mz.subStage = 1;
      } else {
        // Repeat current stage at Wave 1 (infinite farming) until next stage is unlocked
        mz.subStage = 1;
      }
      this.emit('floorCleared', { stage: mz.stage, highestCleared: mz.highestStageCleared });
    } else {
      // Advance to next wave in current floor
      mz.subStage += 1;
    }

    this.spawnMadnessEnemy();
    this.save();
    this.emit('madnessZoneUpdated', mz);
  },

  /**
   * Navigate to a previously unlocked floor (costs 0 Energy)
   */
  setStage(targetStage) {
    const mz = this.state.madnessZone;
    const stageNum = parseInt(targetStage, 10);
    if (isNaN(stageNum) || stageNum < 1) return;
    if (!mz.unlockedStages.includes(stageNum)) {
      throw new Error(`Floor ${stageNum} is not yet unlocked! Defeat previous floor bosses and unlock it first.`);
    }
    mz.stage = stageNum;
    mz.subStage = 1;
    this.spawnMadnessEnemy();
    this.save();
    this.emit('madnessZoneUpdated', mz);
    return { success: true, stage: stageNum };
  },

  /**
   * Unlock and enter a new floor using Energy
   * Once unlocked, repeated plays of this floor cost 0 Energy!
   */
  unlockAndEnterStage(targetStage) {
    const mz = this.state.madnessZone;
    const res = this.state.resources;

    // If already unlocked, simply switch to it (0 Energy cost)
    if (mz.unlockedStages.includes(targetStage)) {
      mz.stage = targetStage;
      mz.subStage = 1;
      this.spawnMadnessEnemy();
      this.emit('madnessZoneUpdated', mz);
      return { success: true, alreadyUnlocked: true };
    }

    // Must be the immediate next locked stage
    if (targetStage !== mz.highestStageUnlocked + 1) {
      throw new Error(`You must clear Floor ${mz.highestStageUnlocked} before unlocking Floor ${targetStage}!`);
    }

    // STRICT GUARD: Must have actually defeated the boss on highestStageUnlocked!
    if ((mz.highestStageCleared || 0) < mz.highestStageUnlocked) {
      throw new Error(`You must defeat the Boss on Floor ${mz.highestStageUnlocked} before unlocking Floor ${targetStage}!`);
    }

    // Energy cost check
    if (res.energy < ENERGY_ENTRY_COST) {
      throw new Error(`Insufficient Energy! Tackling Floor ${targetStage} costs ${ENERGY_ENTRY_COST} ⚡ (Current: ${res.energy} ⚡). Energy recovers 1 per 30s.`);
    }

    // Deduct energy and unlock floor permanently
    res.energy -= ENERGY_ENTRY_COST;
    mz.unlockedStages.push(targetStage);
    mz.unlockedStages.sort((a, b) => a - b);
    mz.highestStageUnlocked = Math.max(...mz.unlockedStages);
    mz.stage = targetStage;
    mz.subStage = 1;

    this.save();
    this.spawnMadnessEnemy();
    this.emit('stageUnlocked', { stage: targetStage, remainingEnergy: res.energy });
    this.emit('madnessZoneUpdated', mz);

    return { success: true, stage: targetStage, remainingEnergy: res.energy };
  },

  toggleAutoAdvance() {
    this.state.madnessZone.autoAdvance = !this.state.madnessZone.autoAdvance;
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  },

  toggleFarmMode() {
    this.state.madnessZone.farmMode = !this.state.madnessZone.farmMode;
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  }
};
