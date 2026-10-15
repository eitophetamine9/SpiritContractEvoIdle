import {
  getSpiritUltimate,
  getSpiritRole
} from '../../data/spiritsData.js';
import {
  PANTHEON_CHAMBERS,
  PANTHEON_DIFFICULTY_TIERS,
  generateDungeonLoot
} from '../../data/artifactDungeonData.js';
import {
  FORGE_CHAMBERS,
  FORGE_DIFFICULTY_TIERS,
  generateForgeLoot
} from '../../data/weaponDungeonData.js';
import {
  ESSENCE_CHAMBERS,
  ESSENCE_DIFFICULTY_TIERS,
  generateEssenceLoot
} from '../../data/essenceDungeonData.js';
import { GREEK_GOD_SETS } from '../../data/equipmentData.js';

export const dungeonMethods = {
  runPantheonTrial(chamberId, tierNum = 1) {
    const chamber = PANTHEON_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Pantheon Chamber selected!');

    const tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    // Deduct energy
    this.state.resources.energy -= tierObj.energyCost;

    // Generate targeted Greek God loot
    const loot = generateDungeonLoot(chamberId, tierNum);

    // Store in inventory
    if (!this.state.inventory) this.state.inventory = { equipment: [] };
    if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];

    loot.relics.forEach(r => this.state.inventory.equipment.push(r));
    loot.weapons.forEach(w => this.state.inventory.equipment.push(w));

    // Award resources
    this.state.resources.spiritShards += loot.shardsGained;
    this.state.resources.soulEssence += loot.essenceGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    return loot;
  },

  generateDungeonWave(dungeonType, chamberId, tierNum, waveNum) {
    let chamber;
    let tierObj;
    if (dungeonType === 'pantheon') {
      chamber = PANTHEON_CHAMBERS.find(c => c.id === chamberId) || PANTHEON_CHAMBERS[0];
      tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || PANTHEON_DIFFICULTY_TIERS[0];
    } else if (dungeonType === 'essence') {
      chamber = ESSENCE_CHAMBERS.find(c => c.id === chamberId) || ESSENCE_CHAMBERS[0];
      tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || ESSENCE_DIFFICULTY_TIERS[0];
    } else {
      chamber = FORGE_CHAMBERS.find(c => c.id === chamberId) || FORGE_CHAMBERS[0];
      tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || FORGE_DIFFICULTY_TIERS[0];
    }

    const targetPower = tierObj.recommendedPower || tierObj.minPartyPower || 1500;
    const baseHp = Math.round(targetPower * 1.6);
    const targetGod = chamber.god || chamber.godTitle || (chamber.godId && GREEK_GOD_SETS[chamber.godId] ? GREEK_GOD_SETS[chamber.godId].god : null) || chamber.name;
    const enemies = [];

    if (waveNum === 1) {
      const namePrefix = dungeonType === 'pantheon' ? `${targetGod} Sentinel` : dungeonType === 'essence' ? `${chamber.name} Sentinel` : 'Cinder Golem';
      const icon = dungeonType === 'pantheon' ? '🛡️' : dungeonType === 'essence' ? '💠' : '🔥';
      enemies.push({
        id: `wave1_e1_${Date.now()}`,
        name: `${namePrefix} Alpha`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(50, Math.round(baseHp * 0.45)),
        hp: Math.max(50, Math.round(baseHp * 0.45)),
        power: Math.max(10, Math.round(targetPower * 0.25)),
        isDefeated: false,
        attackCooldown: 2.0,
        currentCooldown: 1.0
      });
      enemies.push({
        id: `wave1_e2_${Date.now()}`,
        name: `${namePrefix} Beta`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(50, Math.round(baseHp * 0.45)),
        hp: Math.max(50, Math.round(baseHp * 0.45)),
        power: Math.max(10, Math.round(targetPower * 0.25)),
        isDefeated: false,
        attackCooldown: 2.4,
        currentCooldown: 2.0
      });
    } else if (waveNum === 2) {
      const namePrefix = dungeonType === 'pantheon' ? `${targetGod} Guardian` : dungeonType === 'essence' ? `${chamber.name} Warden` : 'Crucible Automaton';
      const icon = dungeonType === 'pantheon' ? '⚡' : dungeonType === 'essence' ? '✨' : '⚙️';
      enemies.push({
        id: `wave2_e1_${Date.now()}`,
        name: `Elite ${namePrefix}`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(80, Math.round(baseHp * 0.75)),
        hp: Math.max(80, Math.round(baseHp * 0.75)),
        power: Math.max(15, Math.round(targetPower * 0.35)),
        isDefeated: false,
        attackCooldown: 1.8,
        currentCooldown: 0.8
      });
      enemies.push({
        id: `wave2_e2_${Date.now()}`,
        name: `${namePrefix} Warden`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(70, Math.round(baseHp * 0.65)),
        hp: Math.max(70, Math.round(baseHp * 0.65)),
        power: Math.max(12, Math.round(targetPower * 0.3)),
        isDefeated: false,
        attackCooldown: 2.2,
        currentCooldown: 1.5
      });
    } else {
      const bossName = dungeonType === 'pantheon' ? `Avatar of ${targetGod}` : dungeonType === 'essence' ? (chamber.bossName || `${chamber.name} Overlord`) : (chamber.bossName || 'Vulcan Titan');
      const bossIcon = dungeonType === 'pantheon' ? (chamber.sigil || chamber.icon || '🔱') : dungeonType === 'essence' ? (chamber.bossIcon || '👑') : (chamber.bossIcon || '🌋');
      
      const isTier4 = tierNum === 4;
      const bossHpMult = isTier4 ? 4.0 : 1.5;
      const bossPwrMult = isTier4 ? 0.75 : 0.5;
      const bossMaxHp = Math.max(150, Math.round(baseHp * bossHpMult));
      const bossPower = Math.max(25, Math.round(targetPower * bossPwrMult));
      const bossBarrier = isTier4 ? Math.round(bossMaxHp * 0.25) : 0;

      enemies.push({
        id: `wave3_boss_${Date.now()}`,
        name: isTier4 ? `Supreme ${bossName}` : bossName,
        icon: bossIcon,
        element: chamber.element || 'LIGHT',
        isBoss: true,
        maxHp: bossMaxHp,
        hp: bossMaxHp,
        shieldHp: bossBarrier,
        divineBarrierMax: bossBarrier,
        hasDivineBarrier: isTier4,
        isEnraged: false,
        power: bossPower,
        isDefeated: false,
        attackCooldown: isTier4 ? 1.5 : 1.6,
        currentCooldown: 0.5
      });

      if (isTier4) {
        // Tier 4 Endgame: Dual Overlord Attendants!
        // Attendant 1: Healer / Vitality Siphon (Periodically restores 2% Max HP to Boss)
        enemies.push({
          id: `wave3_mender_${Date.now()}`,
          name: dungeonType === 'pantheon' ? 'Overlord Pantheon Mender' : dungeonType === 'essence' ? 'Overlord Aether Mender' : 'Overlord Forge Core Mender',
          icon: '💚',
          role: 'healer',
          element: chamber.element || 'LIGHT',
          maxHp: Math.max(100, Math.round(baseHp * 0.9)),
          hp: Math.max(100, Math.round(baseHp * 0.9)),
          power: Math.max(15, Math.round(targetPower * 0.25)),
          isDefeated: false,
          attackCooldown: 2.2,
          currentCooldown: 1.5,
          healTimer: 4.0
        });

        // Attendant 2: Vanguard Executioner (Heavy burst strikes)
        enemies.push({
          id: `wave3_striker_${Date.now()}`,
          name: dungeonType === 'pantheon' ? 'Overlord War Vanguard' : dungeonType === 'essence' ? 'Overlord Prime Striker' : 'Overlord Juggernaut Automaton',
          icon: '⚔️',
          role: 'dps',
          element: chamber.element || 'LIGHT',
          maxHp: Math.max(120, Math.round(baseHp * 1.1)),
          hp: Math.max(120, Math.round(baseHp * 1.1)),
          power: Math.max(20, Math.round(targetPower * 0.42)),
          isDefeated: false,
          attackCooldown: 1.8,
          currentCooldown: 0.9
        });
      } else {
        // Tiers 1-3: Standard Single Attendant
        enemies.push({
          id: `wave3_attendant_${Date.now()}`,
          name: dungeonType === 'pantheon' ? 'Temple High Priest' : dungeonType === 'essence' ? 'Essence Core Primordial' : 'Forge Overseer',
          icon: '🔮',
          element: chamber.element || 'LIGHT',
          maxHp: Math.max(50, Math.round(baseHp * 0.5)),
          hp: Math.max(50, Math.round(baseHp * 0.5)),
          power: Math.max(10, Math.round(targetPower * 0.28)),
          isDefeated: false,
          attackCooldown: 2.0,
          currentCooldown: 1.8
        });
      }
    }

    return enemies;
  },

  startDungeonTrial(dungeonType, chamberId, tierNum = 1) {
    let tierObj;
    if (dungeonType === 'pantheon') {
      tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || PANTHEON_DIFFICULTY_TIERS[0];
    } else if (dungeonType === 'essence') {
      tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || ESSENCE_DIFFICULTY_TIERS[0];
    } else {
      tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || FORGE_DIFFICULTY_TIERS[0];
    }

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    this.save();
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    const party = this.getPartySpirits();
    party.forEach(s => {
      s.currentHp = s.maxHp;
      s.currentMp = (s.ascensionLevel >= 3) ? 15 : 0;
      s.shieldHp = 0;
      s.isFallen = false;
    });

    const initialSwarm = this.generateDungeonWave(dungeonType, chamberId, tierNum, 1);

    this.state.activeDungeonBattle = {
      dungeonType,
      chamberId,
      tier: tierNum,
      currentWave: 1,
      maxWaves: 3,
      status: 'active',
      currentSwarm: initialSwarm,
      elapsedWaveTime: 0,
      loot: null
    };

    this.emit('dungeonBattleUpdated', this.state.activeDungeonBattle);
    return this.state.activeDungeonBattle;
  },

  tickDungeonBattle(deltaSec) {
    const battle = this.state.activeDungeonBattle;
    if (!battle || battle.status !== 'active') return;

    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    const livingEnemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);

    // Defeat check
    if (livingSpirits.length === 0 && party.length > 0) {
      battle.status = 'defeat';
      this.emit('dungeonBattleUpdated', battle);
      this.emit('dungeonBattleDefeat', battle);
      return;
    }

    // Wave Clear check
    if (livingEnemies.length === 0) {
      if (battle.currentWave < battle.maxWaves) {
        battle.currentWave += 1;
        battle.elapsedWaveTime = 0;
        livingSpirits.forEach(s => {
          s.currentHp = Math.min(s.maxHp, s.currentHp + Math.round(s.maxHp * 0.25));
          s.tauntTimer = 0;
        });
        battle.currentSwarm = this.generateDungeonWave(battle.dungeonType, battle.chamberId, battle.tier, battle.currentWave);
        this.emit('dungeonBattleUpdated', battle);
        this.emit('dungeonWaveCleared', { wave: battle.currentWave - 1, nextWave: battle.currentWave });
        return;
      } else {
        this.completeDungeonBattleVictory();
        return;
      }
    }

    battle.elapsedWaveTime = (battle.elapsedWaveTime || 0) + deltaSec;

    // Cataclysm Enrage & Attendant mechanics for Tier 4 Wave 3 Boss
    if (battle.tier === 4 && battle.currentWave === 3) {
      const boss = livingEnemies.find(e => e.isBoss && !e.isDefeated && e.hp > 0);
      if (boss && !boss.isEnraged && battle.elapsedWaveTime >= 45) {
        boss.isEnraged = true;
        boss.power = Math.round(boss.power * 1.5);
        boss.attackCooldown = Math.max(0.8, (boss.attackCooldown || 1.5) * 0.65);
        this.emit('combatEffect', { type: 'boss_enrage', enemy: boss, text: '⚠️ CATACLYSM ENRAGE!' });
      }

      // Overlord Mender periodic boss heal (2% Max HP every 4s)
      const mender = livingEnemies.find(e => e.role === 'healer' && !e.isDefeated && e.hp > 0);
      if (mender) {
        mender.healTimer = (mender.healTimer || 4.0) - deltaSec;
        if (mender.healTimer <= 0) {
          mender.healTimer = 4.0;
          if (boss && boss.hp < boss.maxHp) {
            const healAmt = Math.round(boss.maxHp * 0.02);
            boss.hp = Math.min(boss.maxHp, boss.hp + healAmt);
            this.emit('combatEffect', { type: 'boss_healed', enemy: boss, text: `+${healAmt.toLocaleString()} HP` });
          }
        }
      }
    }

    const leadEnemy = livingEnemies[0];

    // Spirits attack & accumulate MP
    for (const spirit of livingSpirits) {
      // Tick taunt decay and atlas shield cooldown
      if (spirit.tauntTimer > 0) {
        spirit.tauntTimer = Math.max(0, spirit.tauntTimer - deltaSec);
      }
      if (spirit._atlasShieldCooldown > 0) {
        spirit._atlasShieldCooldown = Math.max(0, spirit._atlasShieldCooldown - deltaSec);
      }

      const effectivePower = this.getSpiritTotalPower(spirit);
      // Backline Sanctuary Perk: +15% ATK
      const stats = this.getSpiritCombatStats(spirit);
      const posAtkMult = (stats && stats.formationColumn === 'back') ? 1.15 : 1.0;

      const baseDps = Math.max(1, Math.round(effectivePower * 0.45 * posAtkMult));
      let damageThisTick = baseDps * deltaSec;

      // Staggered attack cadence for spirits in dungeon battles
      spirit._dungeonAttackAnimTimer = (spirit._dungeonAttackAnimTimer || (0.4 + Math.random() * 0.8)) - deltaSec;
      if (spirit._dungeonAttackAnimTimer <= 0) {
        spirit._dungeonAttackAnimTimer = 1.2 + Math.random() * 0.4;
        this.emit('combatStrike', {
          attackerType: 'spirit',
          spirit,
          targetEnemy: leadEnemy,
          zone: 'dungeon'
        });
      }

      if (leadEnemy.shieldHp > 0) {
        const absorbed = Math.min(leadEnemy.shieldHp, damageThisTick);
        leadEnemy.shieldHp -= absorbed;
        damageThisTick -= absorbed;
      }
      if (damageThisTick > 0) {
        leadEnemy.hp = Math.max(0, leadEnemy.hp - damageThisTick);
      }

      const activeBonuses = this.getSpiritActiveSetBonuses(spirit);
      let manaBonusMult = 1;
      for (const b of activeBonuses) {
        if (b.bonus.manaReplenishBonus) {
          manaBonusMult += b.bonus.manaReplenishBonus;
        }
      }
      spirit.currentMp = Math.min(100, (spirit.currentMp || 0) + 20 * manaBonusMult * deltaSec);

      if (spirit.currentMp >= 100) {
        spirit.currentMp = 0;
        this.procSpiritUltimateForDungeon(spirit, battle);
      }
    }

    if (leadEnemy.hp <= 0 && (!leadEnemy.shieldHp || leadEnemy.shieldHp <= 0)) {
      leadEnemy.isDefeated = true;
      leadEnemy.hp = 0;
    }

    // Enemies attack living spirits (Targeting based on Threat aggro & DEF mitigation)
    for (const enemy of livingEnemies) {
      if (enemy.isDefeated || enemy.hp <= 0) continue;
      enemy.currentCooldown = (enemy.currentCooldown || 0) - deltaSec;
      if (enemy.currentCooldown <= 0) {
        enemy.currentCooldown = enemy.attackCooldown || 2.0;

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

          let rawEnemyDamage = Math.max(1, Math.round(enemy.power * (0.8 + Math.random() * 0.4)));

          // Atlas 4-pc Party-wide Damage Mitigation (-12% team damage taken)
          if (atlasBearerBonus) {
            rawEnemyDamage = Math.max(1, Math.round(rawEnemyDamage * 0.88));
          }

          // Apply DEF Mitigation Formula (350 / (350 + DEF))
          const targetStats = this.getSpiritCombatStats(targetSpirit);
          const { mitigatedDamage, defMitigated } = this.calculateDamageMitigation(rawEnemyDamage, targetStats ? targetStats.def : 20);
          let finalEnemyDamage = mitigatedDamage;

          let shieldAbsorbed = 0;
          if (targetSpirit.shieldHp > 0) {
            shieldAbsorbed = Math.min(targetSpirit.shieldHp, finalEnemyDamage);
            targetSpirit.shieldHp -= shieldAbsorbed;
            finalEnemyDamage -= shieldAbsorbed;
          }

          targetSpirit.currentHp = Math.max(0, targetSpirit.currentHp - finalEnemyDamage);
          if (targetSpirit.currentHp <= 0) {
            targetSpirit.isFallen = true;
            targetSpirit.currentHp = 0;
          }

          this.emit('dungeonEnemyCounterAttack', {
            enemy,
            targetSpirit,
            damage: finalEnemyDamage,
            rawDamage: rawEnemyDamage,
            defMitigated,
            shieldAbsorbed,
            isTauntedTarget: (targetSpirit.tauntTimer || 0) > 0
          });

          this.emit('combatStrike', {
            attackerType: 'enemy',
            enemy,
            targetSpirit,
            damage: finalEnemyDamage,
            zone: 'dungeon'
          });
        }
      }
    }

    this.emit('dungeonBattleUpdated', battle);
  },

  procSpiritUltimateForDungeon(spirit, battle) {
    const ult = getSpiritUltimate(spirit.speciesId);
    const livingEnemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);

    const spiritStats = this.getSpiritCombatStats(spirit);
    const role = spiritStats ? spiritStats.role : getSpiritRole(spirit.speciesId);

    // TANK SPECIAL: Activate 6-second Taunt Lock and grant party shield
    if (role === 'TANK') {
      spirit.tauntTimer = 6.0;
      const tankDef = spiritStats ? spiritStats.def : 40;
      const tankShieldAmount = Math.max(40, Math.round(tankDef * 2.5));
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

    const applyDamageToDungeonEnemy = (enemy, rawDmg) => {
      let dmg = rawDmg;
      if (enemy.shieldHp > 0) {
        const absorbed = Math.min(enemy.shieldHp, dmg);
        enemy.shieldHp -= absorbed;
        dmg -= absorbed;
      }
      if (dmg > 0) {
        enemy.hp = Math.max(0, enemy.hp - dmg);
      }
      if (enemy.hp <= 0 && (!enemy.shieldHp || enemy.shieldHp <= 0)) {
        enemy.isDefeated = true;
        enemy.hp = 0;
      }
    };

    switch (ult.type) {
      case 'AOE_DAMAGE': {
        const damagePerEnemy = Math.max(1, Math.round(spirit.power * ult.multiplier * critMult));
        for (const enemy of livingEnemies) {
          applyDamageToDungeonEnemy(enemy, damagePerEnemy);
          totalDamageDealt += damagePerEnemy;
        }
        break;
      }
      case 'SINGLE_TARGET_BURST': {
        const primaryTarget = livingEnemies[0];
        if (primaryTarget) {
          const burstDamage = Math.max(1, Math.round(spirit.power * ult.multiplier * critMult));
          applyDamageToDungeonEnemy(primaryTarget, burstDamage);
          totalDamageDealt += burstDamage;
        }
        break;
      }
      case 'TEAM_HEAL': {
        const healPerSpirit = Math.max(1, Math.round(spirit.power * ult.multiplier * healAmp));
        for (const ally of livingSpirits) {
          const actualHeal = Math.min(ally.maxHp - ally.currentHp, healPerSpirit);
          ally.currentHp += actualHeal;
          totalHealingDone += actualHeal;
        }
        break;
      }
      case 'TEAM_SHIELD': {
        const shieldPerSpirit = Math.max(1, Math.round(spirit.power * ult.multiplier));
        for (const ally of livingSpirits) {
          ally.shieldHp = (ally.shieldHp || 0) + shieldPerSpirit;
        }
        break;
      }
      case 'EXECUTE': {
        const lowestHpEnemy = [...livingEnemies].sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
        if (lowestHpEnemy) {
          const isExecuteThreshold = (lowestHpEnemy.hp / lowestHpEnemy.maxHp) <= ult.threshold;
          const mult = (isExecuteThreshold ? ult.multiplier * 2 : ult.multiplier) * critMult;
          const execDamage = Math.max(1, Math.round(spirit.power * mult));
          applyDamageToDungeonEnemy(lowestHpEnemy, execDamage);
          totalDamageDealt += execDamage;
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
      zone: 'dungeon'
    });
  },

  manualDungeonStrike() {
    const battle = this.state.activeDungeonBattle;
    if (!battle || battle.status !== 'active') return;

    const livingEnemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    if (livingEnemies.length === 0) return;

    const leadEnemy = livingEnemies[0];
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);

    // Check if Main DPS in party triggers a Critical Click
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

    const totalPartyPower = livingSpirits.reduce((sum, s) => sum + this.getSpiritTotalPower(s), 0);
    let tapDamage = Math.max(1, Math.round(totalPartyPower * (0.35 + Math.random() * 0.2) * critMult));

    if (leadEnemy.shieldHp > 0) {
      const absorbed = Math.min(leadEnemy.shieldHp, tapDamage);
      leadEnemy.shieldHp -= absorbed;
      tapDamage -= absorbed;
    }
    if (tapDamage > 0) {
      leadEnemy.hp = Math.max(0, leadEnemy.hp - tapDamage);
    }
    if (leadEnemy.hp <= 0 && (!leadEnemy.shieldHp || leadEnemy.shieldHp <= 0)) {
      leadEnemy.isDefeated = true;
      leadEnemy.hp = 0;
    }

    livingSpirits.forEach(s => {
      s.currentMp = Math.min(100, (s.currentMp || 0) + 10);
      if (s.currentMp >= 100) {
        s.currentMp = 0;
        this.procSpiritUltimateForDungeon(s, battle);
      }
    });

    this.emit('manualPartyStrike', {
      livingSpirits,
      leadEnemy,
      isCrit,
      zone: 'dungeon'
    });

    this.emit('dungeonBattleUpdated', battle);
  },

  completeDungeonBattleVictory() {
    const battle = this.state.activeDungeonBattle;
    if (!battle) return;

    battle.status = 'victory';

    let loot;
    if (battle.dungeonType === 'pantheon') {
      loot = generateDungeonLoot(battle.chamberId, battle.tier);
    } else if (battle.dungeonType === 'essence') {
      loot = generateEssenceLoot(battle.chamberId, battle.tier);
    } else {
      loot = generateForgeLoot(battle.chamberId, battle.tier);
    }

    battle.loot = loot;

    if (!this.state.inventory) this.state.inventory = { equipment: [] };
    if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];

    if (loot.relics) {
      loot.relics.forEach(r => this.state.inventory.equipment.push(r));
    }
    if (loot.weapons) {
      loot.weapons.forEach(w => this.state.inventory.equipment.push(w));
    }
    if (loot.godEssencesGained) {
      this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + loot.godEssencesGained;
    }
    if (loot.soulEssenceGained) {
      this.state.resources.soulEssence += loot.soulEssenceGained;
    } else if (loot.essenceGained) {
      this.state.resources.soulEssence += loot.essenceGained;
    }

    this.state.resources.spiritShards += loot.shardsGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;
    this.addContractorXp(75 + (battle.tier || 1) * 25, 'Dungeon Victory');

    this.getPartySpirits().forEach(s => {
      s.currentHp = s.maxHp;
      s.currentMp = 0;
      s.shieldHp = 0;
      s.isFallen = false;
    });

    this.save();
    this.emit('dungeonBattleVictory', { loot, battle });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    this.emit('dungeonBattleUpdated', battle);
  },

  exitDungeonBattle() {
    this.state.activeDungeonBattle = null;
    this.getPartySpirits().forEach(s => {
      s.currentHp = s.maxHp;
      s.currentMp = 0;
      s.shieldHp = 0;
      s.isFallen = false;
    });
    this.save();
    this.emit('dungeonBattleExited');
  },

  runForgeDungeon(chamberId, tierNum = 1) {
    const chamber = FORGE_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Forge Chamber selected!');

    const tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    const loot = generateForgeLoot(chamberId, tierNum);

    if (!this.state.inventory) this.state.inventory = { equipment: [] };
    if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];

    loot.weapons.forEach(w => this.state.inventory.equipment.push(w));

    this.state.resources.spiritShards += loot.shardsGained;
    this.state.resources.soulEssence += loot.essenceGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;
    this.addContractorXp(75 + tierNum * 25, 'Forge Dungeon Victory');

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    return loot;
  },

  runEssenceDungeon(chamberId, tierNum = 1) {
    const chamber = ESSENCE_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Essence Chamber selected!');

    const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    const loot = generateEssenceLoot(chamberId, tierNum);
    const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
    if (constBonuses.bonusGodEssencesPercent) {
      loot.godEssencesGained = Math.round(loot.godEssencesGained * (1 + constBonuses.bonusGodEssencesPercent / 100));
    }

    this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + loot.godEssencesGained;
    this.state.resources.soulEssence = (this.state.resources.soulEssence || 0) + loot.soulEssenceGained;
    this.state.resources.spiritShards = (this.state.resources.spiritShards || 0) + loot.shardsGained;

    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;
    this.addContractorXp(75 + tierNum * 25, 'Essence Sanctuary Victory');

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('resourcesUpdated', this.state.resources);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    return {
      ...loot,
      essencesAwarded: loot.godEssencesGained,
      soulEssenceAwarded: loot.soulEssenceGained
    };
  }
};
