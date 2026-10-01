import { gameState } from '../../state/gameState.js';
import { showSummonRevealModal } from '../components/modals.js';

export function renderContractView(container) {
  const state = gameState.state;
  const shards = state.resources.spiritShards;

  container.innerHTML = `
    <div class="contract-container">
      
      <!-- Altar Box -->
      <div class="altar-card">
        <div class="pixel-box altar-box-preview elem-DARK">
          <div class="placeholder-creature-sprite">
            <span class="core-glyph" style="font-size: 42px;">📜</span>
          </div>
        </div>

        <div>
          <div class="altar-title">Astral Summoning Circle</div>
          <div class="altar-desc">
            Channel purified Spirit Shards to bind ancient elementals to your will.
          </div>
        </div>

        <div style="font-size: 14px; font-weight: 800; color: #70a1ff;">
          Available Shards: 💎 ${shards.toLocaleString()}
        </div>

        <!-- Summon Action Buttons (min 52px tall) -->
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

      <!-- Contract Odds & Evolution Info Card -->
      <div class="contract-rates-card">
        <div class="rates-title">📊 Summoning & Evolution Mechanics</div>
        <div class="rates-list">
          <div>• <strong>Base Spirits:</strong> Ignis Wisp (Fire), Aqua Sprout (Water), Terra Pebble (Earth), Zephyr Finch (Wind), Umbra Shade (Void), Lux Sprite (Solar)</div>
          <div>• <strong>Blessed IV Chance:</strong> 10% chance to contract with innate ⭐ Rare trait</div>
          <div>• <strong>AFK Training:</strong> Max 5 spirits in Active Party gain idle XP</div>
          <div>• <strong>RNG Evolution:</strong> At Level Cap, spirits evolve through an RNG table (80% Common Variant, 20% Rare Variant)</div>
          <div>• <strong>Apex Ascension:</strong> Tier 2 spirits reach Level 25 to evolve into Mythic / Supreme Tier 3 forms!</div>
        </div>
      </div>

    </div>
  `;

  // Attach button event listeners
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
}
