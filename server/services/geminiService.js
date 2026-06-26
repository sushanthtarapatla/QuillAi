import { GoogleGenerativeAI } from '@google/generative-ai';
import { makeDocumentationPrompt } from '../prompts/documentationPrompt.js';

// Preference list for Flash models (from newest/best to fallback aliases)
const MODEL_PREFERENCES = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash'
];

// Helper to query available models for a key and choose the best flash variant
async function detectBestModel(apiKey, requestedModel) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to query model list: ${response.statusText}`);
    }
    const data = await response.json();
    const modelNames = data.models.map(m => m.name.replace('models/', ''));
    
    console.log("Detected available models for API key:", modelNames);

    // If the requested model is explicitly supported, return it
    if (modelNames.includes(requestedModel)) {
      return requestedModel;
    }

    for (const pref of MODEL_PREFERENCES) {
      if (modelNames.includes(pref)) {
        console.warn(`Requested model "${requestedModel}" is not supported by this API key. Falling back to supported model: "${pref}"`);
        return pref;
      }
    }

    const fallbackFlash = modelNames.find(m => m.includes('flash'));
    if (fallbackFlash) {
      console.warn(`Falling back to detected flash variant: "${fallbackFlash}"`);
      return fallbackFlash;
    }

    return requestedModel;
  } catch (err) {
    console.error("Failed to dynamically detect models, utilizing default fallback:", err);
    return 'gemini-3.5-flash';
  }
}

export const geminiService = {
  async generateDocumentation({ 
    projectName, 
    technologies, 
    folderTreeText, 
    fileContents, 
    userApiKey = null, 
    modelName = 'gemini-3.5-flash',
    attempt = 0 
  }) {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Google Gemini API Key is missing. Please set it in Settings or add GEMINI_API_KEY to your server .env file.');
    }

    // Determine the active model name to use
    let activeModelName = modelName;
    if (attempt > 0) {
      // Find the index of the model that just failed and select the next one in the preference list
      const lastIndex = MODEL_PREFERENCES.indexOf(modelName);
      if (lastIndex !== -1 && lastIndex + 1 < MODEL_PREFERENCES.length) {
        activeModelName = MODEL_PREFERENCES[lastIndex + 1];
        console.warn(`Attempt ${attempt + 1}: Previous model "${modelName}" failed. Retrying with fallback: "${activeModelName}"...`);
      } else {
        throw new Error('AI generation failed: Reached the end of the available fallback model preference list.');
      }
    } else {
      // First attempt: check key compatibility
      activeModelName = await detectBestModel(apiKey, modelName);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Enforce UPPERCASE types for Google Gen AI response schema compatibility
    const responseSchema = {
      type: "OBJECT",
      properties: {
        readme: { type: "STRING" },
        summary: { type: "STRING" },
        techStack: { type: "STRING" },
        folderStructureExplanation: { type: "STRING" },
        installationGuide: { type: "STRING" },
        features: { type: "STRING" },
        architectureOverview: { type: "STRING" },
        mermaidDiagram: { type: "STRING" },
        apiDocumentation: { type: "STRING" },
        databaseExplanation: { type: "STRING" },
        suggestedImprovements: { type: "STRING" },
        resumeProjectDescription: { type: "STRING" },
        interviewQuestions: { type: "STRING" },
        codeQualityScore: { type: "INTEGER" }
      },
      required: [
        "readme", "summary", "techStack", "folderStructureExplanation", 
        "installationGuide", "features", "architectureOverview", 
        "mermaidDiagram", "suggestedImprovements", "resumeProjectDescription", 
        "interviewQuestions", "codeQualityScore"
      ]
    };

    try {
      console.log(`Initializing Gemini API generation using model: ${activeModelName}...`);
      const model = genAI.getGenerativeModel({
        model: activeModelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      const promptText = makeDocumentationPrompt(projectName, technologies, folderTreeText, fileContents);

      console.log(`Sending request to Gemini API (Model: ${activeModelName})...`);
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const responseText = response.text();

      console.log(`Successfully received response from Gemini API using model ${activeModelName}.`);
      
      const parsedData = JSON.parse(responseText);
      return parsedData;
    } catch (err) {
      console.error(`Gemini generation failed for model ${activeModelName}:`, err);
      
      // Detect transient errors like 503 (high demand), 429 (quota spikes), or 500 (internal server error)
      const isTransient = err.message && (
        err.message.includes('503') ||
        err.message.includes('Service Unavailable') ||
        err.message.includes('high demand') ||
        err.message.includes('429') ||
        err.message.includes('500') ||
        err.message.includes('Internal')
      );

      if (isTransient && attempt < MODEL_PREFERENCES.length - 1) {
        console.warn(`Transient issue detected on model "${activeModelName}". Activating automatic failover...`);
        // Recurse with the next candidate in line
        return this.generateDocumentation({
          projectName,
          technologies,
          folderTreeText,
          fileContents,
          userApiKey: apiKey,
          modelName: activeModelName,
          attempt: attempt + 1
        });
      }

      if (err.message && (err.message.includes('API key') || err.message.includes('API_KEY_INVALID'))) {
        throw new Error('Invalid Gemini API Key. Please check your credentials.');
      }
      if (err.message && err.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later or verify billing.');
      }
      
      throw new Error(`AI generation failed: ${err.message}`);
    }
  }
};
