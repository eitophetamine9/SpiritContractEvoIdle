import {
  getContractorXpRequired,
  getFeaturesUnlockedAtLevel,
  isFeatureUnlocked
} from '../../data/contractorData.js';
import {
  createWeaponInstance,
  createRelicInstance
} from '../../data/equipmentData.js';

export const contractorMethods = {
  getContractorLevel() {
    return this.state?.contractor?.level || 1;
  },

  getContractorXp() {
    return this.state?.contractor?.xp || 0;
  },

  getContractorXpRequired() {
    return this.state?.contractor?.xpRequired || getContractorXpRequired(this.getContractorLevel());
  },

  isFeatureUnlocked(featureId) {
    return isFeatureUnlocked(featureId, this.getContractorLevel());
  },

  addContractorXp(amount, reason = '') {
    if (!amount || amount <= 0) return;
    if (!this.state.contractor) {
      this.state.contractor = { level: 1, xp: 0, xpRequired: getContractorXpRequired(1) };
    }

    let { level, xp } = this.state.contractor;
    xp += Math.floor(amount);
    let req = getContractorXpRequired(level);
    let leveledUp = false;
    const levelsGained = [];

    while (xp >= req && level < 100) {
      xp -= req;
      level += 1;
      req = getContractorXpRequired(level);
      leveledUp = true;
      levelsGained.push(level);
    }

    this.state.contractor.level = level;
    this.state.contractor.xp = xp;
    this.state.contractor.xpRequired = req;
    this.isDirty = true;
    this.emit('contractorXpGained', { amount, reason, currentXp: xp, xpRequired: req, level });

    if (leveledUp) {
      for (const newLvl of levelsGained) {
        const newFeatures = getFeaturesUnlockedAtLevel(newLvl);
        // Ascension spoils: +100 Shards, +20 Energy
        this.state.resources.spiritShards = (this.state.resources.spiritShards || 0) + 100;
        this.state.resources.energy = Math.min(
          this.state.resources.maxEnergy || 60,
          (this.state.resources.energy || 0) + 20
        );

        // Award 3 Starter Equipments at Contractor Level 3 (Pantheon Trials & Forge unlock)
        if (newLvl >= 3 && !this.state.claimedLevel3EquipmentGift) {
          this.state.claimedLevel3EquipmentGift = true;
          const starterWeapon = createWeaponInstance({ weaponTypeId: 'sword', rarity: 'COMMON', level: 1 });
          const starterRelic1 = createRelicInstance({ setId: 'hades', slotTypeId: 'headgear', rarity: 'COMMON', level: 1 });
          const starterRelic2 = createRelicInstance({ setId: 'hades', slotTypeId: 'totem', rarity: 'COMMON', level: 1 });

          if (!this.state.inventory) this.state.inventory = {};
          if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];
          this.state.inventory.equipment.push(starterWeapon, starterRelic1, starterRelic2);

          const starterSpirit = this.state.spirits?.[0];
          if (starterSpirit) {
            if (!starterSpirit.weapon) {
              starterSpirit.weapon = starterWeapon.uid;
              starterWeapon.equippedToSpiritId = starterSpirit.id;
            }
            if (starterSpirit.relics) {
              if (!starterSpirit.relics.headgear) {
                starterSpirit.relics.headgear = starterRelic1.uid;
                starterRelic1.equippedToSpiritId = starterSpirit.id;
              }
              if (!starterSpirit.relics.totem) {
                starterSpirit.relics.totem = starterRelic2.uid;
                starterRelic2.equippedToSpiritId = starterSpirit.id;
              }
            }
          }
          if (typeof this.invalidateCaches === 'function') {
            this.invalidateCaches();
          }
          this.emit('equipmentGiftAwarded', {
            weapons: [starterWeapon],
            relics: [starterRelic1, starterRelic2]
          });
        }

        this.emit('resourcesUpdated', this.state.resources);
        this.emit('contractorLevelUp', {
          level: newLvl,
          newFeatures,
          rewards: { shards: 100, energy: 20 }
        });
      }
      this.save(true);
    }
  },

  getTutorialState() {
    return this.state?.tutorial || { step: 0, completed: false, active: true };
  },

  isTutorialActive() {
    const tut = this.getTutorialState();
    return Boolean(tut.active && !tut.completed);
  },

  setTutorialStep(step) {
    if (!this.state.tutorial) {
      this.state.tutorial = { step: 0, completed: false, active: true };
    }
    this.state.tutorial.step = step;
    this.state.tutorial.active = true;
    this.state.tutorial.completed = false;
    this.isDirty = true;
    this.save();
    this.emit('tutorialStepChanged', { step });
  },

  advanceTutorialStep(nextStep = null) {
    if (!this.state.tutorial) {
      this.state.tutorial = { step: 0, completed: false, active: true };
    }
    const current = this.state.tutorial.step || 0;
    const target = nextStep !== null ? nextStep : current + 1;
    this.setTutorialStep(target);
  },

  completeTutorial(awardReward = true) {
    if (!this.state.tutorial) {
      this.state.tutorial = { step: 99, completed: true, active: false };
    }
    this.state.tutorial.completed = true;
    this.state.tutorial.active = false;
    this.state.tutorial.step = 99;

    if (awardReward) {
      this.state.resources.spiritShards = (this.state.resources.spiritShards || 0) + 150;
      this.emit('resourcesUpdated', this.state.resources);
    }

    this.isDirty = true;
    this.save(true);
    this.emit('tutorialCompleted', { rewarded: awardReward });
  },

  restartTutorial() {
    this.setTutorialStep(0);
    this.emit('tutorialRestarted');
  },

  isAreaTutorialSeen(areaKey) {
    if (!this.state.tutorial) return false;
    if (!this.state.tutorial.unlockedTutorialsSeen) return false;
    return Boolean(this.state.tutorial.unlockedTutorialsSeen[areaKey]);
  },

  markAreaTutorialSeen(areaKey) {
    if (!this.state.tutorial) {
      this.state.tutorial = { step: 0, completed: false, active: true, unlockedTutorialsSeen: {} };
    }
    if (!this.state.tutorial.unlockedTutorialsSeen || typeof this.state.tutorial.unlockedTutorialsSeen !== 'object') {
      this.state.tutorial.unlockedTutorialsSeen = {};
    }
    this.state.tutorial.unlockedTutorialsSeen[areaKey] = true;
    this.isDirty = true;
    this.save();
    this.emit('areaTutorialSeen', { areaKey });
  }
};
