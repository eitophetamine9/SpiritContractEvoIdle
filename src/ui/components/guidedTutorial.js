/**
 * Interactive Guided Onboarding Tutorial (The Contractor's Journey)
 * Features dynamic SVG spotlight clipping, smooth coordinate gliding,
 * Cat Spirit mascot guidance, and instant skip option for veterans.
 */

import { gameState } from '../../state/gameState.js';
import { safePlaySfx } from '../../audio/audioManager.js';

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome, Apprentice Contractor!',
    speech: 'Greetings! I am your celestial familiar, **Cat Spirit**. The celestial veil has shattered, unleashing corrupted shadows upon the realm. Together, we must forge sacred spirit contracts and restore balance!',
    targetSelector: null, // Centered dialog
    actionText: 'Begin Contractor Journey ➔',
    expectedTab: null
  },
  {
    id: 'nav_summon',
    title: 'The Altar of Contracts',
    speech: 'Every legendary journey begins with a sacred contract. Tap the **Summon Altar** below to invoke new celestial allies from the spirit stream!',
    targetSelector: '#nav-contract',
    actionText: 'Next ➔',
    expectedTab: 'contract',
    targetClickAdvances: true
  },
  {
    id: 'first_summon',
    title: 'Forging Your Spirit Ally',
    speech: 'Here at the Altar, spend your Spirit Shards to forge a bond. Tap **x1 Contract** to summon your companion into existence!',
    targetSelector: '#btn-summon-1',
    actionText: 'Next ➔',
    expectedTab: 'contract',
    advanceOnEvent: 'spiritsContracted'
  },
  {
    id: 'nav_party',
    title: 'Hero Squad & Alignment',
    speech: 'A new celestial ally has answered your call! Now tap **Party** below to inspect your active squad and formation.',
    targetSelector: '#nav-party',
    actionText: 'Go to Party ➔',
    expectedTab: 'party',
    targetClickAdvances: true
  },
  {
    id: 'afk_chamber',
    title: 'AFK Training Chamber',
    speech: 'Notice the **AFK Training Chamber**! All spirits deployed to your active party continuously train and gain EXP—even while you are offline!',
    targetSelector: '.afk-training-banner',
    actionText: 'To The Battlefront! ➔',
    expectedTab: 'party'
  },
  {
    id: 'nav_madness',
    title: 'The Tower of Madness',
    speech: 'Now let us test your party in combat! Tap **Madness** below to deploy your spirits into the frontlines against the corrupted swarm.',
    targetSelector: '#nav-madness',
    actionText: 'Enter Combat ➔',
    expectedTab: 'madness',
    targetClickAdvances: true
  },
  {
    id: 'combat_strike',
    title: 'Real-Time Combat & Ultimates',
    speech: 'Your party attacks automatically and casts devastating Ultimates when their MP reaches 100! You can also tap the corrupted beast directly to unleash burst click damage.',
    targetSelector: '#view-container',
    actionText: 'Next: Milestones ➔',
    expectedTab: 'madness'
  },
  {
    id: 'contractor_ascension',
    title: 'Contractor Level & Roadmap',
    speech: 'Clearing floors, summoning allies, and evolving spirits awards **Contractor EXP**. As you ascend, you will unlock the **3x3 Grid (Lv. 3)**, **Bestiary (Lv. 5)**, **Pantheon Trials (Lv. 8)**, and **Divine Forge (Lv. 12)**! May fortune guide your contracts!',
    targetSelector: '#btn-top-profile',
    actionText: 'Claim 150 Shards & Ascend! 🌟',
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
      <!-- Dynamic SVG Spotlight Mask Layer -->
      <svg id="tutorial-svg-mask" class="absolute inset-0 w-full h-full pointer-events-auto" style="overflow: visible;">
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
      <div id="tutorial-card" class="absolute pointer-events-auto flex flex-col gap-3 p-4 rounded-3xl bg-slate-900/95 border border-amber-400/40 text-white shadow-2xl backdrop-blur-md max-w-[340px] sm:max-w-[380px] transition-all duration-300"
           style="box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(245, 158, 11, 0.15); left: 50%; transform: translateX(-50%);">
        
        <!-- Header: Mascot & Controls -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-xl shadow-md shadow-amber-500/30 border border-white/50">
              🐱
            </div>
            <div class="flex flex-col text-left">
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-300">Cat Spirit Guide</span>
              <span class="text-[10px] text-slate-400">Step <span id="tut-step-num">1</span> of ${TUTORIAL_STEPS.length}</span>
            </div>
          </div>

          <button id="btn-skip-tutorial" class="text-[11px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 cursor-pointer transition-colors" title="Skip tutorial and proceed with game">
            Skip ✕
          </button>
        </div>

        <!-- Body Content -->
        <div class="flex flex-col text-left gap-1.5">
          <h3 id="tut-title" class="text-sm font-black text-amber-100 tracking-tight"></h3>
          <p id="tut-speech" class="text-xs text-slate-300 leading-relaxed"></p>
        </div>

        <!-- Action Footer -->
        <div class="flex items-center justify-between pt-1">
          <div class="flex gap-1" id="tut-pills">
            ${TUTORIAL_STEPS.map((_, i) => `<span class="w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-slate-700'}"></span>`).join('')}
          </div>

          <button id="btn-tut-action" class="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/30">
            Next ➔
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

    // Update text
    const titleEl = this.overlayEl.querySelector('#tut-title');
    const speechEl = this.overlayEl.querySelector('#tut-speech');
    const stepNumEl = this.overlayEl.querySelector('#tut-step-num');
    const actionBtn = this.overlayEl.querySelector('#btn-tut-action');

    if (titleEl) titleEl.textContent = step.title;
    if (speechEl) speechEl.innerHTML = step.speech.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>');
    if (stepNumEl) stepNumEl.textContent = (this.currentStepIdx + 1).toString();
    if (actionBtn) actionBtn.textContent = step.actionText || 'Next ➔';

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
      this.nextStep();
    }
  }

  nextStep() {
    if (this.currentStepIdx < TUTORIAL_STEPS.length - 1) {
      this.currentStepIdx += 1;
      gameState.advanceTutorialStep(this.currentStepIdx);
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
