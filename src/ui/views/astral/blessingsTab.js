import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { SPIRIT_SPECIES } from '../../../data/spiritsData.js';
import { createSpiritPlaceholderBox } from '../../components/pixelBox.js';
import { closeActiveModal } from '../../modals/modalBase.js';
import { getGameIcon } from '../../icons/gameIcons.js';

export function renderPotionsSectionHtml(res, spirits) {
  const POTIONS = [
    { id: 'lesser_elixir', name: 'Lesser Astral Elixir', iconKey: 'potion', xp: 10000, shardCost: 1200, essenceGodCost: 10, astralCost: 1, desc: 'Brewed elixir granting +10,000 Spirit XP.' },
    { id: 'grand_elixir', name: 'Grand Astral Elixir', iconKey: 'alembic', xp: 50000, shardCost: 3000, essenceGodCost: 25, astralCost: 3, desc: 'Concentrated starlight granting +50,000 Spirit XP.' },
    { id: 'divine_ambrosia', name: 'Divine Ambrosia', iconKey: 'relic', xp: 250000, shardCost: 7500, essenceGodCost: 60, astralCost: 10, desc: 'Nectar of the gods granting +250,000 Spirit XP.' }
  ];

  return `
    <div class="flex flex-col gap-2">
      <div class="text-[11px] text-slate-400">
        Feed concentrated astral potions to rapidly elevate spirit levels (Consumes Shards, God Essences, and Astral Essences):
      </div>

      <div class="flex flex-col gap-2">
        ${POTIONS.map(pot => {
          const canBuy = (res.spiritShards || 0) >= pot.shardCost &&
            (res.essencesOfTheGods || 0) >= pot.essenceGodCost &&
            (res.soulEssence || 0) >= pot.astralCost;

          return `
            <div class="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-3 flex items-center justify-between gap-2.5 shadow-sm">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  ${getGameIcon(pot.iconKey, { size: 20 })}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white truncate">${pot.name}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      +${pot.xp.toLocaleString()} XP
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    Cost: <span class="text-amber-300 font-bold inline-flex items-center gap-0.5">${getGameIcon('spiritShards', { size: 11 })} ${pot.shardCost.toLocaleString()}</span> • <span class="text-cyan-300 font-bold inline-flex items-center gap-0.5">${getGameIcon('godsEssence', { size: 11 })} ${pot.essenceGodCost} Gods</span> • <span class="text-purple-300 font-bold inline-flex items-center gap-0.5">${getGameIcon('astralEssence', { size: 11 })} ${pot.astralCost} Astral</span>
                  </div>
                </div>
              </div>

              <button class="btn-use-potion min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer shadow disabled:opacity-50 ${canBuy ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'}" 
                      data-potion-id="${pot.id}" 
                      ${canBuy ? '' : 'disabled'}>
                ${canBuy ? 'Feed Potion' : 'Need Mats'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}


export function renderBlessingsSectionHtml(res, activeBlessings) {
  const BLESSINGS = [
    { id: 'ares_blessing', name: 'Blessing of Ares', iconKey: 'swords', stat: 'ATK Power +25%', cost: 10, desc: '+25% all party damage for 1 hour.' },
    { id: 'athena_blessing', name: 'Blessing of Athena', iconKey: 'shield', stat: 'Max HP +30%', cost: 10, desc: '+30% party maximum health for 1 hour.' },
    { id: 'zeus_blessing', name: 'Blessing of Zeus', iconKey: 'zap', stat: 'Crit Rate +20%', cost: 15, desc: '+20% Critical Hit Chance for 1 hour.' },
    { id: 'poseidon_blessing', name: 'Blessing of Poseidon', iconKey: 'drop', stat: 'Shard Yield +35%', cost: 15, desc: '+35% bonus Spirit Shards for 1 hour.' }
  ];

  return `
    <div class="flex flex-col gap-2">
      <div class="text-[11px] text-slate-400">
        Invoke 1-hour divine boons from the Greek Gods to supercharge party combat:
      </div>

      <div class="flex flex-col gap-2">
        ${BLESSINGS.map(b => {
          const key = `blessing_${b.id.replace('_blessing', '')}`;
          const active = activeBlessings ? (Array.isArray(activeBlessings) 
            ? activeBlessings.find(ab => ab.id === b.id || ab.id === key) 
            : (activeBlessings[b.id] || activeBlessings[key])) : null;
          const canAfford = (res.essencesOfTheGods || 0) >= b.cost;
          const minsRemaining = active ? Math.ceil((active.expiresAt - Date.now()) / (60 * 1000)) : 0;

          return `
            <div class="rounded-xl border p-3 flex items-center justify-between gap-2.5 shadow-sm transition-all ${active ? 'bg-purple-950/30 border-purple-400/60' : 'bg-slate-900/80 border-slate-800'}">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  ${getGameIcon(b.iconKey, { size: 20 })}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white truncate">${b.name}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      ${b.stat}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5 truncate">${b.desc}</div>
                </div>
              </div>

              <div class="shrink-0 flex items-center">
                ${active ? `
                  <div class="text-[11px] font-bold text-emerald-400 flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/30">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ${minsRemaining}m left
                  </div>
                ` : `
                  <button class="btn-invoke-blessing min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow ${canAfford ? 'bg-gradient-to-r from-purple-400 to-pink-300 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}" 
                          data-blessing-id="${b.id}"
                          data-cost="${b.cost}"
                          data-name="${b.name}">
                    ${canAfford ? 'Invoke Boon' : `Need ${b.cost} Gods`}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}


export function bindPotionEvents(container, callbacks = {}) {
  container.querySelectorAll('.btn-use-potion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const potionId = e.currentTarget.getAttribute('data-potion-id');
      openPotionSpiritSelector(potionId, container, callbacks);
    });
  });
}


export function bindBlessingEvents(container, callbacks = {}) {
  container.querySelectorAll('.btn-invoke-blessing').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bBtn = e.target.closest('.btn-invoke-blessing') || e.currentTarget;
      const blessingId = bBtn.getAttribute('data-blessing-id');
      const cost = parseInt(bBtn.getAttribute('data-cost') || '10', 10);
      const name = bBtn.getAttribute('data-name') || 'Blessing';
      const userEssences = gameState.state.resources.essencesOfTheGods || 0;

      if (userEssences < cost) {
        alert(`Insufficient Essences of the Gods!\nYou need ${cost} Essences to invoke ${name} (You have ${userEssences}).\n\nFarm Sanctuary Trials or dismantle 3-Star+ Relics in your Vault to earn more!`);
        return;
      }

      try {
        gameState.applyTemporaryBlessing(blessingId);
        if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
      } catch (err) {
        alert(err.message);
      }
    });
  });
}


export function openPotionSpiritSelector(potionId, container, callbacks = {}) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const partySpirits = gameState.getPartySpirits();

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-white">
        <h3 class="text-sm font-extrabold text-emerald-300 flex items-center gap-1.5">
          ${getGameIcon('potion', { size: 16 })} Feed Astral Elixir
        </h3>
        <p class="text-[11px] text-slate-400 mt-0.5 mb-2.5">Choose an active party member to receive the XP surge:</p>
        
        <div class="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
          ${partySpirits.map(s => `
            <div class="select-spirit-potion-row flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer" data-spirit-id="${s.id}">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0">${createSpiritPlaceholderBox(s)}</div>
                <div>
                  <div class="font-extrabold text-xs text-white">${s.customName}</div>
                  <div class="text-[10px] text-slate-400 inline-flex items-center gap-1">Lv. ${s.level} • ${getGameIcon('zap', { size: 11, color: '#facc15' })} ${s.power} PWR</div>
                </div>
              </div>
              <button class="btn-feed-confirm px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all cursor-pointer min-h-[34px]">
                Feed
              </button>
            </div>
          `).join('')}
        </div>

        <button id="btn-cancel-potion-modal" class="min-h-[40px] w-full mt-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('.select-spirit-potion-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      try {
        gameState.buyExpPotion(potionId, spiritId);
        modalRoot.innerHTML = '';
        if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.getElementById('btn-cancel-potion-modal')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });
}

