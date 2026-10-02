import { gameState } from '../../state/gameState.js';
import { showSummonRevealModal } from '../components/modals.js';

let activeSanctumTab = 'shards'; // 'shards' | 'essence'

export function renderContractView(container, onNavigateToIndex) {
  const state = gameState.state;
  const shards = state.resources.spiritShards;
  const essence = state.resources.soulEssence;
  const resonanceTier = state.resources.resonanceTier || 0;
  const resonanceCost = 6 + resonanceTier * 4;
  const maxEnergyPurchases = state.resources.maxEnergyPurchases || 0;
  const energyExpansionCost = 8 + maxEnergyPurchases * 4;

  container.innerHTML = `
    <div class="contract-container">
      
      <!-- Top Section Tabs: Shards Altar vs Essence Sanctum -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button id="tab-btn-shards" class="zone-toggle-btn ${activeSanctumTab === 'shards' ? 'active' : ''}" style="min-height: 44px; font-weight: 800;">
          💎 Shards Altar
        </button>
        <button id="tab-btn-essence" class="zone-toggle-btn ${activeSanctumTab === 'essence' ? 'active' : ''}" style="min-height: 44px; font-weight: 800; border-color: #9b59b6; color: ${activeSanctumTab === 'essence' ? '#fff' : '#e056fd'}; background: ${activeSanctumTab === 'essence' ? '#8e44ad' : 'rgba(142,68,173,0.15)'};">
          🔮 Essence Sanctum (${essence})
        </button>
      </div>

      ${activeSanctumTab === 'shards' ? `
        <!-- Shards Altar -->
        <div class="altar-card">
          <div class="pixel-box altar-box-preview rarity-legendary">
            <div class="placeholder-creature-sprite">
              <span class="core-glyph" style="font-size: 42px;">📜</span>
            </div>
          </div>

          <div>
            <div class="altar-title">Sacred Elder Spirit Tree</div>
            <div class="altar-desc">
              Channel Spirit Shards to form mystical bonds with wandering spirits.
            </div>
          </div>

          <div style="font-size: 14px; font-weight: 800; color: #ffd152;">
            Available Shards: 💎 ${shards.toLocaleString()}
          </div>

          <div class="summon-buttons-grid">
            <button id="btn-summon-1" class="btn-summon-single" ${shards < 100 ? 'disabled' : ''}>
              <span>📜 Contract x1</span>
              <span class="cost-sub">100 Shards</span>
            </button>

            <button id="btn-summon-10" class="btn-summon-multi" ${shards < 950 ? 'disabled' : ''}>
              <span>✨ Contract x10</span>
              <span class="cost-sub">950 Shards (-5%)</span>
            </button>
          </div>
        </div>

        <!-- Quick Compendium Link & Gacha Rarity Rates -->
        <div class="contract-rates-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="rates-title">📜 Contract Probability Rates</div>
            <button id="btn-view-index-link" class="btn-view-index-sm">
              📖 View Spirit Index & Trees
            </button>
          </div>

          <div class="rates-list">
            <div><strong style="color: #bdc3c7;">• Common (60%):</strong> Cat, Dog, Chicken, Caterpillar</div>
            <div><strong style="color: #2ecc71;">• Uncommon (26%):</strong> Bull, Lizard, Python</div>
            <div><strong style="color: #3498db;">• Rare (10%):</strong> Shark, Bear</div>
            <div><strong style="color: #9b59b6;">• Epic (3.5%):</strong> Wisp Spirit</div>
            <div><strong style="color: #f39c12;">• Legendary (0.5%):</strong> Fallen Warrior Spirit</div>
          </div>

          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            *All evolution paths, Mythical & Transcendent variants, and species lore are cataloged in the <strong>Spirit Index</strong>.
          </div>
        </div>
      ` : `
        <!-- Soul Essence Sanctum Shop -->
        <div class="altar-card" style="border-color: #9b59b6; background: radial-gradient(circle at 50% 40%, #2c1638 0%, #0d0a14 100%);">
          <div class="pixel-box altar-box-preview rarity-mythical" style="border-color: #e056fd; box-shadow: 0 0 20px rgba(224, 86, 253, 0.4);">
            <div class="placeholder-creature-sprite">
              <span class="core-glyph" style="font-size: 42px;">🔮</span>
            </div>
          </div>

          <div>
            <div class="altar-title" style="color: #e056fd;">Soul Essence Sanctum</div>
            <div class="altar-desc">
              Spend pure Soul Essence earned from Floor Bosses on high-tier ascensions and permanent blessings.
            </div>
          </div>

          <div style="font-size: 14px; font-weight: 800; color: #e056fd;">
            Current Balance: 🔮 ${essence.toLocaleString()} Essence
          </div>
        </div>

        <!-- Essence Shop Items List (Rebalanced) -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          
          <!-- 1. Astral Contract -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">🌟 Astral Contract (Guaranteed Uncommon+)</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                100% chance for Uncommon, Rare, Epic, or Legendary spirits! (0% Commons)
              </span>
            </div>
            <button id="btn-buy-astral-summon" class="btn-essence-buy" ${essence < 8 ? 'disabled' : ''}>
              Contract (8 🔮)
            </button>
          </div>

          <!-- 2. Party XP Elixir -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">🧪 Ancient Party EXP Elixir</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Grants +500 Training XP to all active party spirits.
              </span>
            </div>
            <button id="btn-buy-xp-elixir" class="btn-essence-buy" ${essence < 10 ? 'disabled' : ''}>
              Grant XP (10 🔮)
            </button>
          </div>

          <!-- 3. Expand Max Energy -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">⚡ Expand Max Energy (+10)</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Permanently raises your Energy ceiling (Current: ${state.resources.maxEnergy} ⚡).
              </span>
            </div>
            <button id="btn-buy-max-energy" class="btn-essence-buy" ${essence < energyExpansionCost ? 'disabled' : ''}>
              Expand (${energyExpansionCost} 🔮)
            </button>
          </div>

          <!-- 4. Instant Energy Surge -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">⚡ Instant Energy Surge (+30 ⚡)</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Instantly replenishes 30 Energy for boss tackling.
              </span>
            </div>
            <button id="btn-buy-energy-surge" class="btn-essence-buy" ${essence < 3 || state.resources.energy >= state.resources.maxEnergy ? 'disabled' : ''}>
              Replenish (3 🔮)
            </button>
          </div>

          <!-- 5. Party Resonance Upgrade -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">✨ Party Resonance Blessing (Tier ${resonanceTier})</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Permanently grants +${(resonanceTier + 1) * 5}% Power to all equipped Spirits.
              </span>
            </div>
            <button id="btn-buy-resonance" class="btn-essence-buy" ${essence < resonanceCost ? 'disabled' : ''}>
              Upgrade (${resonanceCost} 🔮)
            </button>
          </div>

        </div>
      `}

    </div>
  `;

  // Attach Event Listeners
  const btnShards = container.querySelector('#tab-btn-shards');
  const btnEssence = container.querySelector('#tab-btn-essence');

  if (btnShards && btnEssence) {
    btnShards.addEventListener('click', () => {
      activeSanctumTab = 'shards';
      renderContractView(container, onNavigateToIndex);
    });

    btnEssence.addEventListener('click', () => {
      activeSanctumTab = 'essence';
      renderContractView(container, onNavigateToIndex);
    });
  }

  // Link to Spirit Index
  const btnViewIndex = container.querySelector('#btn-view-index-link');
  if (btnViewIndex && typeof onNavigateToIndex === 'function') {
    btnViewIndex.addEventListener('click', () => {
      onNavigateToIndex();
    });
  }

  // Summon 1x
  const btnSummon1 = container.querySelector('#btn-summon-1');
  if (btnSummon1) {
    btnSummon1.addEventListener('click', () => {
      try {
        const newSpirits = gameState.contractSpirit(1);
        showSummonRevealModal(newSpirits);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Summon 10x
  const btnSummon10 = container.querySelector('#btn-summon-10');
  if (btnSummon10) {
    btnSummon10.addEventListener('click', () => {
      try {
        const newSpirits = gameState.contractSpirit(10);
        showSummonRevealModal(newSpirits);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Astral Summon
  const btnAstral = container.querySelector('#btn-buy-astral-summon');
  if (btnAstral) {
    btnAstral.addEventListener('click', () => {
      try {
        const newSpirits = gameState.contractAstralSpirit();
        showSummonRevealModal(newSpirits);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Buy XP Elixir
  const btnXp = container.querySelector('#btn-buy-xp-elixir');
  if (btnXp) {
    btnXp.addEventListener('click', () => {
      try {
        const res = gameState.buyPartyXpElixir();
        alert(`✨ Granted +${res.xpGranted} XP to all equipped Spirits!`);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Buy Max Energy
  const btnMaxEnergy = container.querySelector('#btn-buy-max-energy');
  if (btnMaxEnergy) {
    btnMaxEnergy.addEventListener('click', () => {
      try {
        const res = gameState.buyMaxEnergyExpansion();
        alert(`⚡ Max Energy increased to ${res.newMaxEnergy}!`);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Buy Energy Surge
  const btnEnergySurge = container.querySelector('#btn-buy-energy-surge');
  if (btnEnergySurge) {
    btnEnergySurge.addEventListener('click', () => {
      try {
        const res = gameState.buyInstantEnergySurge();
        alert(`⚡ Energy restored to ${res.currentEnergy}!`);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Buy Resonance
  const btnResonance = container.querySelector('#btn-buy-resonance');
  if (btnResonance) {
    btnResonance.addEventListener('click', () => {
      try {
        const res = gameState.buyPartyResonanceUpgrade();
        alert(`✨ Resonance upgraded to Tier ${res.newTier} (+${res.bonusPercent}% Party Power)!`);
        renderContractView(container, onNavigateToIndex);
      } catch (err) {
        alert(err.message);
      }
    });
  }
}
