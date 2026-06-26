# 🚀 QuillAI

**QuillAI** is an AI-powered Project Documentation Generator that automatically analyzes software projects and generates professional documentation using Google's Gemini API.

Users can upload a ZIP file or provide a GitHub repository URL, and QuillAI intelligently understands the project's architecture, technology stack, folder structure, APIs, and features to generate comprehensive documentation in seconds.

---

## ✨ Features

* 📁 Upload project as a ZIP file
* 🔗 Analyze public GitHub repositories
* 🤖 AI-powered project analysis using Gemini API
* 📄 Automatically generate README.md
* 🏗️ Detect project architecture and folder structure
* 💻 Identify technology stack
* 📚 Generate API documentation
* 📊 Create Mermaid architecture diagrams
* 🎯 Generate interview questions
* 📝 Generate resume-ready project descriptions
* 📥 Export documentation (Markdown, PDF, DOCX)
* 🔍 *(Upcoming)* Ask My Codebase (RAG)

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* React Markdown
* Mermaid.js

### Backend

* Node.js
* Express.js
* Multer
* Adm-Zip
* simple-git
* dotenv

### AI

* Google Gemini API

### Deployment

* Frontend: Vercel
* Backend: Render

---

## 📂 Project Structure

```
QuillAI/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── prompts/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── generated/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/sushanthtarapatla/QuillAi.git
cd QuillAi
```

### Install frontend dependencies

```bash
cd client
npm install
```

### Install backend dependencies

```bash
cd ../server
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

## ▶️ Run the Project

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

```bash
cd client
npm run dev
```

---

## 🚀 Roadmap

### Phase 1

* Project upload
* ZIP extraction
* GitHub repository analysis
* Technology detection

### Phase 2

* AI-generated README
* Project summary
* Folder explanation
* Installation guide

### Phase 3

* API documentation
* Mermaid diagrams
* PDF & DOCX export

### Phase 4

* Ask My Codebase (RAG)
* AI code review
* Security analysis
* Performance optimization suggestions

---

## 🎯 Vision

QuillAI aims to simplify software documentation by leveraging Generative AI to automate project understanding, improve developer productivity, and accelerate onboarding for teams.

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Sushanth Tarapatla**

GitHub: https://github.com/sushanthtarapatla
