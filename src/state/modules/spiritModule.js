import {
  SPIRIT_SPECIES,
  ASCENSION_CONFIG,
  REBIRTH_CONFIG,
  getXpRequiredForLevel,
  calculateSpiritPower,
  calculateSpiritMaxHp,
  calculateSpiritStats,
  calculatePartyResonance,
  FORMATION_SLOTS,
  FORMATION_COLUMNS
} from '../../data/spiritsData.js';

export const spiritMethods = {
  /**
   * Returns comprehensive combat stats for a spirit including formation column perks,
   * equipment/relic substats, critical ratings, and effective threat weight.
   */
  getSpiritCombatStats(spiritOrId) {
    if (!spiritOrId) return null;
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return null;

    if (this._combatStatsCache && this._combatStatsCache.has(spirit.id)) {
      const cached = this._combatStatsCache.get(spirit.id);
      cached.tauntTimer = spirit.tauntTimer || 0;
      cached.isTaunting = cached.tauntTimer > 0;
      return cached;
    }

    const baseStats = calculateSpiritStats(spirit) || {
      role: 'MAIN_DPS',
      atk: spirit.power || 20,
      def: 20,
      maxHp: spirit.maxHp || 100,
      spd: 1.0,
      critRate: 5,
      critDmg: 150,
      threat: 50,
      power: spirit.power || 20
    };

    // Formation slot & column perks
    const slotId = this.getSpiritFormationSlot(spirit.id);
    const slotDef = slotId ? FORMATION_SLOTS[slotId] : null;
    const colDef = slotDef ? FORMATION_COLUMNS[slotDef.col] : FORMATION_COLUMNS.mid;
    const colKey = slotDef ? slotDef.col : 'mid';

    // Equipment & substats (O(1) lookups)
    let bonusAtk = 0;
    let bonusDef = 0;
    let bonusHp = 0;
    let bonusCritRate = 0;
    let bonusCritDmg = 0;
    let bonusUltAmp = 0;
    let bonusManaReplenish = 0;
    let atkPercentBonus = 0;
    let defPercentBonus = 0;
    let hpPercentBonus = 0;

    if (spirit.weapon) {
      const wpn = this.getEquipmentItemByUid(spirit.weapon);
      if (wpn) {
        if (wpn.atkPower) bonusAtk += wpn.atkPower;
        if (wpn.critRate) bonusCritRate += wpn.critRate;
        if (wpn.critDmg) bonusCritDmg += wpn.critDmg;
        if (wpn.ultAmp) bonusUltAmp += wpn.ultAmp;
        if (wpn.manaReplenish) bonusManaReplenish += wpn.manaReplenish;
        if (wpn.defBonus) bonusDef += wpn.defBonus;
        if (wpn.hpBonus) bonusHp += wpn.hpBonus;
      }
    }

    if (spirit.relics) {
      for (const relicUid of Object.values(spirit.relics)) {
        if (!relicUid) continue;
        const relic = this.getEquipmentItemByUid(relicUid);
        if (relic) {
          if (relic.mainStatName === 'Bonus ATK Power') bonusAtk += (relic.mainStatValue || 0);
          else if (relic.mainStatName === 'Bonus Max HP') bonusHp += (relic.mainStatValue || 0);
          else if (relic.mainStatName === 'Shield Strength') bonusDef += Math.round((relic.mainStatValue || 0) * 0.4);
          else if (relic.mainStatName === 'Mana Replenish') bonusManaReplenish += (relic.mainStatValue || 0);
          else if (relic.mainStatName === 'Ult Amp') bonusUltAmp += (relic.mainStatValue || 0);

          if (Array.isArray(relic.substats)) {
            for (const sub of relic.substats) {
              if (sub.typeId === 'flat_atk') bonusAtk += (sub.value || 0);
              else if (sub.typeId === 'crit_rate') bonusCritRate += (sub.value || 0);
              else if (sub.typeId === 'crit_dmg') bonusCritDmg += (sub.value || 0);
              else if (sub.typeId === 'flat_hp') bonusHp += (sub.value || 0);
              else if (sub.typeId === 'flat_shield') bonusDef += Math.round((sub.value || 0) * 0.25);
              else if (sub.typeId === 'atk_percent' || sub.typeId === 'percent_atk') atkPercentBonus += (sub.value || 0);
              else if (sub.typeId === 'def_percent') defPercentBonus += (sub.value || 0);
              else if (sub.typeId === 'hp_percent' || sub.typeId === 'percent_hp') hpPercentBonus += (sub.value || 0);
              else if (sub.typeId === 'ult_amp') bonusUltAmp += (sub.value || 0);
              else if (sub.typeId === 'mana_replenish' || sub.typeId === 'mana_regen') bonusManaReplenish += (sub.value || 0);
            }
          }
        }
      }
    }

    // Set bonuses (2-pc Greek God sets)
    const activeBonuses = this.getSpiritActiveSetBonuses ? this.getSpiritActiveSetBonuses(spirit) : [];
    for (const b of activeBonuses) {
      if (b.bonus) {
        if (b.bonus.atkPercentBonus) atkPercentBonus += b.bonus.atkPercentBonus;
        if (b.bonus.damageBonus) atkPercentBonus += Math.round(b.bonus.damageBonus * 100);
        if (b.bonus.defPercentBonus) defPercentBonus += b.bonus.defPercentBonus;
        if (b.bonus.defBonus) defPercentBonus += Math.round(b.bonus.defBonus * 100);
        if (b.bonus.defenseBonus) defPercentBonus += Math.round(b.bonus.defenseBonus * 100);
        if (b.bonus.hpBonus) hpPercentBonus += Math.round(b.bonus.hpBonus * 100);
        if (b.bonus.maxHpBonus) hpPercentBonus += Math.round(b.bonus.maxHpBonus * 100);
        if (b.bonus.hpPercentBonus) hpPercentBonus += b.bonus.hpPercentBonus;
        if (b.bonus.critRateBonus) bonusCritRate += (b.bonus.critRateBonus <= 1 ? Math.round(b.bonus.critRateBonus * 100) : b.bonus.critRateBonus);
        if (b.bonus.critDmgBonus) bonusCritDmg += (b.bonus.critDmgBonus <= 1 ? Math.round(b.bonus.critDmgBonus * 100) : b.bonus.critDmgBonus);
        if (b.bonus.ultAmpBonus) bonusUltAmp += (b.bonus.ultAmpBonus <= 1 ? Math.round(b.bonus.ultAmpBonus * 100) : b.bonus.ultAmpBonus);
        if (b.bonus.manaReplenishBonus) bonusManaReplenish += Math.round(b.bonus.manaReplenishBonus * 100);
      }
    }

    // Rebirth / Ascension Passives (⭐1 to ⭐7)
    const rebirthTier = spirit.ascensionLevel !== undefined ? spirit.ascensionLevel : (spirit.rebirthLevel || 0);
    if (rebirthTier >= 1) {
      // Rebirth I: Primary scaling stat boosted by +5%
      const primStat = baseStats.scalingProfile ? baseStats.scalingProfile.primaryStat : 'atk';
      if (primStat === 'atk') atkPercentBonus += 5;
      else if (primStat === 'def') defPercentBonus += 5;
      else if (primStat === 'hp') hpPercentBonus += 5;
      else if (primStat === 'manaReplenish') bonusManaReplenish += 5;
    }
    if (rebirthTier >= 7) {
      // Rebirth VII: +10% Crit Rate, +30% Crit DMG
      bonusCritRate += 10;
      bonusCritDmg += 30;
    }

    // Column Perks:
    // Frontline Vanguard Perk: +15% DEF / Armor
    // Backline Sanctuary Perk: +15% ATK / Healing Potency
    const defColumnMult = (colKey === 'front') ? 1.15 : 1.0;
    const atkColumnMult = (colKey === 'back') ? 1.15 : 1.0;
    const healAmpMult = (colKey === 'back') ? 1.15 : 1.0;

    // Effective Threat: Base Threat * Column Multiplier
    const threatMult = colDef ? colDef.threatMultiplier : 1.0;
    const effectiveThreat = Math.max(1, Math.round(baseStats.threat * threatMult));

    const totalDefBonus = Math.round(baseStats.def * (defPercentBonus / 100)) + bonusDef;
    const finalDef = Math.max(1, Math.round((baseStats.def + totalDefBonus) * defColumnMult));

    // Hephaestus 2-Piece: Converts 25% of bearer's total DEF into bonus flat ATK Power
    let defToAtkBonus = 0;
    for (const b of activeBonuses) {
      if (b.bonus && b.bonus.defToAtkRatio) {
        defToAtkBonus += Math.round(finalDef * b.bonus.defToAtkRatio);
      }
    }

    const totalAtkBonus = Math.round(baseStats.atk * (atkPercentBonus / 100)) + bonusAtk + defToAtkBonus;
    const finalAtk = Math.max(1, Math.round((baseStats.atk + totalAtkBonus) * atkColumnMult));

    const totalHpBonus = Math.round(baseStats.maxHp * (hpPercentBonus / 100)) + bonusHp;
    const finalMaxHp = Math.max(80, baseStats.maxHp + totalHpBonus);

    const finalCritRate = Math.min(100, Math.max(5, baseStats.critRate + bonusCritRate));
    const finalCritDmg = baseStats.critDmg + bonusCritDmg;
    const finalUltAmp = Math.max(0, (baseStats.ultAmp || 0) + bonusUltAmp);
    const finalManaReplenish = Math.max(100, 100 + bonusManaReplenish);

    // Dual-Tier 7 Core Attributes Breakdown
    const attributes = {
      hp: {
        name: 'Max HP',
        symbol: '💚',
        base: baseStats.maxHp,
        bonus: finalMaxHp - baseStats.maxHp,
        total: finalMaxHp,
        percent: hpPercentBonus,
        unit: ''
      },
      atk: {
        name: 'ATK Power',
        symbol: '⚔️',
        base: baseStats.atk,
        bonus: finalAtk - baseStats.atk,
        total: finalAtk,
        percent: atkPercentBonus,
        unit: ''
      },
      def: {
        name: 'Defense',
        symbol: '🛡️',
        base: baseStats.def,
        bonus: finalDef - baseStats.def,
        total: finalDef,
        percent: defPercentBonus,
        unit: ''
      },
      critRate: {
        name: 'CRIT Rate',
        symbol: '🎯',
        base: baseStats.attributes?.critRate?.base || 5,
        bonus: finalCritRate - (baseStats.attributes?.critRate?.base || 5),
        total: finalCritRate,
        percent: finalCritRate,
        unit: '%'
      },
      critDmg: {
        name: 'CRIT DMG',
        symbol: '💥',
        base: 150,
        bonus: Math.max(0, finalCritDmg - 150),
        total: finalCritDmg,
        percent: finalCritDmg,
        unit: '%'
      },
      ultAmp: {
        name: 'Ult Amp',
        symbol: '🔮',
        base: 0,
        bonus: finalUltAmp,
        total: finalUltAmp,
        percent: finalUltAmp,
        unit: '%'
      },
      manaReplenish: {
        name: 'Mana Replenish',
        symbol: '⚡',
        base: 100,
        bonus: finalManaReplenish - 100,
        total: finalManaReplenish,
        percent: finalManaReplenish,
        unit: '%'
      }
    };

    const statsResult = {
      role: baseStats.role,
      roleInfo: baseStats.roleInfo,
      scalingProfile: baseStats.scalingProfile,
      rebirthLevel: rebirthTier,
      ascensionLevel: rebirthTier,
      atk: finalAtk,
      def: finalDef,
      maxHp: finalMaxHp,
      spd: baseStats.spd,
      critRate: finalCritRate,
      critDmg: finalCritDmg,
      ultAmp: finalUltAmp,
      manaReplenish: finalManaReplenish,
      healAmp: healAmpMult,
      baseThreat: baseStats.threat,
      threatMultiplier: threatMult,
      effectiveThreat,
      formationSlot: slotId,
      formationColumn: colKey,
      columnPerk: colDef ? colDef.perkName : 'Flank Perk',
      tauntTimer: spirit.tauntTimer || 0,
      isTaunting: (spirit.tauntTimer || 0) > 0,
      attributes
    };

    if (!this._combatStatsCache) this._combatStatsCache = new Map();
    this._combatStatsCache.set(spirit.id, statsResult);
    return statsResult;
  },

  /**
   * RNG Evolution System
   * Evaluates branch table odds for the spirit's species
   */
  evolveSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');

    const currentSpecies = SPIRIT_SPECIES[spirit.speciesId];
    if (!currentSpecies) throw new Error('Species data missing');

    if (!spirit.canEvolve || !currentSpecies.evolutions || currentSpecies.evolutions.length === 0) {
      throw new Error('This Spirit is not eligible for evolution yet.');
    }

    // RNG Branch Roll based on weights
    const totalWeight = currentSpecies.evolutions.reduce((acc, ev) => acc + ev.weight, 0);
    const roll = Math.random() * totalWeight;

    let runningWeight = 0;
    let chosenBranch = currentSpecies.evolutions[0];

    for (const evo of currentSpecies.evolutions) {
      runningWeight += evo.weight;
      if (roll <= runningWeight) {
        chosenBranch = evo;
        break;
      }
    }

    const nextSpecies = SPIRIT_SPECIES[chosenBranch.targetSpeciesId];
    if (!nextSpecies) throw new Error(`Target species ${chosenBranch.targetSpeciesId} does not exist`);

    const oldPower = spirit.power;
    const isRare = chosenBranch.rarity && chosenBranch.rarity !== 'UNCOMMON';

    // Apply Evolution
    spirit.speciesId = nextSpecies.id;
    spirit.customName = nextSpecies.name;
    spirit.tier = nextSpecies.tier || 2;
    spirit.level = 1; // Resets to Lv 1 of new Tier for high-ceiling AFK progression
    spirit.xp = 0;
    spirit.canEvolve = false;
    spirit.ascensionLevel = spirit.ascensionLevel || 0;
    spirit.rarity = chosenBranch.rarity || nextSpecies.baseRarity;
    spirit.power = calculateSpiritPower(nextSpecies, spirit.level, spirit.rarity, spirit.ascensionLevel);
    spirit.maxHp = calculateSpiritMaxHp(nextSpecies, spirit.level, spirit.rarity, spirit.ascensionLevel);
    spirit.currentHp = spirit.maxHp;
    spirit.maxMp = 100;
    spirit.currentMp = (spirit.ascensionLevel >= 3) ? 15 : 0;
    spirit.shieldHp = 0;
    spirit.isFallen = false;
    spirit.evolutionHistory.push(nextSpecies.name);

    this.state.stats.totalEvolutions += 1;
    this.addContractorXp(75, 'Spirit Evolution');
    this.markSpeciesDiscovered(nextSpecies.id);
    this.invalidateCaches();
    this.save();

    const result = {
      spiritId: spirit.id,
      spirit,
      oldSpecies: currentSpecies,
      newSpecies: nextSpecies,
      variantName: chosenBranch.variant,
      rarity: spirit.rarity,
      isRare,
      rollValue: Math.round((roll / totalWeight) * 100),
      oldPower,
      newPower: spirit.power
    };

    this.emit('spiritEvolved', result);
    return result;
  },

  /**
   * Party Management (Strict limit: Max 5 Spirits)
   */
  equipSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;

    if (this.state.party.includes(spiritId)) return true; // Already equipped

    if (this.state.party.length >= 5) {
      throw new Error('Party is full! Maximum 5 Spirits can be equipped.');
    }

    spirit.isEquipped = true;
    this.state.party.push(spiritId);
    this.seatSpiritIntoFormation(spiritId);
    this.invalidateCaches();
    this.save();
    this.emit('partyUpdated', this.getPartySpirits());
    this.emit('partyFormationUpdated', this.getPartyFormation());
    return true;
  },

  unequipSpirit(spiritId) {
    const index = this.state.party.indexOf(spiritId);
    if (index === -1) return false;

    if (this.state.party.length <= 1) {
      throw new Error('You must keep at least 1 Spirit in your active party!');
    }

    this.state.party.splice(index, 1);
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (spirit) spirit.isEquipped = false;

    // Clear from formation
    if (this.state.partyFormation) {
      for (const [slotId, sId] of Object.entries(this.state.partyFormation)) {
        if (sId === spiritId) {
          this.state.partyFormation[slotId] = null;
        }
      }
    }

    this.invalidateCaches();
    this.save();
    this.emit('partyUpdated', this.getPartySpirits());
    this.emit('partyFormationUpdated', this.getPartyFormation());
    return true;
  },

  getPartySpirits() {
    return this.state.party
      .map(id => this.state.spirits.find(s => s.id === id))
      .filter(Boolean);
  },

  /**
   * Returns active party spirits annotated with their 3x3 tactical formation slot and column
   */
  getPartySpiritsByFormation() {
    const form = this.state.partyFormation || {};
    const spirits = this.getPartySpirits();

    return spirits.map(spirit => {
      let slotId = null;
      for (const [sId, occupiedId] of Object.entries(form)) {
        if (occupiedId === spirit.id) {
          slotId = sId;
          break;
        }
      }

      const slotDef = slotId ? FORMATION_SLOTS[slotId] : null;
      const colDef = slotDef ? FORMATION_COLUMNS[slotDef.col] : null;

      return {
        ...spirit,
        formationSlot: slotId,
        formationColumn: slotDef ? slotDef.col : 'mid',
        formationSlotLabel: slotDef ? slotDef.label : 'Midline',
        columnPerk: colDef ? colDef.perkName : 'Flank Perk',
        threatMultiplier: colDef ? colDef.threatMultiplier : 1.0
      };
    });
  },

  /**
   * Grants +500 AFK Training XP to all active party spirits (Rebalanced from 2,500)
   * Costs 10 Soul Essence (Rebalanced from 3)
   */
  buyPartyXpElixir() {
    const cost = 10;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    const party = this.getPartySpirits();
    if (party.length === 0) {
      throw new Error('You have no spirits in your active party to receive XP!');
    }

    this.state.resources.soulEssence -= cost;
    const xpBonus = 500; // Balanced boost, not instant level-skip

    for (const spirit of party) {
      const species = SPIRIT_SPECIES[spirit.speciesId];
      if (!species) continue;

      let remainingXp = xpBonus;
      while (remainingXp > 0 && spirit.level < species.levelCap) {
        const req = getXpRequiredForLevel(spirit.level) - spirit.xp;
        if (remainingXp >= req) {
          remainingXp -= req;
          spirit.xp = 0;
          spirit.level += 1;
          spirit.power = calculateSpiritPower(species, spirit.level, spirit.rarity);
          spirit.maxHp = calculateSpiritMaxHp(species, spirit.level, spirit.rarity);
          spirit.currentHp = spirit.maxHp;
          spirit.isFallen = false;
        } else {
          spirit.xp += remainingXp;
          remainingXp = 0;
        }
      }

      if (spirit.level >= species.levelCap) {
        spirit.xp = getXpRequiredForLevel(spirit.level);
        if (species.evolutions && species.evolutions.length > 0) {
          spirit.canEvolve = true;
        }
      }
    }

    this.save();
    this.emit('partyUpdated', party);
    return { success: true, xpGranted: xpBonus };
  },

  /**
   * Returns unequipped, non-favorite duplicate spirits sharing speciesId with target spirit
   */
  getEligibleAscensionDuplicates(spiritId) {
    const target = this.state.spirits.find(s => s.id === spiritId);
    if (!target) return [];
    return this.state.spirits.filter(s => 
      s.id !== target.id &&
      s.speciesId === target.speciesId &&
      !this.state.party.includes(s.id) &&
      !s.favorite
    );
  },

  /**
   * Ascend Spirit to next Star Tier (★1 through ★7)
   * Consumes matching duplicate copies + Astral Essences
   * Grants stacking +12% stats per tier up to +84% at ★7
   */
  ascendSpirit(targetSpiritId, duplicateSpiritIds = []) {
    const target = this.state.spirits.find(s => s.id === targetSpiritId);
    if (!target) throw new Error('Target spirit not found in collection!');

    target.ascensionLevel = target.ascensionLevel || 0;
    if (target.ascensionLevel >= 7) {
      throw new Error(`${target.customName} has already attained maximum Ascension (★7)!`);
    }

    const nextTier = target.ascensionLevel + 1;
    const config = ASCENSION_CONFIG.find(c => c.tier === nextTier) || ASCENSION_CONFIG[target.ascensionLevel];
    if (!config) throw new Error('Ascension configuration not found!');

    if (!Array.isArray(duplicateSpiritIds) || duplicateSpiritIds.length !== config.duplicates) {
      throw new Error(`Ascension to ★${nextTier} requires exactly ${config.duplicates} duplicate copy(ies). Selected: ${duplicateSpiritIds ? duplicateSpiritIds.length : 0}.`);
    }

    const res = this.state.resources;
    if ((res.soulEssence || 0) < config.astralCost) {
      throw new Error(`Insufficient Astral Essence! Need ${config.astralCost} 🔮 (Have: ${res.soulEssence || 0} 🔮).`);
    }

    // Validate duplicate spirits
    for (const dupId of duplicateSpiritIds) {
      if (dupId === targetSpiritId) {
        throw new Error('A spirit cannot consume itself as a duplicate copy!');
      }
      const dup = this.state.spirits.find(s => s.id === dupId);
      if (!dup) {
        throw new Error(`Duplicate spirit with ID ${dupId} not found in collection!`);
      }
      if (dup.speciesId !== target.speciesId) {
        throw new Error(`Duplicate spirit ${dup.customName} must be of the same species (${target.speciesId})!`);
      }
      if (this.state.party.includes(dupId)) {
        throw new Error(`Cannot sacrifice ${dup.customName} while they are in your active party. Unequip first!`);
      }
      if (dup.favorite) {
        throw new Error(`Cannot sacrifice ${dup.customName} while marked as Favorite. Remove favorite first!`);
      }
    }

    // Deduct Astral Essence
    res.soulEssence -= config.astralCost;

    // Remove duplicates and unequip any gear into inventory
    for (const dupId of duplicateSpiritIds) {
      const dupIndex = this.state.spirits.findIndex(s => s.id === dupId);
      if (dupIndex !== -1) {
        const dup = this.state.spirits[dupIndex];
        if (dup.weapon) {
          const weapon = (this.state.inventory?.equipment || []).find(e => e.uid === dup.weapon);
          if (weapon) weapon.equippedToSpiritId = null;
        }
        if (dup.relics) {
          for (const relicUid of Object.values(dup.relics)) {
            if (relicUid) {
              const relic = (this.state.inventory?.equipment || []).find(e => e.uid === relicUid);
              if (relic) relic.equippedToSpiritId = null;
            }
          }
        }
        this.state.spirits.splice(dupIndex, 1);
      }
    }

    // Elevate target spirit
    target.ascensionLevel = nextTier;
    target.rebirthLevel = nextTier;
    const species = SPIRIT_SPECIES[target.speciesId];
    if (species) {
      target.power = calculateSpiritPower(species, target.level, target.rarity, target.ascensionLevel);
      target.maxHp = calculateSpiritMaxHp(species, target.level, target.rarity, target.ascensionLevel);
      target.currentHp = target.maxHp;
      if (target.ascensionLevel >= 3 && target.currentMp < 15) {
        target.currentMp = 15;
      }
    }

    this.state.stats.totalAscensions = (this.state.stats.totalAscensions || 0) + 1;
    this.invalidateCaches();
    this.save();

    this.emit('spiritAscended', { spirit: target, newTier: nextTier, config });
    this.emit('spiritRebirthed', { spirit: target, newTier: nextTier, config });
    this.emit('resourcesUpdated', res);
    this.emit('partyUpdated', this.getPartySpirits());

    return {
      success: true,
      spirit: target,
      newTier: nextTier,
      bonusPercent: config.bonusPercent,
      perk: config.perk,
      uniqueAddition: config.uniqueAddition
    };
  },

  rebirthSpirit(targetSpiritId, duplicateSpiritIds = []) {
    return this.ascendSpirit(targetSpiritId, duplicateSpiritIds);
  },

  toggleFavoriteSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;
    spirit.favorite = !spirit.favorite;
    this.save();
    this.emit('spiritUpdated', spirit);
    return spirit.favorite;
  },

  renameSpirit(spiritId, newName) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;
    const cleanName = (newName || '').trim();
    if (!cleanName) return false;
    spirit.customName = cleanName.substring(0, 24);
    this.save();
    this.emit('spiritUpdated', spirit);
    return true;
  },

  /**
   * Annul Contract with Spirit (formerly Dispel) for refund shards
   */
  annulContract(spiritId) {
    if (this.state.party.includes(spiritId)) {
      throw new Error('Cannot annul contract with an active party Spirit. Unequip it first.');
    }

    const idx = this.state.spirits.findIndex(s => s.id === spiritId);
    if (idx === -1) return 0;

    const spirit = this.state.spirits[idx];
    if (spirit.favorite) {
      throw new Error('This Spirit is marked as Favorite! Unfavorite it first before annulling contract.');
    }

    const shardsGained = 40 * (spirit.tier || 1) + Math.floor((spirit.level || 1) * 3);
    this.state.spirits.splice(idx, 1);
    this.state.resources.spiritShards += shardsGained;

    if (Array.isArray(this.state.hallOfFame)) {
      this.state.hallOfFame = this.state.hallOfFame.filter(id => id !== spiritId);
    }

    this.save();
    this.emit('spiritAnnulled', { spiritId, shardsGained });
    return shardsGained;
  },

  releaseSpirit(spiritId) {
    return this.annulContract(spiritId);
  },

  bulkAnnulSpirits(spiritIds) {
    if (!Array.isArray(spiritIds) || spiritIds.length === 0) {
      return { count: 0, shardsGained: 0, annulledCount: 0, totalShardsGained: 0 };
    }

    let count = 0;
    let totalShardsGained = 0;

    for (const id of spiritIds) {
      if (this.state.party.includes(id)) continue;
      const idx = this.state.spirits.findIndex(s => s.id === id);
      if (idx === -1) continue;
      const spirit = this.state.spirits[idx];
      if (spirit.favorite) continue;

      const shards = 40 * (spirit.tier || 1) + Math.floor((spirit.level || 1) * 3);
      totalShardsGained += shards;
      count++;
      this.state.spirits.splice(idx, 1);

      if (Array.isArray(this.state.hallOfFame)) {
        this.state.hallOfFame = this.state.hallOfFame.filter(hid => hid !== id);
      }
    }

    this.state.resources.spiritShards += totalShardsGained;
    this.save();
    this.emit('spiritsBulkAnnulled', { count, shardsGained: totalShardsGained });
    return {
      count,
      shardsGained: totalShardsGained,
      annulledCount: count,
      totalShardsGained: totalShardsGained
    };
  },

  bulkAnnulContracts(spiritIds) {
    return this.bulkAnnulSpirits(spiritIds);
  },

  toggleHallOfFame(spiritId) {
    if (!Array.isArray(this.state.hallOfFame)) {
      this.state.hallOfFame = [];
    }
    const idx = this.state.hallOfFame.indexOf(spiritId);
    if (idx !== -1) {
      this.state.hallOfFame.splice(idx, 1);
      this.save();
      this.emit('hallOfFameUpdated', this.state.hallOfFame);
      return false;
    }

    if (this.state.hallOfFame.length >= 5) {
      throw new Error('Hall of Fame is full! Maximum 5 Spirits can be showcased.');
    }

    this.state.hallOfFame.push(spiritId);
    this.save();
    this.emit('hallOfFameUpdated', this.state.hallOfFame);
    return true;
  },

  getHallOfFameSpirits() {
    if (!Array.isArray(this.state.hallOfFame)) return [];
    return this.state.hallOfFame
      .map(id => this.state.spirits.find(s => s.id === id))
      .filter(Boolean);
  },

  markSpeciesDiscovered(speciesId) {
    if (!Array.isArray(this.state.discoveredSpeciesIds)) {
      this.state.discoveredSpeciesIds = [];
    }
    if (speciesId && !this.state.discoveredSpeciesIds.includes(speciesId)) {
      this.state.discoveredSpeciesIds.push(speciesId);
      this.save();
      this.emit('speciesDiscovered', speciesId);
    }
  },

  isSpeciesDiscovered(speciesId) {
    if (!Array.isArray(this.state.discoveredSpeciesIds)) return false;
    return this.state.discoveredSpeciesIds.includes(speciesId);
  },

  getSpiritTotalPower(spiritOrId) {
    if (!spiritOrId) return 0;
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return 0;

    if (this._spiritPowerCache && this._spiritPowerCache.has(spirit.id)) {
      return this._spiritPowerCache.get(spirit.id);
    }

    let power = spirit.power || 0;

    // Active 2-pc bonuses
    const activeBonuses = this.getSpiritActiveSetBonuses(spirit);
    let weaponAtkMultiplier = 1;
    let damageMultiplier = 1;
    let defToAtkBonus = 0;
    for (const b of activeBonuses) {
      if (b.bonus.damageBonus) {
        damageMultiplier += b.bonus.damageBonus;
      }
      if (b.bonus.weaponAtkBonus) {
        weaponAtkMultiplier += b.bonus.weaponAtkBonus;
      }
      if (b.bonus.defToAtkRatio) {
        const combatStats = this.getSpiritCombatStats(spirit);
        const sDef = combatStats ? combatStats.def : (spirit.defense || 20);
        defToAtkBonus += Math.round(sDef * b.bonus.defToAtkRatio);
      }
    }

    power += defToAtkBonus;

    // Weapon bonus (O(1) lookup)
    if (spirit.weapon) {
      const wpn = this.getEquipmentItemByUid(spirit.weapon);
      if (wpn && wpn.atkPower) {
        power += Math.round(wpn.atkPower * weaponAtkMultiplier);
      }
    }

    // Relic bonuses & Substats (O(1) lookups)
    let percentAtkBonus = 0;
    if (spirit.relics) {
      for (const relicUid of Object.values(spirit.relics)) {
        if (!relicUid) continue;
        const relic = this.getEquipmentItemByUid(relicUid);
        if (relic) {
          if (relic.mainStatName === 'Bonus ATK Power') {
            power += (relic.mainStatValue || 0);
          }
          if (Array.isArray(relic.substats)) {
            for (const sub of relic.substats) {
              if (sub.typeId === 'flat_atk') power += (sub.value || 0);
              else if (sub.typeId === 'percent_atk') percentAtkBonus += (sub.value || 0);
            }
          }
        }
      }
    }

    if (percentAtkBonus > 0) {
      power = Math.round(power * (1 + percentAtkBonus / 100));
    }

    // Celestial Constellation bonuses (Draco)
    const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
    if (constBonuses.partyAtkPercent) {
      damageMultiplier += (constBonuses.partyAtkPercent / 100);
    }

    const calculatedPower = Math.round(power * damageMultiplier);
    if (!this._spiritPowerCache) this._spiritPowerCache = new Map();
    this._spiritPowerCache.set(spirit.id, calculatedPower);
    return calculatedPower;
  },

  getPartyElementalResonances() {
    return calculatePartyResonance(this.getPartySpirits());
  },

  getTotalPartyPower() {
    if (this._partyPowerCache !== null && this._partyPowerCache !== undefined) {
      return this._partyPowerCache;
    }
    const party = this.getPartySpirits();
    const basePower = party.reduce((sum, s) => sum + this.getSpiritTotalPower(s), 0);
    const resonanceBonus = 1 + (this.state.resources.resonanceTier || 0) * 0.05;
    const elemResonance = this.getPartyElementalResonances();
    const elemAtkBonus = 1 + (elemResonance.atkPercent || 0) + (elemResonance.allStatsPercent || 0);
    this._partyPowerCache = Math.round(basePower * resonanceBonus * elemAtkBonus);
    return this._partyPowerCache;
  },

  getSpiritTotalMaxHp(spiritOrId) {
    if (!spiritOrId) return 100;
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return 100;
    let baseHp = spirit.maxHp || 100;
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];
    let percentHpBonus = 0;

    if (spirit.relics) {
      for (const relicUid of Object.values(spirit.relics)) {
        if (!relicUid) continue;
        const relic = this.getEquipmentItemByUid(relicUid);
        if (relic) {
          if (relic.mainStatName === 'Bonus Max HP') {
            baseHp += (relic.mainStatValue || 0);
          }
          if (Array.isArray(relic.substats)) {
            for (const sub of relic.substats) {
              if (sub.typeId === 'flat_hp') baseHp += (sub.value || 0);
              else if (sub.typeId === 'percent_hp') percentHpBonus += (sub.value || 0);
            }
          }
        }
      }
    }

    const setBonuses = this.getSpiritActiveSetBonuses(spirit);
    for (const b of setBonuses) {
      if (b.bonus.maxHpBonus) percentHpBonus += (b.bonus.maxHpBonus * 100);
    }
    const resonance = this.getPartyElementalResonances();
    if (resonance.maxHpPercent) percentHpBonus += (resonance.maxHpPercent * 100);
    if (resonance.allStatsPercent) percentHpBonus += (resonance.allStatsPercent * 100);
    const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
    if (constBonuses.partyHpPercent) percentHpBonus += constBonuses.partyHpPercent;

    return Math.round(baseHp * (1 + percentHpBonus / 100));
  },

  addExperienceToSpirit(spirit, gainedXp) {
    if (!spirit || gainedXp <= 0) return 0;
    const species = SPIRIT_SPECIES[spirit.speciesId];
    if (!species) return 0;

    const initialLevel = spirit.level;
    spirit.xp = (spirit.xp || 0) + gainedXp;
    let reqXp = getXpRequiredForLevel(spirit.level);

    while (spirit.xp >= reqXp && spirit.level < (species.levelCap || 100)) {
      spirit.xp -= reqXp;
      spirit.level += 1;
      spirit.power = calculateSpiritPower(species, spirit.level, spirit.rarity);
      const newMaxHp = calculateSpiritMaxHp(species, spirit.level, spirit.rarity);
      const hpBonus = newMaxHp - (spirit.maxHp || newMaxHp);
      spirit.maxHp = newMaxHp;
      spirit.currentHp = Math.min(spirit.maxHp, (spirit.currentHp || newMaxHp) + Math.max(0, hpBonus));
      spirit.isFallen = false;

      if (spirit.level >= (species.levelCap || 100)) {
        spirit.xp = reqXp;
        if (species.evolutions && species.evolutions.length > 0) {
          spirit.canEvolve = true;
        }
        this.emit('spiritLevelCapped', spirit);
        break;
      }

      this.emit('spiritLeveledUp', spirit);
      reqXp = getXpRequiredForLevel(spirit.level);
    }

    return spirit.level - initialLevel;
  },

  buyExpPotion(arg1, arg2) {
    const POTIONS = {
      lesser_elixir: { id: 'lesser_elixir', name: 'Lesser Astral Elixir', icon: '🧪', xp: 10000, shardCost: 1200, essenceGodCost: 10, soulEssenceCost: 1 },
      grand_elixir: { id: 'grand_elixir', name: 'Grand Astral Elixir', icon: '⚗️', xp: 50000, shardCost: 3000, essenceGodCost: 25, soulEssenceCost: 3 },
      divine_ambrosia: { id: 'divine_ambrosia', name: 'Divine Ambrosia', icon: '🏺', xp: 250000, shardCost: 7500, essenceGodCost: 60, soulEssenceCost: 10 }
    };

    const potionId = POTIONS[arg1] ? arg1 : arg2;
    const targetSpiritId = POTIONS[arg1] ? arg2 : arg1;

    const pot = POTIONS[potionId];
    if (!pot) throw new Error('Invalid EXP Potion!');

    const spirit = this.state.spirits.find(s => s.id === targetSpiritId);
    if (!spirit) throw new Error('Target Spirit not found in collection!');

    const res = this.state.resources;
    if (pot.shardCost && (res.spiritShards || 0) < pot.shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${pot.shardCost.toLocaleString()} 💎 (Have: ${(res.spiritShards || 0).toLocaleString()} 💎).`);
    }
    if ((res.soulEssence || 0) < pot.soulEssenceCost) {
      throw new Error(`Insufficient Astral Essence! Need ${pot.soulEssenceCost} 🔮 (Have: ${res.soulEssence || 0} 🔮).`);
    }
    if ((res.essencesOfTheGods || 0) < pot.essenceGodCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${pot.essenceGodCost} 💠 (Have: ${res.essencesOfTheGods || 0} 💠).`);
    }

    if (pot.shardCost > 0) res.spiritShards -= pot.shardCost;
    if (pot.soulEssenceCost > 0) res.soulEssence -= pot.soulEssenceCost;
    if (pot.essenceGodCost > 0) res.essencesOfTheGods -= pot.essenceGodCost;

    const initialLevel = spirit.level;
    this.addExperienceToSpirit(spirit, pot.xp);
    this.save();
    this.emit('spiritLeveled', { spirit, levelUps: spirit.level - initialLevel });
    this.emit('resourcesUpdated', res);

    return { success: true, spirit, xpGained: pot.xp, levelUps: spirit.level - initialLevel };
  }
};
