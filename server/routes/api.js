import express from 'express';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';
import { uploadController } from '../controllers/uploadController.js';
import { analyzeController } from '../controllers/analyzeController.js';
import { docController } from '../controllers/docController.js';

const router = express.Router();

// Project upload & git clone
router.post('/upload', uploadMiddleware.single('file'), uploadController.uploadProject);

// Project analysis
router.post('/analyze', analyzeController.analyzeProject);

// AI documentation generation
router.post('/generate', docController.generateDocs);

// History listing
router.get('/history', docController.getHistory);

// Project status polling
router.get('/project/:projectId/status', docController.getProjectStatus);

// Get single project's documentation
router.get('/documentation/:projectId', docController.getDocumentation);

// Download exports (readme, docx, pdf)
router.get('/download/:projectId/:format', docController.downloadDocumentation);

// Delete project and docs
router.delete('/project/:projectId', docController.deleteProject);

export default router;
