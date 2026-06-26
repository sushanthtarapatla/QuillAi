import mongoose from 'mongoose';

const documentationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  summary: { type: String, required: true },
  readme: { type: String, required: true },
  techStack: { type: String, required: true },
  folderStructureExplanation: { type: String, required: true },
  installationGuide: { type: String, required: true },
  features: { type: String, required: true },
  architectureOverview: { type: String, required: true },
  mermaidDiagram: { type: String, required: true },
  apiDocumentation: { type: String, default: '' },
  databaseExplanation: { type: String, default: '' },
  suggestedImprovements: { type: String, required: true },
  resumeProjectDescription: { type: String, required: true },
  interviewQuestions: { type: String, required: true },
  codeQualityScore: { type: Number, required: true, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

export const Documentation = mongoose.models.Documentation || mongoose.model('Documentation', documentationSchema);
