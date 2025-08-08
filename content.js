/**
 * Content script for WebTimeTracker
 * Monitors page visibility and focus state
 */

// ページの可視性状態を追跡
let isPageVisible = !document.hidden;
let isPageFocused = document.hasFocus();

/**
 * Send visibility state to background script
 */
function sendVisibilityState() {
  chrome.runtime.sendMessage({
    action: 'visibilityChanged',
    isVisible: isPageVisible && isPageFocused,
    domain: window.location.hostname
  });
}

// Page Visibility API
document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  sendVisibilityState();

  console.log(`Page visibility changed: ${isPageVisible ? 'visible' : 'hidden'}`);
});

// Window focus/blur events
window.addEventListener('focus', () => {
  isPageFocused = true;
  sendVisibilityState();
  console.log('Page focused');
});

window.addEventListener('blur', () => {
  isPageFocused = false;
  sendVisibilityState();
  console.log('Page blurred');
});

// 初期状態を送信
sendVisibilityState();

// ページアンロード時の処理
window.addEventListener('beforeunload', () => {
  chrome.runtime.sendMessage({
    action: 'pageUnloading',
    domain: window.location.hostname
  });
});

console.log('WebTimeTracker content script loaded on:', window.location.hostname);
