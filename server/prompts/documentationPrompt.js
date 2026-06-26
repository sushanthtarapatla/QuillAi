export const makeDocumentationPrompt = (projectName, technologies, folderTreeText, fileContents) => {
  return `You are a Senior Full Stack Software Architect, AI Engineer, and technical writer. 
Analyze the provided codebase structure and file contents, then generate a comprehensive documentation suite.

PROJECT NAME: ${projectName}
DETECTED TECHNOLOGIES: ${technologies.join(', ')}

FOLDER TREE STRUCTURE:
\`\`\`
${folderTreeText}
\`\`\`

IMPORTANT FILE CONTENTS:
${fileContents.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n')}

INSTRUCTIONS:
Generate complete and detailed software documentation for this project. Ensure you fill out every section in detail, without placeholders or summaries like "refer to code". Write full explanations.

Your output must be structured exactly as requested in the JSON Schema, containing:
1. **readme**: A complete, production-ready, beautifully styled Markdown README.md. It should look professional, feature a badge section, clear description, table of contents, features, installation with code blocks, configuration, folder explanation, usage, api details (if any), contribution guidelines, and license.
2. **summary**: A 2-3 paragraph professional executive summary of what the project is, its target audience, and its core purpose.
3. **techStack**: A detailed breakdown of the technology stack, explaining the role of each library/framework and why it was chosen (e.g. React for UI, Express for lightweight REST API).
4. **folderStructureExplanation**: An explanation of the project's folder layout, clarifying the architecture pattern (e.g. MVC, Clean Architecture, standard layered approach) and what key folders contain.
5. **installationGuide**: A step-by-step installation guide, listing prerequisite software, environment variables, commands to clone/setup, dependencies installation, and commands to run dev/production builds.
6. **features**: A comprehensive bullet-pointed list of features detected in the code, with technical descriptions of how they are implemented.
7. **architectureOverview**: An overview of the application architecture, design patterns, data flow, error-handling strategy, and communication protocols.
8. **mermaidDiagram**: A clean, syntactically correct Mermaid.js diagram showing the architecture or data flow. Example:
   \`\`\`mermaid
   graph TD
     A[Client] -->|API Requests| B[Express Router]
     B -->|Controller| C[Product Controller]
     C -->|Mongoose Schema| D[(MongoDB)]
   \`\`\`
   Do NOT use brackets inside node labels. Ensure syntax is perfectly valid Mermaid code.
9. **apiDocumentation**: A detailed API endpoint reference. List endpoints, HTTP methods, request bodies (JSON), response structures, and status codes. If no API is detected, write "No API endpoints were identified in this codebase."
10. **databaseExplanation**: A description of the database models, collections/tables, schemas, indexing, relationships, or local data storage strategies. If no database is detected, write "No database connection or schemas were identified."
11. **suggestedImprovements**: 5-8 highly technical suggestions for improvements, covering security vulnerabilities (e.g., input sanitization, CSRF), performance (caching, database queries), design patterns, testing (unit/integration), or CI/CD pipelines.
12. **resumeProjectDescription**: 3-4 high-impact resume bullet points written in the "STAR" format (Situation, Task, Action, Result) highlighting technical stack, complex problems solved, and architectural decisions.
13. **interviewQuestions**: 5-10 challenging developer interview questions with complete, detailed answers specifically tailored to this project's implementation details, trade-offs, and architecture.
14. **codeQualityScore**: A numeric score between 0 and 100 evaluating the project's code quality based on standards, structure, error handling, comments, and structure.

Keep all responses highly professional. Avoid generic answers. Make it specific to the scanned code!`;
};
