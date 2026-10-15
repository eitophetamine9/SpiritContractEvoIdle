import { authService } from '../../services/authService.js';
import { isSupabaseConfigured } from '../../services/supabaseClient.js';
import { gameState } from '../../state/gameState.js';

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
  const root = document.getElementById('title-screen-root');
  const app = document.getElementById('app');
  if (!root) return;

  isScreenActive = true;
  root.style.display = 'block';
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
  }, 350);
}

function renderTitleScreen() {
  const root = document.getElementById('title-screen-root');
  if (!root) return;

  const isGuest = authService.isGuest();
  const profile = authService.getProfile();
  const configured = isSupabaseConfigured();

  root.innerHTML = `
    <div class="title-screen-wrapper fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950 text-white select-none">
      
      <!-- Ambient Animated Celestial Background -->
      <div class="title-ambient-bg absolute inset-0 overflow-hidden pointer-events-none">
        <div class="celestial-circle circle-1"></div>
        <div class="celestial-circle circle-2"></div>
        <div class="title-stars-layer"></div>
      </div>

      <!-- Main Container Card -->
      <div class="relative w-full max-w-lg bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 z-10 animate-fadeIn"
           style="box-shadow: 0 0 50px rgba(6, 182, 212, 0.25), inset 0 0 20px rgba(15, 23, 42, 0.8);">

        <!-- Header / Logo Area -->
        <div class="flex flex-col items-center text-center gap-2">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-cyan-500/20 animate-pulse border border-cyan-400/30">
            ⛩️
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-cyan-400 drop-shadow">
              Celestial Realm • Idle RPG
            </span>
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              Spirit Contract Evo
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 max-w-xs mt-1 font-medium leading-relaxed">
              Summon divine spirits, conquer infinite madness, and ascend beyond mortality.
            </p>
          </div>

          <!-- Version & Cloud Badge -->
          <div class="flex items-center gap-2 mt-1">
            <span class="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
              v0.4 Celestial Awakening
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${configured ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400' : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'}">
              ${configured ? '☁️ Supabase Cloud Active' : '💾 Local Storage Only'}
            </span>
          </div>
        </div>

        <!-- Alerts -->
        ${homeErrorMessage ? `
          <div class="w-full p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <span class="text-base shrink-0">⚠️</span>
            <span>${homeErrorMessage}</span>
          </div>
        ` : ''}

        ${homeSuccessMessage ? `
          <div class="w-full p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
            <span class="text-base shrink-0">✅</span>
            <span>${homeSuccessMessage}</span>
          </div>
        ` : ''}

        <!-- Interactive Gateway Content -->
        <div class="w-full flex flex-col gap-4">
          ${!isGuest ? `
            <!-- ALREADY LOGGED IN: Quick Play / Continue Card -->
            <div class="flex flex-col gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-2xl shadow">
                    ${profile.avatarEmoji || '🧙‍♂️'}
                  </div>
                  <div class="text-left">
                    <span class="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">Welcome Back</span>
                    <h3 class="text-base font-extrabold text-white">${profile.username}</h3>
                    <div class="text-[11px] text-slate-400 font-mono">${profile.email || 'Cloud Account'}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="px-2 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                    Lv. ${profile.contractorLevel || 1}
                  </span>
                </div>
              </div>

              <!-- Main Enter Game CTA -->
              <button id="btn-home-continue" class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2">
                <span>⚔️ Enter Celestial Realm</span>
              </button>

              <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button id="btn-home-switch-account" class="text-xs text-slate-400 hover:text-white transition cursor-pointer">
                  🔄 Switch Account / Sign Out
                </button>
                <button id="btn-home-play-guest-mode" class="text-xs text-cyan-400 hover:underline cursor-pointer">
                  Play as Local Guest
                </button>
              </div>
            </div>
          ` : `
            <!-- NOT LOGGED IN: Tab Selection (Guest, Sign In, Register) -->
            <div class="flex flex-col gap-4">
              <!-- Navigation Pills -->
              <div class="grid grid-cols-3 p-1 rounded-2xl bg-slate-950 border border-slate-800 gap-1">
                <button id="tab-home-guest" class="py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${activeHomeTab === 'guest' ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow' : 'text-slate-400 hover:text-white'}">
                  <span class="text-base">🎮</span>
                  <span>Play as Guest</span>
                </button>

                <button id="tab-home-signin" class="py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${activeHomeTab === 'signin' ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow' : 'text-slate-400 hover:text-white'}">
                  <span class="text-base">🔑</span>
                  <span>Sign In</span>
                </button>

                <button id="tab-home-signup" class="py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${activeHomeTab === 'signup' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow' : 'text-slate-400 hover:text-white'}">
                  <span class="text-base">✨</span>
                  <span>Register</span>
                </button>
              </div>

              <!-- Content Cards depending on Active Tab -->
              ${activeHomeTab === 'guest' ? `
                <div class="flex flex-col gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left">
                  <div class="flex items-start gap-3">
                    <span class="text-2xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">⚡</span>
                    <div>
                      <h4 class="text-sm font-extrabold text-white">Instant Play (Guest Mode)</h4>
                      <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Start playing immediately without entering any credentials. Your progress, spirits, and weapons will be securely saved locally on this device.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span class="text-slate-400">Contractor Name:</span>
                    <div class="flex items-center gap-2">
                      <strong id="display-guest-name" class="text-white font-bold">${profile.username}</strong>
                      <button id="btn-edit-home-guest-name" class="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer" title="Edit name">
                        ✏️
                      </button>
                    </div>
                  </div>

                  <button id="btn-home-play-guest" class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                    <span>🎮 Enter Game as Guest</span>
                  </button>

                  <div class="text-[11px] text-center text-slate-500">
                    You can link your guest progress to a cloud account at any time!
                  </div>
                </div>
              ` : ''}

              ${activeHomeTab === 'signin' ? `
                <form id="form-home-signin" class="flex flex-col gap-3 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left">
                  <div>
                    <h4 class="text-sm font-extrabold text-white">Sign In to Cloud Account</h4>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Log in to sync your spirits and progress across all your devices.
                    </p>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-slate-300">Email Address</label>
                    <input type="email" id="home-input-email" required placeholder="contractor@celestial.realm"
                           class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-slate-300">Password</label>
                    <input type="password" id="home-input-password" required placeholder="••••••••"
                           class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                  </div>

                  <button type="submit" id="btn-home-submit-signin" ${isSubmitting ? 'disabled' : ''}
                          class="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                    <span>${isSubmitting ? 'Signing In...' : '🔑 Sign In & Enter Realm'}</span>
                  </button>
                </form>
              ` : ''}

              ${activeHomeTab === 'signup' ? `
                <form id="form-home-signup" class="flex flex-col gap-3 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left">
                  <div>
                    <h4 class="text-sm font-extrabold text-white">Create Celestial Account</h4>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Register to protect your spirits, unlock cloud saves, and prepare for multiplayer guild wars.
                    </p>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-slate-300">Contractor Username</label>
                    <input type="text" id="home-input-username" required placeholder="Archon of Stars" value="${profile.username !== 'Apprentice Contractor' ? profile.username : ''}"
                           class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-slate-300">Email Address</label>
                    <input type="email" id="home-input-email-signup" required placeholder="contractor@celestial.realm"
                           class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-slate-300">Password (min 6 characters)</label>
                    <input type="password" id="home-input-password-signup" required minlength="6" placeholder="••••••••"
                           class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                  </div>

                  <button type="submit" id="btn-home-submit-signup" ${isSubmitting ? 'disabled' : ''}
                          class="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                    <span>${isSubmitting ? 'Creating Account...' : '✨ Register & Enter Realm'}</span>
                  </button>
                </form>
              ` : ''}

            </div>
          `}
        </div>

        <!-- Footer Credits -->
        <div class="text-[10px] text-slate-500 text-center tracking-wide">
          Spirit Contract Evo • Cloud Engine Powered by Supabase & PostgreSQL
        </div>
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

  // Switch account
  root.querySelector('#btn-home-switch-account')?.addEventListener('click', async () => {
    await authService.signOut();
    activeHomeTab = 'signin';
    homeSuccessMessage = 'Signed out. Select an option to continue.';
    renderTitleScreen();
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

  // Play as Guest CTA
  root.querySelector('#btn-home-play-guest')?.addEventListener('click', () => {
    hideTitleScreen();
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
      setTimeout(hideTitleScreen, 800);
    } catch (err) {
      isSubmitting = false;
      homeErrorMessage = err.message || 'Failed to sign in. Please check your credentials.';
      renderTitleScreen();
    }
  });

  // Sign Up Form
  root.querySelector('#form-home-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = root.querySelector('#home-input-username')?.value;
    const email = root.querySelector('#home-input-email-signup')?.value;
    const password = root.querySelector('#home-input-password-signup')?.value;

    isSubmitting = true;
    homeErrorMessage = '';
    renderTitleScreen();

    try {
      await authService.linkGuestAccount({
        email,
        password,
        username,
        currentGameState: gameState.state
      });
      homeSuccessMessage = 'Account created & linked! Entering realm...';
      isSubmitting = false;
      renderTitleScreen();
      setTimeout(hideTitleScreen, 900);
    } catch (err) {
      isSubmitting = false;
      homeErrorMessage = err.message || 'Failed to create account.';
      renderTitleScreen();
    }
  });
}
