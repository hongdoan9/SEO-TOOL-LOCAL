import Queue from 'better-queue';
import SQLiteStore from 'better-queue-sqlite';
import path from 'path';

export const jobProgress = new Map();

import { processCreateAssets } from './jobs/create-assets.job.js';
import { processOptimizeDocs } from './jobs/optimize-docs.job.js';
import { 
    processTranslateKeys, 
    processCreateLangAssets, 
    processCleanTempAssets, 
    processOptimizeLangAssets 
} from './jobs/multi-lang.job.js';

// Tạo store riêng cho Queue để không đụng chạm db chính
const store = new SQLiteStore({
    path: path.join(process.cwd(), 'seo_tool_queue.db')
});

const stackQueue = new Queue(async (task, cb) => {
    try {
        let result;
        const jobId = task.id;
        console.log(`Bắt đầu xử lý task: ${task.type} cho stack ${task.stackId} (JobID: ${jobId})`);
        
        const updateProgress = (progress, message) => {
            if (jobId) {
                jobProgress.set(jobId, {
                    status: 'processing',
                    progress: progress,
                    message: message || `Đang xử lý...`
                });
            }
        };

        const payload = { stackId: task.stackId, updateProgress, ...task.data };
        
        switch (task.type) {
            case 'create_assets':
                result = await processCreateAssets(payload);
                break;
            case 'optimize_docs':
                result = await processOptimizeDocs(payload);
                break;
            case 'translate_keys':
                result = await processTranslateKeys(payload);
                break;
            case 'create_lang_assets':
                result = await processCreateLangAssets(payload);
                break;
            case 'clean_temp_assets':
                result = await processCleanTempAssets(payload);
                break;
            case 'optimize_lang_assets':
                result = await processOptimizeLangAssets(payload);
                break;
            default:
                throw new Error(`Loại task không được hỗ trợ: ${task.type}`);
        }
        
        cb(null, result);
    } catch (err) {
        console.error(`Lỗi xử lý task ${task.type}:`, err);
        cb(err);
    }
}, {
    store: store,
    concurrent: 2,
    maxRetries: 3,
    retryDelay: 2000
});

stackQueue.on('task_finish', function (taskId, result, stats) {
  console.log(`Task ${taskId} hoàn thành thành công.`);
  if (jobProgress.has(taskId)) {
      const current = jobProgress.get(taskId);
      jobProgress.set(taskId, { ...current, status: 'success', progress: 100, message: 'Hoàn tất!' });
  }
});
stackQueue.on('task_failed', function (taskId, err, stats) {
  console.error(`Task ${taskId} thất bại:`, err);
  if (jobProgress.has(taskId)) {
      const current = jobProgress.get(taskId);
      jobProgress.set(taskId, { ...current, status: 'error', message: err.message });
  }
});

export default stackQueue;
