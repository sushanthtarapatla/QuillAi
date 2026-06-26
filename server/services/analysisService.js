import fs from 'fs/promises';
import path from 'path';
import { readTextFile, IGNORE_FOLDERS, IGNORE_EXTENSIONS } from '../utils/fileSystem.js';

// Dictionary of technologies to scan for in dependency manifests or filenames
const TECH_MARKERS = {
  dependencies: {
    react: 'React',
    vue: 'Vue',
    angular: 'Angular',
    svelte: 'Svelte',
    'solid-js': 'SolidJS',
    next: 'Next.js',
    nuxt: 'Nuxt.js',
    gatsby: 'Gatsby',
    express: 'Express',
    koa: 'Koa',
    fastify: 'Fastify',
    nestjs: 'NestJS',
    mongoose: 'Mongoose (MongoDB)',
    sequelize: 'Sequelize (SQL)',
    prisma: 'Prisma ORM',
    pg: 'PostgreSQL',
    mysql2: 'MySQL',
    mongodb: 'MongoDB',
    django: 'Django',
    flask: 'Flask',
    fastapi: 'Fastapi',
    tailwindcss: 'Tailwind CSS',
    bootstrap: 'Bootstrap',
    firebase: 'Firebase',
    'spring-boot': 'Spring Boot',
    flutter: 'Flutter'
  },
  files: {
    'Dockerfile': 'Docker',
    'docker-compose.yml': 'Docker Compose',
    'tailwind.config.js': 'Tailwind CSS',
    'tailwind.config.ts': 'Tailwind CSS',
    'tsconfig.json': 'TypeScript',
    'next.config.js': 'Next.js',
    'vite.config.js': 'Vite',
    'vite.config.ts': 'Vite',
    'webpack.config.js': 'Webpack',
    'requirements.txt': 'Python',
    'Pipfile': 'Python',
    'pyproject.toml': 'Python',
    'go.mod': 'Go',
    'pom.xml': 'Maven (Java)',
    'build.gradle': 'Gradle (Java)',
    'pubspec.yaml': 'Flutter/Dart',
    'Cargo.toml': 'Rust',
    'composer.json': 'PHP',
    'Gemfile': 'Ruby'
  }
};

// Helper to recursively collect files for analysis
async function getImportantFiles(dirPath, currentDir = '', list = []) {
  const fullPath = path.join(dirPath, currentDir);
  const stats = await fs.stat(fullPath);
  const basename = path.basename(fullPath);

  if (stats.isDirectory()) {
    if (IGNORE_FOLDERS.has(basename)) return list;
    const files = await fs.readdir(fullPath);
    for (const file of files) {
      await getImportantFiles(dirPath, path.join(currentDir, file), list);
    }
  } else {
    const ext = path.extname(basename).toLowerCase();
    if (IGNORE_EXTENSIONS.has(ext)) return list;

    let priority = 0; // Higher means more important to analyze

    const filenameLower = basename.toLowerCase();
    
    // Manifest files
    if (['package.json', 'requirements.txt', 'pom.xml', 'build.gradle', 'go.mod', 'pubspec.yaml', 'cargo.toml', 'composer.json', 'gemfile'].includes(filenameLower)) {
      priority = 10;
    }
    // Entry points and configs
    else if (['server.js', 'app.js', 'index.js', 'main.py', 'app.py', 'manage.py', 'main.go', 'dockerfile', 'docker-compose.yml', 'vite.config.js', 'vite.config.ts'].includes(filenameLower)) {
      priority = 8;
    }
    // Web application main entry
    else if (['app.jsx', 'app.tsx', 'main.jsx', 'main.tsx', 'index.html'].includes(filenameLower)) {
      priority = 7;
    }
    // Architectural components (routes, controllers, models, schemas, services)
    else if (
      fullPath.includes(`${path.sep}routes${path.sep}`) ||
      fullPath.includes(`${path.sep}controllers${path.sep}`) ||
      fullPath.includes(`${path.sep}models${path.sep}`) ||
      fullPath.includes(`${path.sep}schemas${path.sep}`) ||
      fullPath.includes(`${path.sep}services${path.sep}`) ||
      filenameLower.endsWith('.routes.js') ||
      filenameLower.endsWith('.controller.js') ||
      filenameLower.endsWith('.model.js')
    ) {
      priority = 6;
    }

    if (priority > 0) {
      list.push({
        relativePath: currentDir.replace(/\\/g, '/'),
        fullPath,
        size: stats.size,
        priority
      });
    }
  }
  return list;
}

export const analysisService = {
  async detectTechnologies(dirPath, folderTree) {
    const detected = new Set();
    const manifestFiles = [];

    // Search folderTree nodes for files
    const traverseTree = (node) => {
      if (!node) return;
      if (node.type === 'file') {
        const marker = TECH_MARKERS.files[node.name];
        if (marker) {
          detected.add(marker);
        }
        if (['package.json', 'requirements.txt', 'pom.xml', 'build.gradle', 'go.mod', 'pubspec.yaml'].includes(node.name.toLowerCase())) {
          manifestFiles.push(path.join(dirPath, node.path));
        }
      } else if (node.type === 'directory' && node.children) {
        node.children.forEach(traverseTree);
      }
    };

    traverseTree(folderTree);

    // Look inside manifests to refine dependencies
    for (const manifestPath of manifestFiles) {
      try {
        const basename = path.basename(manifestPath).toLowerCase();
        const content = await fs.readFile(manifestPath, 'utf8');

        if (basename === 'package.json') {
          const pkg = JSON.parse(content);
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          
          for (const [dep, label] of Object.entries(TECH_MARKERS.dependencies)) {
            if (allDeps[dep]) {
              detected.add(label);
            }
          }
          if (pkg.devDependencies && pkg.devDependencies.typescript) {
            detected.add('TypeScript');
          }
        } 
        else if (basename === 'requirements.txt') {
          const lines = content.split('\n');
          for (const line of lines) {
            const cleanLine = line.split('=')[0].split('>')[0].split('<')[0].trim().toLowerCase();
            const label = TECH_MARKERS.dependencies[cleanLine];
            if (label) {
              detected.add(label);
            }
          }
        }
        else if (basename === 'pom.xml') {
          if (content.includes('spring-boot')) detected.add('Spring Boot');
          if (content.includes('hibernate')) detected.add('Hibernate');
        }
        else if (basename === 'build.gradle') {
          if (content.includes('spring-boot')) detected.add('Spring Boot');
        }
      } catch (err) {
        console.error(`Failed to parse manifest ${manifestPath}:`, err);
      }
    }

    // Infer general categories
    if (detected.has('React') || detected.has('Vue') || detected.has('Angular') || detected.has('Svelte') || detected.has('Next.js') || detected.has('Nuxt.js')) {
      detected.add('Frontend');
    }
    if (detected.has('Express') || detected.has('Flask') || detected.has('Django') || detected.has('Fastapi') || detected.has('Spring Boot') || detected.has('NestJS')) {
      detected.add('Backend');
    }

    // Fallback if empty
    if (detected.size === 0) {
      // Look at file extensions in tree
      const exts = new Set();
      const traverseExts = (node) => {
        if (node.type === 'file') {
          exts.add(path.extname(node.name).toLowerCase());
        } else if (node.type === 'directory' && node.children) {
          node.children.forEach(traverseExts);
        }
      };
      traverseExts(folderTree);

      if (exts.has('.js') || exts.has('.jsx')) detected.add('JavaScript');
      if (exts.has('.ts') || exts.has('.tsx')) detected.add('TypeScript');
      if (exts.has('.py')) detected.add('Python');
      if (exts.has('.java')) detected.add('Java');
      if (exts.has('.go')) detected.add('Go');
      if (exts.has('.rs')) detected.add('Rust');
      if (exts.has('.dart')) detected.add('Dart');
    }

    return Array.from(detected);
  },

  async analyzeCodebase(dirPath) {
    // 1. Gather all important files
    let files = await getImportantFiles(dirPath);

    // 2. Sort files by priority desc, then by size asc
    files.sort((a, b) => b.priority - a.priority || a.size - b.size);

    // 3. Read files up to a size limit (e.g. 400KB total text context)
    const MAX_TOTAL_CONTEXT = 350 * 1024; // 350 KB
    let currentTotalSize = 0;
    const analyzedFiles = [];

    for (const file of files) {
      // If adding this file's size exceeds context, skip or truncate. 
      // We skip if size is huge, or read it and add up to cap.
      const fileSize = file.size;
      if (currentTotalSize + fileSize > MAX_TOTAL_CONTEXT) {
        // If it's a high priority file (e.g. priority >= 8), read it but warn, otherwise stop
        if (file.priority >= 8 && currentTotalSize < MAX_TOTAL_CONTEXT) {
          const content = await readTextFile(file.fullPath, 20 * 1024); // read max 20KB for it
          analyzedFiles.push({
            path: file.relativePath,
            content,
            truncated: true
          });
          currentTotalSize += content.length;
        }
        continue;
      }

      const content = await readTextFile(file.fullPath);
      analyzedFiles.push({
        path: file.relativePath,
        content
      });
      currentTotalSize += content.length;
    }

    return analyzedFiles;
  }
};
