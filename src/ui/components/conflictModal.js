import { closeActiveModal } from './modals.js';

/**
 * Renders an interactive modal comparing Local vs Cloud save states.
 * Allows the player to resolve timestamp or progression desynchronization.
 * 
 * @param {Object} options
 * @param {Object} options.localSummary - Summary metrics of local save { timestamp, stage, partyPower, shards, spiritsCount }
 * @param {Object} options.cloudSummary - Summary metrics of cloud save { timestamp, stage, partyPower, shards, spiritsCount }
 * @param {Function} options.onChooseLocal - Callback when player decides to keep local save
 * @param {Function} options.onChooseCloud - Callback when player decides to keep cloud save
 */
export function showConflictModal({ localSummary, cloudSummary, onChooseLocal, onChooseCloud }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(ts);
    }
  };

  const isLocalNewer = (localSummary?.timestamp || 0) >= (cloudSummary?.timestamp || 0);

  modalRoot.innerHTML = `
    <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div class="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col gap-4 overflow-hidden"
           style="box-shadow: 0 0 45px rgba(245, 158, 11, 0.25);">

        <!-- Header -->
        <div class="flex flex-col items-center text-center gap-1 border-b border-slate-800 pb-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 border border-amber-400/40">
            ⚖️
          </div>
          <h3 class="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-1">
            <span>Cloud Save Conflict Detected</span>
          </h3>
          <p class="text-xs text-slate-300 max-w-xs leading-relaxed">
            Progress on this device differs from your Supabase cloud save. Choose which timeline to preserve:
          </p>
        </div>

        <!-- Comparison Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <!-- Local Save Card -->
          <div class="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-950/80 border ${isLocalNewer ? 'border-amber-400/60 ring-1 ring-amber-400/30' : 'border-slate-800'} relative text-left">
            ${isLocalNewer ? `
              <span class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                Most Recent
              </span>
            ` : ''}

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">📱</span>
                <div>
                  <h4 class="text-xs font-black text-amber-300">Local Device Save</h4>
                  <span class="text-[10px] text-slate-400 font-mono">${formatDate(localSummary?.timestamp)}</span>
                </div>
              </div>

              <div class="flex flex-col gap-1 py-2 border-y border-slate-800/80 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-400">Madness Floor:</span>
                  <strong class="text-white font-bold">Floor ${localSummary?.stage || 1}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Party Power:</span>
                  <strong class="text-amber-300 font-bold">⚡ ${(localSummary?.partyPower || 0).toLocaleString()}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Spirit Shards:</span>
                  <strong class="text-cyan-300 font-bold">💎 ${(localSummary?.shards || 0).toLocaleString()}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Total Spirits:</span>
                  <strong class="text-emerald-300 font-bold">🎴 ${localSummary?.spiritsCount || 1}</strong>
                </div>
              </div>
            </div>

            <button id="btn-conflict-pick-local" class="w-full mt-3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/20">
              Keep Local Save
            </button>
          </div>

          <!-- Cloud Save Card -->
          <div class="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-950/80 border ${!isLocalNewer ? 'border-cyan-400/60 ring-1 ring-cyan-400/30' : 'border-slate-800'} relative text-left">
            ${!isLocalNewer ? `
              <span class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                Most Recent
              </span>
            ` : ''}

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">☁️</span>
                <div>
                  <h4 class="text-xs font-black text-cyan-300">Supabase Cloud Save</h4>
                  <span class="text-[10px] text-slate-400 font-mono">${formatDate(cloudSummary?.timestamp)}</span>
                </div>
              </div>

              <div class="flex flex-col gap-1 py-2 border-y border-slate-800/80 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-400">Madness Floor:</span>
                  <strong class="text-white font-bold">Floor ${cloudSummary?.stage || 1}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Party Power:</span>
                  <strong class="text-amber-300 font-bold">⚡ ${(cloudSummary?.partyPower || 0).toLocaleString()}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Spirit Shards:</span>
                  <strong class="text-cyan-300 font-bold">💎 ${(cloudSummary?.shards || 0).toLocaleString()}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Total Spirits:</span>
                  <strong class="text-emerald-300 font-bold">🎴 ${cloudSummary?.spiritsCount || 1}</strong>
                </div>
              </div>
            </div>

            <button id="btn-conflict-pick-cloud" class="w-full mt-3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-500/20">
              Keep Cloud Save
            </button>
          </div>

        </div>

        <!-- Footer Warning Note -->
        <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 text-center">
          ⚠️ Choosing an option will synchronize and overwrite the other timeline.
        </div>

      </div>
    </div>
  `;

  // Event handlers
  modalRoot.querySelector('#btn-conflict-pick-local')?.addEventListener('click', () => {
    closeActiveModal();
    if (onChooseLocal) onChooseLocal();
  });

  modalRoot.querySelector('#btn-conflict-pick-cloud')?.addEventListener('click', () => {
    closeActiveModal();
    if (onChooseCloud) onChooseCloud();
  });
}
