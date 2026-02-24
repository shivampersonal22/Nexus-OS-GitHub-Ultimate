/**
 * Nexus-OS GitHub Ultimate - Utilities Module
 * Download buttons, file sizes, code copy buttons
 */

class GitHubUtilities {
  constructor() {
    this.repoSize = null;
    this.init();
  }

  init() {
    this.injectDownloadButtons();
    this.injectFileSizeInfo();
    this.injectCodeCopyButtons();
    this.setupMutationObserver();
  }

  injectDownloadButtons() {
    // Find file entries in the repository file list
    const fileItems = document.querySelectorAll('[data-testid="file-tree-item"], [role="row"][data-testid="file-tree-item"]');

    fileItems.forEach(item => {
      if (item.querySelector('.nexus-download-btn')) return; // Already injected

      const fileName = item.querySelector('[data-testid="file-tree-item-name-text"]')?.textContent 
                      || item.textContent;
      
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'nexus-download-btn';
      downloadBtn.title = `Download ${fileName}`;
      downloadBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 1A1.5 1.5 0 001 2.5v11A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0013.5 1h-11zM2 2.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11z"/>
          <path d="M7.646 4.854a.5.5 0 00-.707.707L8 6.414l-.061-.061a.5.5 0 10-.707.707L8 7.828l1.061-1.061a.5.5 0 10-.707-.707L8.707 7.12V4.5a.5.5 0 01.707-.5.5.5 0 01-.293.646V4.5z"/>
        </svg>
      `;

      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.downloadFile(fileName, item);
      });

      item.appendChild(downloadBtn);
    });
  }

  downloadFile(fileName, element) {
    const repoMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (!repoMatch) return;

    const [, owner, repo] = repoMatch;
    const branch = this.getCurrentBranch();
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileName}`;

    // Use browser's download capability
    browser.downloads.download({
      url: rawUrl,
      filename: fileName,
      saveAs: false
    }).catch(err => {
      console.error('[Nexus] Download failed:', err);
      // Fallback: open in new tab
      window.open(rawUrl, '_blank');
    });
  }

  injectFileSizeInfo() {
    const fileEntries = document.querySelectorAll('[data-testid="file-tree-item"]');

    fileEntries.forEach(entry => {
      if (entry.querySelector('.nexus-file-size')) return;

      const fileName = entry.querySelector('[data-testid="file-tree-item-name-text"]')?.textContent;
      
      if (fileName) {
        this.fetchFileSize(fileName).then(size => {
          const sizeEl = document.createElement('span');
          sizeEl.className = 'nexus-file-size';
          sizeEl.textContent = size;
          sizeEl.title = 'File size';
          entry.appendChild(sizeEl);
        });
      }
    });
  }

  fetchFileSize(fileName) {
    return new Promise((resolve) => {
      const repoMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
      if (!repoMatch) {
        resolve('—');
        return;
      }

      const [, owner, repo] = repoMatch;
      const branch = this.getCurrentBranch();
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}?ref=${branch}`;

      fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      })
        .then(r => r.json())
        .then(data => {
          if (data.size) {
            resolve(this.formatSize(data.size));
          } else {
            resolve('—');
          }
        })
        .catch(() => resolve('—'));
    });
  }

  injectCodeCopyButtons() {
    // Inject copy buttons for markdown code blocks
    const codeBlocks = document.querySelectorAll('pre code, .blob-code-block');

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.attachCopyButtons(codeBlocks);
      });
    } else {
      setTimeout(() => {
        this.attachCopyButtons(codeBlocks);
      }, 1000);
    }
  }

  attachCopyButtons(codeBlocks) {
    codeBlocks.forEach(block => {
      if (block.querySelector('.nexus-copy-code')) return;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'nexus-copy-code';
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z"/>
          <path d="M9 2.5h-1V1.5a.5.5 0 00-1 0v1h-1a.5.5 0 000 1h3a.5.5 0 000-1z"/>
        </svg>
      `;
      copyBtn.title = 'Copy code';

      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = block.textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.classList.add('nexus-copy-success');
          setTimeout(() => {
            copyBtn.classList.remove('nexus-copy-success');
          }, 2000);
        });
      });

      block.parentElement.insertBefore(copyBtn, block);
    });
  }

  getCurrentBranch() {
    // Try to detect branch from URL or page elements
    const branchEl = document.querySelector('[data-branch]');
    if (branchEl) return branchEl.dataset.branch;

    const pathMatch = window.location.pathname.match(/\/(?:blob|tree)\/([^/]+)/);
    return pathMatch ? pathMatch[1] : 'main';
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      // Re-scan for new code blocks after content updates
      requestAnimationFrame(() => {
        this.injectCodeCopyButtons();
        this.injectDownloadButtons();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

// Initialize utilities
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.nexusUtils = new GitHubUtilities();
  });
} else {
  window.nexusUtils = new GitHubUtilities();
}
