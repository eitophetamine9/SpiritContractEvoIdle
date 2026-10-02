import './style.css';
import { gameState } from './state/index.js';
import { 
  renderMadnessView, 
  updateMadnessCombatTick,
  renderPartyView, 
  renderContractView, 
  renderVaultView, 
  renderStatsView,
  showOfflineModal 
} from './ui/index.js';

let activeTab = 'madness';
const viewContainer = document.getElementById('view-container');
const resShardsEl = document.getElementById('res-shards');
const resEssenceEl = document.getElementById('res-essence');
const resEnergyEl = document.getElementById('res-energy');
const saveStatusEl = document.getElementById('save-status');
const partyEvolveBadgeEl = document.getElementById('party-evolve-badge');

function updateResourcesDisplay() {
  if (resEnergyEl && gameState.state.resources) {
    const res = gameState.state.resources;
    resEnergyEl.textContent = `${res.energy}/${res.maxEnergy}`;
  }
  if (resShardsEl) {
    resShardsEl.textContent = gameState.state.resources.spiritShards.toLocaleString();
  }
  if (resEssenceEl) {
    resEssenceEl.textContent = gameState.state.resources.soulEssence.toLocaleString();
  }

  // Update Party Evolve Badge if any spirit is ready to evolve
  const hasEvolvable = gameState.getPartySpirits().some(s => s.canEvolve);
  if (partyEvolveBadgeEl) {
    partyEvolveBadgeEl.style.display = hasEvolvable ? 'flex' : 'none';
  }
}

function switchTab(tabName) {
  activeTab = tabName;

  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  renderActiveTab();
}

function renderActiveTab() {
  if (!viewContainer) return;

  switch (activeTab) {
    case 'madness':
      renderMadnessView(viewContainer);
      break;
    case 'party':
      renderPartyView(viewContainer);
      break;
    case 'contract':
      renderContractView(viewContainer);
      break;
    case 'vault':
      renderVaultView(viewContainer);
      break;
    case 'stats':
      renderStatsView(viewContainer);
      break;
  }

  updateResourcesDisplay();
}

// Setup Bottom Navigation listeners
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.currentTarget.getAttribute('data-tab');
    if (tabName && tabName !== activeTab) {
      switchTab(tabName);
    }
  });
});

// Subscribe to Game State updates
gameState.subscribe((eventType, payload, state) => {
  if (eventType === 'tick') {
    updateResourcesDisplay();
    if (activeTab === 'madness') {
      updateMadnessCombatTick(viewContainer);
    } else if (activeTab === 'party') {
      // Periodic refresh of XP numbers in party view
      const activeFill = document.querySelector('.xp-bar-fill');
      if (activeFill) {
        // Fast update without re-rendering entire DOM every 250ms
      }
    }
  } else if (eventType === 'saved') {
    if (saveStatusEl) {
      saveStatusEl.classList.add('pulse');
      setTimeout(() => saveStatusEl.classList.remove('pulse'), 800);
    }
  } else if (eventType === 'enemyDefeated') {
    if (activeTab === 'madness') {
      renderMadnessView(viewContainer);
    }
    updateResourcesDisplay();
  } else if (eventType === 'enemySpawned') {
    if (activeTab === 'madness') {
      renderMadnessView(viewContainer);
    }
  } else if (eventType === 'spiritLevelCapped' || eventType === 'partyUpdated') {
    updateResourcesDisplay();
    if (activeTab === 'party') {
      renderPartyView(viewContainer);
    }
  } else if (eventType === 'offlineGains') {
    showOfflineModal(payload, () => {
      renderActiveTab();
    });
  }
});

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  const offlineReport = gameState.init();

  updateResourcesDisplay();
  renderActiveTab();

  if (offlineReport && offlineReport.elapsedSeconds >= 4) {
    showOfflineModal(offlineReport, () => {
      renderActiveTab();
    });
  }
});
