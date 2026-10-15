import { authService } from '../../services/authService.js';
import { isSupabaseConfigured } from '../../services/supabaseClient.js';
import { gameState } from '../../state/gameState.js';
import { cloudSaveService } from '../../services/cloudSaveService.js';

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
    <div class="title-screen-inner">
      
      <!-- Top Status Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; z-index:10; padding:4px 0;">
        <div style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:800; color:#d4e478;">
          <span>⛩️</span>
          <span>Celestial Realm</span>
        </div>
        <div class="title-status-badges">
          <span class="title-badge title-badge-version">v0.4.0</span>
          <span class="title-badge title-badge-cloud">${configured ? '☁️ Cloud Active' : '💾 Local Only'}</span>
        </div>
      </div>

      <!-- Grand Title / Crest Area -->
      <div class="title-header-group">
        <div class="title-crest-emblem">⛩️</div>
        <span class="title-crest-tag">CELESTIAL IDLE RPG</span>
        <h1 class="title-crest-main">SPIRIT CONTRACT</h1>
        <h2 class="title-crest-sub">EVOLUTION IDLE</h2>
        <p class="title-crest-lore">
          Summon divine spirits, conquer infinite madness realms, and ascend beyond mortality.
        </p>
      </div>

      <!-- Alerts -->
      ${homeErrorMessage ? `
        <div style="background:rgba(127,29,29,0.8); border:1px solid rgba(239,68,68,0.6); padding:10px 14px; border-radius:12px; color:#fecaca; font-size:11.5px; font-weight:700; display:flex; align-items:center; gap:8px; z-index:10;" class="animate-shake">
          <span>⚠️</span>
          <span>${homeErrorMessage}</span>
        </div>
      ` : ''}

      ${homeSuccessMessage ? `
        <div style="background:rgba(6,78,59,0.8); border:1px solid rgba(16,185,129,0.6); padding:10px 14px; border-radius:12px; color:#a7f3d0; font-size:11.5px; font-weight:700; display:flex; align-items:center; gap:8px; z-index:10;">
          <span>✅</span>
          <span>${homeSuccessMessage}</span>
        </div>
      ` : ''}

      <!-- Center Interaction Area -->
      <div style="display:flex; flex-direction:column; gap:8px; z-index:10;">
        ${!isGuest ? `
          <!-- ALREADY LOGGED IN: Continue Card -->
          <div class="title-panel-card">
            <div class="title-identity-plate">
              <div class="title-avatar-badge">
                <div class="title-avatar-icon">${profile.avatarEmoji || '🧙‍♂️'}</div>
                <div class="title-avatar-info">
                  <span class="title-avatar-label">Welcome Back</span>
                  <span class="title-avatar-name">${profile.username}</span>
                  <span style="font-size:10px; color:#94a3b8; font-family:monospace;">${profile.email || 'Cloud Account'}</span>
                </div>
              </div>
              <span class="title-badge title-badge-version">Lv. ${profile.contractorLevel || 1}</span>
            </div>

            <button id="btn-home-continue" class="btn-celestial-start">
              <span>⚔️ CONTINUE JOURNEY</span>
            </button>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; margin-top:2px;">
              <button id="btn-home-switch-account" style="background:none; border:none; color:#94a3b8; font-size:11px; cursor:pointer; padding:0;">
                🔄 Switch / Sign Out
              </button>
              <button id="btn-home-reset-cloud-account" style="background:none; border:none; color:#f87171; font-size:11px; cursor:pointer; padding:0;" title="Reset this cloud account to Day-1">
                🌱 Reset to Day-1
              </button>
              <button id="btn-home-play-guest-mode" style="background:none; border:none; color:#00d0ff; font-size:11px; cursor:pointer; padding:0;">
                Play as Local Guest
              </button>
            </div>
          </div>
        ` : `
          <!-- GUEST / UNREGISTERED: AAA Segmented Tabs -->
          <div class="title-tabs-container">
            <button id="tab-home-guest" class="title-tab-btn ${activeHomeTab === 'guest' ? 'active' : ''}">
              <span class="title-tab-icon">🎮</span>
              <span>Play as Guest</span>
            </button>
            <button id="tab-home-signin" class="title-tab-btn ${activeHomeTab === 'signin' ? 'active' : ''}">
              <span class="title-tab-icon">🔑</span>
              <span>Sign In</span>
            </button>
            <button id="tab-home-signup" class="title-tab-btn ${activeHomeTab === 'signup' ? 'active' : ''}">
              <span class="title-tab-icon">✨</span>
              <span>Register</span>
            </button>
          </div>

          <!-- Tab Content Cards -->
          ${activeHomeTab === 'guest' ? `
            <div class="title-panel-card">
              <div class="title-identity-plate">
                <div class="title-avatar-badge">
                  <div class="title-avatar-icon">🧙‍♂️</div>
                  <div class="title-avatar-info">
                    <span class="title-avatar-label">Contractor Name</span>
                    <span class="title-avatar-name" id="display-guest-name">${profile.username}</span>
                  </div>
                </div>
                <button id="btn-edit-home-guest-name" class="header-profile-btn" style="min-height:30px; padding:2px 10px; font-size:11px;" title="Rename Contractor">
                  ✏️ Edit
                </button>
              </div>

              ${hasExistingProgress ? `
                <button id="btn-home-play-guest" class="btn-celestial-start">
                  <span>⚔️ RESUME GAME (Floor ${currentFloor})</span>
                </button>
                <button id="btn-home-fresh-guest" class="btn-celestial-cyan" style="background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.4); color:#fca5a5; min-height:40px;">
                  <span>🌱 START FRESH GUEST GAME (Reset Save)</span>
                </button>
              ` : `
                <button id="btn-home-play-guest" class="btn-celestial-start">
                  <span>⚔️ ENTER CELESTIAL REALM</span>
                </button>
              `}

              <div style="font-size:11px; text-align:center; color:#8fa596; margin-top:2px;">
                💾 Instant local play • Link to cloud anytime without losing data
              </div>
            </div>
          ` : ''}

          ${activeHomeTab === 'signin' ? `
            <form id="form-home-signin" class="title-panel-card">
              <div class="title-input-field">
                <label class="title-input-label">Email Address</label>
                <input type="email" id="home-input-email" required placeholder="contractor@celestial.realm" />
              </div>

              <div class="title-input-field">
                <label class="title-input-label">Password</label>
                <input type="password" id="home-input-password" required placeholder="••••••••" />
              </div>

              <button type="submit" id="btn-home-submit-signin" class="btn-celestial-cyan" ${isSubmitting ? 'disabled' : ''}>
                <span>${isSubmitting ? 'Signing In...' : '🔑 Sign In & Enter Realm'}</span>
              </button>
            </form>
          ` : ''}

          ${activeHomeTab === 'signup' ? `
            <form id="form-home-signup" class="title-panel-card">
              <div style="font-size:11px; color:#86efac; background:rgba(22,101,52,0.3); border:1px solid rgba(34,197,94,0.3); padding:8px 10px; border-radius:8px; display:flex; align-items:center; gap:6px;">
                <span>✨</span>
                <span>Creates a 100% fresh cloud account with Starter Spirit & Guided Onboarding.</span>
              </div>

              <div class="title-input-field">
                <label class="title-input-label">Contractor Username</label>
                <input type="text" id="home-input-username" required placeholder="Archon of Stars" value="${profile.username !== 'Apprentice Contractor' ? profile.username : ''}" />
              </div>

              <div class="title-input-field">
                <label class="title-input-label">Email Address</label>
                <input type="email" id="home-input-email-signup" required placeholder="contractor@celestial.realm" />
              </div>

              <div class="title-input-field">
                <label class="title-input-label">Password (min 6 characters)</label>
                <input type="password" id="home-input-password-signup" required minlength="6" placeholder="••••••••" />
              </div>

              ${hasExistingProgress ? `
                <label style="display:flex; align-items:center; gap:8px; font-size:11px; color:#cbd5e1; cursor:pointer; margin-top:2px;">
                  <input type="checkbox" id="home-check-link-save" style="accent-color:#00e5ff; width:15px; height:15px;" />
                  <span>Transfer existing device progress (Floor ${currentFloor}) to new account</span>
                </label>
              ` : ''}

              <button type="submit" id="btn-home-submit-signup" class="btn-celestial-emerald" ${isSubmitting ? 'disabled' : ''}>
                <span>${isSubmitting ? 'Awakening Account...' : '✨ Register & Enter Realm'}</span>
              </button>
            </form>
          ` : ''}
        `}
      </div>

      <!-- Footer -->
      <div class="title-footer">
        ⛩️ Spirit Contract Evo • Celestial Realm Engine
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
