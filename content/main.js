/**
 * Nexus-OS GitHub Ultimate - Main Entry Point
 * Initializes all modules and manages global state
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    debug: false,
    sidebarWidth: 320,
    animationDuration: 300
  };

  // Global Nexus object
  window.Nexus = {
    version: '1.0.0',
    config: CONFIG,
    modules: {},
    
    init: function() {
      this.log('Initializing Nexus-OS GitHub Ultimate');
      
      // Check if we're on a GitHub page
      if (!this.isGitHubPage()) {
        this.log('Not on GitHub, skipping initialization');
        return;
      }

      // Initialize core functionality
      this.injectStyles();
      
      // Modules are initialized via their own DOMContentLoaded handlers
      // tree.js, ui.js, utilities.js
      
      this.log('Nexus-OS GitHub Ultimate loaded ✓');
    },

    isGitHubPage: function() {
      return window.location.hostname === 'github.com';
    },

    injectStyles: function() {
      // Styles are loaded via manifest.json content_scripts.css
      // This is a fallback for dynamic style injection if needed
      if (document.getElementById('nexus-styles')) return;

      const style = document.createElement('style');
      style.id = 'nexus-styles';
      style.textContent = `
        :root {
          --nexus-primary: #00d9ff;
          --nexus-secondary: #1e2139;
          --nexus-accent: #ff006e;
          --nexus-bg-dark: #0a0e27;
          --nexus-border: #1f2937;
          --nexus-text: #e5e7eb;
        }
      `;
      document.head.appendChild(style);
    },

    log: function(message) {
      if (this.config.debug) {
        console.log(`[Nexus] ${message}`);
      }
    },

    error: function(message) {
      console.error(`[Nexus] ${message}`);
    }
  };

  // Initialize on document ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.Nexus.init();
    });
  } else {
    window.Nexus.init();
  }

  // Handle Firefox-specific requirements
  if (typeof browser !== 'undefined') {
    // Firefox browser API available
    window.browserAPI = browser;
  } else if (typeof chrome !== 'undefined') {
    // Fallback for Chrome (if needed)
    window.browserAPI = chrome;
  }
})();
