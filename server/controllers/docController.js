import path from 'path';
import { fileURLToPath } from 'url';
import { storageService } from '../services/storageService.js';
import { geminiService } from '../services/geminiService.js';
import { analysisService } from '../services/analysisService.js';
import { removeDirectory } from '../utils/fileSystem.js';
import { generateDocx } from '../utils/docxExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_BASE_DIR = path.join(__dirname, '../uploads');

// Simple helper to format folder tree recursively as indentation text
function folderTreeToText(node, indent = '') {
  if (!node) return '';
  let result = `${indent}${node.type === 'directory' ? '📁' : '📄'} ${node.name}\n`;
  if (node.type === 'directory' && node.children) {
    node.children.forEach(child => {
      result += folderTreeToText(child, indent + '  ');
    });
  }
  return result;
}

export const docController = {
  async generateDocs(req, res) {
    const { projectId, apiKey, modelName } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Missing projectId.' });
    }

    try {
      const project = await storageService.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      // Update status to generating
      await storageService.updateProject(projectId, { status: 'generating' });

      const targetDir = path.join(UPLOADS_BASE_DIR, projectId.toString());

      // Perform AI Generation in background to prevent HTTP timeout
      (async () => {
        try {
          console.log(`Starting AI Documentation generation for: ${project.name}...`);
          
          // 1. Gather file contents
          const fileContents = await analysisService.analyzeCodebase(targetDir);
          
          // 2. Format folder tree
          const folderTreeText = folderTreeToText(project.folderStructure);

          // 3. Call Gemini
          const generatedDoc = await geminiService.generateDocumentation({
            projectName: project.name,
            technologies: project.technologies,
            folderTreeText,
            fileContents,
            userApiKey: apiKey,
            modelName: modelName || 'gemini-1.5-flash'
          });

          // 4. Save documentation to DB
          await storageService.createDocumentation({
            projectId: project._id.toString(),
            ...generatedDoc
          });

          // 5. Cleanup the uploaded project files (security & storage optimization)
          console.log(`Cleaning up uploaded codebase files from ${targetDir}...`);
          await removeDirectory(targetDir);

          // 6. Set status to completed
          await storageService.updateProject(projectId, { status: 'completed' });
          console.log(`Documentation generation complete for ${project.name}.`);

        } catch (err) {
          console.error(`AI Generation failed in background for project ${projectId}:`, err);
          await storageService.updateProject(projectId, {
            status: 'failed',
            errorMessage: err.message
          });
        }
      })();

      return res.status(202).json({
        message: 'AI documentation generation started.',
        projectId: project._id,
        status: 'generating'
      });

    } catch (err) {
      console.error('Doc generator failed:', err);
      res.status(500).json({ error: `Generation startup failed: ${err.message}` });
    }
  },

  async getHistory(req, res) {
    try {
      const history = await storageService.listHistory();
      res.status(200).json(history);
    } catch (err) {
      console.error('Failed to get history:', err);
      res.status(500).json({ error: 'Failed to retrieve analysis history.' });
    }
  },

  async getDocumentation(req, res) {
    const { projectId } = req.params;
    try {
      const doc = await storageService.getDocumentationByProjectId(projectId);
      if (!doc) {
        return res.status(404).json({ error: 'Documentation not found for this project.' });
      }
      res.status(200).json(doc);
    } catch (err) {
      console.error('Failed to get documentation:', err);
      res.status(500).json({ error: 'Failed to retrieve documentation.' });
    }
  },

  async getProjectStatus(req, res) {
    const { projectId } = req.params;
    try {
      const project = await storageService.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      res.status(200).json(project);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get project details.' });
    }
  },

  async downloadDocumentation(req, res) {
    const { projectId, format } = req.params;

    try {
      const project = await storageService.getProject(projectId);
      const doc = await storageService.getDocumentationByProjectId(projectId);

      if (!project || !doc) {
        return res.status(404).json({ error: 'Project or Documentation not found.' });
      }

      if (format === 'readme') {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="README-${project.name}.md"`);
        return res.send(doc.readme);
      } 
      
      else if (format === 'docx') {
        const buffer = await generateDocx(project.name, doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="Documentation-${project.name}.docx"`);
        return res.send(buffer);
      } 
      
      else if (format === 'pdf') {
        // Return a clean HTML layout styled for printing
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${project.name} - Project Documentation</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 900px;
                  margin: 0 auto;
                  padding: 40px 20px;
                }
                h1, h2, h3, h4 {
                  color: #111;
                  font-weight: 600;
                  margin-top: 24px;
                  page-break-after: avoid;
                }
                h1 { border-bottom: 2px solid #eaecef; padding-bottom: 10px; font-size: 2.2em; }
                h2 { border-bottom: 1px solid #eaecef; padding-bottom: 6px; font-size: 1.6em; margin-top: 36px; }
                pre {
                  background-color: #f6f8fa;
                  padding: 16px;
                  border-radius: 6px;
                  overflow-x: auto;
                  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
                  font-size: 85%;
                }
                code {
                  background-color: rgba(27, 31, 35, 0.05);
                  padding: 0.2em 0.4em;
                  border-radius: 3px;
                  font-family: monospace;
                  font-size: 85%;
                }
                pre code { background-color: transparent; padding: 0; }
                blockquote {
                  border-left: 0.25em solid #dfe2e5;
                  color: #6a737d;
                  padding: 0 1em;
                  margin-left: 0;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 16px;
                }
                table th, table td {
                  border: 1px solid #dfe2e5;
                  padding: 6px 13px;
                }
                table tr:nth-child(even) { background-color: #f6f8fa; }
                .page-break {
                  page-break-before: always;
                }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="no-print" style="background: #f1f3f4; padding: 12px; border-radius: 4px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <span>📄 This page is formatted for PDF export. Press <strong>Ctrl+P</strong> (or Cmd+P) and select "Save as PDF".</span>
                <button onclick="window.print()" style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Print / Save to PDF</button>
              </div>

              <h1>${project.name} - Project Documentation</h1>
              
              <h2>1. Executive Summary</h2>
              <div>${doc.summary.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>2. Technology Stack</h2>
              <div>${doc.techStack.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>3. Folder Structure Explanation</h2>
              <div>${doc.folderStructureExplanation.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>4. Installation & Setup Guide</h2>
              <div>${doc.installationGuide.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>5. Features</h2>
              <div>${doc.features.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>6. Architecture Overview</h2>
              <div>${doc.architectureOverview.replace(/\n/g, '<br>')}</div>
              
              <h2>7. Sequence & Flow Diagrams (Mermaid)</h2>
              <pre>${doc.mermaidDiagram}</pre>
              
              <div class="page-break"></div>
              <h2>8. API Documentation</h2>
              <div>${doc.apiDocumentation ? doc.apiDocumentation.replace(/\n/g, '<br>') : 'No API endpoints detected.'}</div>
              
              <div class="page-break"></div>
              <h2>9. Database Description</h2>
              <div>${doc.databaseExplanation ? doc.databaseExplanation.replace(/\n/g, '<br>') : 'No database detected.'}</div>
              
              <div class="page-break"></div>
              <h2>10. Suggested Improvements</h2>
              <div>${doc.suggestedImprovements.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>11. Resume Project Description</h2>
              <div>${doc.resumeProjectDescription.replace(/\n/g, '<br>')}</div>
              
              <div class="page-break"></div>
              <h2>12. Interview Preparation</h2>
              <div>${doc.interviewQuestions.replace(/\n/g, '<br>')}</div>

              <script>
                // Automatically open print dialog
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
      }

      res.status(400).json({ error: 'Unsupported format requested.' });

    } catch (err) {
      console.error('Download failed:', err);
      res.status(500).json({ error: `Download failed: ${err.message}` });
    }
  },

  async deleteProject(req, res) {
    const { projectId } = req.params;
    try {
      await storageService.deleteProject(projectId);
      
      // Clean up folders if they still exist
      const targetDir = path.join(UPLOADS_BASE_DIR, projectId.toString());
      await removeDirectory(targetDir);

      res.status(200).json({ message: 'Project and all generated documentation purged successfully.' });
    } catch (err) {
      console.error('Delete failed:', err);
      res.status(500).json({ error: `Purge failed: ${err.message}` });
    }
  }
};
