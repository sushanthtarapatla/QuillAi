import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { storageService } from '../services/storageService.js';
import { buildFolderTree } from '../utils/fileSystem.js';
import { analysisService } from '../services/analysisService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_BASE_DIR = path.join(__dirname, '../uploads');

export const analyzeController = {
  async analyzeProject(req, res) {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Missing projectId in request body.' });
    }

    try {
      const project = await storageService.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const targetDir = path.join(UPLOADS_BASE_DIR, projectId.toString());

      // Verify directory exists
      try {
        await fs.access(targetDir);
      } catch (err) {
        await storageService.updateProject(projectId, { 
          status: 'failed', 
          errorMessage: 'Project directory not found or was deleted.' 
        });
        return res.status(400).json({ error: 'Project files are missing on server. Please upload again.' });
      }

      // Update status to analyzing
      await storageService.updateProject(projectId, { status: 'analyzing' });

      console.log(`Starting structural analysis for project: ${project.name} (${projectId})...`);
      
      // Build directory tree
      const folderTree = await buildFolderTree(targetDir);
      if (!folderTree) {
        throw new Error('Failed to generate folder tree. Project may be empty.');
      }

      // Detect technologies
      const technologies = await analysisService.detectTechnologies(targetDir, folderTree);

      // Save folder structure and detected technologies to database, and set status to "generating"
      const updatedProject = await storageService.updateProject(projectId, {
        folderStructure: folderTree,
        technologies: technologies,
        status: 'generating' // Ready for AI generation step
      });

      console.log(`Analysis complete for project ${project.name}. Detected:`, technologies);

      return res.status(200).json({
        message: 'Project analysis completed.',
        projectId: updatedProject._id,
        name: updatedProject.name,
        technologies: updatedProject.technologies,
        folderStructure: updatedProject.folderStructure,
        status: updatedProject.status
      });

    } catch (err) {
      console.error(`Analysis failed for project ${projectId}:`, err);
      await storageService.updateProject(projectId, { 
        status: 'failed', 
        errorMessage: `Analysis failed: ${err.message}` 
      });
      res.status(500).json({ error: `Analysis failed: ${err.message}` });
    }
  }
};
