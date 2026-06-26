import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Project } from '../models/Project.js';
import { Documentation } from '../models/Documentation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE_PATH = path.join(__dirname, '../data/db.json');

// Ensure data folder and db.json exist for fallback mode
async function ensureLocalDb() {
  const dir = path.dirname(DB_FILE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // Already exists or can't create
  }

  try {
    await fs.access(DB_FILE_PATH);
  } catch (err) {
    // File doesn't exist, create it with empty structure
    await fs.writeFile(DB_FILE_PATH, JSON.stringify({ projects: [], documentations: [] }, null, 2));
  }
}

// Read local DB
async function readLocalDb() {
  await ensureLocalDb();
  const data = await fs.readFile(DB_FILE_PATH, 'utf8');
  return JSON.parse(data);
}

// Write local DB
async function writeLocalDb(data) {
  await ensureLocalDb();
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2));
}

// Helper to determine if we should use MongoDB
function isMongoEnabled() {
  return !!process.env.MONGODB_URI;
}

export const storageService = {
  // --- PROJECT OPERATIONS ---
  async createProject(projectData) {
    if (isMongoEnabled()) {
      try {
        const project = new Project(projectData);
        return await project.save();
      } catch (err) {
        console.error('Mongo save failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    const newProject = {
      _id: crypto.randomUUID(),
      status: 'pending',
      technologies: [],
      folderStructure: {},
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.projects.push(newProject);
    await writeLocalDb(db);
    return newProject;
  },

  async updateProject(id, updateData) {
    if (isMongoEnabled()) {
      try {
        return await Project.findByIdAndUpdate(id, { ...updateData, updatedAt: Date.now() }, { new: true });
      } catch (err) {
        console.error('Mongo update failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    const index = db.projects.findIndex(p => p._id === id);
    if (index === -1) return null;

    db.projects[index] = {
      ...db.projects[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    await writeLocalDb(db);
    return db.projects[index];
  },

  async getProject(id) {
    if (isMongoEnabled()) {
      try {
        const project = await Project.findById(id);
        if (project) return project;
      } catch (err) {
        console.error('Mongo get failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    return db.projects.find(p => p._id === id) || null;
  },

  async deleteProject(id) {
    if (isMongoEnabled()) {
      try {
        await Project.findByIdAndDelete(id);
        await Documentation.findOneAndDelete({ projectId: id });
        return true;
      } catch (err) {
        console.error('Mongo delete failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    db.projects = db.projects.filter(p => p._id !== id);
    db.documentations = db.documentations.filter(d => d.projectId !== id);
    await writeLocalDb(db);
    return true;
  },

  // --- DOCUMENTATION OPERATIONS ---
  async createDocumentation(docData) {
    if (isMongoEnabled()) {
      try {
        // If doc exists for this project, update it, else create
        let doc = await Documentation.findOne({ projectId: docData.projectId });
        if (doc) {
          Object.assign(doc, docData);
          return await doc.save();
        } else {
          doc = new Documentation(docData);
          return await doc.save();
        }
      } catch (err) {
        console.error('Mongo save doc failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    const existingIndex = db.documentations.findIndex(d => d.projectId === docData.projectId);
    
    const newDoc = {
      _id: crypto.randomUUID(),
      ...docData,
      createdAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      db.documentations[existingIndex] = {
        ...db.documentations[existingIndex],
        ...newDoc
      };
    } else {
      db.documentations.push(newDoc);
    }

    await writeLocalDb(db);
    return newDoc;
  },

  async getDocumentation(id) {
    if (isMongoEnabled()) {
      try {
        const doc = await Documentation.findById(id);
        if (doc) return doc;
      } catch (err) {
        console.error('Mongo get doc failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    return db.documentations.find(d => d._id === id) || null;
  },

  async getDocumentationByProjectId(projectId) {
    if (isMongoEnabled()) {
      try {
        const doc = await Documentation.findOne({ projectId });
        if (doc) return doc;
      } catch (err) {
        console.error('Mongo get doc by project failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    return db.documentations.find(d => d.projectId === projectId) || null;
  },

  // --- HISTORY & LISTS ---
  async listProjects() {
    if (isMongoEnabled()) {
      try {
        return await Project.find().sort({ createdAt: -1 });
      } catch (err) {
        console.error('Mongo list failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    return [...db.projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async listHistory() {
    if (isMongoEnabled()) {
      try {
        // Query projects and join documentation basic properties
        const projects = await Project.find().sort({ createdAt: -1 }).lean();
        const history = [];
        for (const p of projects) {
          const doc = await Documentation.findOne({ projectId: p._id }).select('codeQualityScore summary').lean();
          history.push({
            ...p,
            documentationId: doc ? doc._id : null,
            codeQualityScore: doc ? doc.codeQualityScore : null,
            summary: doc ? doc.summary : null
          });
        }
        return history;
      } catch (err) {
        console.error('Mongo list history failed, using local fallback:', err);
      }
    }

    // Local fallback
    const db = await readLocalDb();
    const history = db.projects.map(p => {
      const doc = db.documentations.find(d => d.projectId === p._id);
      return {
        ...p,
        documentationId: doc ? doc._id : null,
        codeQualityScore: doc ? doc.codeQualityScore : null,
        summary: doc ? doc.summary : null
      };
    });
    return [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};
