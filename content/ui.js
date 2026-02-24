/**
 * Nexus-OS GitHub Ultimate - UI Module
 * Quick-action bars, sticky elements, keyboard shortcuts
 */

class GitHubUIEnhancer {
  constructor() {
    this.lastScrollPos = 0;
    this.isOnIssuePage = this.detectPageType() === 'issue';
    this.isOnPRPage = this.detectPageType() === 'pr';
    this.init();
  }

  init() {
    if (this.isOnIssuePage || this.isOnPRPage) {
      this.createQuickActionBar();
      this.makeConversationSidebarSticky();
    }
    this.attachKeyboardShortcuts();
    this.setupScrollListener();
  }

  detectPageType() {
    const path = window.location.pathname;
    if (path.includes('/issues/')) return 'issue';
    if (path.includes('/pull/')) return 'pr';
    return 'repo';
  }

  createQuickActionBar() {
    if (document.getElementById('nexus-quick-actions')) return;

    const bar = document.createElement('div');
    bar.id = 'nexus-quick-actions';
    bar.className = 'nexus-quick-action-bar';

    // Detect action buttons from existing GitHub UI
    const existingActions = document.querySelectorAll('[data-testid="issue-action-menu"]');
    
    bar.innerHTML = `
      <div class="nexus-quick-actions-content">
        <span class="nexus-qa-label">Quick Actions:</span>
        <button id="nexus-close-btn" class="nexus-qa-button nexus-qa-close" title="Close this issue/PR">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7zm0-1C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z"/>
          </svg>
          Close
        </button>
        <button id="nexus-merge-btn" class="nexus-qa-button nexus-qa-merge" title="Merge this PR" style="display: none;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"/>
          </svg>
          Merge
        </button>
        <button id="nexus-star-btn" class="nexus-qa-button nexus-qa-star" title="Star this repo (G + S)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.147.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.714 1.952a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.146-.611L7.327.668A.75.75 0 018 .25z"/>
          </svg>
          Star
        </button>
      </div>
    `;

    const header = document.querySelector('[data-testid="pull-request-header"]') 
                  || document.querySelector('[data-testid="issue-header"]')
                  || document.querySelector('.gh-header');

    if (header) {
      header.parentElement.insertBefore(bar, header.nextSibling);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    this.attachQuickActionListeners();
  }

  attachQuickActionListeners() {
    const closeBtn = document.getElementById('nexus-close-btn');
    const mergeBtn = document.getElementById('nexus-merge-btn');
    const starBtn = document.getElementById('nexus-star-btn');

    if (this.isOnPRPage) {
      mergeBtn.style.display = 'inline-flex';
      mergeBtn.addEventListener('click', () => {
        const mergeButton = document.querySelector('[data-testid="pull-request-merge-button"]');
        if (mergeButton) mergeButton.click();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const closeButton = document.querySelector('[data-testid="issue-close-button"], button[aria-label="Close issue"]');
        if (closeButton) closeButton.click();
      });
    }

    if (starBtn) {
      starBtn.addEventListener('click', () => {
        const starButton = document.querySelector('[aria-label="Star this repository"]');
        if (starButton) {
          starButton.click();
          starBtn.classList.add('nexus-qa-starred');
        }
      });
    }
  }

  makeConversationSidebarSticky() {
    const sidebar = document.querySelector('[data-testid="pull-request-sidebar"]') 
                   || document.querySelector('[data-testid="issue-sidebar"]')
                   || document.querySelector('.discussion-sidebar');

    if (sidebar) {
      // Use requestIdleCallback for non-critical style injection
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          sidebar.style.position = 'sticky';
          sidebar.style.top = '16px';
          sidebar.style.maxHeight = 'calc(100vh - 32px)';
          sidebar.style.overflowY = 'auto';
        });
      } else {
        setTimeout(() => {
          sidebar.style.position = 'sticky';
          sidebar.style.top = '16px';
          sidebar.style.maxHeight = 'calc(100vh - 32px)';
          sidebar.style.overflowY = 'auto';
        }, 0);
      }
    }
  }

  attachKeyboardShortcuts() {
    let lastKey = null;

    document.addEventListener('keydown', (e) => {
      // Avoid conflicts with form inputs
      if (e.target.matches('input, textarea')) return;

      // G + S = Star repo
      if (e.key === 'g' || e.key === 'G') {
        lastKey = 'g';
        setTimeout(() => { lastKey = null; }, 2000);
      }

      if (lastKey === 'g' && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const starBtn = document.querySelector('[aria-label="Star this repository"]');
        if (starBtn) starBtn.click();
        lastKey = null;
      }

      // Ctrl/Cmd + Shift + P = Focus quick actions
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        const qab = document.getElementById('nexus-quick-actions');
        if (qab) qab.focus();
      }
    });
  }

  setupScrollListener() {
    let scrollTimeout;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      const quickActionBar = document.getElementById('nexus-quick-actions');

      if (quickActionBar) {
        if (window.scrollY > 200) {
          quickActionBar.classList.add('nexus-qa-visible');
        } else {
          quickActionBar.classList.remove('nexus-qa-visible');
        }
      }

      scrollTimeout = setTimeout(() => {
        this.lastScrollPos = window.scrollY;
      }, 100);
    });
  }
}

// Initialize UI enhancements
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.nexusUI = new GitHubUIEnhancer();
  });
} else {
  window.nexusUI = new GitHubUIEnhancer();
}
