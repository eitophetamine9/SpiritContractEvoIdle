import './style.css';
import { gameState } from './state/index.js';
import { 
  renderMadnessView, 
  updateMadnessCombatTick,
  renderPartyView, 
  renderContractView, 
  renderVaultView, 
  renderStatsView,
  renderProfileView,
  renderIndexView,
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

  const btnTopProfile = document.getElementById('btn-top-profile');
  if (btnTopProfile) {
    if (tabName === 'profile') {
      btnTopProfile.classList.add('active');
    } else {
      btnTopProfile.classList.remove('active');
    }
  }

  // Update active state on bottom nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Automatically show appropriate dock
  const dockMain = document.getElementById('nav-dock-main');
  const dockMore = document.getElementById('nav-dock-more');
  if (dockMain && dockMore) {
    if (tabName === 'vault' || tabName === 'index') {
      dockMain.classList.add('nav-dock-hidden');
      dockMore.classList.remove('nav-dock-hidden');
    } else if (tabName === 'party' || tabName === 'madness' || tabName === 'contract') {
      dockMain.classList.remove('nav-dock-hidden');
      dockMore.classList.add('nav-dock-hidden');
    }
  }

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
      renderContractView(viewContainer, () => switchTab('index'));
      break;
    case 'vault':
      renderVaultView(viewContainer);
      break;
    case 'index':
      renderIndexView(viewContainer);
      break;
    case 'profile':
    case 'stats':
      renderProfileView(viewContainer);
      break;
  }

  updateResourcesDisplay();
}

// Setup Bottom Navigation listeners
document.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.currentTarget.getAttribute('data-tab');
    if (tabName && tabName !== activeTab) {
      switchTab(tabName);
    }
  });
});

// Setup More / Back drawer toggles
const navMoreToggle = document.getElementById('nav-more-toggle');
const navMoreBack = document.getElementById('nav-more-back');
const dockMain = document.getElementById('nav-dock-main');
const dockMore = document.getElementById('nav-dock-more');

if (navMoreToggle && dockMain && dockMore) {
  navMoreToggle.addEventListener('click', () => {
    dockMain.classList.add('nav-dock-hidden');
    dockMore.classList.remove('nav-dock-hidden');
  });
}

if (navMoreBack && dockMain && dockMore) {
  navMoreBack.addEventListener('click', () => {
    dockMore.classList.add('nav-dock-hidden');
    dockMain.classList.remove('nav-dock-hidden');
  });
}

// Setup Header Profile button
const btnTopProfile = document.getElementById('btn-top-profile');
if (btnTopProfile) {
  btnTopProfile.addEventListener('click', () => {
    switchTab('profile');
  });
}

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
  } else if (eventType === 'enemySpawned' || eventType === 'swarmSpawned') {
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
