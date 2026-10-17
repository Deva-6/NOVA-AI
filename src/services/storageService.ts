/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Reminder, DayPlan, UserVoiceSettings, ConversationTurn, PastActivity } from '../types/assistant';

const STORAGE_KEYS = {
  TASKS: 'aura_tasks_v1',
  REMINDERS: 'aura_reminders_v1',
  DAY_PLAN: 'aura_day_plan_v1',
  SETTINGS: 'aura_settings_v1',
  CONVERSATION: 'aura_conversation_v1',
  ACTIVITIES: 'aura_activities_v1',
};

const DEFAULT_ACTIVITIES: PastActivity[] = [
  {
    id: 'act-1',
    timestamp: 'Today, 9:15 AM',
    query: 'Plan my day based on top priorities',
    response: 'Created daily schedule with 4 focus time blocks.',
    actionSummary: 'Planned 4 time blocks',
    category: 'planner',
  },
  {
    id: 'act-2',
    timestamp: 'Today, 8:40 AM',
    query: 'Add machine learning assignment with high priority',
    response: 'Added "Finish machine learning assignment" to tasks.',
    actionSummary: 'Added Task (High Priority)',
    category: 'task',
  },
  {
    id: 'act-3',
    timestamp: 'Yesterday, 6:00 PM',
    query: 'Remind me to study at 7 PM',
    response: 'Scheduled reminder for 7:00 PM.',
    actionSummary: 'Reminder set for 7:00 PM',
    category: 'reminder',
  },
];

const DEFAULT_SETTINGS: UserVoiceSettings = {
  userName: 'Alex',
  themeColor: 'alexa-cyan',
  autoSpeak: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  soundEffects: true,
  useGeminiTTS: false,
};

const DEFAULT_TASKS: Task[] = [
  {
    id: 'demo-task-1',
    title: 'Finish machine learning assignment',
    completed: false,
    priority: 'high',
    dueDate: 'Tomorrow, 5:00 PM',
    category: 'Study',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    title: 'Review AURA AI hackathon architecture diagram',
    completed: false,
    priority: 'medium',
    dueDate: 'Today, 8:00 PM',
    category: 'Project',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-3',
    title: 'Morning stretch and hydration routine',
    completed: true,
    priority: 'low',
    dueDate: 'Today, 7:30 AM',
    category: 'Personal',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'demo-rem-1',
    title: 'Study for machine learning exam',
    time: '7:00 PM',
    dueTimestamp: Date.now() + 3600 * 1000 * 2, // 2 hours from now
    triggered: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_DAY_PLAN: DayPlan = {
  date: new Date().toISOString().split('T')[0],
  overview: 'Balanced focus flow targeting machine learning deliverables and team sync.',
  blocks: [
    {
      id: 'block-1',
      timeSlot: '09:00 - 10:30',
      title: 'Deep Work: Machine Learning Assignment',
      description: 'Model optimization, hyperparameter tuning, and cross-validation.',
      priority: 'high',
      completed: false,
    },
    {
      id: 'block-2',
      timeSlot: '11:00 - 12:00',
      title: 'Hackathon Sprint Review',
      description: 'Test voice assistant microphone latency and tool calling flow.',
      priority: 'medium',
      completed: false,
    },
    {
      id: 'block-3',
      timeSlot: '13:00 - 14:00',
      title: 'Lunch Break & Walk',
      description: 'Step away from screen for mental clarity.',
      priority: 'low',
      completed: false,
    },
    {
      id: 'block-4',
      timeSlot: '14:30 - 16:30',
      title: 'Implementation & Documentation',
      description: 'Complete task manager actions and AWS integration notes.',
      priority: 'medium',
      completed: false,
    },
  ],
};

export const storageService = {
  getTasks(): Task[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
        return DEFAULT_TASKS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage:', e);
    }
  },

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    this.saveTasks([newTask, ...tasks]);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates };
    this.saveTasks([...tasks]);
    return tasks[index];
  },

  completeTask(id: string): Task | null {
    return this.updateTask(id, { completed: true });
  },

  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length !== tasks.length) {
      this.saveTasks(filtered);
      return true;
    }
    return false;
  },

  getReminders(): Reminder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(DEFAULT_REMINDERS));
        return DEFAULT_REMINDERS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_REMINDERS;
    }
  },

  saveReminders(reminders: Reminder[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (e) {
      console.warn('Failed to save reminders to localStorage:', e);
    }
  },

  addReminder(title: string, time: string, minutesFromNow?: number): Reminder {
    const reminders = this.getReminders();
    let dueTimestamp = Date.now() + 15 * 60 * 1000; // default 15 min

    if (minutesFromNow && minutesFromNow > 0) {
      dueTimestamp = Date.now() + minutesFromNow * 60 * 1000;
    } else {
      // Parse relative time or standard hours
      const hourMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (hourMatch) {
        const d = new Date();
        let hours = parseInt(hourMatch[1], 10);
        const mins = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
        const meridian = hourMatch[3]?.toLowerCase();

        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;

        d.setHours(hours, mins, 0, 0);
        if (d.getTime() < Date.now()) {
          d.setDate(d.getDate() + 1); // schedule next day if time already passed today
        }
        dueTimestamp = d.getTime();
      }
    }

    const newRem: Reminder = {
      id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      time,
      dueTimestamp,
      triggered: false,
      createdAt: new Date().toISOString(),
    };

    this.saveReminders([newRem, ...reminders]);
    return newRem;
  },

  deleteReminder(id: string): boolean {
    const reminders = this.getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    if (filtered.length !== reminders.length) {
      this.saveReminders(filtered);
      return true;
    }
    return false;
  },

  triggerReminder(id: string): void {
    const reminders = this.getReminders();
    const updated = reminders.map(r => r.id === id ? { ...r, triggered: true } : r);
    this.saveReminders(updated);
  },

  snoozeReminder(id: string, minutes: number = 10): Reminder | null {
    const reminders = this.getReminders();
    const item = reminders.find(r => r.id === id);
    if (!item) return null;
    const newTimestamp = Date.now() + minutes * 60 * 1000;
    const updated = reminders.map(r => r.id === id ? {
      ...r,
      triggered: false,
      snoozed: true,
      dueTimestamp: newTimestamp,
      time: `in ${minutes} mins (snoozed)`
    } : r);
    this.saveReminders(updated);
    return updated.find(r => r.id === id) || null;
  },

  getDayPlan(): DayPlan {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DAY_PLAN);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.DAY_PLAN, JSON.stringify(DEFAULT_DAY_PLAN));
        return DEFAULT_DAY_PLAN;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_DAY_PLAN;
    }
  },

  saveDayPlan(plan: DayPlan): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAY_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.warn('Failed to save day plan:', e);
    }
  },

  getVoiceSettings(): UserVoiceSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveVoiceSettings(settings: UserVoiceSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  getConversation(): ConversationTurn[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveConversation(turns: ConversationTurn[]): void {
    try {
      // Keep up to 25 latest turns
      const trimmed = turns.slice(-25);
      localStorage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save conversation:', e);
    }
  },

  getActivities(): PastActivity[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
        return DEFAULT_ACTIVITIES;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_ACTIVITIES;
    }
  },

  addActivity(activity: Omit<PastActivity, 'id'>): PastActivity {
    const list = this.getActivities();
    const newAct: PastActivity = {
      ...activity,
      id: 'act-' + Date.now(),
    };
    const updated = [newAct, ...list].slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save activities:', e);
    }
    return newAct;
  },

  clearActivities(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
    localStorage.removeItem(STORAGE_KEYS.DAY_PLAN);
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },
};
