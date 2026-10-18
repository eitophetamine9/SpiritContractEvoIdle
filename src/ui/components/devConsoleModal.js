import { gameState } from '../../state/gameState.js';
import { authService, DEV_ADMIN_EMAIL } from '../../services/authService.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { getGameIcon } from '../icons/gameIcons.js';

let activeFeedbackTimer = null;

export function showDevConsoleModal(onClose) {
  // Security check: Only allow admin dev account
  if (!authService.isAdmin()) {
    console.warn('[DEV CONSOLE] Access denied. Current account is not authorized.');
    return;
  }

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  safePlaySfx('button_click', 0.5);

  renderDevConsoleContent(modalRoot, onClose);
}

function renderDevConsoleContent(modalRoot, onClose, lastMessage = '', isError = false) {
  const currentFloor = gameState.state.madnessZone?.stage || 1;
  const contractorLvl = gameState.state.contractor?.level || 1;
  const shards = gameState.state.resources?.spiritShards || 0;
  const purified = gameState.state.resources?.purifiedSoulEssence || 0;
  const energy = gameState.state.resources?.energy || 0;

  modalRoot.innerHTML = `
    <div id="modal-dev-console" class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div class="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col gap-4 overflow-hidden my-auto"
           style="box-shadow: 0 0 45px rgba(245, 158, 11, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.2);">
        
        <!-- Header & Admin Tag -->
        <div class="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-amber-400 animate-pulse">${getGameIcon('zap', { size: 24, className: 'text-amber-400' })}</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black tracking-wide text-amber-400 uppercase">
                  Dev & Admin Cheat Console
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                  Authorized
                </span>
              </div>
              <p class="text-[11px] text-slate-400">
                Account: <strong class="text-amber-200">${DEV_ADMIN_EMAIL}</strong> • Contractor Lv. ${contractorLvl} • Floor ${currentFloor}
              </p>
            </div>
          </div>
          <button id="btn-close-dev-console" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all">
            ${getGameIcon('close', { size: 14 })}
          </button>
        </div>

        <!-- Cheat Code Command Input Bar -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[11px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <span>${getGameIcon('device', { size: 14, className: 'inline mr-1 text-cyan-300' })} Command Bar Cheat Code</span>
            <span class="text-[10px] font-normal text-slate-400 lowercase">(floor &lt;n&gt;, levelup &lt;n&gt;, rich, godmode, unlockall, shards &lt;n&gt;)</span>
          </label>
          <div class="flex items-center gap-2">
            <input type="text" id="dev-cheat-input" placeholder="Type cheat command e.g. 'floor 50' or 'rich'..." 
                   class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-600" />
            <button id="btn-run-cheat-cmd" class="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center gap-1">
              <span>Execute</span>
              ${getGameIcon('zap', { size: 13, className: 'inline' })}
            </button>
          </div>
        </div>

        <!-- Feedback Notification Banner -->
        ${lastMessage ? `
          <div class="px-3 py-2 rounded-xl text-xs font-bold ${isError ? 'bg-rose-950/80 border border-rose-500 text-rose-200' : 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'} animate-fadeIn flex items-center justify-between">
            <span>${lastMessage}</span>
          </div>
        ` : ''}

        <!-- Current Live Telemetry Metrics -->
        <div class="grid grid-cols-5 gap-1.5 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800 text-center">
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-400">Madness</div>
            <div class="text-xs sm:text-sm font-black text-rose-400" id="dev-metric-floor">F.${currentFloor}</div>
          </div>
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-400">Level</div>
            <div class="text-xs sm:text-sm font-black text-amber-300" id="dev-metric-level">Lv.${contractorLvl}</div>
          </div>
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">Purified ${getGameIcon('sparkle', { size: 10, className: 'text-yellow-300' })}</div>
            <div class="text-xs sm:text-sm font-black text-yellow-300" id="dev-metric-soul">${purified.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">Shards ${getGameIcon('crystal', { size: 10, className: 'text-cyan-300' })}</div>
            <div class="text-xs sm:text-sm font-black text-cyan-300" id="dev-metric-shards">${shards.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">Energy ${getGameIcon('zap', { size: 10, className: 'text-emerald-300' })}</div>
            <div class="text-xs sm:text-sm font-black text-emerald-300" id="dev-metric-energy">${energy}/999</div>
          </div>
        </div>

        <!-- Scrollable Action Cards Section -->
        <div class="flex flex-col gap-3.5 max-h-[420px] overflow-y-auto pr-1">

          <!-- 1. Floor Skipper Section -->
          <div class="p-3 rounded-2xl bg-slate-950/60 border border-rose-500/30 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span>${getGameIcon('temple', { size: 14, className: 'text-rose-400 inline mr-1' })} Floor Skip Controls</span>
              </span>
              <div class="flex items-center gap-1.5">
                <input type="number" id="input-custom-floor" min="1" max="999" value="${currentFloor + 5}" 
                       class="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-rose-200 text-center text-xs font-bold" />
                <button id="btn-jump-custom-floor" class="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-[11px] cursor-pointer flex items-center gap-0.5">
                  <span>Jump</span>
                  ${getGameIcon('chevronRight', { size: 11, className: 'inline' })}
                </button>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer" data-action="skip_floor" data-val="1">
                +1 Floor
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer" data-action="skip_floor" data-val="5">
                +5 Floors
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer" data-action="skip_floor" data-val="10">
                +10 Floors
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer" data-action="skip_floor" data-val="50">
                +50 Floors
              </button>
            </div>
          </div>

          <!-- 2. Instant Level Up Section -->
          <div class="p-3 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex flex-col gap-2">
            <span class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>${getGameIcon('crown', { size: 14, className: 'text-amber-300 inline mr-1' })} Instant Level Up (Contractor & Spirits)</span>
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-200 cursor-pointer" data-action="level_up" data-val="1">
                +1 Contractor Lv
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-200 cursor-pointer" data-action="level_up" data-val="5">
                +5 Contractor Lv
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold text-amber-300 cursor-pointer" data-action="level_up_to" data-val="20">
                Set Lv. 20 (All Feats)
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-xs font-bold text-purple-300 cursor-pointer flex items-center justify-center gap-1" data-action="max_spirits">
                <span>Max Spirits (Lv 100 5-Star)</span>
              </button>
            </div>
          </div>

          <!-- 3. ALL CURRENCY BOOSTERS (PURIFIED SOUL INCLUDED) -->
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-yellow-500/40 flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-1.5">
                <span>${getGameIcon('sparkle', { size: 14, className: 'text-yellow-300 inline mr-1' })} Boost Any Currency (Purified Soul, Shards, Energy & More)</span>
              </span>
              <button class="btn-dev-action py-1 px-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-[11px] cursor-pointer shadow-md flex items-center gap-1" data-action="boost_all_currencies">
                ${getGameIcon('coins', { size: 13, className: 'inline' })}
                <span>Boost ALL Max</span>
              </button>
            </div>

            <!-- Purified Soul Essence Quick Row -->
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-yellow-300 w-28 shrink-0 flex items-center gap-1">Purified Soul ${getGameIcon('sparkle', { size: 11, className: 'inline text-yellow-300' })}:</span>
              <div class="grid grid-cols-3 gap-1.5 flex-1">
                <button class="btn-dev-action py-1.5 px-2 rounded-xl bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500/30 text-xs font-bold text-yellow-200 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="purified" data-val="100">
                  <span>+100</span>
                  ${getGameIcon('sparkle', { size: 11, className: 'inline text-yellow-300' })}
                </button>
                <button class="btn-dev-action py-1.5 px-2 rounded-xl bg-yellow-500/25 border border-yellow-500/60 hover:bg-yellow-500/35 text-xs font-black text-yellow-300 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="purified" data-val="1000">
                  <span>+1,000</span>
                  ${getGameIcon('sparkle', { size: 11, className: 'inline text-yellow-300' })}
                </button>
                <button class="btn-dev-action py-1.5 px-2 rounded-xl bg-yellow-500/30 border border-yellow-500/80 hover:bg-yellow-500/40 text-xs font-black text-amber-200 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="purified" data-val="10000">
                  <span>+10,000</span>
                  ${getGameIcon('sparkle', { size: 11, className: 'inline text-yellow-300' })}
                </button>
              </div>
            </div>

            <!-- Spirit Shards Quick Row -->
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-cyan-300 w-28 shrink-0 flex items-center gap-1">Spirit Shards ${getGameIcon('crystal', { size: 11, className: 'inline text-cyan-300' })}:</span>
              <div class="grid grid-cols-3 gap-1.5 flex-1">
                <button class="btn-dev-action py-1.5 px-2 rounded-xl bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-xs font-bold text-cyan-200 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="shards" data-val="100000">
                  <span>+100k</span>
                  ${getGameIcon('crystal', { size: 11, className: 'inline text-cyan-300' })}
                </button>
                <button class="btn-dev-action py-1.5 px-2 rounded-xl bg-cyan-500/25 border border-cyan-500/60 hover:bg-cyan-500/35 text-xs font-black text-cyan-300 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="shards" data-val="1000000">
                  <span>+1M</span>
                  ${getGameIcon('crystal', { size: 11, className: 'inline text-cyan-300' })}
                </button>
                <button class="btn-dev-action py-1.5 px-2 rounded-xl bg-cyan-500/30 border border-cyan-500/80 hover:bg-cyan-500/40 text-xs font-black text-cyan-100 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="shards" data-val="10000000">
                  <span>+10M</span>
                  ${getGameIcon('crystal', { size: 11, className: 'inline text-cyan-300' })}
                </button>
              </div>
            </div>

            <!-- Other Currencies (Energy, Soul Essence, Gods, Scriptures, Reshapers) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/80">
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="soul_essence" data-val="2000">
                <span>+2,000 Soul</span>
                ${getGameIcon('vortex', { size: 11, className: 'inline text-purple-400' })}
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-orange-300 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="gods" data-val="5000">
                <span>+5,000 Gods</span>
                ${getGameIcon('alembic', { size: 11, className: 'inline text-amber-400' })}
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="energy" data-val="999">
                <span>Refill 999</span>
                ${getGameIcon('zap', { size: 11, className: 'inline text-emerald-400' })}
              </button>
              <button class="btn-dev-action py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 cursor-pointer flex items-center justify-center gap-1" data-action="add_currency" data-type="mats" data-val="100">
                <span>+100 Scrip & Reshaper</span>
              </button>
            </div>

            <!-- Custom Currency Selector & Input -->
            <div class="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <select id="select-custom-currency" class="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-yellow-400">
                <option value="purified">Purified Soul Essence</option>
                <option value="shards">Spirit Shards</option>
                <option value="soul_essence">Soul Essence</option>
                <option value="gods">Essences of the Gods</option>
                <option value="energy">Madness Energy</option>
                <option value="astral">Astral Essence</option>
                <option value="scriptures">Divine Scriptures</option>
                <option value="reshapers">Relic Reshapers</option>
              </select>
              <input type="number" id="input-custom-currency-amt" placeholder="Amount" value="5000" min="1" max="10000000"
                     class="w-24 py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono text-center focus:outline-none focus:border-yellow-400" />
              <button id="btn-boost-custom-currency" class="py-1.5 px-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95">
                + Boost
              </button>
            </div>
          </div>

          <!-- 4. Master All-In-One Cheats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button class="btn-dev-action py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20" data-action="unlock_all">
              <span>${getGameIcon('unlock', { size: 14, className: 'inline mr-1' })} Unlock All Systems & Bestiary</span>
            </button>
            <button class="btn-dev-action py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/30" data-action="godmode">
              <span>${getGameIcon('zap', { size: 14, className: 'inline mr-1' })} ACTIVATE GOD MODE</span>
            </button>
          </div>

        </div>

        <!-- Footer Notice -->
        <div class="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-2">
          Strictly gated to admin dev account: ${DEV_ADMIN_EMAIL}. Cheats modify active memory state and persist immediately.
        </div>

      </div>
    </div>
  `;

  bindDevConsoleEvents(modalRoot, onClose);
}

function bindDevConsoleEvents(modalRoot, onClose) {
  const triggerUpdate = (message, isError = false) => {
    safePlaySfx(isError ? 'boss_enrage' : 'contract_summon', 0.5);
    renderDevConsoleContent(modalRoot, onClose, message, isError);
  };

  // Close modal
  const handleClose = () => {
    modalRoot.innerHTML = '';
    if (onClose) onClose();
  };

  modalRoot.querySelector('#btn-close-dev-console')?.addEventListener('click', handleClose);

  // Command bar cheat execution
  const runCommandInput = () => {
    const input = modalRoot.querySelector('#dev-cheat-input');
    const val = input ? input.value : '';
    if (!val || !val.trim()) return;

    const res = gameState.executeCheatCode(val);
    triggerUpdate(res.message || res.error, !res.success);
  };

  modalRoot.querySelector('#btn-run-cheat-cmd')?.addEventListener('click', runCommandInput);
  modalRoot.querySelector('#dev-cheat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runCommandInput();
    }
  });

  // Custom floor jump
  modalRoot.querySelector('#btn-jump-custom-floor')?.addEventListener('click', () => {
    const input = modalRoot.querySelector('#input-custom-floor');
    const target = input ? parseInt(input.value, 10) : 1;
    if (!isNaN(target) && target >= 1) {
      const res = gameState.devSkipFloor(target, false);
      triggerUpdate(res.message, !res.success);
    }
  });

  // Custom Currency Dropdown Booster
  modalRoot.querySelector('#btn-boost-custom-currency')?.addEventListener('click', () => {
    const sel = modalRoot.querySelector('#select-custom-currency');
    const inputAmt = modalRoot.querySelector('#input-custom-currency-amt');
    const currType = sel ? sel.value : 'purified';
    const amt = inputAmt ? parseInt(inputAmt.value, 10) : 1000;

    if (isNaN(amt) || amt <= 0) return;

    let bundle = {};
    if (currType === 'purified') bundle.purifiedSoulEssence = amt;
    else if (currType === 'shards') bundle.spiritShards = amt;
    else if (currType === 'soul_essence') bundle.soulEssence = amt;
    else if (currType === 'gods') bundle.essencesOfTheGods = amt;
    else if (currType === 'energy') bundle.energy = amt;
    else if (currType === 'astral') bundle.astralEssence = amt;
    else if (currType === 'scriptures') bundle.divineScriptures = amt;
    else if (currType === 'reshapers') bundle.relicReshapers = amt;

    const res = gameState.devAddCurrency(bundle);
    triggerUpdate(`[Dev] Boosted +${amt.toLocaleString()} ${currType}!`, !res.success);
  });

  // Quick Action Buttons
  modalRoot.querySelectorAll('.btn-dev-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const val = parseInt(btn.dataset.val, 10);
      const type = btn.dataset.type;

      if (action === 'skip_floor') {
        const res = gameState.devSkipFloor(val, true);
        triggerUpdate(res.message, !res.success);
      } else if (action === 'level_up') {
        const res = gameState.devLevelUp(val, false);
        triggerUpdate(res.message, !res.success);
      } else if (action === 'level_up_to') {
        const res = gameState.devLevelUp(val, true);
        triggerUpdate(res.message, !res.success);
      } else if (action === 'max_spirits') {
        const res = gameState.devMaxPartySpirits();
        triggerUpdate(res.message, !res.success);
      } else if (action === 'boost_all_currencies') {
        const res = gameState.executeCheatCode('rich');
        triggerUpdate('[Dev] ALL currencies boosted! (+5M Shards, +10k Purified Soul, +5k Soul Essence, +999 Energy, etc.)', !res.success);
      } else if (action === 'add_currency') {
        let bundle = {};
        if (type === 'shards') bundle.spiritShards = val;
        if (type === 'purified' || type === 'soul') bundle.purifiedSoulEssence = val;
        if (type === 'soul_essence') bundle.soulEssence = val;
        if (type === 'energy') bundle.energy = val;
        if (type === 'astral') bundle.astralEssence = val;
        if (type === 'gods') bundle.essencesOfTheGods = val;
        if (type === 'mats') { bundle.divineScriptures = val; bundle.relicReshapers = val; }
        const res = gameState.devAddCurrency(bundle);
        triggerUpdate(res.message, !res.success);
      } else if (action === 'unlock_all') {
        const res = gameState.devUnlockAll();
        triggerUpdate(res.message, !res.success);
      } else if (action === 'godmode') {
        const res = gameState.executeCheatCode('godmode');
        triggerUpdate(res.message, !res.success);
      }
    });
  });
}
