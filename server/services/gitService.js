import simpleGit from 'simple-git';
import path from 'path';
import { removeDirectory, ensureDirectory } from '../utils/fileSystem.js';

// Simple regex to validate HTTP/HTTPS git URLs
const GIT_URL_REGEX = /^(https?:\/\/)?([\w.-]+)+([\w/.-]+)+$/;

export const gitService = {
  isValidGitUrl(url) {
    if (!url) return false;
    return GIT_URL_REGEX.test(url);
  },

  async cloneRepository(githubUrl, localPath) {
    if (!this.isValidGitUrl(githubUrl)) {
      throw new Error('Invalid GitHub repository URL format.');
    }

    // Standardize URL: ensure we append .git if missing, or handle standard web URLs
    let repoUrl = githubUrl.trim();
    if (!repoUrl.endsWith('.git')) {
      repoUrl = repoUrl + '.git';
    }

    await ensureDirectory(localPath);
    const git = simpleGit();

    try {
      console.log(`Cloning repository ${repoUrl} to ${localPath}...`);
      // Clone with depth 1 to speed up operations and minimize storage footprint
      await git.clone(repoUrl, localPath, ['--depth', '1']);
      console.log(`Cloning successful.`);
      return true;
    } catch (err) {
      console.error(`Git clone failed for ${repoUrl}:`, err);
      // Clean up directory if clone failed
      await removeDirectory(localPath);
      
      if (err.message.includes('Authentication failed') || err.message.includes('not found') || err.message.includes('Could not read from remote')) {
        throw new Error('Repository not found, or it is private. Please provide a public GitHub URL.');
      }
      throw new Error(`Failed to clone repository: ${err.message}`);
    }
  }
};
