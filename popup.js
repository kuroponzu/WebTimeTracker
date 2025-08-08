/**
 * Popup script for WebTimeTracker
 * Displays current session and today's statistics
 */

// 時間フォーマット用のヘルパー関数
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 現在の日付を表示
function displayCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// 現在のセッション情報を更新
let currentSessionInterval;

async function updateCurrentSession() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentSession' });

    const domainElement = document.getElementById('currentDomain');
    const timeElement = document.getElementById('currentTime');

    if (response && response.domain) {
      domainElement.textContent = response.domain;
      timeElement.textContent = formatTime(response.duration);
    } else {
      domainElement.textContent = 'No active tab';
      timeElement.textContent = '00:00:00';
    }
  } catch (error) {
    console.error('Error updating current session:', error);
  }
}

// 今日の統計情報を表示
async function displayTodayStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTodayData' });

    if (!response || !response.domains) {
      document.getElementById('totalTime').textContent = '00:00:00';
      document.getElementById('domainList').innerHTML = '<div class="no-data">No data for today</div>';
      return;
    }

    // 合計時間を表示
    document.getElementById('totalTime').textContent = formatTime(response.totalTime || 0);

    // ドメインリストを作成
    const domainList = document.getElementById('domainList');
    domainList.innerHTML = '';

    // ドメインを時間順にソート
    const sortedDomains = Object.entries(response.domains)
      .sort((a, b) => b[1].totalTime - a[1].totalTime)
      .slice(0, 10); // 上位10件のみ表示

    if (sortedDomains.length === 0) {
      domainList.innerHTML = '<div class="no-data">No data for today</div>';
      return;
    }

    sortedDomains.forEach(([domain, data]) => {
      const domainItem = document.createElement('div');
      domainItem.className = 'domain-item';

      const domainName = document.createElement('span');
      domainName.className = 'domain-name';
      domainName.textContent = domain;

      const domainTime = document.createElement('span');
      domainTime.className = 'domain-time';
      domainTime.textContent = formatTime(data.totalTime);

      // プログレスバー
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${(data.totalTime / response.totalTime) * 100}%`;
      progressBar.appendChild(progressFill);

      domainItem.appendChild(domainName);
      domainItem.appendChild(domainTime);
      domainItem.appendChild(progressBar);

      domainList.appendChild(domainItem);
    });
  } catch (error) {
    console.error('Error displaying today stats:', error);
  }
}

// データエクスポート機能
async function exportData() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTodayData' });

    if (!response || !response.domains) {
      alert('No data to export');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const dataStr = JSON.stringify(response, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webtime-tracker-${today}.json`;
    a.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data');
  }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDate();
  updateCurrentSession();
  displayTodayStats();

  // 1秒ごとに現在のセッションを更新
  currentSessionInterval = setInterval(updateCurrentSession, 1000);

  // 5秒ごとに統計を更新
  setInterval(displayTodayStats, 5000);

  // ボタンのイベントリスナー
  document.getElementById('optionsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);
});

// ポップアップが閉じられたときにインターバルをクリア
window.addEventListener('unload', () => {
  if (currentSessionInterval) {
    clearInterval(currentSessionInterval);
  }
});
