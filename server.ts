/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Function declarations for Gemini tool calling
const createTaskDeclaration: FunctionDeclaration = {
  name: 'create_task',
  description: 'Add a new task or to-do item for the user with title, optional due date, priority, and category.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The task title or description, e.g., "Finish machine learning assignment"' },
      dueDate: { type: Type.STRING, description: 'Optional due date or time, e.g. "Tomorrow 5 PM", "2026-10-18", or "Friday"' },
      priority: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: 'Priority level (low, medium, high). Defaults to medium.' },
      category: { type: Type.STRING, description: 'Category e.g. "Work", "Study", "Personal", "Errand"' },
    },
    required: ['title'],
  },
};

const completeTaskDeclaration: FunctionDeclaration = {
  name: 'complete_task',
  description: 'Mark an existing task as completed by task ID or title query (e.g. "assignment", "first one").',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskQuery: { type: Type.STRING, description: 'The title, partial title, or ordinal reference of the task to complete.' },
    },
    required: ['taskQuery'],
  },
};

const deleteTaskDeclaration: FunctionDeclaration = {
  name: 'delete_task',
  description: 'Delete a task from the user list. For ambiguous requests, ask confirmation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskQuery: { type: Type.STRING, description: 'The title, partial title, or ordinal reference of the task to delete.' },
      confirmed: { type: Type.BOOLEAN, description: 'Whether the user explicitly confirmed deletion.' },
    },
    required: ['taskQuery'],
  },
};

const editTaskDeclaration: FunctionDeclaration = {
  name: 'edit_task',
  description: 'Update or modify an existing task title, due date, or priority.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskQuery: { type: Type.STRING, description: 'The task title or reference being modified.' },
      newTitle: { type: Type.STRING, description: 'Optional updated title.' },
      newDueDate: { type: Type.STRING, description: 'Optional updated due date.' },
      newPriority: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: 'Optional updated priority.' },
    },
    required: ['taskQuery'],
  },
};

const createReminderDeclaration: FunctionDeclaration = {
  name: 'create_reminder',
  description: 'Set a timed reminder for the user with a title and specific time or relative duration.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'What to remind the user about, e.g. "Study for exam", "Take medication", "Call Sarah"' },
      time: { type: Type.STRING, description: 'Time for reminder, e.g. "at 7 PM", "in 15 minutes", "tomorrow morning at 9am"' },
      minutesFromNow: { type: Type.NUMBER, description: 'Estimated minutes from now if calculable, otherwise null.' },
    },
    required: ['title', 'time'],
  },
};

const listTasksDeclaration: FunctionDeclaration = {
  name: 'list_tasks',
  description: 'List or query existing tasks based on completion status or priority.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, enum: ['all', 'pending', 'completed'], description: 'Which tasks to summarize.' },
    },
  },
};

const listRemindersDeclaration: FunctionDeclaration = {
  name: 'list_reminders',
  description: 'List upcoming reminders for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filter: { type: Type.STRING, description: 'Optional filter criteria.' },
    },
  },
};

const planTheDayDeclaration: FunctionDeclaration = {
  name: 'plan_the_day',
  description: 'Create an organized daily schedule with prioritized time blocks based on user tasks and goals.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      overview: { type: Type.STRING, description: 'Brief motivating summary of the day plan.' },
      blocks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timeSlot: { type: Type.STRING, description: 'e.g. "08:30 - 10:00"' },
            title: { type: Type.STRING, description: 'Title of the time block' },
            description: { type: Type.STRING, description: 'What to accomplish' },
            priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          },
          required: ['timeSlot', 'title', 'priority'],
        },
        description: 'Chronological time blocks for the day.',
      },
    },
    required: ['overview', 'blocks'],
  },
};

// System instruction for AURA AI assistant in Alexa theme
const getSystemInstruction = (userName: string = 'Alex') => `You are Alexa+, an ultra-responsive, voice-first intelligent personal assistant inspired by Amazon Alexa smart displays and Echo devices.
You speak clearly, concisely, warmly, and naturally, suitable for voice output.
The user's name is ${userName}. When appropriate and natural, address the user by name (e.g. "Sure, ${userName}...", "Done, ${userName}!").
Keep responses conversational, concise (1-2 sentences max for spoken feedback), and directly actionable.
When the user wants to add, list, complete, delete, or edit tasks, or set reminders, or plan their day, YOU MUST invoke the matching tool function call.
If the user's request is a follow-up (e.g. "Move it to tomorrow", "Mark the first one complete", "Delete that"), use the provided conversation history and current task/reminder list context to resolve which item they are referring to.
For destructive actions (like deleting all tasks), ask for confirmation if not specified.
Always maintain the Alexa persona: calm, warm, capable, and succinct.`;

// API endpoint: Assistant conversation & tool execution
app.post('/api/assistant', async (req, res) => {
  try {
    const { message, conversationHistory, tasks, reminders, dayPlan, userName = 'Alex' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A message prompt is required' });
    }

    // Build context summary for Gemini
    const taskContext = Array.isArray(tasks) && tasks.length > 0
      ? tasks.map((t: any, i: number) => `[${i + 1}] ID:${t.id} "${t.title}" (Status: ${t.completed ? 'Completed' : 'Pending'}, Priority: ${t.priority || 'medium'}, Due: ${t.dueDate || 'none'})`).join('\n')
      : 'No current tasks recorded.';

    const reminderContext = Array.isArray(reminders) && reminders.length > 0
      ? reminders.map((r: any, i: number) => `[${i + 1}] ID:${r.id} "${r.title}" (Time: ${r.time}, Triggered: ${r.triggered})`).join('\n')
      : 'No active reminders.';

    const contextPrompt = `
[CURRENT SYSTEM TIME: ${new Date().toLocaleString()}]
[USER NAME: ${userName}]

[USER CURRENT TASKS]
${taskContext}

[USER CURRENT REMINDERS]
${reminderContext}

[USER QUERY]
${message}
`;

    // If Gemini client is not initialized or API key is missing, return a smart deterministic fallback
    if (!ai) {
      const fallbackResult = generateDeterministicFallback(message, tasks, reminders, userName);
      return res.json({
        success: true,
        replyText: fallbackResult.replyText,
        action: fallbackResult.action,
        isFallback: true,
      });
    }

    // Format conversation history for Gemini contents
    const contents: any[] = [];

    if (Array.isArray(conversationHistory)) {
      // Keep last 4 turns for context window
      const recentHistory = conversationHistory.slice(-4);
      for (const turn of recentHistory) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: contextPrompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: getSystemInstruction(userName),
        tools: [{
          functionDeclarations: [
            createTaskDeclaration,
            completeTaskDeclaration,
            deleteTaskDeclaration,
            editTaskDeclaration,
            createReminderDeclaration,
            listTasksDeclaration,
            listRemindersDeclaration,
            planTheDayDeclaration,
          ],
        }],
      },
    });

    // Check if Gemini invoked a function call
    const functionCalls = response.functionCalls;
    let actionExecuted: any = null;
    let replyText = response.text || '';

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const args = call.args as any;

      switch (call.name) {
        case 'create_task':
          actionExecuted = {
            type: 'create_task',
            summary: `Added task: "${args.title}"`,
            payload: {
              title: args.title,
              dueDate: args.dueDate || '',
              priority: args.priority || 'medium',
              category: args.category || 'General',
            },
          };
          if (!replyText) {
            replyText = `I've added "${args.title}" to your tasks${args.dueDate ? ` with due date ${args.dueDate}` : ''}.`;
          }
          break;

        case 'complete_task':
          actionExecuted = {
            type: 'complete_task',
            summary: `Completed task matching: "${args.taskQuery}"`,
            payload: { taskQuery: args.taskQuery },
          };
          if (!replyText) {
            replyText = `Marked your task "${args.taskQuery}" as complete. Nice work!`;
          }
          break;

        case 'delete_task':
          actionExecuted = {
            type: 'delete_task',
            summary: `Deleted task matching: "${args.taskQuery}"`,
            payload: { taskQuery: args.taskQuery, confirmed: args.confirmed ?? true },
          };
          if (!replyText) {
            replyText = `I've removed that task from your list.`;
          }
          break;

        case 'edit_task':
          actionExecuted = {
            type: 'edit_task',
            summary: `Updated task: "${args.taskQuery}"`,
            payload: {
              taskQuery: args.taskQuery,
              newTitle: args.newTitle,
              newDueDate: args.newDueDate,
              newPriority: args.newPriority,
            },
          };
          if (!replyText) {
            replyText = `Updated your task "${args.taskQuery}".`;
          }
          break;

        case 'create_reminder':
          actionExecuted = {
            type: 'create_reminder',
            summary: `Set reminder: "${args.title}" at ${args.time}`,
            payload: {
              title: args.title,
              time: args.time,
              minutesFromNow: args.minutesFromNow,
            },
          };
          if (!replyText) {
            replyText = `I've scheduled a reminder to ${args.title} for ${args.time}.`;
          }
          break;

        case 'list_tasks':
          actionExecuted = {
            type: 'list_tasks',
            summary: `Retrieved tasks`,
            payload: { status: args.status || 'all' },
          };
          if (!replyText) {
            const pendingCount = (tasks || []).filter((t: any) => !t.completed).length;
            replyText = pendingCount === 0
              ? 'You currently have no pending tasks on your list. All clear!'
              : `You have ${pendingCount} pending task${pendingCount === 1 ? '' : 's'}. You can view the full list in your tasks panel.`;
          }
          break;

        case 'list_reminders':
          actionExecuted = {
            type: 'list_reminders',
            summary: `Retrieved reminders`,
            payload: {},
          };
          if (!replyText) {
            const remCount = (reminders || []).filter((r: any) => !r.triggered).length;
            replyText = remCount === 0
              ? 'You have no active reminders at the moment.'
              : `You have ${remCount} active reminder${remCount === 1 ? '' : 's'}.`;
          }
          break;

        case 'plan_the_day':
          actionExecuted = {
            type: 'plan_day',
            summary: args.overview || 'Created daily schedule',
            payload: {
              overview: args.overview,
              blocks: args.blocks || [],
            },
          };
          if (!replyText) {
            replyText = `I've prepared your daily schedule: ${args.overview}. You can check each time block in the planner.`;
          }
          break;
      }
    }

    if (!replyText) {
      replyText = "I'm on it. What else can I assist you with?";
    }

    return res.json({
      success: true,
      replyText: replyText.trim(),
      action: actionExecuted,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Error in /api/assistant:', error);
    // Graceful fallback if Gemini API call errors (e.g. quota or network issue)
    const fallbackResult = generateDeterministicFallback(req.body.message || '', req.body.tasks, req.body.reminders);
    return res.json({
      success: true,
      replyText: fallbackResult.replyText,
      action: fallbackResult.action,
      isFallback: true,
      error: error.message,
    });
  }
});

// Optional high-quality TTS endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API client not initialized. Falling back to browser speech synthesis.' });
    }

    // Unary default: complete WAV file (audio/wav, RIFF header, 24kHz mono 16-bit)
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: text.slice(0, 500) }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ success: true, audioBase64: base64Audio });
    } else {
      return res.status(500).json({ error: 'No audio data received' });
    }
  } catch (err: any) {
    console.error('Error in /api/tts:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'AURA AI',
    geminiConfigured: Boolean(ai),
    serverTime: new Date().toISOString(),
  });
});

// Deterministic intent parser for offline fallback
function generateDeterministicFallback(prompt: string, tasks: any[] = [], reminders: any[] = [], userName: string = 'Alex') {
  const p = prompt.toLowerCase().trim();

  // 1. Create Task
  if (p.includes('add task') || p.includes('add to my tasks') || p.includes('create task') || p.startsWith('add ') || p.startsWith('remind me to add ')) {
    let title = prompt.replace(/^(please |could you |can you )?(add to my tasks|add task|create task|add|put on my todo list)\s+/i, '').trim();
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let dueDate = '';

    if (/urgent|high priority|asap/i.test(p)) priority = 'high';
    if (/low priority/i.test(p)) priority = 'low';
    if (/tomorrow/i.test(p)) dueDate = 'Tomorrow';
    else if (/today/i.test(p)) dueDate = 'Today';

    title = title.replace(/\s*(with high priority|with low priority|urgent|due tomorrow|due today)\s*/gi, '').trim();
    if (!title) title = 'New Task';

    return {
      replyText: `I've added "${title}" to your tasks with ${priority} priority.`,
      action: {
        type: 'create_task',
        summary: `Added task: "${title}"`,
        payload: { title, priority, dueDate, category: 'General' },
      },
    };
  }

  // 2. Complete Task
  if (p.includes('complete') || p.includes('finish') || p.includes('done') || p.includes('mark')) {
    let taskQuery = prompt.replace(/^(please |could you )?(mark|complete|finish)\s+/i, '').replace(/\s+(as complete|as completed|done)$/i, '').trim();
    return {
      replyText: `Marked that task as complete. Great progress!`,
      action: {
        type: 'complete_task',
        summary: `Completed task: "${taskQuery}"`,
        payload: { taskQuery },
      },
    };
  }

  // 3. Delete Task
  if (p.includes('delete task') || p.includes('remove task') || p.startsWith('delete ') || p.startsWith('remove ')) {
    let taskQuery = prompt.replace(/^(please |could you )?(delete task|remove task|delete|remove)\s+/i, '').trim();
    return {
      replyText: `I've removed "${taskQuery || 'the task'}" from your tasks list.`,
      action: {
        type: 'delete_task',
        summary: `Deleted task: "${taskQuery}"`,
        payload: { taskQuery, confirmed: true },
      },
    };
  }

  // 4. Create Reminder
  if (p.includes('remind me') || p.includes('set a reminder') || p.includes('set reminder')) {
    let rest = prompt.replace(/^(please |could you )?(remind me to|remind me|set a reminder to|set a reminder for|set reminder)\s+/i, '').trim();
    let timeMatch = rest.match(/\s+(at\s+[\d:apm\s]+|in\s+\d+\s+(?:minutes?|hours?)|tomorrow(?:\s+morning|\s+at\s+[\d:apm\s]+)?)/i);
    let timeStr = timeMatch ? timeMatch[0].trim() : 'in 15 minutes';
    let title = timeMatch ? rest.replace(timeMatch[0], '').trim() : rest;

    return {
      replyText: `I've set a reminder to "${title || 'task'}" ${timeStr}.`,
      action: {
        type: 'create_reminder',
        summary: `Set reminder: "${title || 'Reminder'}" ${timeStr}`,
        payload: { title: title || 'Reminder', time: timeStr, minutesFromNow: 15 },
      },
    };
  }

  // 5. List Tasks
  if (p.includes('what tasks') || p.includes('list tasks') || p.includes('my tasks') || p.includes('show tasks')) {
    const pending = (tasks || []).filter((t: any) => !t.completed);
    const count = pending.length;
    return {
      replyText: count === 0
        ? "You don't have any pending tasks right now. Would you like to add one?"
        : `You have ${count} pending task${count > 1 ? 's' : ''}, including "${pending[0]?.title || 'your tasks'}".`,
      action: {
        type: 'list_tasks',
        summary: 'Listed tasks',
        payload: { status: 'pending' },
      },
    };
  }

  // 6. Plan the day
  if (p.includes('plan my day') || p.includes('plan the day') || p.includes('daily schedule') || p.includes('schedule my day')) {
    return {
      replyText: "Here is your suggested plan for today: Start with focused deep work on your high-priority items, followed by a check-in, review block, and evening wind-down.",
      action: {
        type: 'plan_day',
        summary: 'Generated daily schedule for optimal productivity',
        payload: {
          overview: 'High focus morning sprint followed by project execution and evening wrap-up.',
          blocks: [
            { timeSlot: '08:30 - 10:00', title: 'Deep Work Sprint', description: 'Tackle top priority assignments and core tasks with zero distractions.', priority: 'high' },
            { timeSlot: '10:15 - 11:30', title: 'Communication & Follow-ups', description: 'Review emails, messages, and team coordination.', priority: 'medium' },
            { timeSlot: '12:00 - 13:00', title: 'Mindful Break & Lunch', description: 'Step away from screens, recharge and hydrate.', priority: 'low' },
            { timeSlot: '13:00 - 15:30', title: 'Secondary Tasks & Project Build', description: 'Continue steady progress on open to-dos.', priority: 'medium' },
            { timeSlot: '16:00 - 17:00', title: 'Daily Wrap-up & Tomorrow Prep', description: 'Review completed tasks and organize priorities for tomorrow.', priority: 'low' },
          ],
        },
      },
    };
  }

  // Default conversational answer
  return {
    replyText: `I'm listening. As AURA, I can help organize your tasks, set reminders, schedule your day, or answer your questions. Try saying "Plan my day" or "Add a task".`,
    action: {
      type: 'general_answer',
      summary: 'Conversational response',
      payload: {},
    },
  };
}

// Start server with Vite middleware in development or static serve in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AURA AI Server] running on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
