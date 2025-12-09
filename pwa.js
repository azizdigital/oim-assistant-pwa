// PWA Installation and Management
// Handles service worker registration and install prompt

let deferredPrompt;
let installPromptShown = false;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default mini-infobar
  e.preventDefault();
  
  // Store event for later use
  deferredPrompt = e;
  
  // Show custom install prompt
  if (!installPromptShown && !localStorage.getItem('pwa-dismissed')) {
    showInstallPrompt();
  }
});

function showInstallPrompt() {
  const prompt = document.getElementById('installPrompt');
  if (prompt) {
    prompt.classList.add('show');
    installPromptShown = true;
  }
}

function installPWA() {
  if (!deferredPrompt) {
    // Already installed or not available
    alert('App is already installed or install is not available.');
    return;
  }
  
  // Show install prompt
  deferredPrompt.prompt();
  
  // Wait for user response
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted PWA install');
    } else {
      console.log('User dismissed PWA install');
    }
    
    // Clear the prompt
    deferredPrompt = null;
    
    // Hide install prompt
    const prompt = document.getElementById('installPrompt');
    if (prompt) {
      prompt.classList.remove('show');
    }
  });
}

function dismissInstall() {
  const prompt = document.getElementById('installPrompt');
  if (prompt) {
    prompt.classList.remove('show');
  }
  
  // Remember dismissal for 7 days
  localStorage.setItem('pwa-dismissed', Date.now());
  setTimeout(() => {
    localStorage.removeItem('pwa-dismissed');
  }, 7 * 24 * 60 * 60 * 1000);
}

// Check if already installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed successfully');
  deferredPrompt = null;
  
  // Hide install prompt
  const prompt = document.getElementById('installPrompt');
  if (prompt) {
    prompt.classList.remove('show');
  }
});

// iOS specific - detect if running as PWA
function isRunningAsPWA() {
  // iOS
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Android
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  return false;
}

// Update UI if running as PWA
if (isRunningAsPWA()) {
  document.body.classList.add('pwa-mode');
  console.log('Running as PWA');
}

// Handle iOS Safari specific behaviors
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
  document.body.classList.add('ios-device');
  
  // Prevent zoom on input focus
  document.addEventListener('touchstart', function() {}, {passive: true});
  
  // Handle safe areas
  if (window.navigator.standalone) {
    // Add padding for notch/home indicator
    document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
  }
}

// Offline/Online status
window.addEventListener('online', () => {
  console.log('Back online');
  const status = document.createElement('div');
  status.className = 'alert alert-success';
  status.textContent = '✅ Back online';
  status.style.position = 'fixed';
  status.style.top = '20px';
  status.style.right = '20px';
  status.style.zIndex = '9999';
  document.body.appendChild(status);
  setTimeout(() => status.remove(), 3000);
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  const status = document.createElement('div');
  status.className = 'alert alert-warning';
  status.textContent = '⚠️ Working offline';
  status.style.position = 'fixed';
  status.style.top = '20px';
  status.style.right = '20px';
  status.style.zIndex = '9999';
  document.body.appendChild(status);
  setTimeout(() => status.remove(), 3000);
});

// Share API support
async function shareReport(data) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'OIM Daily Report',
        text: 'Daily Operations Report',
        url: window.location.href
      });
      console.log('Shared successfully');
    } catch (err) {
      console.log('Error sharing:', err);
    }
  } else {
    // Fallback - copy to clipboard
    console.log('Share API not supported');
  }
}

// Add to app.js global scope
window.installPWA = installPWA;
window.dismissInstall = dismissInstall;
window.shareReport = shareReport;