/**
 * Interactive Guided Onboarding Tutorial (The Contractor's Journey)
 * Features dynamic SVG spotlight clipping, smooth coordinate gliding,
 * Cat Spirit mascot guidance, and instant skip option for veterans.
 */

import { gameState } from '../../state/gameState.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { getGameIcon } from '../icons/gameIcons.js';

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome, Apprentice Contractor!',
    speech: 'Greetings! I am your celestial familiar, **Cat Spirit**. The celestial veil has shattered, unleashing corrupted shadows upon the realm. Together, we must forge sacred spirit contracts and restore balance!',
    targetSelector: null, // Centered dialog
    actionText: 'Begin Contractor Journey',
    expectedTab: null
  },
  {
    id: 'nav_summon',
    title: 'The Altar of Contracts',
    speech: 'Every legendary journey begins with a sacred contract. Tap the **Summon Altar** below to invoke new celestial allies from the spirit stream!',
    targetSelector: '#nav-contract',
    actionText: 'Next',
    expectedTab: 'contract',
    targetClickAdvances: true
  },
  {
    id: 'first_summon',
    title: 'Forging Your Spirit Ally',
    speech: 'Here at the Altar, spend your Spirit Shards to forge a bond. Tap **x1 Contract** to summon your companion into existence!',
    targetSelector: '#btn-summon-1',
    actionText: 'Next',
    expectedTab: 'contract',
    advanceOnEvent: 'spiritsContracted'
  },
  {
    id: 'nav_party',
    title: 'Hero Squad & Alignment',
    speech: 'A new celestial ally has answered your call! Now tap **Party** below to inspect your active squad and formation.',
    targetSelector: '#nav-party',
    actionText: 'Go to Party',
    expectedTab: 'party',
    targetClickAdvances: true
  },
  {
    id: 'afk_chamber',
    title: 'AFK Training Chamber',
    speech: 'Notice the **AFK Training Chamber**! All spirits deployed to your active party continuously train and gain EXP—even while you are offline!',
    targetSelector: '.afk-training-banner',
    actionText: 'To The Battlefront!',
    expectedTab: 'party'
  },
  {
    id: 'nav_madness',
    title: 'The Tower of Madness',
    speech: 'Now let us test your party in combat! Tap **Madness** below to deploy your spirits into the frontlines against the corrupted swarm.',
    targetSelector: '#nav-madness',
    actionText: 'Enter Combat',
    expectedTab: 'madness',
    targetClickAdvances: true
  },
  {
    id: 'combat_strike',
    title: 'Real-Time Combat & Ultimates',
    speech: 'Your party attacks automatically and casts devastating Ultimates when their MP reaches 100! You can also tap the corrupted beast directly to unleash burst click damage.',
    targetSelector: '#view-container',
    actionText: 'Next: Milestones',
    expectedTab: 'madness'
  },
  {
    id: 'contractor_ascension',
    title: 'Contractor Level & Roadmap',
    speech: 'Clearing floors, summoning allies, and evolving spirits awards **Contractor EXP**. As you ascend, you will unlock the **3x3 Grid (Lv. 2)**, **Pantheon Trials (Lv. 3)**, **Divine Forge (Lv. 3)**, and **Bestiary (Lv. 4)**! May fortune guide your contracts!',
    targetSelector: '#btn-top-profile',
    actionText: 'Claim 150 Shards & Ascend!',
    isFinal: true
  }
];

class GuidedTutorialController {
  constructor() {
    this.overlayEl = null;
    this.cardEl = null;
    this.currentStepIdx = 0;
    this.resizeObserver = null;
    this.activeCleanup = null;
    this.isTransitioning = false;
  }

  /**
   * Initializes the tutorial system and listens for state changes
   */
  init() {
    if (typeof document === 'undefined') return;

    // Check if tutorial should be active
    const tutState = gameState.getTutorialState();
    if (tutState && !tutState.completed && tutState.active) {
      this.currentStepIdx = tutState.step || 0;
      setTimeout(() => this.start(), 400);
    }

    // Listen to events
    gameState.on('tutorialStepChanged', ({ step }) => {
      this.currentStepIdx = step;
      this.renderCurrentStep();
    });

    gameState.on('tutorialCompleted', () => {
      this.destroy();
    });

    gameState.on('tutorialRestarted', () => {
      this.currentStepIdx = 0;
      this.start();
    });

    gameState.on('gameReset', () => {
      this.destroy();
      this.currentStepIdx = 0;
      setTimeout(() => {
        const tutState = gameState.getTutorialState();
        if (tutState && !tutState.completed && tutState.active) {
          this.start();
        }
      }, 500);
    });

    // Auto-advance if event occurs
    gameState.on('spiritsContracted', () => {
      const stepConfig = TUTORIAL_STEPS[this.currentStepIdx];
      if (stepConfig && stepConfig.advanceOnEvent === 'spiritsContracted') {
        setTimeout(() => this.nextStep(), 600);
      }
    });

    window.addEventListener('resize', () => {
      if (this.overlayEl) {
        this.updateSpotlightPosition();
      }
    });
  }

  start() {
    this.buildDom();
    this.renderCurrentStep();
  }

  buildDom() {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'guided-tutorial-root';
    this.overlayEl.className = 'fixed inset-0 z-50 pointer-events-none select-none transition-opacity duration-300';
    this.overlayEl.style.opacity = '1';

    this.overlayEl.innerHTML = `
      <!-- Dynamic SVG Spotlight Mask Layer (pointer-events-none so highlighted elements can be tapped seamlessly) -->
      <svg id="tutorial-svg-mask" class="absolute inset-0 w-full h-full pointer-events-none" style="overflow: visible;">
        <defs>
          <mask id="tutorial-spotlight-cutout-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect id="spotlight-cutout" x="0" y="0" width="0" height="0" rx="16" fill="black" />
          </mask>
        </defs>
        <!-- Dark Dim Backdrop with SVG mask cut-out -->
        <rect width="100%" height="100%" fill="rgba(6, 11, 8, 0.78)" mask="url(#tutorial-spotlight-cutout-mask)" />
        <!-- Radiant Glowing Border around cut-out -->
        <rect id="spotlight-border" x="0" y="0" width="0" height="0" rx="16" fill="none" stroke="#ffd152" stroke-width="2.5" class="animate-pulse" style="display: none; filter: drop-shadow(0 0 10px rgba(255, 209, 82, 0.6));" />
      </svg>

      <!-- Floating Cat Spirit Guidance Card -->
      <div id="tutorial-card" class="guide-modal-box guide-tutorial-card animate-fadeIn"
           style="left: 50%; transform: translateX(-50%);">
        
        <!-- Header: Mascot & Controls -->
        <div class="guide-modal-header">
          <div class="guide-header-mascot-wrap">
            <div class="guide-mascot-avatar-small">
              ${getGameIcon('cat', { size: 22, className: 'text-amber-200' })}
            </div>
            <div class="guide-header-titles">
              <span class="guide-badge-subtitle">Cat Spirit Guide</span>
              <span class="guide-step-counter">Step <span id="tut-step-num">1</span> of ${TUTORIAL_STEPS.length}</span>
            </div>
          </div>

          <button id="btn-skip-tutorial" class="guide-btn-skip" title="Skip tutorial and proceed with game">
            <span>Skip</span>
            ${getGameIcon('close', { size: 10, className: 'inline text-slate-400' })}
          </button>
        </div>

        <!-- Body Content (Generous Speech Bubble) -->
        <div class="guide-speech-bubble guide-speech-bubble-compact">
          <h3 id="tut-title" class="guide-speech-title"></h3>
          <p id="tut-speech" class="guide-speech-text"></p>
        </div>

        <!-- Action Footer -->
        <div class="guide-modal-footer">
          <div class="guide-step-pills" id="tut-pills">
            ${TUTORIAL_STEPS.map((_, i) => `<span class="guide-pill ${i === 0 ? 'active' : ''}"></span>`).join('')}
          </div>

          <button id="btn-tut-action" class="guide-action-btn guide-action-btn-small">
            <span>Next</span>
            ${getGameIcon('chevronRight', { size: 12, className: 'inline' })}
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(this.overlayEl);

    // Skip Tutorial button
    this.overlayEl.querySelector('#btn-skip-tutorial')?.addEventListener('click', () => {
      this.confirmSkip();
    });

    // Action button
    this.overlayEl.querySelector('#btn-tut-action')?.addEventListener('click', () => {
      this.handleActionClick();
    });

    // Backdrop click: highlight pulse
    this.overlayEl.querySelector('#tutorial-svg-mask')?.addEventListener('click', (e) => {
      if (e.target.tagName === 'rect' && e.target.getAttribute('fill')?.includes('rgba')) {
        safePlaySfx('relic_click', 0.4);
        const card = document.getElementById('tutorial-card');
        if (card) {
          card.classList.add('animate-shake');
          setTimeout(() => card.classList.remove('animate-shake'), 400);
        }
      }
    });
  }

  renderCurrentStep() {
    if (!this.overlayEl) return;

    if (this.currentStepIdx >= TUTORIAL_STEPS.length) {
      this.complete();
      return;
    }

    const step = TUTORIAL_STEPS[this.currentStepIdx];
    if (!step) return;

    safePlaySfx('relic_click', 0.4);

    // Auto-switch to expected tab if specified and not already active
    if (step.expectedTab && typeof window !== 'undefined' && typeof window.switchTab === 'function') {
      const activeNavTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
      if (activeNavTab !== step.expectedTab) {
        window.switchTab(step.expectedTab);
      }
    }

    // Update text
    const titleEl = this.overlayEl.querySelector('#tut-title');
    const speechEl = this.overlayEl.querySelector('#tut-speech');
    const stepNumEl = this.overlayEl.querySelector('#tut-step-num');
    const actionBtn = this.overlayEl.querySelector('#btn-tut-action');

    if (titleEl) titleEl.textContent = step.title;
    if (speechEl) speechEl.innerHTML = step.speech.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>');
    if (stepNumEl) stepNumEl.textContent = (this.currentStepIdx + 1).toString();
    if (actionBtn) {
      const text = step.actionText || 'Next';
      actionBtn.innerHTML = `<span>${text}</span> ${getGameIcon('chevronRight', { size: 12, className: 'inline ml-0.5' })}`;
    }

    // Update pill indicators
    const pills = this.overlayEl.querySelectorAll('#tut-pills span');
    pills.forEach((p, i) => {
      p.className = `w-1.5 h-1.5 rounded-full transition-colors ${i === this.currentStepIdx ? 'bg-amber-400 w-3' : (i < this.currentStepIdx ? 'bg-emerald-400' : 'bg-slate-700')}`;
    });

    // Clean up previous target listeners
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }

    // Attach target interaction
    if (step.targetSelector) {
      const target = document.querySelector(step.targetSelector);
      if (target && step.targetClickAdvances) {
        const handler = () => {
          setTimeout(() => this.nextStep(), 250);
        };
        target.addEventListener('click', handler);
        this.activeCleanup = () => target.removeEventListener('click', handler);
      }
    }

    this.updateSpotlightPosition();
    // Schedule follow-up alignment in case tab view just rendered
    setTimeout(() => this.updateSpotlightPosition(), 120);
  }

  updateSpotlightPosition() {
    if (!this.overlayEl) return;

    const step = TUTORIAL_STEPS[this.currentStepIdx];
    const cutout = this.overlayEl.querySelector('#spotlight-cutout');
    const border = this.overlayEl.querySelector('#spotlight-border');
    const card = this.overlayEl.querySelector('#tutorial-card');

    if (!cutout || !border || !card) return;

    if (!step || !step.targetSelector) {
      // Centered dialog with no cutout
      cutout.setAttribute('width', '0');
      cutout.setAttribute('height', '0');
      border.style.display = 'none';

      card.style.top = '50%';
      card.style.bottom = 'auto';
      card.style.left = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      // If target element not in DOM, fallback to centered
      cutout.setAttribute('width', '0');
      cutout.setAttribute('height', '0');
      border.style.display = 'none';

      card.style.top = '50%';
      card.style.bottom = 'auto';
      card.style.left = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    // Get element bounds
    const rect = target.getBoundingClientRect();
    const pad = 6;
    const x = Math.max(0, rect.left - pad);
    const y = Math.max(0, rect.top - pad);
    const w = rect.width + pad * 2;
    const h = rect.height + pad * 2;

    // Apply smoothly to SVG cutout
    cutout.setAttribute('x', x.toString());
    cutout.setAttribute('y', y.toString());
    cutout.setAttribute('width', w.toString());
    cutout.setAttribute('height', h.toString());

    border.setAttribute('x', x.toString());
    border.setAttribute('y', y.toString());
    border.setAttribute('width', w.toString());
    border.setAttribute('height', h.toString());
    border.style.display = 'block';

    // Position Card intelligently above or below target
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - (y + h);
    const cardHeight = 220; // approximate card height

    card.style.transform = 'translateX(-50%)';

    if (spaceBelow > cardHeight + 20) {
      // Place below target
      card.style.top = `${y + h + 14}px`;
      card.style.bottom = 'auto';
    } else {
      // Place above target
      card.style.top = 'auto';
      card.style.bottom = `${viewportHeight - y + 14}px`;
    }
  }

  handleActionClick() {
    const step = TUTORIAL_STEPS[this.currentStepIdx];
    if (step && step.isFinal) {
      this.complete();
    } else {
      if (step?.expectedTab && typeof window !== 'undefined' && typeof window.switchTab === 'function') {
        window.switchTab(step.expectedTab);
      }
      this.nextStep();
    }
  }

  nextStep() {
    if (this.currentStepIdx < TUTORIAL_STEPS.length - 1) {
      this.currentStepIdx += 1;
      gameState.advanceTutorialStep(this.currentStepIdx);
      const nextStepConfig = TUTORIAL_STEPS[this.currentStepIdx];
      if (nextStepConfig?.expectedTab && typeof window !== 'undefined' && typeof window.switchTab === 'function') {
        window.switchTab(nextStepConfig.expectedTab);
      }
      this.renderCurrentStep();
    } else {
      this.complete();
    }
  }

  complete() {
    safePlaySfx('contract_summon', 0.6);
    gameState.completeTutorial(true);
    this.destroy();
  }

  confirmSkip() {
    const confirmed = confirm('Skip the guided onboarding tutorial? You will still receive +150 bonus Spirit Shards and can review guides in Profile anytime.');
    if (confirmed) {
      this.complete();
    }
  }

  destroy() {
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }
    if (this.overlayEl) {
      this.overlayEl.style.opacity = '0';
      setTimeout(() => {
        this.overlayEl?.remove();
        this.overlayEl = null;
      }, 300);
    }
  }
}

export const guidedTutorial = new GuidedTutorialController();

export const AREA_TUTORIALS = {
  formation: {
    id: 'formation',
    tab: 'party',
    featureId: 'FORMATION_3X3',
    icon: 'chess',
    title: '3x3 Tactical Grid & Formation Alignment',
    speech: 'Contractor! Reaching Level 2 unlocks the **3x3 tactical battle formation**!\n\nPosition your spirits across Frontline, Midline, or Backline:\n• **Frontline**: Draws direct enemy aggro and shields teammates.\n• **Midline**: Balances offense and defense.\n• **Backline**: Safely unleashes high-damage Ultimates and team heals!',
    buttonText: "Deploy Formation"
  },
  trials: {
    id: 'trials',
    tab: 'trials',
    featureId: 'PANTHEON_TRIALS',
    icon: 'trials',
    title: 'The Pantheon Relic Trials',
    speech: 'Welcome to the **Pantheon Trials**! Challenge the 10 Greek God avatars to farm targeted 6-piece Relic Sets.\n\nEquipping matching sets unlocks game-changing **2-piece** and **4-piece divine set bonuses**! You have also been awarded **3 free starter equipments** to begin your trials!',
    buttonText: 'Conquer Trials'
  },
  forge: {
    id: 'forge',
    tab: 'forge',
    featureId: 'DIVINE_FORGE',
    icon: 'forge',
    title: 'The Divine Forge & Weapon Anvils',
    speech: "Hephaestus's sacred forge is now ignited! Overcome Vulcan automatons across 12 weapon anvils to forge Blades, Bows, Staves, Claws, Daggers, and Mallets.\n\nEach weapon archetype features unique combat abilities—like Scythe Crit execution thresholds, Shield block mitigations, or Staff heal amplifications!",
    buttonText: 'Ignite Forge'
  },
  bestiary: {
    id: 'bestiary',
    tab: 'index',
    featureId: 'BESTIARY_INDEX',
    icon: 'index',
    title: 'Spirit Compendium & Star Ascension',
    speech: 'Your **Spirit Compendium** is active! Discovering new spirits awards **+50 Spirit Shards** per entry!\n\nHit completion milestones to earn rare **Purified Soul Essences**. You can also **Star-Ascend** your spirits early by sacrificing duplicate copies in the Vault!',
    buttonText: 'Open Compendium'
  },
  astral: {
    id: 'astral',
    tab: 'mystical',
    featureId: 'SANCTUARY_ESSENCE',
    icon: 'sanctum',
    title: 'The Astral Realm & Sacred Sanctum',
    speech: 'You have entered the **Astral Plane**!\n\nHarvest Astral Essences & Gods Essences to illuminate the **8 Zodiac Constellations**, transmute shards daily, dispatch squad expeditions, brew EXP elixirs, and acquire divine scriptures from the Dwarven Forge!',
    buttonText: 'Explore Astral Plane'
  },
  rebirth: {
    id: 'rebirth',
    tab: 'party',
    featureId: 'SPIRIT_REBIRTH',
    icon: 'flame',
    title: 'Spirit Rebirth & Evolutionary Ascension',
    speech: 'Peak contractor authority unlocked! Reaching Contractor Level 16 permits **Spirit Rebirth**:\n\nYou can now ascend your high-tier evolved spirits using any **pre-evolutionary copy**, unlocking Star 1 through Star 7 cosmic transcendence!',
    buttonText: 'Transcend Limits'
  }
};

export function showAreaUnlockTutorial(areaKey, onDone) {
  const info = AREA_TUTORIALS[areaKey];
  if (!info) return;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  safePlaySfx('contract_summon', 0.6);

  const formattedSpeech = info.speech
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffd152;">$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/• /g, '• ');

  modalRoot.innerHTML = `
    <div class="guide-backdrop animate-fadeIn select-none">
      <div class="guide-modal-box animate-scaleUp">
        
        <!-- Mascot Avatar with Floating Animation -->
        <div class="guide-mascot-avatar ambient-float">
          ${getGameIcon('cat', { size: 36, className: 'text-amber-200' })}
        </div>

        <div class="guide-header-block">
          <span class="guide-badge-pill">
            Cat Spirit Familiar • System Guide
          </span>
          <h3 class="guide-modal-title">
            ${info.icon ? getGameIcon(info.icon, { size: 20, className: 'inline text-amber-300' }) : ''}
            <span>${info.title}</span>
          </h3>
        </div>

        <!-- Speech Bubble with Generous Spacing -->
        <div class="guide-speech-bubble">
          ${formattedSpeech}
        </div>

        <!-- Action Dismiss Button -->
        <button id="btn-dismiss-area-tut" class="guide-action-btn">
          <span>${info.buttonText || 'Understood'}</span>
          ${getGameIcon('chevronRight', { size: 14, className: 'inline' })}
        </button>

      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-dismiss-area-tut')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
    gameState.markAreaTutorialSeen(areaKey);
    if (onDone) onDone();
  });
}

export function checkAreaTutorialTrigger(tabName, onDone) {
  // Map tabName to area tutorial key and required feature
  const candidates = [
    { areaKey: 'formation', tab: 'party', feat: 'FORMATION_3X3' },
    { areaKey: 'trials', tab: 'trials', feat: 'PANTHEON_TRIALS' },
    { areaKey: 'forge', tab: 'forge', feat: 'DIVINE_FORGE' },
    { areaKey: 'bestiary', tab: 'index', feat: 'BESTIARY_INDEX' },
    { areaKey: 'astral', tab: 'mystical', feat: 'SANCTUARY_ESSENCE' },
    { areaKey: 'rebirth', tab: 'party', feat: 'SPIRIT_REBIRTH' }
  ];

  for (const c of candidates) {
    if (c.tab === tabName && gameState.isFeatureUnlocked(c.feat) && !gameState.isAreaTutorialSeen(c.areaKey)) {
      showAreaUnlockTutorial(c.areaKey, onDone);
      return true;
    }
  }
  return false;
}
