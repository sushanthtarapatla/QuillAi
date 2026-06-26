import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// Default folders to ignore
export const IGNORE_FOLDERS = new Set([
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage',
  '.cache',
  '.next',
  '.idea',
  '.vscode',
  '__pycache__',
  'venv',
  '.venv',
  'env',
  '.env',
  'target',
  'bin',
  'obj'
]);

// Binary / media extensions to ignore
export const IGNORE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.mp4', '.mov', '.avi', '.mp3', '.wav', '.flac',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.epub', '.docx', '.xlsx', '.pptx',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.db', '.sqlite',
  '.woff', '.woff2', '.eot', '.ttf', '.otf'
]);

// Helper to check if a file path is safe (prevent directory traversal)
export function isPathSafe(baseDir, targetPath) {
  const relative = path.relative(baseDir, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

// Ensure dir exists
export async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

// Clean/delete directory
export async function removeDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to remove directory ${dirPath}:`, err);
  }
}

// Unzip a file securely to target directory
export async function extractZip(zipFilePath, targetDir) {
  await ensureDirectory(targetDir);
  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  for (const entry of zipEntries) {
    // Zip Slip security vulnerability check
    const entryPath = entry.entryName;
    const resolvedPath = path.join(targetDir, entryPath);
    
    // Resolve absolute path and verify it stays inside targetDir
    const absoluteTargetDir = path.resolve(targetDir);
    const absoluteResolvedPath = path.resolve(resolvedPath);
    
    if (!absoluteResolvedPath.startsWith(absoluteTargetDir)) {
      throw new Error(`Security Violation: Zip entry attempts traversal outside extraction target directory: ${entryPath}`);
    }

    if (entry.isDirectory) {
      await ensureDirectory(resolvedPath);
    } else {
      await ensureDirectory(path.dirname(resolvedPath));
      await fs.writeFile(resolvedPath, entry.getData());
    }
  }
}

// Check if a file is text or binary
export function isTextFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IGNORE_EXTENSIONS.has(ext)) return false;
  return true;
}

// Recursively traverse directory to build folder tree JSON
export async function buildFolderTree(dirPath, currentPath = '', baseDir = dirPath) {
  const fullPath = path.join(dirPath, currentPath);
  const stats = await fs.stat(fullPath);
  const basename = path.basename(fullPath);

  if (stats.isDirectory()) {
    if (IGNORE_FOLDERS.has(basename)) return null;

    const files = await fs.readdir(fullPath);
    const children = [];
    
    for (const file of files) {
      const childTree = await buildFolderTree(dirPath, path.join(currentPath, file), baseDir);
      if (childTree) {
        children.push(childTree);
      }
    }

    // Sort: directories first, then files alphabetically
    children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      name: basename || 'root',
      type: 'directory',
      path: currentPath.replace(/\\/g, '/'),
      children
    };
  } else {
    const ext = path.extname(basename).toLowerCase();
    if (IGNORE_EXTENSIONS.has(ext) || basename.startsWith('.')) return null;

    return {
      name: basename,
      type: 'file',
      path: currentPath.replace(/\\/g, '/'),
      size: stats.size
    };
  }
}

// Read text file contents safely
export async function readTextFile(filePath, maxBytes = 50 * 1024) {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > maxBytes) {
      return `[File size too large for analysis: ${(stats.size / 1024).toFixed(1)} KB]`;
    }
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (err) {
    return `[Error reading file: ${err.message}]`;
  }
}
