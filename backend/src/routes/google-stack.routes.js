import express from 'express';
import { getStacks, createStack, deleteStack, getStackDetail, saveKeywords, savePrepCheck } from '../controllers/google-stack/stack-crud.controller.js';
import { 
  runAssets, createTempTemplates, updateAssetsChecked, resetAssets, 
  getStep4Data, saveStep4Data 
} from '../controllers/google-stack/stack-assets.controller.js';
import { uploadStep4File, uploadStep4Images } from '../controllers/google-stack/stack-images.controller.js';
import { syncStep4Drive } from '../controllers/google-stack/stack-sync.controller.js';
import { optimizePdf, optimizeSheet } from '../controllers/google-stack/stack-optimize.controller.js';
import { addJob, getJobStatus } from '../controllers/google-stack-v2/queue.controller.js';
import { uploadFileStream } from '../controllers/google-stack-v2/stream.controller.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/temp/' });

const router = express.Router();

router.get('/:projectId', getStacks);
router.post('/:projectId', createStack);
router.delete('/:id', deleteStack);
router.get('/detail/:id', getStackDetail);
router.post('/keywords/:id', saveKeywords);
router.post('/prep-check/:id', savePrepCheck);

router.post('/create-temp-templates/:id', createTempTemplates);
router.post('/assets-checked/:id', updateAssetsChecked);
router.post('/reset-assets/:id', resetAssets);
router.get('/step4/:id', getStep4Data);
router.post('/step4/:id', saveStep4Data);
router.post('/step4/upload-file/:id', upload.single('file'), uploadStep4File);
router.post('/step4/upload-images/:id', upload.array('images', 12), uploadStep4Images);
router.post('/step4/sync-drive/:id', syncStep4Drive);

router.post('/optimize-pdf/:id', optimizePdf);
router.post('/optimize-sheet/:id', optimizeSheet);

// Queue Endpoints
router.post('/queue/:id', addJob);
router.get('/queue/status/:jobId', getJobStatus);

// Stream Upload Endpoint
router.post('/stream/upload', uploadFileStream);

export default router;