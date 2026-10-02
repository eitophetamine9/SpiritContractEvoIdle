import { gameState } from '../../state/gameState.js';
import { showSummonRevealModal } from '../components/modals.js';

let activeSanctumTab = 'shards'; // 'shards' | 'essence'

export function renderContractView(container) {
  const state = gameState.state;
  const shards = state.resources.spiritShards;
  const essence = state.resources.soulEssence;
  const resonanceTier = state.resources.resonanceTier || 0;
  const resonanceCost = 3 + resonanceTier * 2;

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
          <div class="pixel-box altar-box-preview elem-DARK">
            <div class="placeholder-creature-sprite">
              <span class="core-glyph" style="font-size: 42px;">📜</span>
            </div>
          </div>

          <div>
            <div class="altar-title">Astral Summoning Circle</div>
            <div class="altar-desc">
              Channel Spirit Shards to bind elemental beasts and ancient mythical guardians.
            </div>
          </div>

          <div style="font-size: 14px; font-weight: 800; color: #70a1ff;">
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

        <!-- Contract Roster & Rates Card -->
        <div class="contract-rates-card">
          <div class="rates-title">📜 Available Spirits by Rarity</div>
          <div class="rates-list">
            <div><strong style="color: #bdc3c7;">• Common (60%):</strong> Cat Spirit 🐱, Dog Spirit 🐶, Chicken Spirit 🐔, Caterpillar Spirit 🐛</div>
            <div><strong style="color: #2ecc71;">• Uncommon (26%):</strong> Bull Spirit 🐂, Lizard Spirit 🦎, Python Spirit 🐍</div>
            <div><strong style="color: #3498db;">• Rare (10%):</strong> Shark Spirit 🦈, Bear Spirit 🐻</div>
            <div><strong style="color: #9b59b6;">• Epic (3.5%):</strong> Wisp Spirit ✨</div>
            <div><strong style="color: #f39c12;">• Legendary (0.5%):</strong> Fallen Warrior Spirit ⚔️</div>
          </div>

          <div class="rates-title" style="margin-top: 8px;">⚡ Evolution Horizons</div>
          <div class="rates-list" style="font-size: 11px;">
            <div>• <strong>Cat:</strong> 80% Furious Cat, 20% Elemental Cat (EPIC)</div>
            <div>• <strong>Dog:</strong> 80% Vitality Dog, 20% Guardian Dog (EPIC)</div>
            <div>• <strong>Chicken:</strong> 90% Battle Chicken, 10% Dino Genus Chicken (LEGENDARY)</div>
            <div>• <strong>Caterpillar:</strong> 90% Elegant Butterfly, 10% Mystical Butterfly (LEGENDARY)</div>
            <div>• <strong>Bull:</strong> 80% Raging Bull, 15% Elemental Bull (EPIC), 5% Minotaur (MYTHICAL)</div>
            <div>• <strong>Lizard:</strong> 80% Multi-venom Lizard, 15% Komodo Dragon (EPIC), 5% Drake (MYTHICAL)</div>
            <div>• <strong>Python:</strong> 80% HighLord Python, 15% Huge Albino Anaconda (EPIC), 5% Wyrm (MYTHICAL)</div>
            <div>• <strong>Shark:</strong> 90% Great White Shark (EPIC), 8% Megalodon (MYTHICAL), 2% Cosmic Oceanic Devourer (TRANSCENDENT)</div>
            <div>• <strong>Bear:</strong> 90% HighLord Bear (EPIC), 8% Bear of Dreams (MYTHICAL), 2% Cosmic Bear Ursalite (TRANSCENDENT)</div>
            <div>• <strong>Wisp:</strong> 100% High Elf (MYTHICAL)</div>
            <div>• <strong>Fallen Warrior:</strong> 99% Sovereign Warrior (MYTHICAL), 1% DreadLord Warrior (TRANSCENDENT)</div>
          </div>
        </div>
      ` : `
        <!-- Soul Essence Sanctum Shop -->
        <div class="altar-card" style="border-color: #9b59b6; background: radial-gradient(circle at 50% 40%, #2c1638 0%, #0d0a14 100%);">
          <div class="pixel-box altar-box-preview elem-DARK" style="border-color: #e056fd; box-shadow: 0 0 20px rgba(224, 86, 253, 0.4);">
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

        <!-- Essence Shop Items List -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          
          <!-- 1. Astral Contract -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">🌟 Astral Contract (No Commons)</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Guarantees Uncommon (65%), Rare (25%), Epic (8%), or Legendary (2%) Spirit!
              </span>
            </div>
            <button id="btn-buy-astral-summon" class="btn-essence-buy" ${essence < 5 ? 'disabled' : ''}>
              Summon (5 🔮)
            </button>
          </div>

          <!-- 2. Party XP Elixir -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">🧪 Transcendent Party Elixir</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Instantly bestows +2,500 AFK Training XP to all 5 equipped Spirits.
              </span>
            </div>
            <button id="btn-buy-xp-elixir" class="btn-essence-buy" ${essence < 3 ? 'disabled' : ''}>
              Grant XP (3 🔮)
            </button>
          </div>

          <!-- 3. Expand Max Energy -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">⚡ Expand Max Energy (+10)</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Permanently raises your Energy ceiling (Current Max: ${state.resources.maxEnergy} ⚡).
              </span>
            </div>
            <button id="btn-buy-max-energy" class="btn-essence-buy" ${essence < 5 ? 'disabled' : ''}>
              Upgrade (5 🔮)
            </button>
          </div>

          <!-- 4. Energy Surge -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">⚡ Instant Energy Surge (+30)</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Instantly replenishes +30 Energy to push locked floors right now.
              </span>
            </div>
            <button id="btn-buy-energy-surge" class="btn-essence-buy" ${essence < 2 ? 'disabled' : ''}>
              Recharge (2 🔮)
            </button>
          </div>

          <!-- 5. Permanent Party Resonance -->
          <div class="essence-item-card">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 14px; font-weight: 800; color: #ffffff;">⚔️ Party Resonance (Tier ${resonanceTier})</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Permanently increases all Spirits' power by +5% (Current bonus: +${resonanceTier * 5}%).
              </span>
            </div>
            <button id="btn-buy-resonance" class="btn-essence-buy" ${essence < resonanceCost ? 'disabled' : ''}>
              Level Up (${resonanceCost} 🔮)
            </button>
          </div>

        </div>
      `}

    </div>
  `;

  // Attach Tab switcher listeners
  document.getElementById('tab-btn-shards')?.addEventListener('click', () => {
    activeSanctumTab = 'shards';
    renderContractView(container);
  });

  document.getElementById('tab-btn-essence')?.addEventListener('click', () => {
    activeSanctumTab = 'essence';
    renderContractView(container);
  });

  // Attach Shards summon listeners
  document.getElementById('btn-summon-1')?.addEventListener('click', () => {
    try {
      const summoned = gameState.contractSpirit(1);
      showSummonRevealModal(summoned, () => {
        renderContractView(container);
      });
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-summon-10')?.addEventListener('click', () => {
    try {
      const summoned = gameState.contractSpirit(10);
      showSummonRevealModal(summoned, () => {
        renderContractView(container);
      });
    } catch (err) {
      alert(err.message);
    }
  });

  // Attach Essence Sanctum shop listeners
  document.getElementById('btn-buy-astral-summon')?.addEventListener('click', () => {
    try {
      const summoned = gameState.contractAstralSpirit();
      showSummonRevealModal(summoned, () => {
        renderContractView(container);
      });
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-buy-xp-elixir')?.addEventListener('click', () => {
    try {
      gameState.buyPartyXpElixir();
      alert('✨ Transcendent Elixir consumed! +2,500 XP granted to all equipped Spirits!');
      renderContractView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-buy-max-energy')?.addEventListener('click', () => {
    try {
      const res = gameState.buyMaxEnergyExpansion();
      alert(`⚡ Max Energy capacity expanded to ${res.newMaxEnergy} ⚡!`);
      renderContractView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-buy-energy-surge')?.addEventListener('click', () => {
    try {
      const res = gameState.buyInstantEnergySurge();
      alert(`⚡ Energy recharged! Current Energy: ${res.currentEnergy} ⚡.`);
      renderContractView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-buy-resonance')?.addEventListener('click', () => {
    try {
      const res = gameState.buyPartyResonanceUpgrade();
      alert(`⚔️ Party Resonance upgraded to Tier ${res.newTier}! (+${res.bonusPercent}% Power Bonus)`);
      renderContractView(container);
    } catch (err) {
      alert(err.message);
    }
  });
}
