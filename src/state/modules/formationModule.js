import {
  FORMATION_SLOTS,
  FORMATION_COLUMNS,
  validateFormationGrid,
  getSpiritRole
} from '../../data/spiritsData.js';

export const formationMethods = {
  /**
   * Sanitizes and validates the 3x3 tactical grid formation
   */
  sanitizePartyFormation(loadedFormation, party = [], spirits = []) {
    const defaultFormation = {
      b1: null, b2: null, b3: null,
      m1: null, m2: null, m3: null,
      f1: null, f2: null, f3: null
    };

    if (!Array.isArray(party) || party.length === 0) {
      return defaultFormation;
    }

    const clean = { ...defaultFormation };
    const partySet = new Set(party);
    const assignedSpirits = new Set();

    if (loadedFormation && typeof loadedFormation === 'object') {
      for (const [slotId, spiritId] of Object.entries(loadedFormation)) {
        if (!FORMATION_SLOTS[slotId] || !spiritId) continue;
        if (partySet.has(spiritId) && !assignedSpirits.has(spiritId)) {
          clean[slotId] = spiritId;
          assignedSpirits.add(spiritId);
        }
      }
    }

    // Check if valid and all party members are assigned
    const validation = validateFormationGrid(clean);
    const allAssigned = party.every(id => assignedSpirits.has(id));

    if (validation.valid && allAssigned && assignedSpirits.size === party.length) {
      return clean;
    }

    // Otherwise, auto-format party into optimal 3x3 grid
    return this.autoFormatPartyArray(party, spirits);
  },

  /**
   * Generates a 100% valid 3x3 tactical formation for a given list of spirit IDs
   * Adheres to constraints:
   * - 1 in the furthest back (Backline)
   * - 2 or 3 in the middle (Midline)
   * - 1 or 2 in the front (Frontline)
   */
  autoFormatPartyArray(party = [], spirits = []) {
    const formation = {
      b1: null, b2: null, b3: null,
      m1: null, m2: null, m3: null,
      f1: null, f2: null, f3: null
    };

    if (!Array.isArray(party) || party.length === 0) {
      return formation;
    }

    const spiritsCatalog = spirits.length > 0 ? spirits : (this.state?.spirits || []);
    const partySpirits = party
      .map(id => spiritsCatalog.find(s => s.id === id))
      .filter(Boolean);

    if (partySpirits.length === 0) {
      return formation;
    }

    // Role categorization
    const tanks = [];
    const healers = [];
    const mainDps = [];
    const subDps = [];
    const supports = [];

    for (const spirit of partySpirits) {
      const role = getSpiritRole(spirit);
      if (role === 'TANK') tanks.push(spirit);
      else if (role === 'HEALER') healers.push(spirit);
      else if (role === 'MAIN_DPS') mainDps.push(spirit);
      else if (role === 'SUPPORT') supports.push(spirit);
      else subDps.push(spirit);
    }

    // 1. Backline (furthest back - max 1 unit):
    // Prioritize Healer -> Main DPS -> Support -> Sub-DPS -> Tank
    let backSpirit = healers.shift() || mainDps.shift() || supports.shift() || subDps.shift() || tanks.shift();
    if (backSpirit) {
      formation.b2 = backSpirit.id; // Center back anchor
    }

    // 2. Frontline (front - max 2 units, min 1 unit when full squad):
    // Prioritize Tanks -> Sub-DPS -> remaining
    const frontSpirits = [];
    while (frontSpirits.length < 2 && tanks.length > 0) {
      frontSpirits.push(tanks.shift());
    }
    if (partySpirits.length >= 3 && frontSpirits.length === 0) {
      const frontCandidate = subDps.shift() || mainDps.shift() || supports.shift() || healers.shift();
      if (frontCandidate) frontSpirits.push(frontCandidate);
    }

    if (frontSpirits[0]) formation.f2 = frontSpirits[0].id; // Center front
    if (frontSpirits[1]) formation.f1 = frontSpirits[1].id; // Top front

    // 3. Midline (middle - 2 to 3 units):
    // All remaining spirits
    const remaining = [...tanks, ...healers, ...mainDps, ...supports, ...subDps];
    const midSlots = ['m2', 'm1', 'm3'];
    let midIdx = 0;
    while (remaining.length > 0 && midIdx < midSlots.length) {
      const s = remaining.shift();
      formation[midSlots[midIdx]] = s.id;
      midIdx++;
    }

    // If any spirit still remains and front has capacity
    if (remaining.length > 0 && !formation.f1) {
      formation.f1 = remaining.shift().id;
    }
    if (remaining.length > 0 && !formation.f3) {
      formation.f3 = remaining.shift().id;
    }

    return formation;
  },

  /**
   * Intelligently assigns an individual spirit into the best open formation slot
   */
  seatSpiritIntoFormation(spiritId) {
    if (!spiritId) return;
    if (!this.state.partyFormation) {
      this.state.partyFormation = this.sanitizePartyFormation(null, this.state.party, this.state.spirits);
    }

    // If already seated, do nothing
    if (Object.values(this.state.partyFormation).includes(spiritId)) return;

    const spirit = this.state.spirits.find(s => s.id === spiritId);
    const role = spirit ? getSpiritRole(spirit) : 'MAIN_DPS';
    const form = this.state.partyFormation;

    let targetSlot = null;
    const currentCounts = {
      back: ['b1', 'b2', 'b3'].filter(k => !!form[k]).length,
      mid: ['m1', 'm2', 'm3'].filter(k => !!form[k]).length,
      front: ['f1', 'f2', 'f3'].filter(k => !!form[k]).length
    };

    if (role === 'TANK' && currentCounts.front < 2) {
      targetSlot = !form.f2 ? 'f2' : (!form.f1 ? 'f1' : (!form.f3 ? 'f3' : null));
    } else if ((role === 'HEALER' || role === 'MAIN_DPS') && currentCounts.back < 1) {
      targetSlot = !form.b2 ? 'b2' : (!form.b1 ? 'b1' : (!form.b3 ? 'b3' : null));
    } else if (currentCounts.mid < 3) {
      targetSlot = !form.m2 ? 'm2' : (!form.m1 ? 'm1' : (!form.m3 ? 'm3' : null));
    } else if (currentCounts.front < 2) {
      targetSlot = !form.f2 ? 'f2' : (!form.f1 ? 'f1' : (!form.f3 ? 'f3' : null));
    } else if (currentCounts.back < 1) {
      targetSlot = !form.b2 ? 'b2' : (!form.b1 ? 'b1' : (!form.b3 ? 'b3' : null));
    }

    if (targetSlot) {
      form[targetSlot] = spiritId;
    } else {
      this.autoFormatParty();
    }
  },

  /**
   * Returns complete status and slot metadata for the 3x3 tactical grid
   */
  getPartyFormation() {
    if (!this.state.partyFormation) {
      this.state.partyFormation = this.sanitizePartyFormation(null, this.state.party, this.state.spirits);
    }

    const form = this.state.partyFormation;
    const slots = {};
    for (const [slotId, def] of Object.entries(FORMATION_SLOTS)) {
      const spiritId = form[slotId] || null;
      const spirit = spiritId ? (this.state.spirits.find(s => s.id === spiritId) || null) : null;
      slots[slotId] = {
        ...def,
        spiritId,
        spirit
      };
    }

    const validation = validateFormationGrid(form);
    return {
      slots,
      raw: { ...form },
      counts: validation.counts || { back: 0, mid: 0, front: 0, total: 0 },
      isValid: validation.valid,
      validationError: validation.error || null,
      columns: FORMATION_COLUMNS
    };
  },

  /**
   * Returns current slot ID ('b1'..'f3') of a given spirit ID
   */
  getSpiritFormationSlot(spiritId) {
    if (!spiritId || !this.state.partyFormation) return null;
    for (const [slotId, sId] of Object.entries(this.state.partyFormation)) {
      if (sId === spiritId) return slotId;
    }
    return null;
  },

  /**
   * Positions a spirit into targetSlotId, automatically swapping if occupied
   * and enforcing column constraints (1 Back, 2-3 Mid, 1-2 Front)
   */
  setSpiritPosition(spiritId, targetSlotId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found in collection!');
    if (!FORMATION_SLOTS[targetSlotId]) throw new Error(`Invalid formation slot "${targetSlotId}"!`);

    // Ensure partyFormation exists
    if (!this.state.partyFormation) {
      this.state.partyFormation = this.sanitizePartyFormation(null, this.state.party, this.state.spirits);
    }

    // Auto-equip if not currently in party
    if (!this.state.party.includes(spiritId)) {
      if (this.state.party.length >= 5) {
        throw new Error('Party is full (5/5). Unequip a spirit first or swap positions with an active member.');
      }
      this.state.party.push(spiritId);
      spirit.isEquipped = true;
    }

    const form = { ...this.state.partyFormation };
    const currentSlot = this.getSpiritFormationSlot(spiritId);
    const occupantId = form[targetSlotId];

    if (occupantId && occupantId !== spiritId) {
      if (currentSlot) {
        // Swap positions between the two equipped spirits
        form[currentSlot] = occupantId;
        form[targetSlotId] = spiritId;
      } else {
        throw new Error(`Slot "${targetSlotId}" is already occupied. Choose an empty tile or swap with an equipped unit.`);
      }
    } else {
      if (currentSlot) form[currentSlot] = null;
      form[targetSlotId] = spiritId;
    }

    const validation = validateFormationGrid(form);
    if (!validation.valid) {
      throw new Error(`Cannot place spirit in ${targetSlotId}: ${validation.error}`);
    }

    this.state.partyFormation = form;
    this.save();
    this.emit('partyFormationUpdated', this.getPartyFormation());
    this.emit('partyUpdated', this.getPartySpirits());
    return { success: true, targetSlotId, previousSlotId: currentSlot };
  },

  /**
   * Swaps contents between two grid slots
   */
  swapFormationSlots(slotA, slotB) {
    if (!FORMATION_SLOTS[slotA] || !FORMATION_SLOTS[slotB]) {
      throw new Error(`Invalid formation slot specified (${slotA}, ${slotB})`);
    }

    if (!this.state.partyFormation) {
      this.state.partyFormation = this.sanitizePartyFormation(null, this.state.party, this.state.spirits);
    }

    const form = { ...this.state.partyFormation };
    const temp = form[slotA];
    form[slotA] = form[slotB];
    form[slotB] = temp;

    const validation = validateFormationGrid(form);
    if (!validation.valid) {
      throw new Error(`Cannot swap ${slotA} and ${slotB}: ${validation.error}`);
    }

    this.state.partyFormation = form;
    this.invalidateCaches();
    this.save();
    this.emit('partyFormationUpdated', this.getPartyFormation());
    this.emit('partyUpdated', this.getPartySpirits());
    return { success: true, slotA, slotB };
  },

  /**
   * Automatically organizes active party spirits into the optimal 3x3 tactical grid
   */
  autoFormatParty() {
    this.state.partyFormation = this.autoFormatPartyArray(this.state.party, this.state.spirits);
    this.invalidateCaches();
    this.save();
    this.emit('partyFormationUpdated', this.getPartyFormation());
    this.emit('partyUpdated', this.getPartySpirits());
    return this.getPartyFormation();
  }
};
