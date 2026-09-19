const UNIFIED_URL = 'http://localhost:5050/api/system-tasks';
const LEGACY_URL = 'http://localhost:5050/api/profile-creation';
let currentTask = null;

console.log('[SEO Universal Agent] Worker đã sẵn sàng...');

// Hàm kiểm tra nhiệm vụ từ Backend Unified Engine
async function checkNextTask() {
  if (currentTask) {
    console.log('[SEO Agent] Đang thực thi task cũ, tạm dừng nhận task mới.');
    return;
  }

  try {
    // 1. Thử lấy Task từ Unified System Engine trước
    let response = await fetch(`${UNIFIED_URL}/next-task`);
    let isUnified = true;

    if (!response.ok) {
      // Fallback về Legacy endpoint nếu Unified endpoint chưa sẵn sàng
      response = await fetch(`${LEGACY_URL}/agent/next-task`);
      isUnified = false;
    }

    if (!response.ok) return;

    const data = await response.json();
    if (data.hasTask) {
      console.log(`[SEO Agent] ĐÃ NHẬN NHIỆM VỤ MỚI (${isUnified ? 'Unified' : 'Legacy'}):`, data);
      currentTask = { ...data, isUnified };
      executeTask(currentTask);
    }
  } catch (err) {
    console.log('[SEO Agent] Chờ kết nối SEO Tool Backend (localhost:5050)...');
  }
}

// Thực thi nhiệm vụ
async function executeTask(taskData) {
  const { schema, taskId, platform, taskName, isUnified } = taskData;
  const nameDisplay = taskName || platform || 'Task';

  if (!schema || !schema.steps || schema.steps.length === 0) {
    reportTask(taskId, 'failed', null, `Schema của ${nameDisplay} không hợp lệ.`, isUnified);
    currentTask = null;
    return;
  }

  const firstStep = schema.steps[0];
  const targetUrl = firstStep.target_url || schema.urls?.register || schema.urls?.login_email;

  if (!targetUrl) {
    reportTask(taskId, 'failed', null, 'Không tìm thấy Target URL trong Schema.', isUnified);
    currentTask = null;
    return;
  }

  console.log(`[SEO Agent] Đang mở tab cho ${nameDisplay}: ${targetUrl}`);

  function attachTabListener(tabId, taskId, taskData) {
    const listener = (message, sender) => {
      if (sender.tab && sender.tab.id === tabId && message.action === 'TASK_REPORT') {
        reportTask(taskId, message.status, { profileUrl: message.profileUrl }, message.logs, isUnified);
        chrome.runtime.onMessage.removeListener(listener);
        currentTask = null;
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    chrome.tabs.onUpdated.addListener(function tabUpdateListener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);
        
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'EXECUTE_SCHEMA',
            taskData: taskData
          }).catch((err) => {
            console.error('[SEO Agent] Gửi message tới content script thất bại:', err);
            currentTask = null;
          });
        }, 1200);
      }
    });
  }

  // Mở Window ẩn danh hoặc Tab bình thường
  chrome.windows.create({ url: targetUrl, incognito: true }, (win) => {
    if (chrome.runtime.lastError || !win) {
      chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
        attachTabListener(tab.id, taskId, taskData);
      });
    } else {
      const tabId = win.tabs[0].id;
      attachTabListener(tabId, taskId, taskData);
    }
  });
}

// Báo cáo về Backend
async function reportTask(taskId, status, resultData, logs, isUnified = true) {
  try {
    if (isUnified) {
      await fetch(`${UNIFIED_URL}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status, resultData, logs })
      });
    } else {
      await fetch(`${LEGACY_URL}/agent/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status, profileUrl: resultData?.profileUrl || '', logs })
      });
    }
    console.log(`[SEO Agent] Đã báo cáo Task #${taskId}: ${status}`);
  } catch (err) {
    console.error('[SEO Agent] Lỗi báo cáo về Backend:', err);
  }
}

// Đặt Alarm kiểm tra định kỳ 5 giây
chrome.alarms.create('check_tasks_alarm', { periodInMinutes: 0.1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check_tasks_alarm') {
    checkNextTask();
  }
});

// Trigger thủ công khi click icon Extension
chrome.action.onClicked.addListener(() => {
  console.log('[SEO Agent] Reset task & trigger kiểm tra ngay lập tức...');
  currentTask = null;
  checkNextTask();
});

checkNextTask();
