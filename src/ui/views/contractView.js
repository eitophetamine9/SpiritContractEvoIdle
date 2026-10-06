import { gameState } from '../../state/gameState.js';
import { BANNER_CONFIGS, RARITIES, getRarityInfo } from '../../data/spiritsData.js';
import { showSummonRevealModal } from '../components/modals.js';

let activeBannerIndex = 0;
let skipAnimation = false;

export function renderContractView(container, onNavigateToIndex) {
  const state = gameState.state;
  const shards = state.resources.spiritShards || 0;
  const stats = state.stats || {};
  const summonLevel = stats.summonLevel || 1;
  const summonXp = stats.summonXp || 0;
  const reqSummonXp = gameState.getSummonLevelReqXp(summonLevel);
  const totalSummons = stats.totalBannerSummons || stats.totalSpiritsContracted || 0;
  const claimedMilestones = stats.claimedSummonMilestones || [];

  const activeBanner = BANNER_CONFIGS[activeBannerIndex] || BANNER_CONFIGS[0];
  const summonProgressPct = Math.min(100, Math.round((summonXp / reqSummonXp) * 100));

  const MILESTONES = [
    { count: 20, reward: '500 Shards & 20 Gods' },
    { count: 50, reward: '1,200 Shards & 50 Gods' },
    { count: 100, reward: '10 Essence & 100 Gods' },
    { count: 200, reward: '★ Astraea Valkyrie' },
    { count: 500, reward: '★ Solaris Sin of Pride' },
    { count: 1000, reward: '★ Solaris The One' }
  ];

  container.innerHTML = `
    <div class="contract-overhaul-wrapper" style="
      max-width: 580px; 
      margin: 0 auto; 
      display: flex; 
      flex-direction: column; 
      gap: 12px;
      padding: 8px 4px 24px 4px;
    ">
      
      <!-- Top Summon Level & Title Header (Reference Inspired) -->
      <div class="summon-header-banner" style="
        background: linear-gradient(180deg, #513622 0%, #2f1d10 100%);
        border: 2px solid #8e623b;
        border-radius: 14px;
        padding: 10px 14px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
        display: flex;
        flex-direction: column;
        gap: 6px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">⛩️</span>
            <div>
              <h2 style="margin: 0; font-size: 17px; font-weight: 900; color: #ffebc8; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
                Hero Summon & Contract Altar
              </h2>
              <div style="font-size: 11px; color: #d4a373; font-weight: 700;">
                Summon Level <span style="color: #ffd152; font-size: 13px;">${summonLevel}</span>
              </div>
            </div>
          </div>

          <button id="btn-milestone-chest" title="Milestone Rewards" style="
            background: linear-gradient(180deg, #d35400 0%, #a04000 100%);
            border: 2px solid #e67e22;
            color: #fff;
            border-radius: 10px;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
          ">
            <span>🎁</span>
            <span>Rewards</span>
          </button>
        </div>

        <!-- Summon Level XP Progress Bar -->
        <div style="
          background: rgba(0,0,0,0.6);
          border-radius: 999px;
          height: 10px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,215,0,0.3);
        ">
          <div style="
            background: linear-gradient(90deg, #f1c40f 0%, #e67e22 100%);
            width: ${summonProgressPct}%;
            height: 100%;
            transition: width 0.3s ease;
            box-shadow: 0 0 10px rgba(241,196,15,0.8);
          "></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #e0d0b8; font-weight: 700;">
          <span>Lv.${summonLevel} Perk: Enhanced Rarity Luck</span>
          <span>${summonXp.toLocaleString()} / ${reqSummonXp.toLocaleString()} XP (${summonProgressPct}%)</span>
        </div>
      </div>

      <!-- Main Summon Parchment Poster pinned to wall -->
      <div class="summon-poster-card" style="
        position: relative;
        background: #e9d5a1;
        background-image: radial-gradient(#d4b886 1px, transparent 1px), radial-gradient(#d4b886 1px, #e9d5a1 1px);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
        border: 4px solid #784d28;
        border-radius: 18px;
        padding: 16px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.7), inset 0 0 25px rgba(120,77,40,0.35);
        color: #2b1807;
        overflow: hidden;
      ">
        <!-- Stone Rivets in corners -->
        <div style="position: absolute; top: 8px; left: 8px; width: 12px; height: 12px; border-radius: 50%; background: #4a3319; border: 2px solid #8e623b; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);"></div>
        <div style="position: absolute; top: 8px; right: 8px; width: 12px; height: 12px; border-radius: 50%; background: #4a3319; border: 2px solid #8e623b; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);"></div>
        <div style="position: absolute; bottom: 8px; left: 8px; width: 12px; height: 12px; border-radius: 50%; background: #4a3319; border: 2px solid #8e623b; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);"></div>
        <div style="position: absolute; bottom: 8px; right: 8px; width: 12px; height: 12px; border-radius: 50%; background: #4a3319; border: 2px solid #8e623b; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);"></div>

        <!-- Left / Right Carousel Arrow Buttons -->
        <button id="btn-banner-prev" style="
          position: absolute;
          left: 6px;
          top: 38%;
          transform: translateY(-50%);
          background: rgba(43,24,7,0.85);
          color: #ffebc8;
          border: 2px solid #c99347;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          font-size: 16px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        ">◄</button>

        <button id="btn-banner-next" style="
          position: absolute;
          right: 6px;
          top: 38%;
          transform: translateY(-50%);
          background: rgba(43,24,7,0.85);
          color: #ffebc8;
          border: 2px solid #c99347;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          font-size: 16px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        ">►</button>

        <!-- Featured Character Showcase Graphic -->
        <div style="
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8px 30px;
          background: ${activeBanner.bgGradient};
          border-radius: 14px;
          border: 2px solid ${activeBanner.accentColor};
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
          position: relative;
        ">
          <!-- Element & Banner Tag -->
          <div style="
            position: absolute;
            top: 8px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: #ffd700;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            border: 1px solid ${activeBanner.accentColor};
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>${activeBanner.icon}</span>
            <span>${activeBanner.shortName}</span>
          </div>

          <div style="
            position: absolute;
            top: 8px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: #ff7675;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            border: 1px solid rgba(255,118,117,0.4);
          ">
            ⏳ ${activeBanner.timerText}
          </div>

          <!-- Featured Spirit Giant Avatar & Aura -->
          <div style="
            margin-top: 18px;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: radial-gradient(circle, ${activeBanner.accentColor} 0%, rgba(0,0,0,0.6) 80%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            box-shadow: 0 0 25px ${activeBanner.accentColor}, inset 0 0 15px rgba(255,255,255,0.4);
            border: 3px solid #fff;
          ">
            ${activeBanner.icon}
          </div>

          <div style="margin-top: 8px;">
            <div style="
              font-size: 19px; 
              font-weight: 900; 
              color: #ffffff; 
              text-shadow: 0 2px 8px rgba(0,0,0,0.9), 0 0 12px ${activeBanner.accentColor};
              letter-spacing: 0.5px;
            ">
              ${activeBanner.characterName}
            </div>
            <div style="font-size: 11px; color: #ffeaa7; font-weight: 700; margin-top: 2px;">
              ${activeBanner.characterTitle}
            </div>
          </div>

          <!-- Subtitle Ribbon -->
          <div style="
            margin-top: 8px;
            background: rgba(0,0,0,0.65);
            color: #ffebc8;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 999px;
            border: 1px solid rgba(255,235,200,0.3);
          ">
            ${activeBanner.subtitle}
          </div>
        </div>

        <!-- Milestone Progress Ribbon across the bottom of the poster -->
        <div style="
          margin-top: 14px;
          background: rgba(68, 38, 14, 0.9);
          border: 2px solid #a87948;
          border-radius: 12px;
          padding: 8px 10px;
          color: #ffebc8;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 800; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="
                background: #c0392b; 
                color: #fff; 
                padding: 2px 7px; 
                border-radius: 999px; 
                font-size: 10px;
                border: 1px solid #e74c3c;
                box-shadow: 0 2px 4px rgba(0,0,0,0.4);
              ">
                📜 ${totalSummons} Summons
              </span>
              <span>Milestone Track</span>
            </div>
            <span style="color: #ffd152; font-size: 10px;">Next Goal: ${MILESTONES.find(m => totalSummons < m.count)?.count || 'Max'}</span>
          </div>

          <!-- Step Checkpoints Row -->
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center;">
            ${MILESTONES.map(m => {
              const reached = totalSummons >= m.count;
              const claimed = claimedMilestones.includes(m.count);
              return `
                <div style="
                  background: ${claimed ? 'rgba(46,204,113,0.2)' : (reached ? 'rgba(241,196,15,0.25)' : 'rgba(0,0,0,0.4)')};
                  border: 1px solid ${claimed ? '#2ecc71' : (reached ? '#f1c40f' : '#6b4f2c')};
                  border-radius: 6px;
                  padding: 4px 2px;
                  font-size: 9px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 2px;
                ">
                  <span style="font-weight: 800; color: ${reached ? '#ffd152' : '#a89379'};">${m.count}</span>
                  ${claimed ? '<span style="color: #2ecc71;">✓</span>' : (reached ? `<button class="btn-claim-milestone" data-count="${m.count}" style="background: #27ae60; color: #fff; border: none; border-radius: 4px; font-size: 8px; font-weight: 800; padding: 2px 4px; cursor: pointer;">Claim</button>` : '<span style="color: #7f8c8d;">🔒</span>')}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Horizontal Banner Carousel Selectors (Cards at bottom) -->
      <div style="
        display: grid; 
        grid-template-columns: repeat(${BANNER_CONFIGS.length}, 1fr); 
        gap: 6px;
      ">
        ${BANNER_CONFIGS.map((b, idx) => `
          <button class="banner-tab-card ${idx === activeBannerIndex ? 'active' : ''}" data-banner-idx="${idx}" style="
            background: ${idx === activeBannerIndex ? 'linear-gradient(180deg, #5c3c1e 0%, #36220f 100%)' : 'rgba(30, 20, 10, 0.7)'};
            border: 2px solid ${idx === activeBannerIndex ? '#ffd700' : '#6b4f2c'};
            border-radius: 10px;
            padding: 6px 4px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            box-shadow: ${idx === activeBannerIndex ? '0 0 12px rgba(255,215,0,0.4)' : 'none'};
            transition: all 0.2s ease;
          ">
            <span style="font-size: 16px;">${b.icon}</span>
            <span style="font-size: 10px; font-weight: 800; color: ${idx === activeBannerIndex ? '#ffd700' : '#d4a373'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
              ${b.shortName}
            </span>
            <span style="font-size: 8px; color: ${idx === activeBannerIndex ? '#ffeaa7' : '#8c7050'};">
              ${b.timerText}
            </span>
          </button>
        `).join('')}
      </div>

      <!-- Controls: Skip Animation & Rates Button -->
      <div style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 4px 6px;
        background: rgba(20, 15, 10, 0.6);
        border-radius: 8px;
        border: 1px solid rgba(142,98,59,0.3);
      ">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #ffebc8; cursor: pointer;">
          <input type="checkbox" id="chk-skip-anim" ${skipAnimation ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #e67e22;">
          <span>Skip Animation</span>
        </label>

        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="font-size: 12px; font-weight: 800; color: #ffd152;">
            💎 ${shards.toLocaleString()} Shards
          </div>
          <button id="btn-rates-modal" style="
            background: rgba(43,24,7,0.8);
            border: 1px solid #c99347;
            color: #ffebc8;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            🎲 Rates
          </button>
        </div>
      </div>

      <!-- Summon Action Buttons: x1, x10, x30 (1-Line Sleek Dock Layout) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <!-- x1 Pull -->
        <button id="btn-summon-1" ${shards < 100 ? 'disabled' : ''} style="
          min-height: 52px;
          background: ${shards >= 100 ? 'linear-gradient(180deg, #4b6584 0%, #2c3e50 100%)' : '#2c3e5088'};
          border: 2px solid ${shards >= 100 ? '#778ca3' : '#4b658444'};
          border-radius: 12px;
          color: #fff;
          cursor: ${shards >= 100 ? 'pointer' : 'not-allowed'};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          transition: transform 0.1s ease;
        ">
          <span style="font-size: 13px; font-weight: 900;">📜 x1</span>
          <span style="font-size: 11px; font-weight: 700; color: #ffd152;">💎 100</span>
        </button>

        <!-- x10 Pull (-5%) -->
        <button id="btn-summon-10" ${shards < 950 ? 'disabled' : ''} style="
          min-height: 52px;
          background: ${shards >= 950 ? 'linear-gradient(180deg, #d35400 0%, #a04000 100%)' : '#a0400088'};
          border: 2px solid ${shards >= 950 ? '#f39c12' : '#e67e2244'};
          border-radius: 12px;
          color: #fff;
          cursor: ${shards >= 950 ? 'pointer' : 'not-allowed'};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          transition: transform 0.1s ease;
        ">
          <span style="font-size: 13px; font-weight: 900;">✨ x10</span>
          <span style="font-size: 11px; font-weight: 700; color: #ffd152;">💎 950 (-5%)</span>
        </button>

        <!-- x30 Pull (-10% Bulk) -->
        <button id="btn-summon-30" ${shards < 2700 ? 'disabled' : ''} style="
          min-height: 52px;
          background: ${shards >= 2700 ? 'linear-gradient(180deg, #8e44ad 0%, #5b2c6f 100%)' : '#5b2c6f88'};
          border: 2px solid ${shards >= 2700 ? '#bb6bd9' : '#8e44ad44'};
          border-radius: 12px;
          color: #fff;
          cursor: ${shards >= 2700 ? 'pointer' : 'not-allowed'};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          transition: transform 0.1s ease;
        ">
          <span style="font-size: 13px; font-weight: 900;">🌟 x30</span>
          <span style="font-size: 11px; font-weight: 700; color: #ffd152;">💎 2,700 (-10%)</span>
        </button>
      </div>

    </div>
  `;

  // Attach Event Handlers
  const chkSkip = container.querySelector('#chk-skip-anim');
  if (chkSkip) {
    chkSkip.addEventListener('change', (e) => {
      skipAnimation = e.target.checked;
    });
  }

  // Prev / Next Banner Buttons
  const btnPrev = container.querySelector('#btn-banner-prev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      activeBannerIndex = (activeBannerIndex - 1 + BANNER_CONFIGS.length) % BANNER_CONFIGS.length;
      renderContractView(container, onNavigateToIndex);
    });
  }

  const btnNext = container.querySelector('#btn-banner-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      activeBannerIndex = (activeBannerIndex + 1) % BANNER_CONFIGS.length;
      renderContractView(container, onNavigateToIndex);
    });
  }

  // Banner Selector Cards
  container.querySelectorAll('.banner-tab-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-banner-idx'), 10);
      if (!isNaN(idx)) {
        activeBannerIndex = idx;
        renderContractView(container, onNavigateToIndex);
      }
    });
  });

  // Rates Modal
  const btnRates = container.querySelector('#btn-rates-modal');
  if (btnRates) {
    btnRates.addEventListener('click', () => {
      showRatesModal(activeBanner);
    });
  }

  // Milestone Chest Modal
  const btnMilestoneChest = container.querySelector('#btn-milestone-chest');
  if (btnMilestoneChest) {
    btnMilestoneChest.addEventListener('click', () => {
      showMilestonesModal(totalSummons, claimedMilestones, container, onNavigateToIndex);
    });
  }

  // Individual Claim Buttons
  container.querySelectorAll('.btn-claim-milestone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const count = parseInt(e.target.getAttribute('data-count'), 10);
      try {
        const reward = gameState.claimSummonMilestone(count);
        alert(`🎉 Milestone ${count} Claimed!\n${reward.desc}`);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Summon Pull Handlers
  const handleSummon = (count) => {
    try {
      const newSpirits = gameState.contractSpirit(count, activeBanner.id);
      showSummonRevealModal(newSpirits);
      renderContractView(container, onNavigateToIndex);
    } catch (err) {
      alert(err.message);
    }
  };

  const btn1 = container.querySelector('#btn-summon-1');
  if (btn1) btn1.addEventListener('click', () => handleSummon(1));

  const btn10 = container.querySelector('#btn-summon-10');
  if (btn10) btn10.addEventListener('click', () => handleSummon(10));

  const btn30 = container.querySelector('#btn-summon-30');
  if (btn30) btn30.addEventListener('click', () => handleSummon(30));
}

function showRatesModal(banner) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.innerHTML = `
    <div class="modal-card" style="max-width: 420px; padding: 18px; border: 2px solid ${banner.accentColor}; background: #140d07;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; color: #ffd700; display: flex; align-items: center; gap: 6px;">
          <span>🎲</span>
          <span>${banner.name} Probability Rates</span>
        </h3>
        <button id="btn-close-rates" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        ${banner.odds.map(o => {
          const rInfo = getRarityInfo(o.rarity);
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 8px; border-left: 4px solid ${rInfo.color};">
              <span style="font-weight: 800; color: ${rInfo.color};">${rInfo.name}</span>
              <span style="font-weight: 900; color: #fff;">${o.weight.toFixed(1)}%</span>
            </div>
          `;
        }).join('')}
      </div>

      ${banner.rateUpBonus ? `
        <div style="margin-top: 12px; background: rgba(243,156,18,0.15); border: 1px solid #f39c12; border-radius: 8px; padding: 10px; font-size: 11px; color: #ffeaa7;">
          <strong>⭐ Rate-Up Guarantee:</strong><br>
          When pulling the featured highest rarity, there is a <strong>${Math.round((banner.rateUpBonus.rateUpShare || 0.5) * 100)}% chance</strong> to receive the featured banner character!
        </div>
      ` : ''}

      <button id="btn-dismiss-rates" style="margin-top: 16px; width: 100%; min-height: 42px; background: #e67e22; border: none; border-radius: 8px; color: #fff; font-weight: 800; cursor: pointer;">
        Close
      </button>
    </div>
  `;

  modalRoot.appendChild(modalEl);

  const close = () => {
    if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
  };
  modalEl.querySelector('#btn-close-rates')?.addEventListener('click', close);
  modalEl.querySelector('#btn-dismiss-rates')?.addEventListener('click', close);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });
}

function showMilestonesModal(totalSummons, claimedMilestones, container, onNavigateToIndex) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const MILESTONES = [
    { count: 20, desc: '500 Shards & 20 Essences of the Gods' },
    { count: 50, desc: '1,200 Shards & 50 Essences of the Gods' },
    { count: 100, desc: '10 Soul Essence & 100 Essences of the Gods' },
    { count: 200, desc: 'Guaranteed Legendary: Astraea, Star-Forged Valkyrie' },
    { count: 500, desc: 'Guaranteed Mythical: Solaris, Lion Sin of Pride' },
    { count: 1000, desc: 'Transcendent Hero: Solaris, The One Ultimate' }
  ];

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.innerHTML = `
    <div class="modal-card" style="max-width: 440px; padding: 18px; border: 2px solid #e67e22; background: #1a110a;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; color: #ffd700; display: flex; align-items: center; gap: 6px;">
          <span>🎁</span>
          <span>Summon Milestone Rewards</span>
        </h3>
        <button id="btn-close-milestones" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <div style="font-size: 12px; color: #d4a373; margin: 10px 0 14px 0;">
        Total Summons Completed: <strong style="color: #ffd152; font-size: 14px;">${totalSummons}</strong>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto;">
        ${MILESTONES.map(m => {
          const reached = totalSummons >= m.count;
          const claimed = claimedMilestones.includes(m.count);
          return `
            <div style="
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              background: rgba(0,0,0,0.5); 
              padding: 10px 12px; 
              border-radius: 8px; 
              border: 1px solid ${claimed ? '#2ecc71' : (reached ? '#f1c40f' : '#4b3520')};
            ">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 12px; font-weight: 800; color: #ffd700;">${m.count} Summons</span>
                <span style="font-size: 11px; color: #e0d0b8;">${m.desc}</span>
              </div>
              <div>
                ${claimed ? `
                  <span style="font-size: 11px; font-weight: 800; color: #2ecc71;">Claimed ✓</span>
                ` : (reached ? `
                  <button class="btn-claim-modal" data-count="${m.count}" style="
                    background: #27ae60; 
                    border: none; 
                    color: #fff; 
                    font-size: 11px; 
                    font-weight: 800; 
                    padding: 6px 12px; 
                    border-radius: 6px; 
                    cursor: pointer;
                  ">Claim</button>
                ` : `
                  <span style="font-size: 11px; font-weight: 700; color: #7f8c8d;">Locked 🔒</span>
                `)}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <button id="btn-dismiss-milestones" style="margin-top: 16px; width: 100%; min-height: 42px; background: #c0392b; border: none; border-radius: 8px; color: #fff; font-weight: 800; cursor: pointer;">
        Close
      </button>
    </div>
  `;

  modalRoot.appendChild(modalEl);

  const close = () => {
    if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
  };
  modalEl.querySelector('#btn-close-milestones')?.addEventListener('click', close);
  modalEl.querySelector('#btn-dismiss-milestones')?.addEventListener('click', close);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });

  modalEl.querySelectorAll('.btn-claim-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const count = parseInt(e.target.getAttribute('data-count'), 10);
      try {
        const reward = gameState.claimSummonMilestone(count);
        alert(`🎉 Milestone ${count} Claimed!\n${reward.desc}`);
        close();
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
