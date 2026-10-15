import { authService } from '../../services/authService.js';
import { isSupabaseConfigured } from '../../services/supabaseClient.js';
import { gameState } from '../../state/gameState.js';
import { closeActiveModal } from './modals.js';
import { showTitleScreen } from './titleScreen.js';
import { cloudSaveService } from '../../services/cloudSaveService.js';

let activeAuthTab = 'signin'; // 'signin' | 'signup'
let authErrorMessage = '';
let authSuccessMessage = '';
let isSubmitting = false;

export function showAuthModal(onClose = null) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  authErrorMessage = '';
  authSuccessMessage = '';
  isSubmitting = false;

  renderAuthModalContent(modalRoot, onClose);
}

function renderAuthModalContent(modalRoot, onClose) {
  const isGuest = authService.isGuest();
  const profile = authService.getProfile();
  const configured = isSupabaseConfigured();

  modalRoot.innerHTML = `
    <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div class="auth-modal-card relative w-full max-w-md bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl text-white flex flex-col gap-4 overflow-hidden" style="box-shadow: 0 0 35px rgba(6, 182, 212, 0.2);">
        
        <!-- Header Strip -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xl shadow-md">
              ${profile.avatarEmoji || '🧙‍♂️'}
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Contractor Account</span>
              </h3>
              <span class="text-[11px] font-semibold ${isGuest ? 'text-amber-400' : 'text-emerald-400'} flex items-center gap-1">
                ${isGuest ? '💾 Guest Mode (Local Browser Save)' : '☁️ Cloud Account (Sync Active)'}
              </span>
            </div>
          </div>

          <button id="btn-close-auth-modal" class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Supabase Unconfigured Warning Badge (if .env not set) -->
        ${!configured ? `
          <div class="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
            <span class="text-base shrink-0">ℹ️</span>
            <div>
              <strong class="font-bold">Offline / Local Mode Active:</strong>
              <div class="text-[10px] text-amber-300/80 mt-0.5">
                To connect Supabase cloud sync, add your project credentials to <code class="bg-slate-950 px-1 py-0.5 rounded text-amber-100">.env</code>. You can continue playing locally with no data loss!
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Alerts -->
        ${authErrorMessage ? `
          <div class="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>${authErrorMessage}</span>
          </div>
        ` : ''}

        ${authSuccessMessage ? `
          <div class="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <span>✅</span>
            <span>${authSuccessMessage}</span>
          </div>
        ` : ''}

        ${!isGuest ? `
          <!-- Logged In Profile Card -->
          <div class="flex flex-col gap-3">
            <div class="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Username:</span>
                <strong class="text-xs text-cyan-300 font-bold">${profile.username}</strong>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Email:</span>
                <span class="text-xs text-slate-200 font-mono">${profile.email || '—'}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Contractor Level:</span>
                <span class="text-xs text-amber-300 font-bold">Lv. ${profile.contractorLevel || 1}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">Save Backup:</span>
                <span class="text-[11px] text-emerald-400 font-bold">☁️ Auto-Sync Protected</span>
              </div>
            </div>

            <button id="btn-auth-manual-sync" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition-all cursor-pointer shadow flex items-center justify-center gap-1.5">
              <span>☁️ Backup & Sync to Cloud Now</span>
            </button>

            <button id="btn-auth-goto-title" class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-extrabold text-xs transition-all cursor-pointer shadow flex items-center justify-center gap-1.5">
              <span>🏠 Return to Title / Home Screen</span>
            </button>

            <button id="btn-auth-signout" class="w-full py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-extrabold text-xs transition-all cursor-pointer shadow">
              Sign Out (Return to Guest Mode)
            </button>
          </div>
        ` : `
          <!-- Guest Mode: Tabs for Sign In vs Register & Link -->
          <div class="flex flex-col gap-3">
            
            <!-- Tab Buttons -->
            <div class="flex p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1">
              <button id="tab-btn-signin" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeAuthTab === 'signin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'text-slate-400 hover:text-white'}">
                🔑 Sign In
              </button>
              <button id="tab-btn-signup" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeAuthTab === 'signup' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'text-slate-400 hover:text-white'}">
                ✨ Create Account
              </button>
            </div>

            <!-- Current Guest Notice -->
            <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              Playing as: <strong class="text-white">${profile.username}</strong>. Create an account to back up your current progress to the cloud!
            </div>

            <!-- Forms -->
            ${activeAuthTab === 'signin' ? `
              <form id="form-auth-signin" class="flex flex-col gap-2.5">
                <div class="flex flex-col gap-1 text-left">
                  <label class="text-[11px] font-bold text-slate-300">Email Address</label>
                  <input type="email" id="auth-input-email" required placeholder="contractor@celestial.realm" 
                         class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                </div>

                <div class="flex flex-col gap-1 text-left">
                  <label class="text-[11px] font-bold text-slate-300">Password</label>
                  <input type="password" id="auth-input-password" required placeholder="••••••••" 
                         class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                </div>

                <button type="submit" id="btn-submit-signin" ${isSubmitting ? 'disabled' : ''}
                        class="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                  ${isSubmitting ? 'Signing In...' : 'Sign In to Cloud Account'}
                </button>
              </form>
            ` : `
              <form id="form-auth-signup" class="flex flex-col gap-2.5">
                <div class="flex flex-col gap-1 text-left">
                  <label class="text-[11px] font-bold text-slate-300">Contractor Username</label>
                  <input type="text" id="auth-input-username" required placeholder="Archon of Stars" value="${profile.username !== 'Apprentice Contractor' ? profile.username : ''}"
                         class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                </div>

                <div class="flex flex-col gap-1 text-left">
                  <label class="text-[11px] font-bold text-slate-300">Email Address</label>
                  <input type="email" id="auth-input-email" required placeholder="contractor@celestial.realm" 
                         class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                </div>

                <div class="flex flex-col gap-1 text-left">
                  <label class="text-[11px] font-bold text-slate-300">Password (min 6 chars)</label>
                  <input type="password" id="auth-input-password" required minlength="6" placeholder="••••••••" 
                         class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-all" />
                </div>

                <button type="submit" id="btn-submit-signup" ${isSubmitting ? 'disabled' : ''}
                        class="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  ${isSubmitting ? 'Creating & Linking Save...' : 'Register & Link Current Save ☁️'}
                </button>
              </form>
            `}

            <!-- Change Guest Username Quick Action -->
            <div class="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Playing locally?</span>
              <button id="btn-edit-guest-name" class="text-cyan-400 hover:underline cursor-pointer">
                Rename Guest Contractor
              </button>
            </div>

            <button id="btn-auth-goto-title" class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-extrabold text-xs transition-all cursor-pointer shadow flex items-center justify-center gap-1.5">
              <span>🏠 Return to Title / Home Screen</span>
            </button>

          </div>
        `}

      </div>
    </div>
  `;

  bindAuthModalEvents(modalRoot, onClose);
}

function bindAuthModalEvents(modalRoot, onClose) {
  // Close modal
  const handleClose = () => {
    closeActiveModal();
    if (onClose) onClose();
  };

  modalRoot.querySelector('#btn-close-auth-modal')?.addEventListener('click', handleClose);

  // Tab switching
  modalRoot.querySelector('#tab-btn-signin')?.addEventListener('click', () => {
    activeAuthTab = 'signin';
    authErrorMessage = '';
    authSuccessMessage = '';
    renderAuthModalContent(modalRoot, onClose);
  });

  modalRoot.querySelector('#tab-btn-signup')?.addEventListener('click', () => {
    activeAuthTab = 'signup';
    authErrorMessage = '';
    authSuccessMessage = '';
    renderAuthModalContent(modalRoot, onClose);
  });

  // Sign In submit
  modalRoot.querySelector('#form-auth-signin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = modalRoot.querySelector('#auth-input-email')?.value;
    const password = modalRoot.querySelector('#auth-input-password')?.value;

    isSubmitting = true;
    authErrorMessage = '';
    renderAuthModalContent(modalRoot, onClose);

    try {
      await authService.signIn({ email, password });
      authSuccessMessage = 'Signed in successfully! Cloud sync active.';
      isSubmitting = false;
      renderAuthModalContent(modalRoot, onClose);
      setTimeout(handleClose, 1200);
    } catch (err) {
      isSubmitting = false;
      authErrorMessage = err.message || 'Failed to sign in.';
      renderAuthModalContent(modalRoot, onClose);
    }
  });

  // Sign Up & Link submit
  modalRoot.querySelector('#form-auth-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = modalRoot.querySelector('#auth-input-username')?.value;
    const email = modalRoot.querySelector('#auth-input-email')?.value;
    const password = modalRoot.querySelector('#auth-input-password')?.value;

    isSubmitting = true;
    authErrorMessage = '';
    renderAuthModalContent(modalRoot, onClose);

    try {
      await authService.linkGuestAccount({
        email,
        password,
        username,
        localSaveData: gameState.state
      });
      authSuccessMessage = 'Account created & local save successfully backed up to cloud!';
      isSubmitting = false;
      renderAuthModalContent(modalRoot, onClose);
      setTimeout(handleClose, 1500);
    } catch (err) {
      isSubmitting = false;
      authErrorMessage = err.message || 'Failed to create account.';
      renderAuthModalContent(modalRoot, onClose);
    }
  });

  // Manual Cloud Sync
  modalRoot.querySelector('#btn-auth-manual-sync')?.addEventListener('click', async () => {
    const syncBtn = modalRoot.querySelector('#btn-auth-manual-sync');
    if (syncBtn) syncBtn.textContent = '⏳ Uploading Save...';
    const success = await cloudSaveService.uploadSave(true);
    if (success) {
      authSuccessMessage = 'Cloud save synchronized with Supabase!';
    } else {
      authErrorMessage = 'Failed to sync to cloud. Local save preserved.';
    }
    renderAuthModalContent(modalRoot, onClose);
  });

  // Return to Title Screen
  modalRoot.querySelectorAll('#btn-auth-goto-title').forEach(btn => {
    btn.addEventListener('click', () => {
      handleClose();
      showTitleScreen();
    });
  });

  // Sign Out (returns to Title Screen in Guest Mode)
  modalRoot.querySelector('#btn-auth-signout')?.addEventListener('click', async () => {
    await authService.signOut();
    handleClose();
    showTitleScreen();
  });

  // Edit guest name
  modalRoot.querySelector('#btn-edit-guest-name')?.addEventListener('click', () => {
    const cur = authService.getProfile().username;
    const newName = prompt('Enter contractor name:', cur);
    if (newName && newName.trim()) {
      authService.setGuestUsername(newName.trim());
      renderAuthModalContent(modalRoot, onClose);
    }
  });
}
