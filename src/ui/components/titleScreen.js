import { authService } from '../../services/authService.js';
import { isSupabaseConfigured } from '../../services/supabaseClient.js';
import { gameState } from '../../state/gameState.js';
import { cloudSaveService } from '../../services/cloudSaveService.js';
import { getGameIcon } from '../icons/gameIcons.js';

let activeHomeTab = 'guest'; // 'guest' | 'signin' | 'signup'
let homeErrorMessage = '';
let homeSuccessMessage = '';
let isSubmitting = false;
let onEnterGameCallback = null;
let isScreenActive = false;

/**
 * Initializes the Title / Home Screen.
 * @param {Object} options
 * @param {Function} options.onEnterGame - Callback when player enters the game.
 */
export function initTitleScreen({ onEnterGame }) {
  onEnterGameCallback = onEnterGame;
  let root = document.getElementById('title-screen-root');
  if (!root && typeof document.createElement === 'function') {
    root = document.createElement('div');
    root.id = 'title-screen-root';
    if (document.body && typeof document.body.prepend === 'function') {
      document.body.prepend(root);
    }
  }

  // Subscribe to auth state changes to update Title Screen if open
  authService.subscribe((event, data) => {
    if (isScreenActive) {
      renderTitleScreen();
    }
  });

  showTitleScreen();
}

export function isTitleScreenActive() {
  return isScreenActive;
}

export function showTitleScreen() {
  gameState.exitToTitleSession();
  const root = document.getElementById('title-screen-root');
  const app = document.getElementById('app');
  if (!root) return;

  isScreenActive = true;
  root.style.display = 'flex';
  if (app) {
    app.style.display = 'none';
  }

  homeErrorMessage = '';
  homeSuccessMessage = '';
  isSubmitting = false;

  renderTitleScreen();
}

export function hideTitleScreen() {
  const root = document.getElementById('title-screen-root');
  const app = document.getElementById('app');
  if (!root) return;

  root.classList.add('fade-out');
  setTimeout(() => {
    root.style.display = 'none';
    root.classList.remove('fade-out');
    if (app) {
      app.style.display = 'flex';
    }
    isScreenActive = false;

    if (onEnterGameCallback) {
      onEnterGameCallback();
    }
  }, 250);
}

function renderTitleScreen() {
  const root = document.getElementById('title-screen-root');
  if (!root) return;

  const isGuest = authService.isGuest();
  const profile = authService.getProfile();
  const configured = isSupabaseConfigured();

  const hasExistingProgress = (gameState.state?.madnessZone?.highestStageCleared || 0) > 0 ||
                              (gameState.state?.spirits?.length || 0) > 1 ||
                              (gameState.state?.contractor?.level || 1) > 1 ||
                              (gameState.state?.madnessZone?.stage || 1) > 1;
  const currentFloor = gameState.state?.madnessZone?.stage || 1;

  root.innerHTML = `
    <!-- Ambient Backdrop Effects -->
    <div class="title-arcane-backdrop">
      <div class="title-stars-layer"></div>
      <div class="title-rune-circle"></div>
      <div class="title-rune-circle-inner"></div>
    </div>

    <!-- Inner Screen Content Column matching #app 480px width -->
    <div class="title-screen-inner flex flex-col justify-between min-h-screen p-4 sm:p-5 relative z-10 w-full max-w-[480px] mx-auto">
      
      <!-- Top Status Bar -->
      <div class="flex justify-between items-center z-10 py-1 px-1">
        <div class="flex items-center gap-2 text-xs font-black tracking-wide text-amber-300">
          <span class="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">${getGameIcon('sanctum', { size: '16px' })}</span>
          <span class="tracking-widest uppercase">Celestial Realm</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 border border-amber-500/30 text-amber-300 shadow-sm">v0.4.0</span>
          <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${configured ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-900/80 border border-slate-700/60 text-slate-400'}">
            ${getGameIcon('cloud', { size: '12px' })}
            <span>${configured ? 'Cloud Active' : 'Local Only'}</span>
          </span>
        </div>
      </div>

      <!-- Grand Title / Crest Area -->
      <div class="flex flex-col items-center text-center mt-2 relative z-10">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-slate-950/90 border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center text-amber-300 mb-2.5 animate-pulse">
          ${getGameIcon('sanctum', { size: '32px' })}
        </div>
        <span class="text-[10px] font-extrabold tracking-[3px] uppercase text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] mb-1">CELESTIAL IDLE RPG</span>
        <h1 class="font-serif text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight">SPIRIT CONTRACT</h1>
        <h2 class="font-serif text-xs sm:text-sm font-bold tracking-[4px] uppercase text-amber-200/90 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] mt-0.5">EVOLUTION IDLE</h2>
        <p class="text-[11px] text-slate-400 max-w-[320px] text-center mt-2 leading-relaxed">
          Summon divine spirits, conquer infinite madness realms, and ascend beyond mortality.
        </p>
      </div>

      <!-- Alerts -->
      ${homeErrorMessage ? `
        <div class="bg-rose-950/80 border border-rose-500/60 p-3 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-950/50 z-10 animate-shake">
          <span class="text-rose-400">${getGameIcon('alert', { size: '15px' })}</span>
          <span>${homeErrorMessage}</span>
        </div>
      ` : ''}

      ${homeSuccessMessage ? `
        <div class="bg-emerald-950/80 border border-emerald-500/60 p-3 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-emerald-950/50 z-10">
          <span class="text-emerald-400">${getGameIcon('check', { size: '15px' })}</span>
          <span>${homeSuccessMessage}</span>
        </div>
      ` : ''}

      <!-- Center Interaction Area -->
      <div class="flex flex-col gap-3 z-10 my-2">
        ${!isGuest ? `
          <!-- ALREADY LOGGED IN: Continue Card -->
          <div class="title-panel-card bg-slate-900/85 border border-slate-700/70 hover:border-amber-500/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 transition-all">
            <div class="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  ${getGameIcon('user', { size: '20px' })}
                </div>
                <div class="flex flex-col text-left">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Welcome Back</span>
                  <span class="text-sm font-extrabold text-slate-100">${profile.username}</span>
                  <span class="text-[10px] text-slate-400 font-mono">${profile.email || 'Cloud Account'}</span>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-950/40 border border-amber-500/40 text-amber-300">Lv. ${profile.contractorLevel || 1}</span>
            </div>

            <button id="btn-home-continue" class="btn-celestial-start w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all active:scale-[0.98] cursor-pointer">
              ${getGameIcon('sword', { size: '16px' })}
              <span>CONTINUE JOURNEY</span>
            </button>

            <div class="flex justify-between items-center border-t border-slate-800/80 pt-2.5 mt-1 text-[11px]">
              <button id="btn-home-switch-account" class="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0">
                ${getGameIcon('refresh', { size: '12px' })}
                <span>Switch / Sign Out</span>
              </button>
              <button id="btn-home-reset-cloud-account" class="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer bg-transparent border-none p-0" title="Reset this cloud account to Day-1">
                Reset to Day-1
              </button>
              <button id="btn-home-play-guest-mode" class="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-transparent border-none p-0">
                Play as Local Guest
              </button>
            </div>
          </div>
        ` : `
          <!-- GUEST / UNREGISTERED: AAA Segmented Tabs -->
          <div class="title-tabs-container grid grid-cols-3 gap-1.5 bg-slate-950/85 border border-slate-800/90 p-1.5 rounded-xl shadow-inner">
            <button id="tab-home-guest" class="title-tab-btn flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[46px] rounded-lg transition-all cursor-pointer ${activeHomeTab === 'guest' ? 'active bg-gradient-to-b from-amber-500/25 to-amber-600/10 border border-amber-400/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}">
              <span class="title-tab-icon">${getGameIcon('gamepad', { size: '16px' })}</span>
              <span class="text-[11px] font-bold">Play as Guest</span>
            </button>
            <button id="tab-home-signin" class="title-tab-btn flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[46px] rounded-lg transition-all cursor-pointer ${activeHomeTab === 'signin' ? 'active bg-gradient-to-b from-cyan-500/25 to-cyan-600/10 border border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]' : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}">
              <span class="title-tab-icon">${getGameIcon('key', { size: '16px' })}</span>
              <span class="text-[11px] font-bold">Sign In</span>
            </button>
            <button id="tab-home-signup" class="title-tab-btn flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[46px] rounded-lg transition-all cursor-pointer ${activeHomeTab === 'signup' ? 'active bg-gradient-to-b from-emerald-500/25 to-emerald-600/10 border border-emerald-400/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]' : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}">
              <span class="title-tab-icon">${getGameIcon('sparkle', { size: '16px' })}</span>
              <span class="text-[11px] font-bold">Register</span>
            </button>
          </div>

          <!-- Tab Content Cards -->
          ${activeHomeTab === 'guest' ? `
            <div class="title-panel-card bg-slate-900/85 border border-slate-700/70 hover:border-amber-500/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 transition-all">
              <div class="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    ${getGameIcon('user', { size: '20px' })}
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Contractor Name</span>
                    <span class="text-sm font-extrabold text-slate-100" id="display-guest-name">${profile.username}</span>
                  </div>
                </div>
                <button id="btn-edit-home-guest-name" class="header-profile-btn flex items-center gap-1.5 text-[11px] font-semibold py-1 px-3 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-amber-400/50 text-slate-200 cursor-pointer transition-all" title="Rename Contractor">
                  ${getGameIcon('edit', { size: '12px' })}
                  <span>Edit</span>
                </button>
              </div>

              ${hasExistingProgress ? `
                <button id="btn-home-play-guest" class="btn-celestial-start w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all active:scale-[0.98] cursor-pointer">
                  ${getGameIcon('sword', { size: '16px' })}
                  <span>RESUME GAME (Floor ${currentFloor})</span>
                </button>
                <button id="btn-home-fresh-guest" class="btn-celestial-cyan w-full py-2.5 px-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 text-rose-300 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/50 hover:border-rose-400/60">
                  ${getGameIcon('refresh', { size: '13px' })}
                  <span>START FRESH GUEST GAME (Reset Save)</span>
                </button>
              ` : `
                <button id="btn-home-play-guest" class="btn-celestial-start w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all active:scale-[0.98] cursor-pointer">
                  ${getGameIcon('sword', { size: '16px' })}
                  <span>ENTER CELESTIAL REALM</span>
                </button>
              `}

              <div class="text-[11px] text-center text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                ${getGameIcon('save', { size: '12px' })} <span>Instant local play • Link to cloud anytime without losing data</span>
              </div>
            </div>
          ` : ''}

          ${activeHomeTab === 'signin' ? `
            <form id="form-home-signin" class="title-panel-card bg-slate-900/85 border border-slate-700/70 hover:border-cyan-500/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 transition-all">
              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-[11px] font-bold text-slate-300">Email Address</label>
                <input type="email" id="home-input-email" required placeholder="contractor@celestial.realm" class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition-all" />
              </div>

              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-[11px] font-bold text-slate-300">Password</label>
                <input type="password" id="home-input-password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition-all" />
              </div>

              <button type="submit" id="btn-home-submit-signin" class="btn-celestial-cyan w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_18px_rgba(6,182,212,0.35)] active:scale-[0.98] disabled:opacity-50" ${isSubmitting ? 'disabled' : ''}>
                ${getGameIcon('key', { size: '14px' })}
                <span>${isSubmitting ? 'Signing In...' : 'Sign In & Enter Realm'}</span>
              </button>
            </form>
          ` : ''}

          ${activeHomeTab === 'signup' ? `
            <form id="form-home-signup" class="title-panel-card bg-slate-900/85 border border-slate-700/70 hover:border-emerald-500/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 transition-all">
              <div class="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2">
                <span class="text-emerald-400 shrink-0">${getGameIcon('sparkle', { size: '14px' })}</span>
                <span>Creates a 100% fresh cloud account with Starter Spirit & Guided Onboarding.</span>
              </div>

              <div class="flex flex-col gap-1 text-left">
                <label class="text-[11px] font-bold text-slate-300">Contractor Username</label>
                <input type="text" id="home-input-username" required placeholder="Archon of Stars" value="${profile.username !== 'Apprentice Contractor' ? profile.username : ''}" class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition-all" />
              </div>

              <div class="flex flex-col gap-1 text-left">
                <label class="text-[11px] font-bold text-slate-300">Email Address</label>
                <input type="email" id="home-input-email-signup" required placeholder="contractor@celestial.realm" class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition-all" />
              </div>

              <div class="flex flex-col gap-1 text-left">
                <label class="text-[11px] font-bold text-slate-300">Password (min 6 characters)</label>
                <input type="password" id="home-input-password-signup" required minlength="6" placeholder="••••••••" class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition-all" />
              </div>

              ${hasExistingProgress ? `
                <label class="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer mt-1">
                  <input type="checkbox" id="home-check-link-save" class="accent-cyan-400 w-4 h-4 rounded" />
                  <span>Transfer existing device progress (Floor ${currentFloor}) to new account</span>
                </label>
              ` : ''}

              <button type="submit" id="btn-home-submit-signup" class="btn-celestial-emerald w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-[0_0_18px_rgba(16,185,129,0.35)] active:scale-[0.98] disabled:opacity-50" ${isSubmitting ? 'disabled' : ''}>
                ${getGameIcon('sparkle', { size: '14px' })}
                <span>${isSubmitting ? 'Awakening Account...' : 'Register & Enter Realm'}</span>
              </button>
            </form>
          ` : ''}
        `}
      </div>

      <!-- Footer -->
      <div class="title-footer text-[11px] text-slate-500 text-center py-2 flex items-center justify-center gap-1.5">
        <span class="text-amber-400/60">${getGameIcon('sanctum', { size: '12px' })}</span>
        <span>Spirit Contract Evo • Celestial Realm Engine</span>
      </div>

    </div>
  `;

  bindTitleScreenEvents(root);
}

function bindTitleScreenEvents(root) {
  // Continue when logged in
  root.querySelector('#btn-home-continue')?.addEventListener('click', () => {
    hideTitleScreen();
  });

  // Switch account / Log out
  root.querySelector('#btn-home-switch-account')?.addEventListener('click', async () => {
    await authService.signOut();
    activeHomeTab = 'signin';
    homeSuccessMessage = 'Signed out. Device reset to fresh state.';
    renderTitleScreen();
  });

  // Reset Cloud Account to Day-1
  root.querySelector('#btn-home-reset-cloud-account')?.addEventListener('click', async () => {
    if (confirm('CRITICAL: Reset this cloud account to Day-1 starter state? All spirits, progress, and shards will be wiped and the guided tutorial will restart.')) {
      if (confirm('Final confirmation: Proceed with account wipe?')) {
        gameState.resetAllProgress();
        await cloudSaveService.uploadSave(true);
        homeSuccessMessage = 'Cloud account reset to Day-1 starter state! Enter realm to begin tutorial.';
        renderTitleScreen();
      }
    }
  });

  // Play as local guest while logged in
  root.querySelector('#btn-home-play-guest-mode')?.addEventListener('click', () => {
    hideTitleScreen();
  });

  // Tab switching
  root.querySelector('#tab-home-guest')?.addEventListener('click', () => {
    activeHomeTab = 'guest';
    homeErrorMessage = '';
    homeSuccessMessage = '';
    renderTitleScreen();
  });

  root.querySelector('#tab-home-signin')?.addEventListener('click', () => {
    activeHomeTab = 'signin';
    homeErrorMessage = '';
    homeSuccessMessage = '';
    renderTitleScreen();
  });

  root.querySelector('#tab-home-signup')?.addEventListener('click', () => {
    activeHomeTab = 'signup';
    homeErrorMessage = '';
    homeSuccessMessage = '';
    renderTitleScreen();
  });

  // Play as Guest CTA (Resume existing)
  root.querySelector('#btn-home-play-guest')?.addEventListener('click', () => {
    hideTitleScreen();
  });

  // Start Fresh Guest Game (Reset local save)
  root.querySelector('#btn-home-fresh-guest')?.addEventListener('click', () => {
    if (confirm('Start a brand new game? All current local progress will be wiped back to Level 1 Cat Spirit with guided tutorial active.')) {
      gameState.resetAllProgress();
      hideTitleScreen();
    }
  });

  // Edit guest name
  root.querySelector('#btn-edit-home-guest-name')?.addEventListener('click', () => {
    const cur = authService.getProfile().username;
    const newName = prompt('Enter Contractor Name:', cur);
    if (newName && newName.trim()) {
      authService.setGuestUsername(newName.trim());
      renderTitleScreen();
    }
  });

  // Sign In Form
  root.querySelector('#form-home-signin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = root.querySelector('#home-input-email')?.value;
    const password = root.querySelector('#home-input-password')?.value;

    isSubmitting = true;
    homeErrorMessage = '';
    renderTitleScreen();

    try {
      await authService.signIn({ email, password });
      homeSuccessMessage = 'Welcome back! Entering realm...';
      isSubmitting = false;
      renderTitleScreen();
      setTimeout(hideTitleScreen, 600);
    } catch (err) {
      isSubmitting = false;
      homeErrorMessage = err.message || 'Failed to sign in. Please check your credentials.';
      renderTitleScreen();
    }
  });

  // Sign Up Form (defaults to 100% fresh account!)
  root.querySelector('#form-home-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = root.querySelector('#home-input-username')?.value;
    const email = root.querySelector('#home-input-email-signup')?.value;
    const password = root.querySelector('#home-input-password-signup')?.value;
    const shouldLink = root.querySelector('#home-check-link-save')?.checked;

    isSubmitting = true;
    homeErrorMessage = '';
    renderTitleScreen();

    try {
      if (shouldLink) {
        await authService.linkGuestAccount({
          email,
          password,
          username,
          localSaveData: gameState.state
        });
        homeSuccessMessage = 'Account created & linked! Entering realm...';
      } else {
        // Reset local game state to clean Day-1 starter state FIRST
        gameState.resetAllProgress();
        // Register new Supabase account
        await authService.signUp({ email, password, username });
        // Upload the clean Day-1 starter state to Supabase
        await cloudSaveService.uploadSave(true);
        homeSuccessMessage = 'Fresh account created! Entering realm...';
      }
      isSubmitting = false;
      renderTitleScreen();
      setTimeout(hideTitleScreen, 700);
    } catch (err) {
      isSubmitting = false;
      homeErrorMessage = err.message || 'Failed to create account.';
      renderTitleScreen();
    }
  });
}
