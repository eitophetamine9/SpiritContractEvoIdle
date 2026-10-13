import './style.css';
import { gameState } from './state/index.js';
import { audioManager } from './audio/audioManager.js';
import { 
  renderMadnessView, 
  updateMadnessCombatTick,
  renderPartyView, 
  renderContractView, 
  renderDungeonView,
  renderForgeView,
  renderMysticalView,
  renderVaultView, 
  renderStatsView,
  renderProfileView,
  renderIndexView,
  showOfflineModal 
} from './ui/index.js';

import { arenaRenderer } from './render/arenaRenderer.js';

let activeTab = 'madness';
const viewContainer = document.getElementById('view-container');
const resShardsEl = document.getElementById('res-shards');
const resEssenceEl = document.getElementById('res-essence');
const resGodEssencesEl = document.getElementById('res-god-essences');
const resEnergyEl = document.getElementById('res-energy');
const saveStatusEl = document.getElementById('save-status');
const partyEvolveBadgeEl = document.getElementById('party-evolve-badge');

let _lastEnergyStr = '';
let _lastShards = -1;
let _lastEssence = -1;
let _lastGodEssences = -1;
let _lastHasEvolvable = null;

function updateResourcesDisplay(force = false) {
  if (!gameState.state || !gameState.state.resources) return;
  const res = gameState.state.resources;

  if (resEnergyEl) {
    const energyStr = `${res.energy}/${res.maxEnergy}`;
    if (force || energyStr !== _lastEnergyStr) {
      resEnergyEl.textContent = energyStr;
      _lastEnergyStr = energyStr;
    }
  }
  if (resShardsEl) {
    if (force || res.spiritShards !== _lastShards) {
      resShardsEl.textContent = res.spiritShards.toLocaleString();
      _lastShards = res.spiritShards;
    }
  }
  if (resEssenceEl) {
    if (force || res.soulEssence !== _lastEssence) {
      resEssenceEl.textContent = res.soulEssence.toLocaleString();
      _lastEssence = res.soulEssence;
    }
  }
  if (resGodEssencesEl) {
    const godVal = res.essencesOfTheGods || 0;
    if (force || godVal !== _lastGodEssences) {
      resGodEssencesEl.textContent = godVal.toLocaleString();
      _lastGodEssences = godVal;
    }
  }

  // Update Party Evolve Badge if any spirit is ready to evolve
  if (partyEvolveBadgeEl) {
    const hasEvolvable = gameState.getPartySpirits().some(s => s.canEvolve);
    if (force || hasEvolvable !== _lastHasEvolvable) {
      partyEvolveBadgeEl.style.display = hasEvolvable ? 'flex' : 'none';
      _lastHasEvolvable = hasEvolvable;
    }
  }
}

function switchTab(tabName) {
  if (activeTab !== tabName) {
    // Cleanly unmount any active canvas renderer before switching views
    arenaRenderer.destroy();
  }
  activeTab = tabName;
  audioManager.handleTabChange(tabName);

  const btnTopProfile = document.getElementById('btn-top-profile');
  if (btnTopProfile) {
    if (tabName === 'profile') {
      btnTopProfile.classList.add('active');
    } else {
      btnTopProfile.classList.remove('active');
    }
  }

  const btnTopIndex = document.getElementById('btn-top-index');
  if (btnTopIndex) {
    if (tabName === 'index') {
      btnTopIndex.classList.add('active');
    } else {
      btnTopIndex.classList.remove('active');
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

  const secondaryTabs = ['trials', 'forge', 'mystical', 'vault', 'index', 'profile'];
  const navMenuBtn = document.getElementById('nav-menu-toggle');
  if (navMenuBtn) {
    if (secondaryTabs.includes(tabName)) {
      navMenuBtn.classList.add('active');
    } else {
      navMenuBtn.classList.remove('active');
    }
  }

  document.querySelectorAll('.nav-drawer-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
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
      renderContractView(viewContainer, () => switchTab('index'));
      break;
    case 'trials':
      renderDungeonView(viewContainer);
      break;
    case 'forge':
      renderForgeView(viewContainer);
      break;
    case 'mystical':
      renderMysticalView(viewContainer);
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

// Setup Bottom Navigation listeners (3 main tabs + Drawer items)
document.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.currentTarget.getAttribute('data-tab');
    if (tabName && tabName !== activeTab) {
      switchTab(tabName);
    }
  });
});

// Setup Menu Drawer Toggle and Items
const navDrawerBackdrop = document.getElementById('nav-drawer-backdrop');
const navMenuToggleBtn = document.getElementById('nav-menu-toggle');
const btnCloseNavDrawer = document.getElementById('btn-close-nav-drawer');

const openNavDrawer = () => {
  if (navDrawerBackdrop) {
    navDrawerBackdrop.style.display = 'flex';
  }
};

const closeNavDrawer = () => {
  if (navDrawerBackdrop) {
    navDrawerBackdrop.style.display = 'none';
  }
};

if (navMenuToggleBtn) {
  navMenuToggleBtn.addEventListener('click', () => {
    if (navDrawerBackdrop && navDrawerBackdrop.style.display === 'flex') {
      closeNavDrawer();
    } else {
      openNavDrawer();
    }
  });
}

if (btnCloseNavDrawer) {
  btnCloseNavDrawer.addEventListener('click', closeNavDrawer);
}

if (navDrawerBackdrop) {
  navDrawerBackdrop.addEventListener('click', (e) => {
    if (e.target === navDrawerBackdrop) {
      closeNavDrawer();
    }
  });
}

document.querySelectorAll('.nav-drawer-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.currentTarget.getAttribute('data-tab');
    closeNavDrawer();
    if (tabName) {
      switchTab(tabName);
    }
  });
});

// Setup Header Profile button
const btnTopProfile = document.getElementById('btn-top-profile');
if (btnTopProfile) {
  btnTopProfile.addEventListener('click', () => {
    switchTab('profile');
  });
}

// Setup Header Index button
const btnTopIndex = document.getElementById('btn-top-index');
if (btnTopIndex) {
  btnTopIndex.addEventListener('click', () => {
    switchTab('index');
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
    updateResourcesDisplay();
  } else if (eventType === 'madnessZoneUpdated' || eventType === 'stageUnlocked' || eventType === 'floorCleared') {
    if (activeTab === 'madness') {
      renderMadnessView(viewContainer);
    }
    updateResourcesDisplay();
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

  // Audio setup
  audioManager.bindGameStateEvents(gameState);
  const btnTopAudio = document.getElementById('btn-top-audio');
  const audioIconSymbol = document.getElementById('audio-icon-symbol');

  const updateAudioUI = () => {
    if (audioIconSymbol) {
      audioIconSymbol.textContent = audioManager.isMuted ? '🔇' : '🔊';
    }
    if (btnTopAudio) {
      btnTopAudio.classList.toggle('muted', audioManager.isMuted);
    }
  };

  updateAudioUI();

  if (btnTopAudio) {
    btnTopAudio.addEventListener('click', () => {
      audioManager.toggleMute();
      updateAudioUI();
    });
  }

  // Resume / Start audio upon first interaction
  const resumeAudioOnce = () => {
    audioManager.init();
    audioManager.handleTabChange(activeTab);
    document.removeEventListener('click', resumeAudioOnce);
    document.removeEventListener('touchstart', resumeAudioOnce);
  };
  document.addEventListener('click', resumeAudioOnce, { once: true });
  document.addEventListener('touchstart', resumeAudioOnce, { once: true });

  updateResourcesDisplay();
  renderActiveTab();

  if (offlineReport && offlineReport.elapsedSeconds >= 4) {
    showOfflineModal(offlineReport, () => {
      renderActiveTab();
    });
  }
});

