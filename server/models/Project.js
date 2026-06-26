import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sourceType: { type: String, enum: ['zip', 'github'], required: true },
  githubUrl: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'extracting', 'analyzing', 'generating', 'completed', 'failed'], 
    default: 'pending' 
  },
  errorMessage: { type: String },
  technologies: [{ type: String }],
  folderStructure: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
