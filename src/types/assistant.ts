/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // ISO date string or human readable
  category: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // ISO timestamp or descriptive time
  dueTimestamp: number; // millisecond timestamp for active scheduling
  triggered: boolean;
  snoozed?: boolean;
  createdAt: string;
}

export interface DayPlanBlock {
  id: string;
  timeSlot: string; // e.g. "08:30 - 10:00"
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
}

export interface DayPlan {
  date: string;
  overview: string;
  blocks: DayPlanBlock[];
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface ActionExecuted {
  type: 'create_task' | 'complete_task' | 'delete_task' | 'edit_task' | 'create_reminder' | 'delete_reminder' | 'plan_day' | 'general_answer';
  summary: string;
  payload?: any;
  requiresConfirmation?: boolean;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionExecuted?: ActionExecuted;
  audioBase64?: string;
}

export type AlexaTheme = 'alexa-cyan' | 'electric-blue' | 'amazon-amber' | 'emerald';

export interface PastActivity {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  actionSummary?: string;
  category: 'task' | 'reminder' | 'planner' | 'query';
}

export interface UserVoiceSettings {
  userName: string;
  themeColor: AlexaTheme;
  autoSpeak: boolean;
  speechRate: number; // 0.8 - 1.5
  speechPitch: number; // 0.8 - 1.3
  preferredVoiceURI?: string;
  soundEffects: boolean;
  useGeminiTTS: boolean;
}

export interface AssistantApiResponse {
  success: boolean;
  replyText: string;
  action?: ActionExecuted;
  audioBase64?: string;
  error?: string;
  isFallback?: boolean;
}
