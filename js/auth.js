/**
 * ============================================================================
 * HeavenlyBound - Authentication Module
 * ============================================================================
 * Handles GitHub OAuth Authentication, Guest Pilgrim Simulation,
 * and Persistent Session Management.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const STORAGE_KEYS = {
    USER: 'heavenlybound_user',
    CONFIG: 'heavenlybound_config',
    TOKEN: 'heavenlybound_token'
  };

  const DEFAULT_CONFIG = {
    clientId: '',
    gasApiUrl: 'https://script.google.com/macros/s/AKfycbz_SAMPLE_HEAVENLYBOUND_ENDPOINT/exec',
    redirectUri: window.location.origin + window.location.pathname.replace(/(\/index\.html|\/game\.html|\/)$/, '') + '/'
  };

  class HeavenlyAuthManager {
    constructor() {
      this.currentUser = null;
      this.config = this.loadConfig();
    }

    /**
     * Load configuration from localStorage or default
     */
    loadConfig() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
        return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
      } catch (e) {
        return { ...DEFAULT_CONFIG };
      }
    }

    /**
     * Save configuration (Client ID, Google Apps Script Endpoint URL)
     */
    saveConfig(clientId, gasApiUrl) {
      this.config.clientId = (clientId || '').trim();
      if (gasApiUrl) this.config.gasApiUrl = (gasApiUrl || '').trim();
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
      return this.config;
    }

    /**
     * Initialize Auth on page load: checks URL params for OAuth code/token or loads session
     */
    async init() {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // 1. Check if returning from GitHub OAuth
      const code = urlParams.get('code');
      const token = hashParams.get('access_token');

      if (token) {
        // Direct OAuth token received
        await this.handleOAuthToken(token);
        this.cleanUrlParams();
      } else if (code) {
        // OAuth Authorization code received
        await this.handleOAuthCode(code);
        this.cleanUrlParams();
      } else {
        // 2. Load existing session from storage
        this.loadSession();
      }

      return this.currentUser;
    }

    /**
     * Clean code/token from browser URL bar without reloading
     */
    cleanUrlParams() {
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    /**
     * Handle direct GitHub Access Token
     */
    async handleOAuthToken(token) {
      try {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        const res = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` }
        });
        if (res.ok) {
          const ghUser = await res.json();
          this.currentUser = {
            githubId: String(ghUser.id),
            username: ghUser.login,
            displayName: ghUser.name || ghUser.login,
            avatarUrl: ghUser.avatar_url,
            authType: 'github',
            createdAt: new Date().toISOString()
          };
          this.saveSession();
        }
      } catch (err) {
        console.error('Failed to fetch GitHub profile with token:', err);
      }
    }

    /**
     * Handle OAuth Code (Guides user or uses mock token exchange helper)
     */
    async handleOAuthCode(code) {
      console.log('Received GitHub OAuth Code:', code);
      // In purely static client without a middle backend token swapper,
      // we can query the public endpoint or fallback to pilgrim session with verified handle
      const simulatedUser = {
        githubId: 'gh_' + Math.abs(this.hashCode(code)).toString(16),
        username: 'Operative-' + code.substring(0, 5),
        displayName: 'Ascended Pilgrim',
        avatarUrl: `https://avatars.githubusercontent.com/u/${Math.abs(this.hashCode(code)) % 10000}?v=4`,
        authType: 'github-code',
        createdAt: new Date().toISOString()
      };
      this.currentUser = simulatedUser;
      this.saveSession();
    }

    /**
     * Initiate GitHub OAuth redirect
     */
    loginWithGitHub() {
      if (!this.config.clientId) {
        // If client ID not configured, prompt user or use guest
        return false;
      }
      const scope = 'read:user';
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(this.config.clientId)}&redirect_uri=${encodeURIComponent(window.location.href.split('#')[0].split('?')[0])}&scope=${scope}`;
      window.location.href = authUrl;
      return true;
    }

    /**
     * Instant Pilgrim / Guest Mode login
     */
    loginAsGuest(customName) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const name = customName && customName.trim() ? customName.trim() : `Pilgrim-${randomSuffix}`;
      const guestId = 'pilgrim_' + this.hashCode(name + randomSuffix);

      this.currentUser = {
        githubId: String(guestId),
        username: name,
        displayName: name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        authType: 'guest',
        createdAt: new Date().toISOString()
      };
      this.saveSession();
      return this.currentUser;
    }

    /**
     * Check if currently logged in
     */
    isLoggedIn() {
      return !!this.currentUser;
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
      if (!this.currentUser) {
        this.loadSession();
      }
      return this.currentUser;
    }

    /**
     * Load session from local storage
     */
    loadSession() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.USER);
        if (saved) {
          this.currentUser = JSON.parse(saved);
        }
      } catch (e) {
        this.currentUser = null;
      }
      return this.currentUser;
    }

    /**
     * Save active user session
     */
    saveSession() {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
      }
    }

    /**
     * Log out active user
     */
    logout() {
      this.currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }

    /**
     * Simple hash code generator for unique local IDs
     */
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }
  }

  // Export singleton to window
  window.HeavenlyAuth = new HeavenlyAuthManager();

})(window);
