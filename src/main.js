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
  renderCharacterHubView,
  showOfflineModal 
} from './ui/index.js';

import { arenaRenderer } from './render/arenaRenderer.js';
import { authService } from './services/authService.js';
import { showAuthModal } from './ui/components/authModal.js';
import { initTitleScreen, showTitleScreen } from './ui/components/titleScreen.js';
import { cloudSaveService } from './services/cloudSaveService.js';
import { showGameToast } from './ui/components/toast.js';
import { showLevelUpModal } from './ui/components/levelUpModal.js';
import { FEATURE_UNLOCKS } from './data/contractorData.js';
import { guidedTutorial } from './ui/components/guidedTutorial.js';

let activeTab = 'madness';
const viewContainer = document.getElementById('view-container');
const resShardsEl = document.getElementById('res-shards');
const resEssenceEl = document.getElementById('res-essence');
const resGodEssencesEl = document.getElementById('res-god-essences');
const resEnergyEl = document.getElementById('res-energy');
const saveStatusEl = document.getElementById('save-status');
const partyEvolveBadgeEl = document.getElementById('party-evolve-badge');
const btnTopAuth = document.getElementById('btn-top-auth');
const authStatusIcon = document.getElementById('auth-status-icon');
const authStatusText = document.getElementById('auth-status-text');

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

function updateFeatureGatingUI() {
  // Top Index button
  const btnTopIndex = document.getElementById('btn-top-index');
  if (btnTopIndex) {
    const isIndexUnlocked = gameState.isFeatureUnlocked('BESTIARY_INDEX');
    btnTopIndex.classList.toggle('locked', !isIndexUnlocked);
    btnTopIndex.title = isIndexUnlocked 
      ? 'Spirit Bestiary & Lineages' 
      : `🔒 Spirit Bestiary (Unlocks at Lv. ${FEATURE_UNLOCKS.BESTIARY_INDEX.level})`;
  }

  // Nav drawer items
  const drawerLocks = {
    trials: { feat: 'PANTHEON_TRIALS', lvl: FEATURE_UNLOCKS.PANTHEON_TRIALS.level },
    forge: { feat: 'DIVINE_FORGE', lvl: FEATURE_UNLOCKS.DIVINE_FORGE.level },
    mystical: { feat: 'SANCTUARY_ESSENCE', lvl: FEATURE_UNLOCKS.SANCTUARY_ESSENCE.level },
    index: { feat: 'BESTIARY_INDEX', lvl: FEATURE_UNLOCKS.BESTIARY_INDEX.level }
  };

  document.querySelectorAll('.nav-drawer-item').forEach(item => {
    const tab = item.getAttribute('data-tab');
    const lockConfig = drawerLocks[tab];
    let badge = item.querySelector('.drawer-lock-badge');

    if (lockConfig) {
      const isUnlocked = gameState.isFeatureUnlocked(lockConfig.feat);
      item.classList.toggle('locked', !isUnlocked);
      if (!isUnlocked) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'drawer-lock-badge';
          item.appendChild(badge);
        }
        badge.textContent = `🔒 Lv.${lockConfig.lvl}`;
      } else if (badge) {
        badge.remove();
      }
    }
  });
}

function switchTab(tabName) {
  // Feature Gating Checks
  if (tabName === 'index' && !gameState.isFeatureUnlocked('BESTIARY_INDEX')) {
    showGameToast(`🔒 Spirit Bestiary unlocks at Contractor Level ${FEATURE_UNLOCKS.BESTIARY_INDEX.level}! Defeat enemies and summon spirits to gain EXP.`, 'lock');
    return;
  }
  if (tabName === 'trials' && !gameState.isFeatureUnlocked('PANTHEON_TRIALS')) {
    showGameToast(`🔒 Pantheon Trials unlock at Contractor Level ${FEATURE_UNLOCKS.PANTHEON_TRIALS.level}! Clear floors in the Madness Zone to ascend.`, 'lock');
    return;
  }
  if (tabName === 'forge' && !gameState.isFeatureUnlocked('DIVINE_FORGE')) {
    showGameToast(`🔒 Divine Forge unlocks at Contractor Level ${FEATURE_UNLOCKS.DIVINE_FORGE.level}! Evolve spirits and defeat overlords to gain EXP.`, 'lock');
    return;
  }
  if (tabName === 'mystical' && !gameState.isFeatureUnlocked('SANCTUARY_ESSENCE')) {
    showGameToast(`🔒 Sanctuary of the Gods unlocks at Contractor Level ${FEATURE_UNLOCKS.SANCTUARY_ESSENCE.level}! Refine gear and conquer trials to level up.`, 'lock');
    return;
  }

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

  const secondaryTabs = ['sanctum', 'trials', 'forge', 'mystical', 'vault', 'index', 'profile'];
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
  setTimeout(() => guidedTutorial.updateSpotlightPosition(), 150);
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
    case 'sanctum':
      renderCharacterHubView(viewContainer);
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

// Setup Header Home / Title Screen button
const btnTopHome = document.getElementById('btn-top-home');
if (btnTopHome) {
  btnTopHome.addEventListener('click', () => {
    showTitleScreen();
  });
}

const btnHeaderTitle = document.getElementById('btn-header-title');
if (btnHeaderTitle) {
  btnHeaderTitle.addEventListener('click', () => {
    showTitleScreen();
  });
}

// Setup Header Auth / Cloud Account button
function updateAuthDisplay() {
  const isGuest = authService.isGuest();
  const profile = authService.getProfile();
  if (btnTopAuth) {
    if (isGuest) {
      btnTopAuth.classList.remove('cloud-active');
      if (authStatusIcon) authStatusIcon.textContent = '💾';
      if (authStatusText) {
        authStatusText.textContent = profile.username === 'Apprentice Contractor' ? 'Guest' : profile.username;
      }
    } else {
      btnTopAuth.classList.add('cloud-active');
      if (authStatusIcon) authStatusIcon.textContent = '☁️';
      if (authStatusText) {
        authStatusText.textContent = profile.username || 'Online';
      }
    }
  }
}

if (btnTopAuth) {
  btnTopAuth.addEventListener('click', () => {
    showAuthModal(updateAuthDisplay);
  });
}

authService.subscribe((event, payload) => {
  updateAuthDisplay();
});

updateAuthDisplay();

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
  } else if (eventType === 'contractorLevelUp') {
    showLevelUpModal({
      level: payload.level,
      newFeatures: payload.newFeatures,
      rewards: payload.rewards,
      onClaim: () => {
        updateFeatureGatingUI();
        renderActiveTab();
      }
    });
    updateFeatureGatingUI();
  } else if (eventType === 'stateLoaded') {
    updateFeatureGatingUI();
    renderActiveTab();
  } else if (eventType === 'offlineGains') {
    showOfflineModal(payload, () => {
      renderActiveTab();
    });
  }
});

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  const offlineReport = gameState.init();
  cloudSaveService.init();

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

  const enterGame = () => {
    audioManager.init();
    audioManager.handleTabChange(activeTab);
    updateResourcesDisplay(true);
    updateAuthDisplay();
    cloudSaveService.updateSaveStatusUI();
    updateFeatureGatingUI();
    renderActiveTab();
    guidedTutorial.init();

    if (offlineReport && (offlineReport.elapsedSeconds >= 3600 || offlineReport.canClaim)) {
      showOfflineModal(offlineReport, () => {
        renderActiveTab();
      });
    }
  };

  // Launch into Title / Home Screen gateway
  initTitleScreen({ onEnterGame: enterGame });
});

