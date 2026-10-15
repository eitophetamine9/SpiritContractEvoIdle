/**
 * Combat Animation Engine
 * Coordinates visual attack lunges, weapon swing frames, hit flashes, and flinch recoil animations
 * across all combat scenes (Madness Zone, Pantheon Trials, Divine Forge, Sanctuary of the Gods).
 */

/**
 * Triggers allied spirit attack animation:
 * Lunges slot forward towards enemies and steps through attack sprite frames (4, 5, 6, 4).
 * @param {HTMLElement} slotEl - The allied spirit slot container element
 */
export function triggerSpiritAttack(slotEl) {
  if (!slotEl) return;
  const sprite = slotEl.querySelector('.animated-pixel-sprite') || slotEl;

  slotEl.classList.remove('lunge-attack');
  void slotEl.offsetWidth; // Force layout reflow to restart CSS keyframe animation
  slotEl.classList.add('lunge-attack');

  if (sprite) {
    sprite.classList.remove('attacking');
    void sprite.offsetWidth;
    sprite.classList.add('attacking');
  }

  clearTimeout(slotEl._attackTimer);
  slotEl._attackTimer = setTimeout(() => {
    slotEl.classList.remove('lunge-attack');
    if (sprite) sprite.classList.remove('attacking');
  }, 360);
}

/**
 * Triggers enemy flinch animation:
 * Enemy slot recoils backwards, flashes red/white, and displays Hurt frame (Frame 7).
 * @param {HTMLElement} enemySlotEl - The enemy slot element
 */
export function triggerEnemyFlinch(enemySlotEl) {
  if (!enemySlotEl) return;
  const sprite = enemySlotEl.querySelector('.animated-pixel-sprite') || enemySlotEl;

  enemySlotEl.classList.remove('enemy-hit-flash', 'crit-clash-flash');
  void enemySlotEl.offsetWidth;
  enemySlotEl.classList.add('enemy-hit-flash');

  if (sprite) {
    sprite.classList.remove('hurt', 'flinching');
    void sprite.offsetWidth;
    sprite.classList.add('hurt', 'flinching');
  }

  clearTimeout(enemySlotEl._flinchTimer);
  enemySlotEl._flinchTimer = setTimeout(() => {
    enemySlotEl.classList.remove('enemy-hit-flash');
    if (sprite) sprite.classList.remove('hurt', 'flinching');
  }, 360);
}

/**
 * Triggers enemy attack animation:
 * Enemy slot lunges forward (left) towards the player party and cycles attack frames.
 * @param {HTMLElement} enemySlotEl - The enemy slot element
 */
export function triggerEnemyAttack(enemySlotEl) {
  if (!enemySlotEl) return;
  const sprite = enemySlotEl.querySelector('.animated-pixel-sprite') || enemySlotEl;

  enemySlotEl.classList.remove('enemy-lunge-attack');
  void enemySlotEl.offsetWidth;
  enemySlotEl.classList.add('enemy-lunge-attack');

  if (sprite) {
    sprite.classList.remove('attacking');
    void sprite.offsetWidth;
    sprite.classList.add('attacking');
  }

  clearTimeout(enemySlotEl._enemyAttackTimer);
  enemySlotEl._enemyAttackTimer = setTimeout(() => {
    enemySlotEl.classList.remove('enemy-lunge-attack');
    if (sprite) sprite.classList.remove('attacking');
  }, 360);
}

/**
 * Triggers allied spirit flinch animation:
 * Spirit slot recoils backwards (left) and displays Hurt frame (Frame 7).
 * @param {HTMLElement} spiritSlotEl - The allied spirit slot container element
 */
export function triggerSpiritFlinch(spiritSlotEl) {
  if (!spiritSlotEl) return;
  const sprite = spiritSlotEl.querySelector('.animated-pixel-sprite') || spiritSlotEl;

  spiritSlotEl.classList.remove('spirit-hit-flinch');
  void spiritSlotEl.offsetWidth;
  spiritSlotEl.classList.add('spirit-hit-flinch');

  if (sprite) {
    sprite.classList.remove('hurt', 'flinching');
    void sprite.offsetWidth;
    sprite.classList.add('hurt', 'flinching');
  }

  clearTimeout(spiritSlotEl._spiritFlinchTimer);
  spiritSlotEl._spiritFlinchTimer = setTimeout(() => {
    spiritSlotEl.classList.remove('spirit-hit-flinch');
    if (sprite) sprite.classList.remove('hurt', 'flinching');
  }, 360);
}

/**
 * Triggers full party strike exchange (used on manual attack click or whole-squad burst).
 * @param {HTMLElement} container - The combat view root container
 */
export function triggerPartyStrikeExchange(container) {
  if (!container) return;

  const spiritSlots = container.querySelectorAll('.seamless-battle-spirit:not(.spirit-fallen), .spirit-formation-slot.slot-active');
  spiritSlots.forEach(slot => triggerSpiritAttack(slot));

  const leadEnemy = container.querySelector('.seamless-enemy-slot:not(.enemy-defeated)') || container.querySelector('.enemy-swarm-slot:not(.enemy-defeated)');
  if (leadEnemy) {
    triggerEnemyFlinch(leadEnemy);
  }
}
