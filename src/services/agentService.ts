/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { storageService } from './storageService';
import { Task, Reminder, DayPlan, ActionExecuted, AssistantApiResponse, ConversationTurn } from '../types/assistant';

export interface ProcessTurnResult {
  replyText: string;
  actionExecuted?: ActionExecuted;
  audioBase64?: string;
  isFallback: boolean;
}

export const agentService = {
  /**
   * Process a user command (voice or typed)
   */
  async processCommand(userText: string): Promise<ProcessTurnResult> {
    const currentTasks = storageService.getTasks();
    const currentReminders = storageService.getReminders();
    const currentDayPlan = storageService.getDayPlan();
    const conversationHistory = storageService.getConversation();

    const settings = storageService.getVoiceSettings();
    let apiResponse: AssistantApiResponse | null = null;

    try {
      // Send request to server-side Gemini endpoint
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationHistory: conversationHistory.slice(-6),
          tasks: currentTasks,
          reminders: currentReminders,
          dayPlan: currentDayPlan,
          userName: settings.userName || 'Alex',
        }),
      });

      if (response.ok) {
        apiResponse = await response.json();
      }
    } catch (networkErr) {
      console.warn('Backend /api/assistant unreachable, using offline agent:', networkErr);
    }

    // If server succeeded, execute the action and record turn
    if (apiResponse && apiResponse.success) {
      let finalAction: ActionExecuted | undefined = apiResponse.action;

      if (finalAction) {
        const executionResult = this.executeActionOnState(finalAction, currentTasks, currentReminders);
        if (executionResult.updatedAction) {
          finalAction = executionResult.updatedAction;
        }
      }

      // Record conversation turn
      const userTurn: ConversationTurn = {
        id: 'user-' + Date.now(),
        role: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const assistantTurn: ConversationTurn = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        text: apiResponse.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: finalAction,
        audioBase64: apiResponse.audioBase64,
      };

      storageService.saveConversation([...conversationHistory, userTurn, assistantTurn]);

      // Record in past activities side panel
      let activityCategory: 'task' | 'reminder' | 'planner' | 'query' = 'query';
      if (finalAction?.type.includes('task')) activityCategory = 'task';
      else if (finalAction?.type.includes('reminder')) activityCategory = 'reminder';
      else if (finalAction?.type === 'plan_day') activityCategory = 'planner';

      storageService.addActivity({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        query: userText,
        response: apiResponse.replyText,
        actionSummary: finalAction?.summary,
        category: activityCategory,
      });

      return {
        replyText: apiResponse.replyText,
        actionExecuted: finalAction,
        audioBase64: apiResponse.audioBase64,
        isFallback: Boolean(apiResponse.isFallback),
      };
    }

    // Offline client-side rule-based fallback
    return this.processOffline(userText, currentTasks, currentReminders, conversationHistory, settings.userName || 'Alex');
  },

  /**
   * Execute action on local application state so data updates immediately
   */
  executeActionOnState(action: ActionExecuted, tasks: Task[], reminders: Reminder[]): { updatedAction?: ActionExecuted } {
    switch (action.type) {
      case 'create_task': {
        const payload = action.payload || {};
        const newTask = storageService.addTask({
          title: payload.title || 'Untitled Task',
          completed: false,
          priority: payload.priority || 'medium',
          dueDate: payload.dueDate || '',
          category: payload.category || 'General',
        });
        return {
          updatedAction: {
            ...action,
            summary: `Added task: "${newTask.title}"`,
            payload: newTask,
          },
        };
      }

      case 'complete_task': {
        const query = action.payload?.taskQuery?.toLowerCase() || '';
        const target = this.findTaskByQuery(query, tasks);
        if (target) {
          storageService.completeTask(target.id);
          return {
            updatedAction: {
              ...action,
              summary: `Marked "${target.title}" as complete`,
              payload: { ...target, completed: true },
            },
          };
        }
        return { updatedAction: action };
      }

      case 'delete_task': {
        const query = action.payload?.taskQuery?.toLowerCase() || '';
        const target = this.findTaskByQuery(query, tasks);
        if (target) {
          storageService.deleteTask(target.id);
          return {
            updatedAction: {
              ...action,
              summary: `Deleted "${target.title}"`,
              payload: target,
            },
          };
        }
        return { updatedAction: action };
      }

      case 'edit_task': {
        const query = action.payload?.taskQuery?.toLowerCase() || '';
        const target = this.findTaskByQuery(query, tasks);
        if (target) {
          const updates: Partial<Task> = {};
          if (action.payload.newTitle) updates.title = action.payload.newTitle;
          if (action.payload.newDueDate) updates.dueDate = action.payload.newDueDate;
          if (action.payload.newPriority) updates.priority = action.payload.newPriority;
          const updated = storageService.updateTask(target.id, updates);
          return {
            updatedAction: {
              ...action,
              summary: `Updated "${updated?.title || target.title}"`,
              payload: updated,
            },
          };
        }
        return { updatedAction: action };
      }

      case 'create_reminder': {
        const payload = action.payload || {};
        const newRem = storageService.addReminder(
          payload.title || 'Reminder',
          payload.time || 'soon',
          payload.minutesFromNow
        );
        return {
          updatedAction: {
            ...action,
            summary: `Reminder set: "${newRem.title}" for ${newRem.time}`,
            payload: newRem,
          },
        };
      }

      case 'delete_reminder': {
        const query = action.payload?.reminderQuery?.toLowerCase() || '';
        const target = reminders.find(r => r.title.toLowerCase().includes(query) || query.includes(r.title.toLowerCase()));
        if (target) {
          storageService.deleteReminder(target.id);
          return {
            updatedAction: {
              ...action,
              summary: `Removed reminder: "${target.title}"`,
              payload: target,
            },
          };
        }
        return { updatedAction: action };
      }

      case 'plan_day': {
        if (action.payload?.blocks && Array.isArray(action.payload.blocks)) {
          const plan: DayPlan = {
            date: new Date().toISOString().split('T')[0],
            overview: action.payload.overview || 'Structured daily schedule',
            blocks: action.payload.blocks.map((b: any, index: number) => ({
              id: 'block-' + Date.now() + '-' + index,
              timeSlot: b.timeSlot || '09:00 - 10:00',
              title: b.title || 'Focus Sprint',
              description: b.description || '',
              priority: b.priority || 'medium',
              completed: false,
            })),
          };
          storageService.saveDayPlan(plan);
        }
        return { updatedAction: action };
      }

      default:
        return { updatedAction: action };
    }
  },

  /**
   * Helper to resolve natural language task references:
   * e.g. "first one", "second task", "machine learning", "assignment", "it"
   */
  findTaskByQuery(query: string, tasks: Task[]): Task | null {
    if (!tasks || tasks.length === 0) return null;

    const q = query.toLowerCase().trim();

    // Ordinal matching
    if (q.includes('first') || q.includes('1st') || q.includes('top task') || q === '1') {
      return tasks.find(t => !t.completed) || tasks[0];
    }
    if (q.includes('second') || q.includes('2nd') || q === '2') {
      const pending = tasks.filter(t => !t.completed);
      return pending[1] || tasks[1] || tasks[0];
    }
    if (q.includes('third') || q.includes('3rd') || q === '3') {
      const pending = tasks.filter(t => !t.completed);
      return pending[2] || tasks[2] || tasks[0];
    }
    if (q.includes('last') || q.includes('latest')) {
      return tasks[tasks.length - 1];
    }

    // Pronoun or context reference ("it", "that", "the task")
    if (q === 'it' || q === 'that' || q === 'the task' || q === 'that task') {
      return tasks.find(t => !t.completed) || tasks[0];
    }

    // Direct substring match
    const directMatch = tasks.find(t => t.title.toLowerCase().includes(q) || q.includes(t.title.toLowerCase()));
    if (directMatch) return directMatch;

    // Fuzzy token match
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['task', 'the', 'my', 'complete', 'delete', 'remove', 'mark'].includes(w));
    if (words.length > 0) {
      for (const t of tasks) {
        const titleLower = t.title.toLowerCase();
        if (words.some(word => titleLower.includes(word))) {
          return t;
        }
      }
    }

    // Default to the first pending task if query was vague
    return tasks.find(t => !t.completed) || tasks[0];
  },

  /**
   * Offline processor
   */
  processOffline(
    userText: string,
    tasks: Task[],
    reminders: Reminder[],
    history: ConversationTurn[],
    userName: string = 'Alex'
  ): ProcessTurnResult {
    const p = userText.toLowerCase().trim();

    // 1. Create task
    if (p.includes('add task') || p.includes('create task') || p.includes('add to my tasks') || p.startsWith('add ') || p.startsWith('new task')) {
      let title = userText.replace(/^(please |could you )?(add task|create task|add to my tasks|add|new task)\s+/i, '').trim();
      let priority: 'low' | 'medium' | 'high' = 'medium';
      let dueDate = '';

      if (/urgent|high priority|asap/i.test(p)) priority = 'high';
      if (/low priority/i.test(p)) priority = 'low';
      if (/tomorrow/i.test(p)) dueDate = 'Tomorrow';
      else if (/today/i.test(p)) dueDate = 'Today';

      title = title.replace(/\s*(with high priority|with low priority|urgent|due tomorrow|due today)\s*/gi, '').trim();
      if (!title) title = 'New Task';

      const newTask = storageService.addTask({
        title,
        completed: false,
        priority,
        dueDate,
        category: 'General',
      });

      const reply = `I've added "${title}" to your tasks.`;
      const action: ActionExecuted = {
        type: 'create_task',
        summary: `Added task: "${title}"`,
        payload: newTask,
      };

      this.saveTurns(userText, reply, action, history);
      return { replyText: reply, actionExecuted: action, isFallback: true };
    }

    // 2. Complete task
    if (p.includes('complete') || p.includes('finish') || p.includes('mark') || p.includes('done')) {
      const target = this.findTaskByQuery(p, tasks);
      if (target) {
        storageService.completeTask(target.id);
        const reply = `Marked "${target.title}" as complete. Well done!`;
        const action: ActionExecuted = {
          type: 'complete_task',
          summary: `Completed "${target.title}"`,
          payload: { ...target, completed: true },
        };
        this.saveTurns(userText, reply, action, history);
        return { replyText: reply, actionExecuted: action, isFallback: true };
      }
    }

    // 3. Delete task
    if (p.includes('delete') || p.includes('remove')) {
      const target = this.findTaskByQuery(p, tasks);
      if (target) {
        storageService.deleteTask(target.id);
        const reply = `I've deleted "${target.title}" from your tasks.`;
        const action: ActionExecuted = {
          type: 'delete_task',
          summary: `Deleted "${target.title}"`,
          payload: target,
        };
        this.saveTurns(userText, reply, action, history);
        return { replyText: reply, actionExecuted: action, isFallback: true };
      }
    }

    // 4. Create reminder
    if (p.includes('remind me') || p.includes('set a reminder') || p.includes('set reminder')) {
      let rest = userText.replace(/^(please |could you )?(remind me to|remind me|set a reminder to|set a reminder for|set reminder)\s+/i, '').trim();
      let timeMatch = rest.match(/\s+(at\s+[\d:apm\s]+|in\s+\d+\s+(?:minutes?|hours?)|tomorrow(?:\s+morning|\s+at\s+[\d:apm\s]+)?)/i);
      let timeStr = timeMatch ? timeMatch[0].trim() : 'in 15 minutes';
      let title = timeMatch ? rest.replace(timeMatch[0], '').trim() : rest;
      if (!title) title = 'Important Reminder';

      const newRem = storageService.addReminder(title, timeStr);
      const reply = `I've set a reminder to ${title} for ${timeStr}.`;
      const action: ActionExecuted = {
        type: 'create_reminder',
        summary: `Reminder set: "${title}" ${timeStr}`,
        payload: newRem,
      };
      this.saveTurns(userText, reply, action, history);
      return { replyText: reply, actionExecuted: action, isFallback: true };
    }

    // 5. Plan the day
    if (p.includes('plan my day') || p.includes('plan the day') || p.includes('schedule') || p.includes('daily plan')) {
      const plan: DayPlan = {
        date: new Date().toISOString().split('T')[0],
        overview: 'Organized daily schedule prioritized around your key goals.',
        blocks: [
          { id: 'b1', timeSlot: '09:00 - 10:30', title: 'Deep Focus Sprint', description: 'Priority tasks and core deliverables.', priority: 'high', completed: false },
          { id: 'b2', timeSlot: '11:00 - 12:00', title: 'Communications & Meetings', description: 'Emails, updates, and reviews.', priority: 'medium', completed: false },
          { id: 'b3', timeSlot: '13:00 - 14:00', title: 'Lunch & Screen Break', description: 'Rest and recharge.', priority: 'low', completed: false },
          { id: 'b4', timeSlot: '14:30 - 16:30', title: 'Secondary Tasks', description: 'Work through active to-dos.', priority: 'medium', completed: false },
          { id: 'b5', timeSlot: '17:00 - 17:30', title: 'Evening Wrap-Up', description: 'Plan tomorrow and celebrate wins.', priority: 'low', completed: false },
        ],
      };
      storageService.saveDayPlan(plan);
      const reply = `I've organized your daily schedule with 5 focused time blocks. You can view it in the Day Planner.`;
      const action: ActionExecuted = {
        type: 'plan_day',
        summary: 'Generated daily plan',
        payload: plan,
      };
      this.saveTurns(userText, reply, action, history);
      return { replyText: reply, actionExecuted: action, isFallback: true };
    }

    // Default conversational response
    const reply = `I heard: "${userText}". Try saying "Plan my day", "Add finish my machine learning assignment to my tasks", or "Remind me to study at 7 PM".`;
    this.saveTurns(userText, reply, undefined, history);
    return {
      replyText: reply,
      isFallback: true,
    };
  },

  saveTurns(userText: string, assistantReply: string, action?: ActionExecuted, history: ConversationTurn[] = []) {
    const userTurn: ConversationTurn = {
      id: 'user-' + Date.now(),
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantTurn: ConversationTurn = {
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      text: assistantReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionExecuted: action,
    };

    storageService.saveConversation([...history, userTurn, assistantTurn]);
  },
};
