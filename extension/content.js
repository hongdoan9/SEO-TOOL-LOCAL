console.log('[SEO Universal Agent Content Script] Đã kết nối trang:', window.location.href);

// Lắng nghe lệnh từ Background Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'EXECUTE_SCHEMA') {
    runSchemaExecution(message.taskData);
  }
});

// Thuật toán chờ Element xuất hiện bằng MutationObserver
function waitElement(selector, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    let timer;
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// Thuật toán gõ phím ngẫu nhiên mô phỏng người thật (Human Typing)
async function humanType(element, text) {
  element.focus();
  element.value = '';
  for (let i = 0; i < text.length; i++) {
    element.value += text[i];
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    const delay = Math.floor(Math.random() * 70) + 30; // 30ms - 100ms
    await new Promise(r => setTimeout(r, delay));
  }
}

// Chạy quy trình các bước trong Schema
async function runSchemaExecution(taskData) {
  const { taskId, schema, payload = {} } = taskData;
  const logs = [];
  const extractedData = {};

  try {
    const nameDisplay = schema.name || 'Task Schema';
    logs.push(`[${new Date().toLocaleTimeString()}] Bắt đầu thực thi ${nameDisplay}...`);

    for (const step of schema.steps || []) {
      logs.push(`-> Bước: ${step.name}`);

      for (const action of step.actions || []) {
        if (action.type === 'wait') {
          const el = await waitElement(action.selector, action.timeout || 10000);
          if (!el) {
            logs.push(`  ⚠ Bỏ qua phần tử (${action.selector}) do không tìm thấy.`);
            continue;
          }
          logs.push(`  + Tìm thấy phần tử ${action.selector}`);
        } else if (action.type === 'type') {
          const el = await waitElement(action.selector, action.timeout || 5000);
          if (el) {
            const valToType = payload[action.field] || action.value || '';
            await humanType(el, valToType);
            logs.push(`  + Đã gõ dữ liệu vào ${action.selector}`);
          } else {
            logs.push(`  ⚠ Không thấy ô nhập (${action.selector}).`);
          }
        } else if (action.type === 'click') {
          const el = await waitElement(action.selector, action.timeout || 5000);
          if (el) {
            el.click();
            logs.push(`  + Đã bấm nút ${action.selector}`);
            await new Promise(r => setTimeout(r, 1000));
          } else {
            logs.push(`  ⚠ Không thấy nút bấm (${action.selector}).`);
          }
        } else if (action.type === 'select') {
          const el = await waitElement(action.selector, action.timeout || 5000);
          if (el) {
            const valToSelect = payload[action.field] || action.value || '';
            el.value = valToSelect;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            logs.push(`  + Đã chọn '${valToSelect}' cho ${action.selector}`);
          }
        } else if (action.type === 'extract') {
          const el = await waitElement(action.selector, action.timeout || 5000);
          if (el) {
            const attr = action.attribute || 'innerText';
            const val = attr === 'innerText' ? el.innerText : el.getAttribute(attr);
            extractedData[action.key || 'extracted'] = val;
            logs.push(`  + Đã trích xuất '${action.key || 'extracted'}': ${val}`);
          }
        } else if (action.type === 'navigate') {
          const targetUrl = action.url || payload[action.field];
          if (targetUrl) {
            logs.push(`  + Chuyển hướng trang tới ${targetUrl}...`);
            window.location.href = targetUrl;
            return; // Đợi tab load lại ở bước tiếp theo
          }
        } else if (action.type === 'scroll') {
          const el = document.querySelector(action.selector);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            logs.push(`  + Đã cuộn tới phần tử ${action.selector}`);
          } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            logs.push(`  + Đã cuộn xuống cuối trang`);
          }
          await new Promise(r => setTimeout(r, 800));
        } else if (action.type === 'delay') {
          const ms = action.timeout || 2000;
          logs.push(`  + Tạm dừng ${ms}ms...`);
          await new Promise(r => setTimeout(r, ms));
        }
      }
    }

    logs.push(`[${new Date().toLocaleTimeString()}] Hoàn thành công việc tự động!`);

    chrome.runtime.sendMessage({
      action: 'TASK_REPORT',
      status: 'completed',
      profileUrl: window.location.href,
      resultData: { finalUrl: window.location.href, extracted: extractedData },
      logs: logs.join('\n')
    });
  } catch (err) {
    logs.push(`❌ LỖI THỰC THI: ${err.message}`);
    chrome.runtime.sendMessage({
      action: 'TASK_REPORT',
      status: 'failed',
      profileUrl: '',
      resultData: {},
      logs: logs.join('\n')
    });
  }
}
