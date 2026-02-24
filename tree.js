/**
 * Nexus-OS GitHub Ultimate - Tree Module
 * Renders recursive file tree with instant navigation and lazy-loading
 */

class GitHubTree {
  constructor() {
    this.treeCache = new Map();
    this.currentRepo = null;
    this.currentBranch = 'main';
    this.observer = null;
    this.token = localStorage.getItem('github_token') || null;
    this.init();
  }

  init() {
    this.detectRepository();
    this.createSidebar();
    this.attachEventListeners();
  }

  detectRepository() {
    const pathMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (pathMatch) {
      this.currentRepo = {
        owner: pathMatch[1],
        name: pathMatch[2]
      };
    }
  }

  createSidebar() {
    if (document.getElementById('nexus-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'nexus-sidebar';
    sidebar.className = 'nexus-sidebar-container';
    sidebar.innerHTML = `
      <div class="nexus-sidebar-header">
        <h3>Repository Tree</h3>
        <button id="nexus-sidebar-toggle" class="nexus-sidebar-toggle" title="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M3 5h14M3 10h14M3 15h14" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="nexus-sidebar-content">
        <div id="nexus-tree-root" class="nexus-tree-root"></div>
      </div>
    `;

    document.body.appendChild(sidebar);
    this.adjustMainContent();
    this.loadTreeData();
  }

  adjustMainContent() {
    const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
    if (main) {
      main.style.marginLeft = '320px';
      main.style.transition = 'margin-left 0.3s ease';
    }
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('nexus-sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Lazy-load tree items on intersection
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const options = {
      root: document.getElementById('nexus-sidebar-content'),
      rootMargin: '50px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.loaded) {
          this.loadTreeItem(entry.target);
          entry.target.dataset.loaded = 'true';
        }
      });
    }, options);
  }

  loadTreeData() {
    if (!this.currentRepo) return;

    const { owner, name } = this.currentRepo;
    const query = `query {
      repository(owner: "${owner}", name: "${name}") {
        defaultBranchRef {
          name
          target {
            ... on Commit {
              tree {
                entries {
                  name
                  type
                  object {
                    ... on Tree {
                      entries {
                        name
                        type
                      }
                    }
                    ... on Blob {
                      byteSize
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    this.fetchGraphQL(query).then(data => {
      if (data && data.repository) {
        const entries = data.repository.defaultBranchRef?.target?.tree?.entries || [];
        this.renderTree(entries);
      }
    }).catch(err => console.error('[Nexus] Tree fetch error:', err));
  }

  fetchGraphQL(query) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        {
          action: 'fetchGitHubAPI',
          url: 'https://api.github.com/graphql',
          token: this.token,
          query
        },
        (response) => {
          if (response.success) {
            resolve(response.data.data);
          } else {
            reject(response.error);
          }
        }
      );
    });
  }

  renderTree(entries, parentElement = null) {
    const root = parentElement || document.getElementById('nexus-tree-root');
    if (!root) return;

    root.innerHTML = '';

    entries.forEach(entry => {
      const item = document.createElement('div');
      item.className = `nexus-tree-item nexus-tree-${entry.type.toLowerCase()}`;
      item.dataset.name = entry.name;

      const icon = entry.type === 'Tree' 
        ? '<svg class="nexus-tree-icon" width="16" height="16" viewBox="0 0 16 16"><path d="M2 4h12v10H2z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
        : '<svg class="nexus-tree-icon" width="16" height="16" viewBox="0 0 16 16"><path d="M4 2h8v12H4z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

      item.innerHTML = `
        ${icon}
        <span class="nexus-tree-label">${entry.name}</span>
        ${entry.byteSize ? `<span class="nexus-tree-size">${this.formatSize(entry.byteSize)}</span>` : ''}
      `;

      item.addEventListener('click', () => this.navigateToFile(entry.name));
      root.appendChild(item);

      if (this.observer) {
        this.observer.observe(item);
      }
    });
  }

  navigateToFile(fileName) {
    const path = `${window.location.pathname}/blob/${this.currentBranch}/${fileName}`;
    window.location.href = path;
  }

  toggleSidebar() {
    const sidebar = document.getElementById('nexus-sidebar');
    const isOpen = sidebar.classList.toggle('nexus-sidebar-open');
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    
    if (main) {
      main.style.marginLeft = isOpen ? '320px' : '0px';
    }

    browser.runtime.sendMessage({
      action: 'saveSidebarState',
      open: isOpen,
      width: 320
    });
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  }
}

// Initialize tree when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.nexusTree = new GitHubTree();
  });
} else {
  window.nexusTree = new GitHubTree();
}
