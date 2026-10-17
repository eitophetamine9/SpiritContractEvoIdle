import {
  SPIRIT_SPECIES,
  rollContractSpirit,
  rollAstralContractSpirit,
  rollBannerContractSpirit,
  calculateSpiritPower,
  calculateSpiritMaxHp
} from '../../data/spiritsData.js';

export const summonMethods = {
  getSummonLevelReqXp(level = 1) {
    return Math.round(200 * Math.pow(Math.max(1, level), 1.35));
  },

  getDailyPurifiedExchangeStatus() {
    if (!this.state.dailyExchange) {
      this.state.dailyExchange = {
        purifiedEssenceCount: 0,
        purifiedEssenceDate: new Date().toDateString()
      };
    }
    if (this.state.dailyExchange.purifiedEssenceDate !== new Date().toDateString()) {
      this.state.dailyExchange.purifiedEssenceCount = 0;
      this.state.dailyExchange.purifiedEssenceDate = new Date().toDateString();
    }
    const maxPerDay = 10;
    const used = this.state.dailyExchange.purifiedEssenceCount || 0;
    const remaining = Math.max(0, maxPerDay - used);
    return {
      used,
      maxPerDay,
      remaining,
      rate: 500
    };
  },

  exchangeShardsForPurifiedEssence(count = 1) {
    const num = Math.max(1, Math.floor(count || 1));
    const status = this.getDailyPurifiedExchangeStatus();
    if (status.remaining <= 0) {
      throw new Error('Daily exchange limit reached (10/10 today)! Resets tomorrow.');
    }
    if (num > status.remaining) {
      throw new Error(`Cannot exchange ${num} times! Only ${status.remaining} exchange(s) remaining today.`);
    }
    const shardCost = num * 500;
    if ((this.state.resources.spiritShards || 0) < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost.toLocaleString()} 💎 (Have: ${(this.state.resources.spiritShards || 0).toLocaleString()} 💎).`);
    }

    this.state.resources.spiritShards -= shardCost;
    this.state.resources.purifiedSoulEssence = (this.state.resources.purifiedSoulEssence || 0) + num;
    this.state.dailyExchange.purifiedEssenceCount += num;
    this.state.dailyExchange.purifiedEssenceDate = new Date().toDateString();

    this.isDirty = true;
    this.save();
    this.emit('resourcesUpdated', this.state.resources);
    this.emit('dailyExchangeUpdated', this.getDailyPurifiedExchangeStatus());
    return {
      exchanged: num,
      cost: shardCost,
      newPurifiedBalance: this.state.resources.purifiedSoulEssence,
      remainingExchanges: this.getDailyPurifiedExchangeStatus().remaining
    };
  },

  /**
   * Contracting random Spirits (Gacha / Summoning)
   * Supports Multi-Banner (Solaris Rate-Up, Gelda Rate-Up, Celestial Conflux, Standard)
   * Supports 1x, 10x, and 30x pulls with summon level XP progression
   */
  contractSpirit(count = 1, bannerId = 'standard') {
    const singleCost = 100;
    let totalCost = singleCost * count;
    if (count === 10) totalCost = 950;
    if (count === 30) totalCost = 2700; // 10% discount for 30x contract

    if (this.state.resources.spiritShards < totalCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${totalCost}, have ${this.state.resources.spiritShards}.`);
    }

    this.state.resources.spiritShards -= totalCost;

    const newSpirits = [];

    for (let i = 0; i < count; i++) {
      const rolled = (!bannerId || bannerId === 'standard') 
        ? rollContractSpirit() 
        : rollBannerContractSpirit(bannerId);
      const species = SPIRIT_SPECIES[rolled.speciesId] || SPIRIT_SPECIES['fallen_warrior_spirit'];

      const spirit = {
        id: this.generateId(),
        speciesId: species.id,
        customName: species.name,
        level: 1,
        xp: 0,
        tier: species.tier || 1,
        rarity: rolled.rarityTier,
        element: species.element || 'EARTH',
        power: calculateSpiritPower(species, 1, rolled.rarityTier),
        maxHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
        currentHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
        maxMp: 100,
        currentMp: 0,
        shieldHp: 0,
        isFallen: false,
        isEquipped: false,
        canEvolve: false,
        evolutionHistory: [species.name],
        contractedAt: Date.now()
      };

      // Auto-equip if active party has room (< 5)
      if (this.state.party.length < 5) {
        spirit.isEquipped = true;
        this.state.party.push(spirit.id);
        this.seatSpiritIntoFormation(spirit.id);
      }

      this.state.spirits.unshift(spirit);
      newSpirits.push(spirit);
      this.markSpeciesDiscovered(species.id);
    }

    // Summon Level XP Progression
    if (!this.state.stats) this.state.stats = {};
    const gainedXp = count * 25;
    this.state.stats.summonXp = (this.state.stats.summonXp || 0) + gainedXp;
    this.state.stats.summonLevel = this.state.stats.summonLevel || 1;
    let reqXp = this.getSummonLevelReqXp(this.state.stats.summonLevel);

    while (this.state.stats.summonXp >= reqXp) {
      this.state.stats.summonXp -= reqXp;
      this.state.stats.summonLevel += 1;
      reqXp = this.getSummonLevelReqXp(this.state.stats.summonLevel);
      this.emit('summonLevelUp', { level: this.state.stats.summonLevel });
    }

    this.state.stats.totalSpiritsContracted = (this.state.stats.totalSpiritsContracted || 0) + count;
    this.state.stats.totalBannerSummons = (this.state.stats.totalBannerSummons || 0) + count;
    this.addContractorXp(count * 25, 'Spirit Contract');
    this.save();

    this.emit('spiritsContracted', { spirits: newSpirits, cost: totalCost, bannerId });
    this.emit('resourcesUpdated', this.state.resources);
    return newSpirits;
  },

  claimSummonMilestone(milestoneCount) {
    if (!this.state.stats.claimedSummonMilestones) this.state.stats.claimedSummonMilestones = [];
    if (this.state.stats.claimedSummonMilestones.includes(milestoneCount)) {
      throw new Error('Milestone reward already claimed!');
    }
    const total = this.state.stats.totalBannerSummons || this.state.stats.totalSpiritsContracted || 0;
    if (total < milestoneCount) {
      throw new Error(`Need ${milestoneCount} total summons! Currently at ${total}.`);
    }

    const MILESTONE_REWARDS = {
      20: { shards: 500, essences: 20, desc: '500 Shards & 20 Essences of the Gods' },
      50: { shards: 1200, essences: 50, desc: '1,200 Shards & 50 Essences of the Gods' },
      100: { soulEssence: 10, essences: 100, desc: '10 Soul Essence & 100 Essences of the Gods' },
      200: { speciesId: 'astraea_valkyrie', desc: 'Guaranteed Legendary Hero: Astraea, Star-Forged Valkyrie' },
      500: { speciesId: 'solaris_lion_pride', desc: 'Guaranteed Mythical Hero: Solaris, Lion Sin of Pride' },
      1000: { speciesId: 'solaris_the_one', desc: 'Transcendent Hero: Solaris, The One Ultimate' }
    };

    const reward = MILESTONE_REWARDS[milestoneCount];
    if (!reward) throw new Error('Invalid milestone tier!');

    if (reward.shards) this.state.resources.spiritShards += reward.shards;
    if (reward.essences) this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + reward.essences;
    if (reward.soulEssence) this.state.resources.soulEssence = (this.state.resources.soulEssence || 0) + reward.soulEssence;
    if (reward.speciesId) {
      const species = SPIRIT_SPECIES[reward.speciesId];
      if (species) {
        const spirit = {
          id: this.generateId(),
          speciesId: species.id,
          customName: species.name,
          level: 1,
          xp: 0,
          tier: species.tier || 1,
          rarity: species.baseRarity,
          element: species.element || 'LIGHT',
          power: calculateSpiritPower(species, 1, species.baseRarity),
          maxHp: calculateSpiritMaxHp(species, 1, species.baseRarity),
          currentHp: calculateSpiritMaxHp(species, 1, species.baseRarity),
          maxMp: 100,
          currentMp: 0,
          shieldHp: 0,
          isFallen: false,
          isEquipped: false,
          canEvolve: false,
          evolutionHistory: [species.name],
          contractedAt: Date.now()
        };
        this.state.spirits.unshift(spirit);
        this.markSpeciesDiscovered(species.id);
      }
    }

    this.state.stats.claimedSummonMilestones.push(milestoneCount);
    this.save();
    this.emit('milestoneClaimed', { milestoneCount, reward });
    this.emit('resourcesUpdated', this.state.resources);
    return reward;
  },

  /**
   * Premium Astral Contract (0% Commons, guaranteed Uncommon+)
   * Costs 8 Soul Essence (Rebalanced from 5)
   */
  contractAstralSpirit() {
    const cost = 8;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮 (Have: ${this.state.resources.soulEssence} 🔮). Earn Essence by defeating Floor Bosses.`);
    }

    this.state.resources.soulEssence -= cost;
    const rolled = rollAstralContractSpirit();
    const species = SPIRIT_SPECIES[rolled.speciesId];

    const spirit = {
      id: this.generateId(),
      speciesId: species.id,
      customName: species.name,
      level: 1,
      xp: 0,
      tier: 1,
      rarity: rolled.rarityTier,
      element: species.element || 'EARTH',
      power: calculateSpiritPower(species, 1, rolled.rarityTier),
      maxHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
      currentHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
      maxMp: 100,
      currentMp: 0,
      shieldHp: 0,
      isFallen: false,
      isEquipped: false,
      canEvolve: false,
      favorite: false,
      evolutionHistory: [species.name],
      contractedAt: Date.now()
    };

    if (this.state.party.length < 5) {
      spirit.isEquipped = true;
      this.state.party.push(spirit.id);
      this.seatSpiritIntoFormation(spirit.id);
    }

    this.state.spirits.unshift(spirit);
    this.state.stats.totalSpiritsContracted += 1;
    this.markSpeciesDiscovered(species.id);
    this.save();

    this.emit('spiritsContracted', { spirits: [spirit], cost, currency: 'essence' });
    return [spirit];
  }
};
