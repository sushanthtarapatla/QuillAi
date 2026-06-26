import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Upload ZIP
  async uploadZip(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
    return response.data;
  },

  // Clone Git URL
  async cloneGit(githubUrl) {
    const response = await apiClient.post('/upload', { githubUrl });
    return response.data;
  },

  // Analyze structure & tech stack
  async analyzeProject(projectId) {
    const response = await apiClient.post('/analyze', { projectId });
    return response.data;
  },

  // Generate Gemini documentation
  async generateDocs(projectId, apiKey = null, modelName = null) {
    const response = await apiClient.post('/generate', { projectId, apiKey, modelName });
    return response.data;
  },

  // Poll project status
  async getProjectStatus(projectId) {
    const response = await apiClient.get(`/project/${projectId}/status`);
    return response.data;
  },

  // Fetch generated documentation
  async getDocumentation(projectId) {
    const response = await apiClient.get(`/documentation/${projectId}`);
    return response.data;
  },

  // Get project history list
  async getHistory() {
    const response = await apiClient.get('/history');
    return response.data;
  },

  // Purge/delete project
  async deleteProject(projectId) {
    const response = await apiClient.delete(`/project/${projectId}`);
    return response.data;
  },

  // Helper to build download endpoint URLs
  getDownloadUrl(projectId, format) {
    return `${API_BASE_URL}/download/${projectId}/${format}`;
  }
};
