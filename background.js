/**
 * Background service worker for WebTimeTracker
 * Handles tab tracking, time measurement, and data persistence
 */

// 現在アクティブなタブの情報を保持
let activeTab = {
  id: null,
  domain: null,
  startTime: null
};

// ウィンドウのフォーカス状態
let isWindowFocused = true;

/**
 * Extract domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string|null} - The extracted domain or null
 */
function extractDomain(url) {
  if (!url || url === 'chrome://newtab/' || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error('Error extracting domain:', e);
    return null;
  }
}

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns {string} - Today's date string
 */
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Save time data for the current active tab
 */
async function saveCurrentTabTime() {
  if (!activeTab.domain || !activeTab.startTime) {
    return;
  }

  const endTime = Date.now();
  const duration = endTime - activeTab.startTime;

  // 1秒未満の場合は記録しない
  if (duration < 1000) {
    return;
  }

  const dateString = getTodayDateString();
  const storageKey = `timeData_${dateString}`;

  try {
    const result = await chrome.storage.local.get([storageKey]);
    let dayData = result[storageKey] || { domains: {}, totalTime: 0 };

    // ドメインのデータを初期化または更新
    if (!dayData.domains[activeTab.domain]) {
      dayData.domains[activeTab.domain] = {
        totalTime: 0,
        sessions: []
      };
    }

    // セッション情報を追加
    dayData.domains[activeTab.domain].sessions.push({
      start: new Date(activeTab.startTime).toISOString(),
      end: new Date(endTime).toISOString(),
      duration: duration
    });

    // 合計時間を更新
    dayData.domains[activeTab.domain].totalTime += duration;
    dayData.totalTime += duration;

    // ストレージに保存
    await chrome.storage.local.set({ [storageKey]: dayData });

    console.log(`Saved ${duration}ms for ${activeTab.domain}`);
  } catch (error) {
    console.error('Error saving time data:', error);
  }
}

/**
 * Start tracking a new tab
 * @param {number} tabId - The ID of the tab to track
 * @param {string} url - The URL of the tab
 */
async function startTracking(tabId, url) {
  // 既存のタブの時間を保存
  await saveCurrentTabTime();

  const domain = extractDomain(url);
  if (!domain) {
    activeTab = { id: null, domain: null, startTime: null };
    return;
  }

  // 新しいタブの追跡を開始
  activeTab = {
    id: tabId,
    domain: domain,
    startTime: Date.now()
  };

  console.log(`Started tracking: ${domain}`);
}

/**
 * Stop tracking the current tab
 */
async function stopTracking() {
  await saveCurrentTabTime();
  activeTab = { id: null, domain: null, startTime: null };
  console.log('Stopped tracking');
}

// タブがアクティブになったとき
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isWindowFocused) {
    return;
  }

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await startTracking(tab.id, tab.url);
    }
  } catch (error) {
    console.error('Error on tab activated:', error);
  }
});

// タブのURLが更新されたとき
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTab.id && changeInfo.url) {
    await startTracking(tabId, changeInfo.url);
  }
});

// タブが閉じられたとき
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === activeTab.id) {
    await stopTracking();
  }
});

// ウィンドウのフォーカスが変更されたとき
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // フォーカスが外れた
    isWindowFocused = false;
    await stopTracking();
  } else {
    // フォーカスが戻った
    isWindowFocused = true;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url) {
        await startTracking(tabs[0].id, tabs[0].url);
      }
    } catch (error) {
      console.error('Error on window focus changed:', error);
    }
  }
});

// 拡張機能が起動したとき
chrome.runtime.onStartup.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      await startTracking(tabs[0].id, tabs[0].url);
    }
  } catch (error) {
    console.error('Error on startup:', error);
  }
});

// 拡張機能がインストール/更新されたとき
chrome.runtime.onInstalled.addListener(async () => {
  console.log('WebTimeTracker installed/updated');

  // 定期的にデータを保存するアラームを設定（1分ごと）
  chrome.alarms.create('saveData', { periodInMinutes: 1 });

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      await startTracking(tabs[0].id, tabs[0].url);
    }
  } catch (error) {
    console.error('Error on installed:', error);
  }
});

// アラームが発火したとき
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'saveData') {
    await saveCurrentTabTime();
    // 継続して追跡
    if (activeTab.domain && activeTab.startTime) {
      activeTab.startTime = Date.now();
    }
  }
});

// アイドル状態の検知（15分）
chrome.idle.setDetectionInterval(15 * 60);

chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === 'idle' || newState === 'locked') {
    await stopTracking();
  } else if (newState === 'active') {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url) {
        await startTracking(tabs[0].id, tabs[0].url);
      }
    } catch (error) {
      console.error('Error on idle state changed:', error);
    }
  }
});

// メッセージリスナー（popup等からの通信用）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentSession') {
    if (activeTab.domain && activeTab.startTime) {
      sendResponse({
        domain: activeTab.domain,
        duration: Date.now() - activeTab.startTime
      });
    } else {
      sendResponse(null);
    }
    return true;
  }

  if (request.action === 'getTodayData') {
    const dateString = getTodayDateString();
    const storageKey = `timeData_${dateString}`;

    chrome.storage.local.get([storageKey], (result) => {
      sendResponse(result[storageKey] || { domains: {}, totalTime: 0 });
    });
    return true;
  }
});
