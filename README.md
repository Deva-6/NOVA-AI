# AURA AI — Voice-First AI Personal Assistant
### *Simulated Alexa+ Experience for Hackathon*

[![Status](https://img.shields.io/badge/Status-Production%20Ready-06b6d4)](https://github.com)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%203.8%20Flash-8b5cf6)](https://ai.google.dev)
[![Voice](https://img.shields.io/badge/Voice-Web%20Speech%20%2B%20Web%20Audio-22d3ee)](https://w3c.github.io/speech-api/)

A complete, responsive, futuristic voice assistant web application inspired by next-generation smart assistants (simulated Alexa+ style experience). Featuring a dynamic circular voice orb, continuous conversational reasoning with structured tool calling, natural language task management, in-app timed reminders, day planning, and robust offline capabilities.

---

## 🌟 Key Features

1. **Original Brand Identity (AURA AI)**
   - Custom vector logo: Minimal circular AI orb with three concentric sound-wave arcs and a violet-to-cyan luminous ring.
   - Dark midnight-black theme with violet (`#8b5cf6`) and electric-cyan (`#06b6d4`) accents.
   - Zero-pill metadata typography discipline and anti-slop aesthetic standard.

2. **Futuristic Animated Voice Orb**
   - Four distinct reactive states: **Idle** (subtle breathing), **Listening** (pulsing concentric soundwave ripples), **Processing** (orbital particle acceleration), and **Speaking** (waveform aura synchronized with speech synthesis).
   - Clickable and keyboard-interactive (Enter/Space).

3. **Autonomous AI Agent with Real Tool Execution**
   - Integrates server-side **Google Gemini 3.8 Flash** via `@google/genai` function calling:
     - `create_task`: Extracts title, due date, priority, and category.
     - `complete_task`: Resolves task by title, query, or ordinal reference (e.g., *"first one"*).
     - `delete_task`: Safely removes tasks with confirmation.
     - `edit_task`: Updates due date, priority, or task title.
     - `create_reminder`: Parses specific hours or relative durations (e.g., *"at 7 PM"*, *"in 15 minutes"*).
     - `plan_the_day`: Synthesizes organized chronological schedule blocks.
     - `list_tasks` & `list_reminders`: Contextual status reporting.
   - Maintains multi-turn conversation memory so follow-up commands (e.g., *"Move it to tomorrow"* or *"Mark that complete"*) work seamlessly.

4. **Multi-Modal Voice & Text Interaction**
   - Web Speech API integration (`SpeechRecognition` / `webkitSpeechRecognition`) for speech-to-text.
   - Real-time interim transcript preview while speaking.
   - Speech synthesis (`speechSynthesis`) with customizable voice selection, rate, pitch, and instant "Stop Speaking" interrupt button.
   - Web Audio API procedural chimes for wake, success, and reminder alert signals without external audio file dependencies.
   - Fallback text command input bar with keyboard shortcuts (`Enter ↵`).

5. **In-App Timed Reminders & Day Planner**
   - Periodic reminder scheduler running every 5 seconds.
   - Visual floating toast alert with chime sound, Snooze (+10m), and Dismiss actions.
   - Daily schedule organizer with prioritized time blocks (Deep Work, Meetings, Review).
   - Local persistence via `localStorage` with multi-session data integrity.

6. **100% Offline Capability**
   - If the network is unavailable or the Gemini API is offline, an intelligent client-side intent parser automatically executes task creation, completion, deletion, reminders, and day planning.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                        │
│                                                                │
│   ┌─────────────────────┐          ┌───────────────────────┐   │
│   │   Web Speech API    │          │  AURA AI UI Layer     │   │
│   │  (Recognition/TTS)  │          │  (React 19 + Tailwind)│   │
│   └──────────┬──────────┘          └───────────┬───────────┘   │
│              │                                 │               │
│              ▼                                 ▼               │
│     ┌─────────────────────────────────────────────────┐        │
│     │            Client Agent Dispatcher              │        │
│     │  (State mutations, storageService, offlineAgent)│        │
│     └────────────────────────┬────────────────────────┘        │
└──────────────────────────────┼─────────────────────────────────┘
                               │ HTTP POST /api/assistant
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                     FULL-STACK BACKEND                         │
│                    (Express / server.ts)                       │
│                                                                │
│   ┌────────────────────────────────────────────────────────┐   │
│   │  Google Gemini 3.8 Flash Engine (@google/genai)        │   │
│   │  - Function Declarations (Tools)                       │   │
│   │  - Multi-Turn Conversation Memory                      │   │
│   │  - Context Injection (Active Tasks & Reminders)        │   │
│   └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── metadata.json             # AI Studio applet metadata & permissions
├── package.json              # Full-stack dependencies & scripts
├── server.ts                 # Express full-stack server + Gemini API bridge
├── index.html                # HTML entry point with custom SVG favicon
├── src/
│   ├── main.tsx              # React entry point
│   ├── index.css             # Tailwind CSS global styles & dark scrollbars
│   ├── App.tsx               # Main application controller
│   ├── types/
│   │   └── assistant.ts      # TypeScript interfaces for tasks, reminders, turns
│   ├── services/
│   │   ├── speechService.ts  # Web Speech API & Web Audio chime engine
│   │   ├── storageService.ts # Local persistent storage & DynamoDB adapter interface
│   │   └── agentService.ts   # Tool dispatcher & offline intent fallback router
│   └── components/
│       ├── AuraLogo.tsx          # Custom vector SVG logo with 3 sound-wave arcs
│       ├── AssistantHeader.tsx   # Header with logo, audio mute, and drawer triggers
│       ├── VoiceOrb.tsx          # Animated circular AI voice orb
│       ├── VoiceControls.tsx     # Mic toggle, live transcript, stop speaking
│       ├── CommandInput.tsx      # Keyboard command bar
│       ├── AssistantResponse.tsx # Spoken response & action execution card
│       ├── QuickActions.tsx      # 1-click shortcut cards
│       ├── TaskPanel.tsx         # Slide-over Tasks, Reminders & Planner drawer
│       ├── SettingsModal.tsx     # Voice preferences & AWS architecture view
│       ├── DemoGuideModal.tsx    # Hackathon live demo testing script
│       └── ReminderToast.tsx     # Real-time reminder alert toast
└── vite.config.ts            # Vite configuration
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables Configuration
Copy the example file to `.env`:
```bash
cp .env.example .env
```
Provide your Gemini API key in `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```
> **Security Note:** The `GEMINI_API_KEY` is strictly accessed server-side in `server.ts`. It is **never** sent or exposed to client-side JavaScript. If no key is set, AURA automatically operates using its built-in offline rule engine.

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 🎤 Hackathon Demo Flow (Recommended Judge Walkthrough)

To experience the full agent capabilities in under 2 minutes:

| Step | Command (Speak or Click) | Feature Demonstrated |
|---|---|---|
| **1** | *"Plan my day based on my machine learning priorities"* | Autonomous schedule generation with time blocks into Day Planner |
| **2** | *"Add finish my machine learning assignment to my tasks with high priority"* | Structured task tool call with title, priority, and study category |
| **3** | *"Mark the first task complete"* | Contextual ordinal understanding & task completion |
| **4** | *"Remind me to study at 7 PM"* | Timed reminder tool & in-app reminder scheduling |
| **5** | *"What are the top 3 productivity habits of AI researchers?"* | Real-time reasoning and voice vocalization |

*Tip: You can also click the **"Demo Guide"** button in the top navigation bar to run any of these commands with a single click!*

---

## ☁️ Optional AWS Integration Blueprint

AURA AI is designed to transition cleanly to an AWS serverless architecture:

1. **Amazon API Gateway (`/api/*`)**:
   - Manages WebSocket and REST routes with rate limiting and AWS IAM / Cognito authorizers.
2. **AWS Lambda (`AssistantHandler`)**:
   - Runs serverless Python/Node handler invoking Gemini 3.8 Flash via API keys securely stored in AWS Secrets Manager.
3. **Amazon DynamoDB**:
   - `TasksTable` (`PartitionKey: userId`, `SortKey: taskId`)
   - `RemindersTable` (`PartitionKey: userId`, `SortKey: dueTimestamp`)
   - Global Secondary Indexes (GSI) for querying status (`pending` vs `completed`).
4. **Amazon EventBridge**:
   - Triggers server-side push notifications or SMS/Email alerts for reminders even when the user closes their browser.

*Note: In the current prototype, data is persisted locally in the user's browser using `localStorage`, ensuring zero cloud cost, full privacy, and 100% offline functionality.*

---

## ⚠️ Browser & Voice Compatibility Notes

- **Microphone Input:** Uses the W3C Web Speech API (`webkitSpeechRecognition`). Fully supported on Google Chrome, Microsoft Edge, Safari, and Brave on desktop and mobile.
- **Speech Synthesis:** Uses the Web Speech Synthesis API, supported natively on all modern evergreen browsers.
- **Microphone Permissions in iframes:** In embedded preview environments, if the iframe sandbox restricts `microphone` access, the application displays a friendly notice and allows users to test all capabilities using typed text or the 1-click Quick Action cards.
- **Background Reminders:** Web applications in inactive background tabs or closed browsers cannot run JavaScript timers. In-app reminders trigger reliably whenever the application is open.
