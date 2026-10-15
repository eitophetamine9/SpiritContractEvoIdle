import { SPIRIT_SPECIES } from '../../data/spiritsData.js';
import {
  CONSTELLATIONS_CONFIG,
  EXPEDITIONS_CONFIG,
  TRANSMUTATION_CONFIG
} from '../../data/astralRealmData.js';
import {
  GREEK_GOD_SETS,
  RELIC_SLOT_TYPES,
  RELIC_SUBSTAT_TYPES,
  createRelicInstance,
  rerollRelicSubstatsData
} from '../../data/equipmentData.js';

export const astralMethods = {
  /**
   * Permanently expands Max Energy by +10
   * Scaling cost: 8 + (purchases * 4) Soul Essence
   */
  buyMaxEnergyExpansion() {
    const purchases = this.state.resources.maxEnergyPurchases || 0;
    const cost = 8 + purchases * 4;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    this.state.resources.soulEssence -= cost;
    this.state.resources.maxEnergyPurchases = purchases + 1;
    this.state.resources.maxEnergy += 10;
    this.state.resources.energy += 10;
    this.save();
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });
    return { newMaxEnergy: this.state.resources.maxEnergy };
  },

  /**
   * Instantly restores +30 Energy
   * Costs 3 Soul Essence (Rebalanced from 2)
   */
  buyInstantEnergySurge() {
    const cost = 3;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    this.state.resources.soulEssence -= cost;
    this.state.resources.energy = Math.min(this.state.resources.maxEnergy, this.state.resources.energy + 30);
    this.save();
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });
    return { currentEnergy: this.state.resources.energy };
  },

  /**
   * Permanently upgrades party resonance (+5% all spirit power per tier)
   * Costs 6 + (tier * 4) Soul Essence (Rebalanced)
   */
  buyPartyResonanceUpgrade() {
    const currentTier = this.state.resources.resonanceTier || 0;
    const cost = 6 + currentTier * 4;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    this.state.resources.soulEssence -= cost;
    this.state.resources.resonanceTier = currentTier + 1;
    this.save();
    this.emit('partyUpdated', this.getPartySpirits());
    return { newTier: this.state.resources.resonanceTier, bonusPercent: (currentTier + 1) * 5 };
  },

  getConstellationBonuses() {
    const bonuses = {
      partyAtkPercent: 0,
      critRate: 0,
      critDamage: 0,
      ultAmp: 0,
      partyHpPercent: 0,
      initialShieldPercent: 0,
      healingReceivedPercent: 0,
      damageMitigationPercent: 0,
      energyRegenBonus: 0,
      maxEnergyBonus: 0,
      bonusAstralDropChance: 0,
      afkXpBonus: 0,
      bonusGodEssencesPercent: 0
    };

    if (!this.state || !this.state.constellations) return bonuses;

    for (const [cId, level] of Object.entries(this.state.constellations)) {
      const config = CONSTELLATIONS_CONFIG[cId];
      if (!config) continue;
      for (let node = 1; node <= level; node++) {
        const star = config.stars.find(s => s.node === node);
        if (star && star.bonus) {
          for (const [key, val] of Object.entries(star.bonus)) {
            bonuses[key] = (bonuses[key] || 0) + val;
          }
        }
      }
    }

    return bonuses;
  },

  unlockConstellationStar(constellationId) {
    const config = CONSTELLATIONS_CONFIG[constellationId];
    if (!config) throw new Error('Invalid Celestial Constellation!');

    const currentLevel = (this.state.constellations && this.state.constellations[constellationId]) || 0;
    if (currentLevel >= 5) {
      throw new Error(`${config.name} constellation is already fully illuminated!`);
    }

    const nextNode = currentLevel + 1;
    const star = config.stars.find(s => s.node === nextNode);
    if (!star) throw new Error('Star node configuration not found!');

    const res = this.state.resources;
    if ((res.soulEssence || 0) < star.cost) {
      throw new Error(`Insufficient Astral Essence! Need ${star.cost} 🔮 (Have: ${res.soulEssence || 0} 🔮).`);
    }

    res.soulEssence -= star.cost;
    this.state.constellations[constellationId] = nextNode;
    if (star.bonus && star.bonus.maxEnergyBonus) {
      res.maxEnergy = (res.maxEnergy || 100) + star.bonus.maxEnergyBonus;
      res.energy = Math.min(res.maxEnergy, res.energy + star.bonus.maxEnergyBonus);
    }
    this.invalidateCaches();
    this.save();

    this.emit('constellationUpdated', { constellationId, newLevel: nextNode, star });
    this.emit('resourcesUpdated', res);
    this.emit('partyUpdated', this.getPartySpirits());

    return { success: true, constellationId, newLevel: nextNode, star };
  },

  getEligibleExpeditionSpirits() {
    const partyIds = new Set(this.state.party || []);
    const expeditionIds = new Set();
    for (const exp of Object.values(this.state.expeditions || {})) {
      if (exp && exp.active && Array.isArray(exp.spiritIds)) {
        exp.spiritIds.forEach(id => expeditionIds.add(id));
      }
    }
    return (this.state.spirits || []).filter(s => !partyIds.has(s.id) && !expeditionIds.has(s.id));
  },

  dispatchExpedition(fissureId, spiritIds = []) {
    const fissure = EXPEDITIONS_CONFIG.find(f => f.id === fissureId);
    if (!fissure) throw new Error('Invalid Expedition Fissure!');

    const activeExp = this.state.expeditions[fissureId];
    if (activeExp && activeExp.active) {
      throw new Error('An expedition is already in progress in this fissure!');
    }

    if (!Array.isArray(spiritIds) || spiritIds.length !== fissure.requiredSpirits) {
      throw new Error(`This expedition requires exactly ${fissure.requiredSpirits} spirit(s). Selected: ${spiritIds.length}.`);
    }

    // Validate selected spirits
    const allExpeditionSpiritIds = new Set();
    for (const exp of Object.values(this.state.expeditions || {})) {
      if (exp && exp.active && Array.isArray(exp.spiritIds)) {
        exp.spiritIds.forEach(id => allExpeditionSpiritIds.add(id));
      }
    }

    for (const id of spiritIds) {
      const spirit = this.state.spirits.find(s => s.id === id);
      if (!spirit) throw new Error(`Spirit ${id} not found in collection!`);
      const spiritName = spirit.customName || (SPIRIT_SPECIES[spirit.speciesId]?.name) || spirit.id;
      if (this.state.party.includes(id)) {
        throw new Error(`Cannot dispatch ${spiritName} while in active combat party!`);
      }
      if (allExpeditionSpiritIds.has(id)) {
        throw new Error(`Cannot dispatch ${spiritName} while already on another expedition!`);
      }
    }

    this.state.expeditions[fissureId] = {
      fissureId,
      spiritIds: [...spiritIds],
      startTime: Date.now(),
      durationSec: fissure.durationSec,
      active: true
    };

    this.save();
    this.emit('expeditionStarted', this.state.expeditions[fissureId]);
    return { success: true, expedition: this.state.expeditions[fissureId] };
  },

  claimExpeditionRewards(fissureId) {
    const fissure = EXPEDITIONS_CONFIG.find(f => f.id === fissureId);
    if (!fissure) throw new Error('Invalid Expedition Fissure!');

    const exp = this.state.expeditions[fissureId];
    if (!exp || !exp.active) {
      throw new Error('No active expedition found for this fissure!');
    }

    const elapsedSec = (Date.now() - exp.startTime) / 1000;
    if (elapsedSec < exp.durationSec) {
      const remainMin = Math.ceil((exp.durationSec - elapsedSec) / 60);
      throw new Error(`Expedition is still ongoing! Time remaining: ${remainMin} minute(s).`);
    }

    // Check elemental synergy bonus
    let hasElementMatch = false;
    for (const sId of exp.spiritIds) {
      const sp = this.state.spirits.find(s => s.id === sId);
      if (sp && sp.element === fissure.recommendedElement) {
        hasElementMatch = true;
        break;
      }
    }

    const mult = hasElementMatch ? 1.25 : 1.0;
    const astralGained = Math.round((fissure.rewards.minAstral + Math.random() * (fissure.rewards.maxAstral - fissure.rewards.minAstral)) * mult);
    const godsGained = Math.round((fissure.rewards.minGods + Math.random() * (fissure.rewards.maxGods - fissure.rewards.minGods)) * mult);
    const shardsGained = Math.round(fissure.rewards.shards * mult);

    this.state.resources.soulEssence = (this.state.resources.soulEssence || 0) + astralGained;
    this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + godsGained;
    this.state.resources.spiritShards = (this.state.resources.spiritShards || 0) + shardsGained;

    let relicGained = null;
    if (fissure.rewards.dropRelicChance && Math.random() < fissure.rewards.dropRelicChance) {
      const godKeys = Object.keys(GREEK_GOD_SETS);
      const randomGod = godKeys[Math.floor(Math.random() * godKeys.length)];
      const randomSlot = RELIC_SLOT_TYPES[Math.floor(Math.random() * RELIC_SLOT_TYPES.length)];
      relicGained = createRelicInstance({
        setId: randomGod,
        slotTypeId: randomSlot.id,
        rarity: Math.random() < 0.7 ? 'RARE' : 'EPIC',
        level: 1
      });
      this.state.inventory.equipment.push(relicGained);
    }

    this.state.expeditions[fissureId] = null;
    this.save();

    const rewards = {
      astralGained,
      godsGained,
      shardsGained,
      relicGained,
      hasElementMatch
    };

    this.emit('expeditionClaimed', { fissureId, rewards });
    this.emit('resourcesUpdated', this.state.resources);
    if (relicGained) this.emit('inventoryUpdated', this.state.inventory);

    return rewards;
  },

  transmuteShardsToAstralEssence() {
    const today = new Date().toDateString();
    if (this.state.lastTransmutationDate !== today) {
      this.state.lastTransmutationDate = today;
      this.state.transmutationsToday = 0;
    }

    const currentCount = this.state.transmutationsToday || 0;
    const maxQuota = TRANSMUTATION_CONFIG.dailyQuota || 5;
    if (currentCount >= maxQuota) {
      throw new Error(`Daily transmutation limit reached (${maxQuota}/${maxQuota})! Please return tomorrow.`);
    }

    // Anti-oversaturation scaling: 1000 base + 250 per transmutation today
    const shardCost = TRANSMUTATION_CONFIG.shardCost + currentCount * 250;
    const godCost = TRANSMUTATION_CONFIG.godEssenceCost;

    const res = this.state.resources;
    if ((res.spiritShards || 0) < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost.toLocaleString()} 💎 (Have: ${res.spiritShards.toLocaleString()} 💎).`);
    }
    if ((res.essencesOfTheGods || 0) < godCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${godCost} 💠 (Have: ${res.essencesOfTheGods || 0} 💠).`);
    }

    res.spiritShards -= shardCost;
    res.essencesOfTheGods -= godCost;
    res.soulEssence = (res.soulEssence || 0) + TRANSMUTATION_CONFIG.astralEssenceReward;

    this.state.transmutationsToday = currentCount + 1;
    this.save();

    this.emit('transmutationCompleted', {
      shardCost,
      godCost,
      astralGained: TRANSMUTATION_CONFIG.astralEssenceReward,
      transmutationsToday: this.state.transmutationsToday
    });
    this.emit('resourcesUpdated', res);

    return {
      success: true,
      astralGained: TRANSMUTATION_CONFIG.astralEssenceReward,
      shardCost,
      godCost,
      transmutationsToday: this.state.transmutationsToday
    };
  },

  getDwarvenWeekKey(d = new Date()) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${weekNum}`;
  },

  checkDwarvenForgeWeekReset() {
    const currentWeek = this.getDwarvenWeekKey();
    if (!this.state.dwarvenForge || typeof this.state.dwarvenForge !== 'object') {
      this.state.dwarvenForge = {
        weekKey: currentWeek,
        scripturesPurchasedThisWeek: 0,
        reshapersPurchasedThisWeek: 0
      };
    } else if (this.state.dwarvenForge.weekKey !== currentWeek) {
      this.state.dwarvenForge.weekKey = currentWeek;
      this.state.dwarvenForge.scripturesPurchasedThisWeek = 0;
      this.state.dwarvenForge.reshapersPurchasedThisWeek = 0;
    }
  },

  buyDivineScriptureFromDwarvenForge(quantity = 1) {
    this.checkDwarvenForgeWeekReset();
    const qty = Math.max(1, quantity);
    const forge = this.state.dwarvenForge;
    const currentWeekly = forge.scripturesPurchasedThisWeek || 0;
    const weeklyLimit = 3;

    if (currentWeekly + qty > weeklyLimit) {
      throw new Error(`Weekly purchase limit reached for Divine Scripture (${currentWeekly}/${weeklyLimit} this week)! Resets every Monday.`);
    }

    const shardCost = 5000 * qty;
    const godCost = 40 * qty;
    const soulCost = 15 * qty;

    const res = this.state.resources;
    if ((res.spiritShards || 0) < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost.toLocaleString()} 💎 (Have: ${(res.spiritShards || 0).toLocaleString()} 💎).`);
    }
    if ((res.essencesOfTheGods || 0) < godCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${godCost} 💠 (Have: ${res.essencesOfTheGods || 0} 💠).`);
    }
    if ((res.soulEssence || 0) < soulCost) {
      throw new Error(`Insufficient Soul Essence! Need ${soulCost} 🔮 (Have: ${res.soulEssence || 0} 🔮).`);
    }

    res.spiritShards -= shardCost;
    res.essencesOfTheGods -= godCost;
    res.soulEssence -= soulCost;
    res.divineScriptures = (res.divineScriptures || 0) + qty;
    forge.scripturesPurchasedThisWeek = currentWeekly + qty;

    this.save();
    this.emit('resourcesUpdated', res);
    this.emit('dwarvenForgePurchased', {
      item: 'divineScripture',
      quantity: qty,
      scripturesPurchasedThisWeek: forge.scripturesPurchasedThisWeek
    });

    return {
      success: true,
      purchased: qty,
      shardCost,
      godCost,
      soulCost,
      remainingScriptures: res.divineScriptures,
      purchasedThisWeek: forge.scripturesPurchasedThisWeek,
      weeklyLimit
    };
  },

  buyRelicReshaper(quantity = 1) {
    this.checkDwarvenForgeWeekReset();
    const qty = Math.max(1, quantity);
    const forge = this.state.dwarvenForge;
    const currentWeekly = forge.reshapersPurchasedThisWeek || 0;
    const weeklyLimit = 12;

    if (currentWeekly + qty > weeklyLimit) {
      throw new Error(`Weekly purchase limit reached for Relic Reshaper (${currentWeekly}/${weeklyLimit} this week)! Resets every Monday.`);
    }

    const shardCost = 1500 * qty;
    const godCost = 12 * qty;
    const soulCost = 4 * qty;

    const res = this.state.resources;
    if ((res.spiritShards || 0) < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost.toLocaleString()} 💎 (Have: ${(res.spiritShards || 0).toLocaleString()} 💎).`);
    }
    if ((res.essencesOfTheGods || 0) < godCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${godCost} 💠 (Have: ${res.essencesOfTheGods || 0} 💠).`);
    }
    if ((res.soulEssence || 0) < soulCost) {
      throw new Error(`Insufficient Soul Essence! Need ${soulCost} 🔮 (Have: ${res.soulEssence || 0} 🔮).`);
    }

    res.spiritShards -= shardCost;
    res.essencesOfTheGods -= godCost;
    res.soulEssence -= soulCost;
    res.relicReshapers = (res.relicReshapers || 0) + qty;
    forge.reshapersPurchasedThisWeek = currentWeekly + qty;

    this.save();
    this.emit('resourcesUpdated', res);
    this.emit('dwarvenForgePurchased', {
      item: 'relicReshaper',
      quantity: qty,
      reshapersPurchasedThisWeek: forge.reshapersPurchasedThisWeek
    });

    return {
      success: true,
      purchased: qty,
      shardCost,
      godCost,
      soulCost,
      remainingReshapers: res.relicReshapers,
      purchasedThisWeek: forge.reshapersPurchasedThisWeek,
      weeklyLimit
    };
  },

  buyDivineScripture(quantity = 1) {
    const costPerItem = 15;
    const qty = Math.max(1, quantity);
    const totalCost = costPerItem * qty;
    if ((this.state.resources.soulEssence || 0) < totalCost) {
      throw new Error(`Insufficient Soul Essence! Need ${totalCost} 🔮 (Have: ${this.state.resources.soulEssence || 0} 🔮).`);
    }

    this.state.resources.soulEssence -= totalCost;
    this.state.resources.divineScriptures = (this.state.resources.divineScriptures || 0) + qty;

    this.save();
    this.emit('resourcesUpdated', this.state.resources);
    return {
      success: true,
      purchased: qty,
      cost: totalCost,
      remainingEssence: this.state.resources.soulEssence,
      totalScriptures: this.state.resources.divineScriptures
    };
  },

  applyDivineScripture(itemUid, subType1, subType2) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) {
      throw new Error('Inventory equipment not initialized');
    }
    const item = this.state.inventory.equipment.find(e => e.uid === itemUid);
    if (!item) throw new Error('Relic not found in inventory');
    if (item.type !== 'relic') throw new Error('Only Relics can be inscribed with Divine Scripture!');

    if ((this.state.resources.divineScriptures || 0) < 1) {
      throw new Error('No Divine Relic Scriptures available! Purchase one for 15 Soul Essences.');
    }

    if (!subType1 || !subType2) {
      throw new Error('You must select two guaranteed substats!');
    }
    if (subType1 === subType2) {
      throw new Error('Please select two distinct substats!');
    }

    const validSub1 = RELIC_SUBSTAT_TYPES.find(s => s.id === subType1);
    const validSub2 = RELIC_SUBSTAT_TYPES.find(s => s.id === subType2);
    if (!validSub1 || !validSub2) {
      throw new Error('Invalid substats selected!');
    }

    this.state.resources.divineScriptures -= 1;
    rerollRelicSubstatsData(item, { lockedSubTypes: [subType1, subType2] });

    this.invalidateCaches();
    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);

    return {
      success: true,
      item,
      remainingScriptures: this.state.resources.divineScriptures,
      lockedSubTypes: [subType1, subType2]
    };
  },

  upgradeEnergyCapacity() {
    const res = this.state.resources;
    const currentMax = res.maxEnergy || 60;
    if (currentMax >= 500) {
      throw new Error('Energy capacity is already at the maximum limit of 500 ⚡!');
    }

    const tierIndex = Math.floor((currentMax - 60) / 20);
    const costEssence = Math.round(15 * Math.pow(1.18, tierIndex));
    const costSoul = 1 + Math.floor(tierIndex * 0.75); // Linear Astral Essence cost from Tier 1

    if ((res.essencesOfTheGods || 0) < costEssence) {
      throw new Error(`Insufficient Essences of the Gods! Need ${costEssence}, have ${res.essencesOfTheGods || 0}.`);
    }
    if (costSoul > 0 && (res.soulEssence || 0) < costSoul) {
      throw new Error(`Insufficient Astral Essence! Need ${costSoul} 🔮, have ${res.soulEssence || 0} 🔮.`);
    }

    res.essencesOfTheGods -= costEssence;
    if (costSoul > 0) res.soulEssence -= costSoul;

    res.maxEnergy = Math.min(500, currentMax + 20);

    this.save();
    this.emit('resourcesUpdated', res);
    return { success: true, newMaxEnergy: res.maxEnergy, costEssence, costSoul };
  },

  applyTemporaryBlessing(blessingId) {
    const ALIASES = {
      ares_blessing: 'blessing_ares',
      athena_blessing: 'blessing_athena',
      hermes_blessing: 'blessing_hermes',
      zeus_blessing: 'blessing_zeus',
      poseidon_blessing: 'blessing_poseidon'
    };
    const key = ALIASES[blessingId] || blessingId;

    const BLESSINGS = {
      blessing_ares: { id: 'blessing_ares', name: 'Blessing of Ares', icon: '⚔️', cost: 10, durationSec: 3600, desc: '+20% Party DMG & +10% Crit Rate' },
      blessing_athena: { id: 'blessing_athena', name: 'Blessing of Athena', icon: '🛡️', cost: 10, durationSec: 3600, desc: '+25% Max HP & +20% Shield' },
      blessing_hermes: { id: 'blessing_hermes', name: 'Blessing of Hermes', icon: '🪽', cost: 10, durationSec: 3600, desc: '+30% Shards & Drops in Madness Zone' },
      blessing_zeus: { id: 'blessing_zeus', name: 'Blessing of Zeus', icon: '⚡', cost: 15, durationSec: 3600, desc: '+20% Crit Rate & +15% Lightning Surge' },
      blessing_poseidon: { id: 'blessing_poseidon', name: 'Blessing of Poseidon', icon: '🌊', cost: 15, durationSec: 3600, desc: '+35% Tidal Shard Abundance' }
    };

    const b = BLESSINGS[key];
    if (!b) throw new Error('Invalid Blessing selected!');

    if ((this.state.resources.essencesOfTheGods || 0) < b.cost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${b.cost} 💠, have ${this.state.resources.essencesOfTheGods || 0} 💠.`);
    }

    this.state.resources.essencesOfTheGods -= b.cost;
    if (!this.state.activeBlessings) this.state.activeBlessings = {};
    this.state.activeBlessings[key] = {
      id: b.id,
      name: b.name,
      icon: b.icon,
      expiresAt: Date.now() + b.durationSec * 1000
    };

    this.save();
    this.emit('blessingsUpdated', this.state.activeBlessings);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, blessing: this.state.activeBlessings[blessingId] };
  },

  getActiveBlessings() {
    const now = Date.now();
    const active = {};
    if (this.state.activeBlessings) {
      for (const [id, b] of Object.entries(this.state.activeBlessings)) {
        if (b.expiresAt > now) {
          active[id] = { ...b, remainingSec: Math.round((b.expiresAt - now) / 1000) };
        }
      }
    }
    return active;
  },

  tickBlessings() {
    if (!this.state.activeBlessings) return;
    const now = Date.now();
    let changed = false;
    for (const [id, b] of Object.entries(this.state.activeBlessings)) {
      if (b.expiresAt <= now) {
        delete this.state.activeBlessings[id];
        changed = true;
      }
    }
    if (changed) {
      this.emit('blessingsUpdated', this.state.activeBlessings);
    }
  }
};
