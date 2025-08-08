/**
 * Options page script for WebTimeTracker
 * Manages settings and data export/import
 */

// 除外ドメインの管理
let excludedDomains = [];

/**
 * Load excluded domains from storage
 */
async function loadExcludedDomains() {
  try {
    const result = await chrome.storage.local.get(['excludedDomains']);
    excludedDomains = result.excludedDomains || [];
    displayExcludedDomains();
  } catch (error) {
    console.error('Error loading excluded domains:', error);
  }
}

/**
 * Display excluded domains list
 */
function displayExcludedDomains() {
  const listElement = document.getElementById('excludedDomainsList');
  listElement.innerHTML = '';

  if (excludedDomains.length === 0) {
    listElement.innerHTML = '<p class="empty-message">No excluded domains</p>';
    return;
  }

  excludedDomains.forEach((domain, index) => {
    const domainElement = document.createElement('div');
    domainElement.className = 'excluded-domain-item';

    const domainText = document.createElement('span');
    domainText.textContent = domain;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => removeDomain(index);

    domainElement.appendChild(domainText);
    domainElement.appendChild(removeBtn);
    listElement.appendChild(domainElement);
  });
}

/**
 * Add a new excluded domain
 */
async function addExcludedDomain() {
  const input = document.getElementById('excludeDomainInput');
  const domain = input.value.trim().toLowerCase();

  if (!domain) {
    alert('Please enter a domain');
    return;
  }

  if (excludedDomains.includes(domain)) {
    alert('Domain already excluded');
    return;
  }

  excludedDomains.push(domain);

  try {
    await chrome.storage.local.set({ excludedDomains });
    input.value = '';
    displayExcludedDomains();
  } catch (error) {
    console.error('Error saving excluded domains:', error);
    alert('Failed to save domain');
  }
}

/**
 * Remove an excluded domain
 */
async function removeDomain(index) {
  excludedDomains.splice(index, 1);

  try {
    await chrome.storage.local.set({ excludedDomains });
    displayExcludedDomains();
  } catch (error) {
    console.error('Error removing domain:', error);
    alert('Failed to remove domain');
  }
}

/**
 * Format time for display
 */
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Get all tracking data
 */
async function getAllData() {
  try {
    const result = await chrome.storage.local.get(null);
    const timeData = {};

    for (const key in result) {
      if (key.startsWith('timeData_')) {
        const date = key.replace('timeData_', '');
        timeData[date] = result[key];
      }
    }

    return timeData;
  } catch (error) {
    console.error('Error getting all data:', error);
    return {};
  }
}

/**
 * Export data as JSON
 */
async function exportJsonData() {
  const data = await getAllData();

  if (Object.keys(data).length === 0) {
    alert('No data to export');
    return;
  }

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const url = URL.createObjectURL(dataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `webtime-tracker-all-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV
 */
async function exportCsvData() {
  const data = await getAllData();

  if (Object.keys(data).length === 0) {
    alert('No data to export');
    return;
  }

  let csv = 'Date,Domain,Time (seconds),Sessions\n';

  for (const [date, dayData] of Object.entries(data)) {
    if (dayData.domains) {
      for (const [domain, domainData] of Object.entries(dayData.domains)) {
        const timeInSeconds = Math.floor(domainData.totalTime / 1000);
        const sessions = domainData.sessions ? domainData.sessions.length : 0;
        csv += `${date},${domain},${timeInSeconds},${sessions}\n`;
      }
    }
  }

  const csvBlob = new Blob([csv], { type: 'text/csv' });

  const url = URL.createObjectURL(csvBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `webtime-tracker-all-data-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Clear today's data
 */
async function clearTodayData() {
  if (!confirm("Are you sure you want to clear today's data? This cannot be undone.")) {
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `timeData_${today}`;

  try {
    await chrome.storage.local.remove([storageKey]);
    alert("Today's data has been cleared");
    displayStatistics();
  } catch (error) {
    console.error('Error clearing today data:', error);
    alert('Failed to clear data');
  }
}

/**
 * Clear all data
 */
async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL tracking data? This cannot be undone.')) {
    return;
  }

  if (!confirm('This will permanently delete all your tracking history. Are you absolutely sure?')) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(result).filter(key => key.startsWith('timeData_'));

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      alert('All tracking data has been cleared');
      displayStatistics();
    } else {
      alert('No data to clear');
    }
  } catch (error) {
    console.error('Error clearing all data:', error);
    alert('Failed to clear data');
  }
}

/**
 * Display statistics
 */
async function displayStatistics() {
  const data = await getAllData();
  const statsElement = document.getElementById('statistics');

  if (Object.keys(data).length === 0) {
    statsElement.innerHTML = '<p class="empty-message">No tracking data available</p>';
    return;
  }

  let totalTime = 0;
  let totalDomains = new Set();
  let totalSessions = 0;
  const dates = Object.keys(data);

  for (const dayData of Object.values(data)) {
    if (dayData.totalTime) {
      totalTime += dayData.totalTime;
    }
    if (dayData.domains) {
      Object.keys(dayData.domains).forEach(domain => totalDomains.add(domain));
      for (const domainData of Object.values(dayData.domains)) {
        if (domainData.sessions) {
          totalSessions += domainData.sessions.length;
        }
      }
    }
  }

  statsElement.innerHTML = `
    <div class="stat-grid">
      <div class="stat-item">
        <div class="stat-value">${dates.length}</div>
        <div class="stat-label">Days Tracked</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalDomains.size}</div>
        <div class="stat-label">Unique Domains</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${formatTime(totalTime)}</div>
        <div class="stat-label">Total Time</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalSessions}</div>
        <div class="stat-label">Total Sessions</div>
      </div>
    </div>
  `;
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
  loadExcludedDomains();
  displayStatistics();

  // 除外ドメイン追加
  document.getElementById('addExcludeDomain').addEventListener('click', addExcludedDomain);
  document.getElementById('excludeDomainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addExcludedDomain();
    }
  });

  // エクスポートボタン
  document.getElementById('exportJsonBtn').addEventListener('click', exportJsonData);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsvData);

  // クリアボタン
  document.getElementById('clearTodayBtn').addEventListener('click', clearTodayData);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllData);

  // フッターリンク
  document.getElementById('privacyLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('WebTimeTracker stores all data locally on your device. No data is sent to external servers.');
  });

  document.getElementById('supportLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('For support, please visit the Chrome Web Store page or GitHub repository.');
  });
});
