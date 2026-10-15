import {
  GREEK_GOD_SETS,
  RELIC_SLOT_TYPES,
  RELIC_STAR_TIERS,
  MAX_WEAPON_LEVEL,
  enhanceRelicData,
  enhanceWeaponData,
  getWeaponEnhanceCost,
  ascendRelicData,
  rerollRelicSubstatsData
} from '../../data/equipmentData.js';

export const equipmentMethods = {
  getEquipmentMap() {
    if (!this._equipmentMap || this._equipmentMapDirty) {
      this._equipmentMap = new Map();
      const list = (this.state && this.state.inventory && this.state.inventory.equipment) || [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item && item.uid) this._equipmentMap.set(item.uid, item);
      }
      this._equipmentMapDirty = false;
    }
    return this._equipmentMap;
  },

  getEquipmentItemByUid(uid) {
    if (!uid) return null;
    const map = this.getEquipmentMap();
    let item = map.get(uid);
    if (!item && this.state && this.state.inventory && Array.isArray(this.state.inventory.equipment)) {
      item = this.state.inventory.equipment.find(e => e && e.uid === uid) || null;
      if (item) map.set(uid, item);
    }
    return item || null;
  },

  getSpiritEquippedItems(spiritOrId) {
    if (!spiritOrId) return { weapon: null, relics: {} };
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return { weapon: null, relics: {} };
    const weapon = spirit.weapon ? this.getEquipmentItemByUid(spirit.weapon) : null;
    const relics = {};
    if (spirit.relics) {
      for (const [slot, uid] of Object.entries(spirit.relics)) {
        relics[slot] = uid ? this.getEquipmentItemByUid(uid) : null;
      }
    }
    return { weapon, relics };
  },

  getSpiritActiveSetBonuses(spiritOrId) {
    if (!spiritOrId) return [];
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit || !spirit.relics) return [];

    if (this._setBonusesCache && this._setBonusesCache.has(spirit.id)) {
      return this._setBonusesCache.get(spirit.id);
    }

    const countBySet = {};
    for (const relicUid of Object.values(spirit.relics)) {
      if (!relicUid) continue;
      const relic = this.getEquipmentItemByUid(relicUid);
      if (relic && relic.setId) {
        countBySet[relic.setId] = (countBySet[relic.setId] || 0) + 1;
      }
    }

    const activeBonuses = [];
    for (const [setId, count] of Object.entries(countBySet)) {
      const godSet = GREEK_GOD_SETS[setId];
      if (!godSet) continue;
      if (count >= 2) {
        activeBonuses.push({
          setId,
          godName: godSet.god,
          tier: '2pc',
          name: godSet.bonus2pc.name,
          description: godSet.bonus2pc.description,
          bonus: godSet.bonus2pc,
          color: godSet.color,
          icon: godSet.icon,
          count
        });
      }
      if (count >= 4) {
        activeBonuses.push({
          setId,
          godName: godSet.god,
          tier: '4pc',
          name: godSet.bonus4pc.name,
          description: godSet.bonus4pc.description,
          bonus: godSet.bonus4pc,
          color: godSet.color,
          icon: godSet.icon,
          count
        });
      }
    }

    if (!this._setBonusesCache) this._setBonusesCache = new Map();
    this._setBonusesCache.set(spirit.id, activeBonuses);
    return activeBonuses;
  },

  getPartyActiveSetBonuses() {
    const party = this.getPartySpirits ? this.getPartySpirits() : [];
    const partyBonuses = [];
    for (const spirit of party) {
      if (!spirit) continue;
      const bonuses = this.getSpiritActiveSetBonuses(spirit);
      for (const b of bonuses) {
        partyBonuses.push({ ...b, spiritId: spirit.id, spirit });
      }
    }
    return partyBonuses;
  },

  proc4PieceSetBonus(spirit, setBonusObj) {
    if (!setBonusObj) return;
    const { madnessZone } = this.state;
    const livingEnemies = (madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);

    const setId = setBonusObj.setId || setBonusObj.id;

    switch (setId) {
      case 'hades': {
        for (const em of livingEnemies) {
          const dotDamage = Math.max(1, Math.round(em.maxHp * 0.025));
          em.hp = Math.max(0, em.hp - dotDamage);
          if (em.hp <= 0) this.onIndividualEnemyKilled(em);
        }
        break;
      }
      case 'zeus': {
        for (const em of livingEnemies) {
          const strikeDamage = Math.max(1, Math.round(em.maxHp * 0.08));
          em.hp = Math.max(0, em.hp - strikeDamage);
          if (em.hp <= 0) this.onIndividualEnemyKilled(em);
        }
        break;
      }
      case 'poseidon': {
        for (const ally of livingSpirits) {
          ally.shieldHp = (ally.shieldHp || 0) + Math.round(ally.maxHp * 0.15);
        }
        break;
      }
      case 'hermes': {
        for (const ally of livingSpirits) {
          const heal = Math.round(ally.maxHp * 0.03 * 7);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
          ally.currentMp = Math.min(ally.maxMp, (ally.currentMp || 0) + 25);
        }
        break;
      }
      case 'ares': {
        for (const em of livingEnemies) {
          em.power = Math.max(1, Math.round(em.power * 0.9));
        }
        break;
      }
      case 'apollo': {
        if (livingSpirits.length > 0) {
          const sorted = [...livingSpirits].sort((a, b) => a.currentHp - b.currentHp);
          const lowest = sorted[0];
          lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + Math.round(lowest.maxHp * 0.08));
        }
        break;
      }
      case 'athena': {
        for (const ally of livingSpirits) {
          ally.shieldHp = (ally.shieldHp || 0) + Math.round(ally.maxHp * 0.20);
        }
        break;
      }
      case 'artemis': {
        if (livingEnemies.length > 0) {
          const sorted = [...livingEnemies].sort((a, b) => b.hp - a.hp);
          const highest = sorted[0];
          const pierce = Math.max(1, Math.round(highest.maxHp * 0.12));
          highest.hp = Math.max(0, highest.hp - pierce);
          if (highest.hp <= 0) this.onIndividualEnemyKilled(highest);
        }
        break;
      }
      case 'hephaestus': {
        const stats = this.getSpiritCombatStats(spirit);
        const sDef = stats ? stats.def : 40;
        const sHp = stats ? stats.maxHp : 200;
        const ultAmp = stats ? (stats.ultAmp || 0) : 0;
        const eruptionDmg = Math.max(1, Math.round((sDef * 2.0 + sHp * 0.10) * (1 + ultAmp / 100)));
        for (const em of livingEnemies) {
          em.hp = Math.max(0, em.hp - eruptionDmg);
          if (em.hp <= 0) this.onIndividualEnemyKilled(em);
        }
        spirit.tauntTimer = 4.0;
        break;
      }
      case 'atlas': {
        const stats = this.getSpiritCombatStats(spirit);
        const sHp = stats ? stats.maxHp : 200;
        spirit.shieldHp = (spirit.shieldHp || 0) + Math.round(sHp * 0.30);
        spirit.tauntTimer = 8.0;
        break;
      }
    }

    this.emit('setBonusProc', {
      spirit,
      godSet: setBonusObj,
      name: setBonusObj.name,
      description: setBonusObj.description
    });
  },

  equipItem(spiritId, itemUid) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');

    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];
    const item = equipmentList.find(e => e.uid === itemUid);
    if (!item) throw new Error('Equipment not found in inventory');

    if (item.type === 'weapon') {
      if (spirit.weapon) {
        const oldWpn = equipmentList.find(e => e.uid === spirit.weapon);
        if (oldWpn) oldWpn.equippedToSpiritId = null;
      }
      if (item.equippedToSpiritId) {
        const prevSpirit = this.state.spirits.find(s => s.id === item.equippedToSpiritId);
        if (prevSpirit && prevSpirit.weapon === item.uid) {
          prevSpirit.weapon = null;
        }
      }
      spirit.weapon = item.uid;
      item.equippedToSpiritId = spirit.id;
    } else if (item.type === 'relic') {
      const slotType = item.slotTypeId;
      if (!spirit.relics) {
        spirit.relics = { headgear: null, totem: null, ring: null, necklace: null, orb: null, charm: null };
      }
      if (spirit.relics[slotType]) {
        const oldRelic = equipmentList.find(e => e.uid === spirit.relics[slotType]);
        if (oldRelic) oldRelic.equippedToSpiritId = null;
      }
      if (item.equippedToSpiritId) {
        const prevSpirit = this.state.spirits.find(s => s.id === item.equippedToSpiritId);
        if (prevSpirit && prevSpirit.relics && prevSpirit.relics[slotType] === item.uid) {
          prevSpirit.relics[slotType] = null;
        }
      }
      spirit.relics[slotType] = item.uid;
      item.equippedToSpiritId = spirit.id;
    }

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { spirit, item });
    this.emit('inventoryUpdated', this.state.inventory);
    return { success: true, spirit, item };
  },

  unequipItem(spiritId, slotType) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];

    if (slotType === 'weapon') {
      if (spirit.weapon) {
        const wpn = this.getEquipmentItemByUid(spirit.weapon);
        if (wpn) wpn.equippedToSpiritId = null;
        spirit.weapon = null;
      }
    } else {
      if (spirit.relics && spirit.relics[slotType]) {
        const relic = this.getEquipmentItemByUid(spirit.relics[slotType]);
        if (relic) relic.equippedToSpiritId = null;
        spirit.relics[slotType] = null;
      }
    }

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { spirit, slotType });
    this.emit('inventoryUpdated', this.state.inventory);
    return { success: true, spirit, slotType };
  },

  quickEquipBest(spiritOrId) {
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) throw new Error('Spirit not found');
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];

    let equippedCount = 0;

    // 1. Weapon
    const currentWeapon = spirit.weapon ? this.getEquipmentItemByUid(spirit.weapon) : null;
    const currentWeaponPower = currentWeapon ? (currentWeapon.atkPower || 0) : -1;

    const availableWeapons = equipmentList.filter(e => 
      e.type === 'weapon' && (!e.equippedToSpiritId || e.equippedToSpiritId === spirit.id)
    );
    if (availableWeapons.length > 0) {
      availableWeapons.sort((a, b) => (b.atkPower || 0) - (a.atkPower || 0));
      const bestWeapon = availableWeapons[0];
      if (bestWeapon && (!currentWeapon || (bestWeapon.atkPower || 0) > currentWeaponPower)) {
        this.equipItem(spirit.id, bestWeapon.uid);
        equippedCount++;
      }
    }

    // 2. Relics
    if (!spirit.relics) {
      spirit.relics = { headgear: null, totem: null, ring: null, necklace: null, orb: null, charm: null };
    }

    for (const slotDef of RELIC_SLOT_TYPES) {
      const slotId = slotDef.id;
      const currentRelic = spirit.relics[slotId] ? this.getEquipmentItemByUid(spirit.relics[slotId]) : null;
      const currentRelicScore = currentRelic 
        ? (currentRelic.mainStatValue || 0) + (currentRelic.stars || 1) * 20 + (currentRelic.level || 0) * 5 
        : -1;

      const availableRelics = equipmentList.filter(e => 
        e.type === 'relic' && 
        e.slotTypeId === slotId && 
        (!e.equippedToSpiritId || e.equippedToSpiritId === spirit.id)
      );

      if (availableRelics.length > 0) {
        availableRelics.sort((a, b) => {
          const scoreA = (a.mainStatValue || 0) + (a.stars || 1) * 20 + (a.level || 0) * 5;
          const scoreB = (b.mainStatValue || 0) + (b.stars || 1) * 20 + (b.level || 0) * 5;
          return scoreB - scoreA;
        });
        const bestRelic = availableRelics[0];
        const bestScore = (bestRelic.mainStatValue || 0) + (bestRelic.stars || 1) * 20 + (bestRelic.level || 0) * 5;
        if (bestRelic && (!currentRelic || bestScore > currentRelicScore)) {
          this.equipItem(spirit.id, bestRelic.uid);
          equippedCount++;
        }
      }
    }

    this.invalidateCaches();
    this.save();
    return { success: true, spirit, equippedCount };
  },

  rerollRelicSubstats(itemUid, options = {}) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) {
      throw new Error('Inventory equipment not initialized');
    }
    const item = this.state.inventory.equipment.find(e => e.uid === itemUid);
    if (!item) throw new Error('Relic not found in inventory');
    if (item.type !== 'relic') throw new Error('Only Relics can have their substats rerolled!');

    const res = this.state.resources;
    let usedReshaper = false;
    if ((res.relicReshapers || 0) >= 1) {
      res.relicReshapers -= 1;
      usedReshaper = true;
    } else if ((res.soulEssence || 0) >= 5) {
      res.soulEssence -= 5;
    } else {
      throw new Error('Insufficient Soul Essence or Relic Reshapers! Purchase a Relic Reshaper from the Dwarven\'s Forge in the Astral Realm (Need 1 Relic Reshaper or 5 Soul Essence).');
    }

    rerollRelicSubstatsData(item, options);

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);

    return {
      success: true,
      item,
      usedReshaper,
      remainingReshapers: res.relicReshapers || 0,
      remainingEssence: res.soulEssence || 0
    };
  },

  dismantleEquipment(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const index = this.state.inventory.equipment.findIndex(e => e.uid === itemUid);
    if (index === -1) throw new Error('Item not found in inventory');

    const item = this.state.inventory.equipment[index];
    if (item.equippedToSpiritId) {
      throw new Error('Cannot dismantle an equipped item! Unequip it first.');
    }

    this.state.inventory.equipment.splice(index, 1);

    let shardsGained = 0;
    let essencesGained = 0;

    if (item.type === 'relic') {
      const stars = item.stars || 3;
      const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
      const itemLvl = Math.max(1, item.level || 1);
      shardsGained = Math.round(tier.dismantleShards * (1 + (itemLvl - 1) * 0.15));
      essencesGained = Math.max(tier.dismantleEssences, tier.dismantleEssences + Math.max(0, itemLvl - 1) * 2);
      this.state.resources.spiritShards += shardsGained;
      this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + essencesGained;
    } else {
      shardsGained = Math.round(25 * (item.level || 1));
      this.state.resources.spiritShards += shardsGained;
    }

    this.invalidateCaches();
    this.save();
    this.emit('equipmentDismantled', { item, shardsGained, essencesGained });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, shardsGained, essencesGained };
  },

  bulkDismantleEquipment(itemUids) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment) || !Array.isArray(itemUids) || itemUids.length === 0) {
      return { count: 0, shardsGained: 0, essencesGained: 0 };
    }

    let count = 0;
    let totalShardsGained = 0;
    let totalEssencesGained = 0;
    const uidsToDismantle = new Set(itemUids);

    const remainingEquipment = [];
    for (const item of this.state.inventory.equipment) {
      if (uidsToDismantle.has(item.uid) && !item.equippedToSpiritId && !item.favorite) {
        let shardsGained = 0;
        let essencesGained = 0;
        if (item.type === 'relic') {
          const stars = item.stars || 3;
          const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
          const itemLvl = Math.max(1, item.level || 1);
          shardsGained = Math.round(tier.dismantleShards * (1 + (itemLvl - 1) * 0.15));
          essencesGained = Math.max(tier.dismantleEssences, tier.dismantleEssences + Math.max(0, itemLvl - 1) * 2);
        } else {
          shardsGained = Math.round(25 * (item.level || 1));
        }
        totalShardsGained += shardsGained;
        totalEssencesGained += essencesGained;
        count++;
      } else {
        remainingEquipment.push(item);
      }
    }

    this.state.inventory.equipment = remainingEquipment;
    this.state.resources.spiritShards += totalShardsGained;
    this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + totalEssencesGained;

    this.invalidateCaches();
    this.save();
    this.emit('equipmentBulkDismantled', { count, shardsGained: totalShardsGained, essencesGained: totalEssencesGained });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);

    return {
      count,
      shardsGained: totalShardsGained,
      essencesGained: totalEssencesGained
    };
  },

  bulkDismantle(itemUids) {
    return this.bulkDismantleEquipment(itemUids);
  },

  enhanceRelic(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const item = this.getEquipmentItemByUid(itemUid);
    if (!item) throw new Error('Relic not found in inventory');
    if (item.type !== 'relic') throw new Error('Item is not a Relic');

    const stars = item.stars || 3;
    const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
    if (item.level >= tier.maxLevel) {
      throw new Error(`Relic has reached maximum enhancement (+${tier.maxLevel})!`);
    }

    const nextLevel = item.level + 1;
    const shardCost = Math.round(50 * nextLevel * (stars * 0.4));
    const isMilestone = nextLevel % 3 === 0;
    const essenceCost = isMilestone ? Math.round(stars * 2 + nextLevel * 0.5) : 0;

    if (this.state.resources.spiritShards < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost}, have ${this.state.resources.spiritShards}.`);
    }
    if (essenceCost > 0 && (this.state.resources.essencesOfTheGods || 0) < essenceCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${essenceCost}, have ${this.state.resources.essencesOfTheGods || 0}.`);
    }

    this.state.resources.spiritShards -= shardCost;
    if (essenceCost > 0) {
      this.state.resources.essencesOfTheGods -= essenceCost;
    }

    enhanceRelicData(item);
    this.addContractorXp(20, 'Relic Refinement');

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, item, shardCost, essenceCost };
  },

  enhanceWeapon(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const item = this.getEquipmentItemByUid(itemUid);
    if (!item) throw new Error('Weapon not found in inventory');
    if (item.type !== 'weapon') throw new Error('Item is not a Weapon');

    const currentLevel = item.level || 1;
    if (currentLevel >= MAX_WEAPON_LEVEL) {
      throw new Error(`Weapon has reached maximum enhancement (+${MAX_WEAPON_LEVEL})!`);
    }

    const costInfo = getWeaponEnhanceCost(item);
    if (!costInfo) {
      throw new Error(`Weapon has reached maximum enhancement (+${MAX_WEAPON_LEVEL})!`);
    }

    const { nextLevel, shardCost, essenceCost } = costInfo;

    if (this.state.resources.spiritShards < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost}, have ${this.state.resources.spiritShards}.`);
    }
    if (essenceCost > 0 && (this.state.resources.essencesOfTheGods || 0) < essenceCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${essenceCost}, have ${this.state.resources.essencesOfTheGods || 0}.`);
    }

    this.state.resources.spiritShards -= shardCost;
    if (essenceCost > 0) {
      this.state.resources.essencesOfTheGods -= essenceCost;
    }

    enhanceWeaponData(item);
    this.addContractorXp(20, 'Weapon Refinement');

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, item, shardCost, essenceCost, nextLevel };
  },

  enhanceEquipment(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const item = this.getEquipmentItemByUid(itemUid);
    if (!item) throw new Error('Equipment item not found in inventory');
    if (item.type === 'weapon') {
      return this.enhanceWeapon(itemUid);
    } else {
      return this.enhanceRelic(itemUid);
    }
  },

  ascendRelic(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const item = this.getEquipmentItemByUid(itemUid);
    if (!item) throw new Error('Relic not found in inventory');
    if (item.type !== 'relic') throw new Error('Item is not a Relic');
    if (item.stars !== 5) throw new Error('Only 5★ Relics can be ascended to 6★!');
    if (item.level < 15) throw new Error('Relic must be enhanced to +15 before ascending!');

    const essenceGodCost = 100;
    const soulEssenceCost = 10;

    if ((this.state.resources.essencesOfTheGods || 0) < essenceGodCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${essenceGodCost}, have ${this.state.resources.essencesOfTheGods || 0}.`);
    }
    if ((this.state.resources.soulEssence || 0) < soulEssenceCost) {
      throw new Error(`Insufficient Soul Essence! Need ${soulEssenceCost}, have ${this.state.resources.soulEssence || 0}.`);
    }

    this.state.resources.essencesOfTheGods -= essenceGodCost;
    this.state.resources.soulEssence -= soulEssenceCost;

    ascendRelicData(item);

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, item };
  }
};
