
# NOVA+ — AI Personal Assistant

NOVA+ is an AI-powered personal assistant designed to make everyday tasks easier. It allows users to interact with an AI assistant, manage tasks and reminders, and organize their daily schedules through a simple, user-friendly interface.

## Features

- **AI Chat:** Ask questions and interact naturally with the assistant.
- **Task Management:** Add, view, edit, complete, and delete tasks.
- **Reminders:** Create reminders for important activities.
- **Daily Planner:** Organize your day with prioritized time blocks.
- **Voice Interaction:** Designed to support a voice-first assistant experience.
- **Text-to-Speech:** Convert assistant responses into speech using supported AI or browser features.
- **Smart Assistance:** Understands natural-language requests and recent conversation context.

## Technologies Used

- React
- TypeScript
- Vite
- Node.js
- Express.js
- Google Gemini API

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Deva-6/NOVA-AI.git
   cd NOVA-AI
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the application:

   ```bash
   npm run dev
   ```

5. Open the local URL shown in your terminal.

## API Endpoints

- `/api/assistant` — AI conversations and task-related actions.
- `/api/tts` — Text-to-speech generation.
- `/api/health` — Server health check.

## Developer

**Deva Kannapu**

GitHub: [Deva-6](https://github.com/Deva-6)

---

*NOVA+ — Your day, organized intelligently.*
