import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { gameState } from '../state/gameState.js';

const GUEST_KEY = 'spirit_contract_guest_profile_v1';
export const DEV_ADMIN_EMAIL = 'admin@email.com';
export const DEV_ADMIN_PW = 'x@DM1N';
const DEV_ADMIN_SESSION_KEY = 'spirit_admin_dev_session_v1';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.isInitialized = false;
    this.subscribers = new Set();

    this.init();
  }

  /**
   * Initializes auth state, checking active Supabase session or fallback to guest
   */
  async init() {
    if (this.isInitialized) return;

    // Check if previously signed in as Dev Admin
    try {
      const devSession = localStorage.getItem(DEV_ADMIN_SESSION_KEY);
      if (devSession) {
        this.setAdminDevSession();
        this.isInitialized = true;
        this.emit('AUTH_INITIALIZED', { isGuest: false, profile: this.getProfile() });
        return;
      }
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          await this.fetchProfile(session.user.id);
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session && session.user) {
            this.currentUser = session.user;
            await this.fetchProfile(session.user.id);
            this.emit('AUTH_STATE_CHANGED', { user: this.currentUser, profile: this.currentProfile, isGuest: false });
          } else {
            // Only revert to guest if not in dev session
            try {
              if (localStorage.getItem(DEV_ADMIN_SESSION_KEY)) return;
            } catch {}
            this.currentUser = null;
            this.currentProfile = null;
            this.emit('AUTH_STATE_CHANGED', { user: null, profile: this.getGuestProfile(), isGuest: true });
          }
        });
      } catch (err) {
        console.warn('[AuthService] Error during auth session initialization:', err);
      }
    }

    this.isInitialized = true;
    this.emit('AUTH_INITIALIZED', { isGuest: this.isGuest(), profile: this.getProfile() });
  }

  /**
   * Configures local active session as the Dev Admin
   */
  setAdminDevSession() {
    this.currentUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: DEV_ADMIN_EMAIL,
      role: 'admin',
      user_metadata: {
        username: 'AdminDev',
        role: 'admin',
        isDev: true
      }
    };
    this.currentProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'AdminDev [DEV]',
      contractorLevel: 99,
      contractorXp: 999999,
      avatarEmoji: 'zap',
      role: 'admin',
      isAdmin: true,
      isDev: true
    };
    try {
      localStorage.setItem(DEV_ADMIN_SESSION_KEY, JSON.stringify({ email: DEV_ADMIN_EMAIL, ts: Date.now() }));
    } catch {}
  }

  /**
   * Check if current user is the Dev / Admin account
   */
  isAdmin() {
    if (!this.currentUser) return false;
    return Boolean(
      this.currentUser.email === DEV_ADMIN_EMAIL ||
      this.currentUser.role === 'admin' ||
      this.currentProfile?.role === 'admin' ||
      this.currentProfile?.isAdmin === true
    );
  }

  isDev() {
    return this.isAdmin();
  }

  /**
   * Subscribes to auth events: (event, payload) => {}
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(event, payload) {
    for (const callback of this.subscribers) {
      try {
        callback(event, payload);
      } catch (err) {
        console.error('[AuthService] Error in subscriber callback:', err);
      }
    }
  }

  /**
   * Checks if active session is a local guest
   */
  isGuest() {
    return !this.currentUser;
  }

  /**
   * Gets or initializes local guest profile
   */
  getGuestProfile() {
    try {
      const stored = localStorage.getItem(GUEST_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const defaultGuest = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      username: 'Apprentice Contractor',
      avatarEmoji: 'wizard',
      contractorLevel: 1,
      isGuest: true,
      createdAt: Date.now()
    };

    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(defaultGuest));
    } catch {}

    return defaultGuest;
  }

  /**
   * Updates guest profile (e.g. username)
   */
  setGuestUsername(username) {
    const profile = this.getGuestProfile();
    profile.username = (username || '').trim() || 'Apprentice Contractor';
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(profile));
    } catch {}
    this.emit('PROFILE_UPDATED', profile);
    return profile;
  }

  /**
   * Returns current active profile (Cloud Profile if authenticated, else Guest Profile)
   */
  getProfile() {
    if (this.currentUser && this.currentProfile) {
      return {
        ...this.currentProfile,
        isGuest: false,
        email: this.currentUser.email
      };
    }
    return this.getGuestProfile();
  }

  /**
   * Fetches profile from Supabase profiles table
   */
  async fetchProfile(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthService] Could not fetch profile from cloud:', error);
      }

      if (data) {
        this.currentProfile = {
          id: data.id,
          username: data.username,
          contractorLevel: data.contractor_level || 1,
          contractorXp: data.contractor_xp || 0,
          avatarEmoji: data.avatar_emoji || 'wizard',
          createdAt: data.created_at,
          lastLogin: data.last_login
        };
      } else {
        // Fallback: derive from user metadata
        this.currentProfile = {
          id: userId,
          username: this.currentUser?.user_metadata?.username || this.currentUser?.email?.split('@')[0] || 'Contractor',
          contractorLevel: 1,
          contractorXp: 0,
          avatarEmoji: 'wizard'
        };
      }
      return this.currentProfile;
    } catch (err) {
      console.warn('[AuthService] fetchProfile exception:', err);
      return null;
    }
  }

  /**
   * Register a new Supabase user
   */
  async signUp({ email, password, username }) {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    const cleanUsername = (username || '').trim();
    if (!cleanUsername) throw new Error('Please choose a valid contractor username.');
    if (!email || !email.includes('@')) throw new Error('Please enter a valid email address.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      this.currentUser = data.user;
      // Upsert profile in case trigger takes a moment
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: cleanUsername,
          last_login: new Date().toISOString()
        });
      } catch {}

      await this.fetchProfile(data.user.id);
      this.emit('AUTH_STATE_CHANGED', { user: this.currentUser, profile: this.getProfile(), isGuest: false });
    }

    return { user: data.user, session: data.session, profile: this.getProfile() };
  }

  /**
   * Sign In an existing Supabase user or Dev Admin account
   */
  async signIn({ email, password }) {
    if (!email || !password) throw new Error('Please enter both email and password.');

    const cleanEmail = email.trim().toLowerCase();
    const isDevAdminAttempt = (cleanEmail === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PW);

    if (isDevAdminAttempt) {
      // First attempt Supabase sign-in if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: DEV_ADMIN_EMAIL,
            password: DEV_ADMIN_PW
          });
          if (!error && data?.user) {
            this.currentUser = data.user;
            await this.fetchProfile(data.user.id);
            this.emit('AUTH_STATE_CHANGED', { user: this.currentUser, profile: this.getProfile(), isGuest: false });
            return { user: data.user, session: data.session, profile: this.getProfile() };
          }
        } catch (err) {
          console.warn('[AuthService] Supabase cloud login fallback to dev session:', err);
        }
      }

      // Activate Dev Admin Session
      this.setAdminDevSession();
      this.emit('AUTH_STATE_CHANGED', { user: this.currentUser, profile: this.getProfile(), isGuest: false });
      return { user: this.currentUser, session: { user: this.currentUser }, profile: this.getProfile() };
    }

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this.currentUser = data.user;
    await this.fetchProfile(data.user.id);
    this.emit('AUTH_STATE_CHANGED', { user: this.currentUser, profile: this.getProfile(), isGuest: false });

    return { user: data.user, session: data.session, profile: this.getProfile() };
  }

  /**
   * Sign Out
   */
  async signOut() {
    try {
      localStorage.removeItem(DEV_ADMIN_SESSION_KEY);
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthService] signOut error:', err);
      }
    }

    this.currentUser = null;
    this.currentProfile = null;
    try {
      localStorage.removeItem(GUEST_KEY);
    } catch {}
    if (gameState && typeof gameState.resetAllProgress === 'function') {
      gameState.resetAllProgress();
    }
    this.emit('AUTH_STATE_CHANGED', { user: null, profile: this.getGuestProfile(), isGuest: true });
    return { success: true };
  }

  /**
   * Links local guest state to a newly registered Supabase cloud account
   */
  async linkGuestAccount({ email, password, username, localSaveData }) {
    if (typeof window !== 'undefined') {
      window.__linkDeviceSaveRequested = true;
    }
    const signupRes = await this.signUp({ email, password, username });
    const user = signupRes.user;

    if (user && localSaveData && isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('game_saves').upsert({
          user_id: user.id,
          version: localSaveData.version || 2,
          save_data: localSaveData,
          updated_at: new Date().toISOString()
        });
        console.log('[AuthService] Successfully backed up guest game state to cloud on registration!');
      } catch (err) {
        console.warn('[AuthService] Could not immediately upload initial save:', err);
      }
    }

    return signupRes;
  }
}

export const authService = new AuthService();
export default authService;
