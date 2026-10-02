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
            Channel Spirit Shards to bind elemental beasts and ancient mythical guardians.
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
