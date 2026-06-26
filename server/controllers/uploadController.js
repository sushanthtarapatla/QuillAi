import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { storageService } from '../services/storageService.js';
import { gitService } from '../services/gitService.js';
import { extractZip, removeDirectory } from '../utils/fileSystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_BASE_DIR = path.join(__dirname, '../uploads');

// Helper to extract repo name from GitHub URL
function getRepoName(githubUrl) {
  try {
    const url = githubUrl.trim().replace(/\.git$/, '');
    const parts = url.split('/');
    return parts[parts.length - 1] || 'github-repo';
  } catch (err) {
    return 'github-repo';
  }
}

export const uploadController = {
  async uploadProject(req, res) {
    try {
      // 1. ZIP File upload path
      if (req.file) {
        const zipFile = req.file;
        const projectName = path.basename(zipFile.originalname, path.extname(zipFile.originalname));

        // Create project entry with status "extracting"
        const project = await storageService.createProject({
          name: projectName,
          sourceType: 'zip',
          status: 'extracting'
        });

        const targetDir = path.join(UPLOADS_BASE_DIR, project._id.toString());

        // Perform extraction asynchronously to prevent HTTP block
        (async () => {
          try {
            console.log(`Extracting zip for project ${project._id} to ${targetDir}...`);
            await extractZip(zipFile.path, targetDir);
            
            // Clean up temporary uploaded zip file
            await fs.unlink(zipFile.path);

            console.log(`Extraction complete. Setting project status to "analyzing"`);
            await storageService.updateProject(project._id.toString(), { status: 'analyzing' });
          } catch (err) {
            console.error(`Zip extraction background error for project ${project._id}:`, err);
            await storageService.updateProject(project._id.toString(), { 
              status: 'failed', 
              errorMessage: `Extraction failed: ${err.message}` 
            });
            // Clean up target folder on error
            await removeDirectory(targetDir);
            try { await fs.unlink(zipFile.path); } catch (_) {}
          }
        })();

        return res.status(202).json({
          message: 'ZIP uploaded and extraction started.',
          projectId: project._id,
          name: project.name,
          sourceType: project.sourceType,
          status: 'extracting'
        });
      }

      // 2. GitHub URL clone path
      const { githubUrl } = req.body;
      if (!githubUrl) {
        return res.status(400).json({ error: 'Please upload a ZIP file or provide a GitHub repository URL.' });
      }

      if (!gitService.isValidGitUrl(githubUrl)) {
        return res.status(400).json({ error: 'Invalid GitHub repository URL format.' });
      }

      const projectName = getRepoName(githubUrl);
      
      // Create project entry with status "extracting"
      const project = await storageService.createProject({
        name: projectName,
        sourceType: 'github',
        githubUrl: githubUrl,
        status: 'extracting'
      });

      const targetDir = path.join(UPLOADS_BASE_DIR, project._id.toString());

      // Perform Git cloning asynchronously
      (async () => {
        try {
          console.log(`Cloning git repository for project ${project._id} to ${targetDir}...`);
          await gitService.cloneRepository(githubUrl, targetDir);
          
          console.log(`Cloning complete. Setting project status to "analyzing"`);
          await storageService.updateProject(project._id.toString(), { status: 'analyzing' });
        } catch (err) {
          console.error(`Git cloning background error for project ${project._id}:`, err);
          await storageService.updateProject(project._id.toString(), { 
            status: 'failed', 
            errorMessage: err.message 
          });
          // Clean up target folder on error
          await removeDirectory(targetDir);
        }
      })();

      return res.status(202).json({
        message: 'GitHub cloning started.',
        projectId: project._id,
        name: project.name,
        sourceType: project.sourceType,
        status: 'extracting'
      });

    } catch (err) {
      console.error('Upload controller failed:', err);
      res.status(500).json({ error: `Upload process failed: ${err.message}` });
    }
  }
};
