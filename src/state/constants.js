/**
 * Global game state constants
 */
export const SAVE_KEY = 'spirit_contract_evo_idle_save_v2';
export const AUTO_SAVE_INTERVAL_MS = 5000;
export const ENERGY_ENTRY_COST = 10;
export const ENERGY_REGEN_INTERVAL_SEC = 30; // 1 energy per 30 seconds

/**
 * Returns YYYY-MM-DD day key for Singapore Time (UTC+8).
 * Resets daily at 00:00 UTC+8.
 * @param {number|Date} [timestamp]
 * @returns {string} e.g. "2026-10-17"
 */
export function getSingaporeDayKey(timestamp = Date.now()) {
  const time = typeof timestamp === 'number' ? timestamp : (timestamp?.getTime ? timestamp.getTime() : Date.now());
  const sgDate = new Date(time + 8 * 3600 * 1000);
  return sgDate.toISOString().split('T')[0];
}

/**
 * Returns YYYY-MM-DD week key for Singapore Time (UTC+8) starting every Sunday at 00:00 UTC+8.
 * @param {number|Date} [timestamp]
 * @returns {string} e.g. "2026-10-18"
 */
export function getSingaporeWeekKey(timestamp = Date.now()) {
  const time = typeof timestamp === 'number' ? timestamp : (timestamp?.getTime ? timestamp.getTime() : Date.now());
  const sgDate = new Date(time + 8 * 3600 * 1000);
  const dayOfWeek = sgDate.getUTCDay(); // 0 is Sunday
  const diffMs = dayOfWeek * 24 * 3600 * 1000;
  const sundayDate = new Date(sgDate.getTime() - diffMs);
  return sundayDate.toISOString().split('T')[0];
}
