/**
 * ============================================================================
 * HeavenlyBound - API & Google Apps Script Database Bridge
 * ============================================================================
 * Handles REST synchronization with Google Apps Script Web App (HeavenlyBound_GameDB)
 * with robust offline/local storage fallback and automatic cloud buffering.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const LOCAL_STATE_KEY = 'heavenlybound_local_gamestate_';
  const LOCAL_LEADERBOARD_KEY = 'heavenlybound_local_leaderboard';

  class HeavenlyApiManager {
    constructor() {
      this.isSyncing = false;
      this.lastSyncTime = null;
      this.syncListeners = [];
    }

    /**
     * Get Google Apps Script URL from Auth config
     */
    getApiUrl() {
      if (window.HeavenlyAuth && window.HeavenlyAuth.config) {
        return window.HeavenlyAuth.config.gasApiUrl;
      }
      return '';
    }

    /**
     * Subscribe to sync state changes (for HUD indicators)
     */
    onSyncStateChange(callback) {
      if (typeof callback === 'function') {
        this.syncListeners.push(callback);
      }
    }

    notifySync(status, detail) {
      this.syncListeners.forEach(cb => {
        try { cb({ status, detail, timestamp: new Date().toISOString() }); } catch (e) {}
      });
    }

    /**
     * Check if Google Apps Script URL is a valid configured endpoint
     */
    hasCustomEndpoint() {
      const url = this.getApiUrl();
      return url && url.includes('script.google.com/macros/s/') && !url.includes('AKfycbz_SAMPLE');
    }

    /**
     * Ping API Endpoint to verify connection
     */
    async ping() {
      const url = this.getApiUrl();
      if (!this.hasCustomEndpoint()) {
        return { status: 'mock', message: 'Local Sanctum Buffer Active (No GAS configured)' };
      }

      try {
        const response = await fetch(`${url}?action=ping`, { method: 'GET', mode: 'cors' });
        if (response.ok) {
          return await response.json();
        }
        return { status: 'error', message: `HTTP error ${response.status}` };
      } catch (err) {
        return { status: 'error', message: err.toString() };
      }
    }

    /**
     * Sync User Profile (Credits, Level, Last Seen)
     */
    async syncUserProfile(user, credits = 0, baseLevel = 1) {
      if (!user || !user.githubId) return null;

      const payload = {
        action: 'syncUser',
        githubId: user.githubId,
        username: user.username || user.displayName || 'Pilgrim',
        credits: credits,
        baseLevel: baseLevel
      };

      // Save locally first
      this.saveLocalProfile(payload);

      if (!this.hasCustomEndpoint()) {
        this.notifySync('local_buffered', 'Profile cached locally');
        return { status: 'local', data: payload };
      }

      try {
        this.isSyncing = true;
        this.notifySync('syncing', 'Syncing profile to Celestial Sheets...');

        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          mode: 'no-cors', // Google Apps Script Web App redirects work with no-cors or JSONP
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        this.lastSyncTime = new Date();
        this.notifySync('synced', 'Profile synchronized with Google Sheets');
        return { status: 'success', data: payload };
      } catch (err) {
        console.warn('GAS Profile Sync failed, using local buffer:', err);
        this.notifySync('fallback', 'Network sync failed; stored locally');
        return { status: 'fallback', data: payload };
      } finally {
        this.isSyncing = false;
      }
    }

    /**
     * Save Game State (C&C base layout, Innie progression, inventory, high score)
     */
    async saveGameState(githubId, gameStateObj, highScore = 0) {
      if (!githubId) return null;

      const jsonStr = typeof gameStateObj === 'string' ? gameStateObj : JSON.stringify(gameStateObj);
      
      // 1. Immediately persist to localStorage
      try {
        localStorage.setItem(LOCAL_STATE_KEY + githubId, jsonStr);
        this.updateLocalLeaderboard(githubId, highScore);
      } catch (e) {
        console.error('LocalStorage save failed:', e);
      }

      if (!this.hasCustomEndpoint()) {
        this.notifySync('local_buffered', 'State saved to local memory');
        return { status: 'local', state: gameStateObj };
      }

      // 2. Transmit to Google Apps Script
      try {
        this.isSyncing = true;
        this.notifySync('syncing', 'Committing state to Google Sheets...');

        const payload = {
          action: 'syncState',
          githubId: githubId,
          saveDataJSON: jsonStr,
          highScore: highScore,
          credits: gameStateObj.credits || 0,
          baseLevel: gameStateObj.baseLevel || 1
        };

        await fetch(this.getApiUrl(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        this.lastSyncTime = new Date();
        this.notifySync('synced', 'State securely committed to Celestial Sheets');
        return { status: 'success', state: gameStateObj };
      } catch (err) {
        console.warn('Cloud sync error, local state preserved:', err);
        this.notifySync('fallback', 'Cloud sync failed; local state preserved');
        return { status: 'fallback', state: gameStateObj };
      } finally {
        this.isSyncing = false;
      }
    }

    /**
     * Load Game State for a player
     */
    async loadGameState(githubId) {
      if (!githubId) return null;

      // 1. Check local buffer first
      let localState = null;
      try {
        const saved = localStorage.getItem(LOCAL_STATE_KEY + githubId);
        if (saved) localState = JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading local state:', e);
      }

      if (!this.hasCustomEndpoint()) {
        return localState;
      }

      // 2. Fetch from Google Apps Script endpoint
      try {
        const res = await fetch(`${this.getApiUrl()}?action=getGameState&githubId=${encodeURIComponent(githubId)}`, {
          method: 'GET',
          mode: 'cors'
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'success' && data.state && data.state.saveDataJSON) {
            const cloudState = JSON.parse(data.state.saveDataJSON);
            return cloudState;
          }
        }
      } catch (err) {
        console.warn('Failed to load cloud state, falling back to local state:', err);
      }

      return localState;
    }

    /**
     * Fetch Top Pilgrims Leaderboard
     */
    async fetchLeaderboard() {
      if (this.hasCustomEndpoint()) {
        try {
          const res = await fetch(`${this.getApiUrl()}?action=getLeaderboard`, { method: 'GET', mode: 'cors' });
          if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'success') {
              return data.leaderboard;
            }
          }
        } catch (e) {
          console.warn('Leaderboard cloud fetch failed:', e);
        }
      }

      // Return local leaderboard fallback
      return this.getLocalLeaderboard();
    }

    /**
     * Local storage helpers
     */
    saveLocalProfile(profileData) {
      try {
        localStorage.setItem('heavenlybound_profile_' + profileData.githubId, JSON.stringify(profileData));
      } catch (e) {}
    }

    updateLocalLeaderboard(githubId, score) {
      try {
        let board = this.getLocalLeaderboard();
        const existingIdx = board.findIndex(item => item.githubId === githubId);
        if (existingIdx >= 0) {
          if (score > board[existingIdx].highScore) {
            board[existingIdx].highScore = score;
            board[existingIdx].lastUpdated = new Date().toISOString();
          }
        } else {
          board.push({
            githubId: githubId,
            highScore: score,
            lastUpdated: new Date().toISOString()
          });
        }
        board.sort((a, b) => b.highScore - a.highScore);
        localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(board.slice(0, 10)));
      } catch (e) {}
    }

    getLocalLeaderboard() {
      try {
        const saved = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      
      // Default mock leaderboard
      return [
        { githubId: 'Archangel-Prime', highScore: 24500, lastUpdated: '2026-08-19' },
        { githubId: 'Seraph-07', highScore: 18200, lastUpdated: '2026-08-19' },
        { githubId: 'Grid-Valkyrie', highScore: 14100, lastUpdated: '2026-08-18' },
        { githubId: 'Cherub-Cipher', highScore: 9800, lastUpdated: '2026-08-17' }
      ];
    }
  }

  // Export singleton to window
  window.HeavenlyApi = new HeavenlyApiManager();

})(window);
