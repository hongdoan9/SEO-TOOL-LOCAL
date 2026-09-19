import stackQueue, { jobProgress } from '../../queue/stack-job.queue.js';
// Import db query nếu cần thiết để thao tác CSDL

export async function addJob(req, res) {
    const { id } = req.params; // project ID or stack ID
    const { type, data } = req.body;

    try {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        // Khởi tạo progress
        jobProgress.set(jobId, { status: 'pending', progress: 0, message: 'Đang chờ xử lý...' });

        // Đẩy job vào Queue (Local)
        stackQueue.push({ id: jobId, stackId: id, type, data });
        
        res.json({ 
            message: 'Đã đưa tiến trình vào hàng đợi chạy ngầm (Background Queue).',
            jobId: jobId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getJobStatus(req, res) {
    const { jobId } = req.params;
    
    const progressData = jobProgress.get(jobId);
    if (!progressData) {
        return res.json({
            jobId,
            status: 'not_found',
            progress: 0,
            message: 'Không tìm thấy tiến trình này hoặc đã hoàn tất từ lâu.'
        });
    }

    res.json({
        jobId,
        status: progressData.status,
        progress: progressData.progress,
        message: progressData.message
    });
}
