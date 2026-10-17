/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceState, Task, Reminder, DayPlan, UserVoiceSettings, ConversationTurn, Priority, PastActivity, AlexaTheme } from './types/assistant';
import { storageService } from './services/storageService';
import { speechService } from './services/speechService';
import { agentService } from './services/agentService';

import { AssistantHeader } from './components/AssistantHeader';
import { VoiceOrb } from './components/VoiceOrb';
import { VoiceControls } from './components/VoiceControls';
import { CommandInput } from './components/CommandInput';
import { AssistantResponse } from './components/AssistantResponse';
import { QuickActions } from './components/QuickActions';
import { ActivitySidePanel } from './components/ActivitySidePanel';
import { SettingsModal } from './components/SettingsModal';
import { ReminderToast } from './components/ReminderToast';

export default function App() {
  // Assistant states
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dayPlan, setDayPlan] = useState<DayPlan>(storageService.getDayPlan());
  const [settings, setSettings] = useState<UserVoiceSettings>(storageService.getVoiceSettings());
  const [activities, setActivities] = useState<PastActivity[]>(storageService.getActivities());
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [latestTurn, setLatestTurn] = useState<ConversationTurn | null>(null);

  // Modals & Panels
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [activeReminderToast, setActiveReminderToast] = useState<Reminder | null>(null);

  const isMicSupported = speechService.isSpeechRecognitionSupported();
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Load initial data from persistent local storage
  useEffect(() => {
    const loadedTasks = storageService.getTasks();
    const loadedReminders = storageService.getReminders();
    const loadedPlan = storageService.getDayPlan();
    const loadedSettings = storageService.getVoiceSettings();
    const loadedConvo = storageService.getConversation();
    const loadedActivities = storageService.getActivities();

    setTasks(loadedTasks);
    setReminders(loadedReminders);
    setDayPlan(loadedPlan);
    setSettings(loadedSettings);
    setActivities(loadedActivities);
    setConversation(loadedConvo);

    if (loadedConvo.length > 0) {
      const last = loadedConvo[loadedConvo.length - 1];
      if (last.role === 'assistant') {
        setLatestTurn(last);
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {
        // ignore
      }
    }
  }, []);

  // Periodic Reminder Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentReminders = storageService.getReminders();
      const due = currentReminders.find(
        (r) => !r.triggered && r.dueTimestamp <= now
      );

      if (due) {
        storageService.triggerReminder(due.id);
        setReminders(storageService.getReminders());
        setActiveReminderToast(due);
        speechService.playChime('reminder');

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`Alexa Reminder: ${due.title}`, {
              body: `Scheduled for ${due.time}`,
              icon: '/favicon.ico',
            });
          } catch {
            // ignore
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle Voice Execution and Response vocalization
  const handleAssistantResult = useCallback((textToSpeak: string, audioBase64?: string) => {
    setTasks(storageService.getTasks());
    setReminders(storageService.getReminders());
    setDayPlan(storageService.getDayPlan());
    setActivities(storageService.getActivities());
    const convo = storageService.getConversation();
    setConversation(convo);
    if (convo.length > 0) {
      setLatestTurn(convo[convo.length - 1]);
    }

    if (settings.autoSpeak && !isMuted) {
      setVoiceState('speaking');
      speechService.speak(textToSpeak, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        voiceURI: settings.preferredVoiceURI,
        audioBase64,
        onEnd: () => {
          setVoiceState('idle');
        },
      });
    } else {
      setVoiceState('idle');
    }
  }, [settings, isMuted]);

  // Execute User Command (voice or typed)
  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    setErrorMessage(null);
    setVoiceState('processing');

    try {
      const result = await agentService.processCommand(command);
      handleAssistantResult(result.replyText, result.audioBase64);
    } catch (err: any) {
      console.error('Failed to process command:', err);
      setErrorMessage('Could not process request. Please try again.');
      setVoiceState('idle');
    }
  }, [handleAssistantResult]);

  // Microphone toggle handler
  const handleToggleMic = useCallback(() => {
    if (voiceState === 'listening') {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setVoiceState('idle');
      setInterimTranscript('');
      return;
    }

    if (voiceState === 'speaking') {
      speechService.stopSpeaking();
      setVoiceState('idle');
    }

    setErrorMessage(null);
    setInterimTranscript('');
    setVoiceState('listening');

    stopListeningRef.current = speechService.startListening({
      onInterim: (text) => {
        setInterimTranscript(text);
      },
      onFinal: (text) => {
        setInterimTranscript('');
        executeCommand(text);
      },
      onError: (err) => {
        setErrorMessage(err);
        setVoiceState('idle');
      },
      onEnd: () => {
        // onEnd will be followed by execution or idle
      },
    });
  }, [voiceState, executeCommand]);

  // Stop speaking
  const handleStopSpeaking = useCallback(() => {
    speechService.stopSpeaking();
    setVoiceState('idle');
  }, []);

  // Audio Mute toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    speechService.setMuted(nextMuted);
  }, [isMuted]);

  // Replay speech
  const handleReplayVoice = useCallback((text: string, audioBase64?: string) => {
    setVoiceState('speaking');
    speechService.speak(text, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.preferredVoiceURI,
      audioBase64,
      onEnd: () => setVoiceState('idle'),
    });
  }, [settings]);

  // Task operations
  const handleAddTask = (title: string, priority: Priority, dueDate?: string, category?: string) => {
    storageService.addTask({
      title,
      completed: false,
      priority,
      dueDate,
      category: category || 'Work',
    });
    setTasks(storageService.getTasks());
    setActivities(storageService.getActivities());
  };

  const handleToggleTask = (id: string) => {
    const current = tasks.find(t => t.id === id);
    if (!current) return;
    storageService.updateTask(id, { completed: !current.completed });
    setTasks(storageService.getTasks());
  };

  const handleDeleteTask = (id: string) => {
    storageService.deleteTask(id);
    setTasks(storageService.getTasks());
  };

  // Reminder operations
  const handleAddReminder = (title: string, time: string) => {
    storageService.addReminder(title, time);
    setReminders(storageService.getReminders());
  };

  const handleDeleteReminder = (id: string) => {
    storageService.deleteReminder(id);
    setReminders(storageService.getReminders());
  };

  const handleDismissReminder = () => {
    setActiveReminderToast(null);
  };

  const handleSnoozeReminder = (id: string) => {
    storageService.snoozeReminder(id, 10);
    setReminders(storageService.getReminders());
    setActiveReminderToast(null);
  };

  // Day plan operations
  const handleTogglePlanBlock = (blockId: string) => {
    const updated = {
      ...dayPlan,
      blocks: dayPlan.blocks.map(b => b.id === blockId ? { ...b, completed: !b.completed } : b),
    };
    storageService.saveDayPlan(updated);
    setDayPlan(updated);
  };

  const handleRequestDayPlan = () => {
    setIsActivityPanelOpen(false);
    executeCommand('Plan my day with optimized schedule blocks');
  };

  // Clear activities
  const handleClearActivities = () => {
    storageService.clearActivities();
    setActivities([]);
  };

  // Dynamic greeting based on time of day and user name
  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    const name = settings.userName?.trim() || 'Alex';
    return `${timeGreeting}, ${name}`;
  };

  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#070b10] text-slate-100 flex flex-col justify-between selection:bg-[#00CAFF]/30 selection:text-[#00CAFF] font-['Plus_Jakarta_Sans',sans-serif] relative select-none">
      {/* Alexa Ambient Radial Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[550px] h-[280px] bg-gradient-to-b from-[#00CAFF]/12 via-[#0088FF]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Application Header */}
      <AssistantHeader
        userName={settings.userName || 'Alex'}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenActivityPanel={() => setIsActivityPanelOpen(true)}
        activityCount={activities.length}
        pendingTasksCount={pendingTasksCount}
        themeColor={settings.themeColor || 'alexa-cyan'}
      />

      {/* Main Single-Frame Viewport (No scrollbar) */}
      <main className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 py-1 z-10 min-h-0 overflow-hidden">
        {/* Nova Dynamic Greeting */}
        <div className="text-center mb-0.5 flex-shrink-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            {getDynamicGreeting()}. <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-[#00CAFF] to-slate-300">How can Nova help?</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Voice-first assistant. Speak or type to manage tasks, reminders, and daily schedules.
          </p>
        </div>

        {/* Central Animated Alexa Light Ring Orb */}
        <VoiceOrb
          state={voiceState}
          onClick={handleToggleMic}
          themeColor={settings.themeColor || 'alexa-cyan'}
        />

        {/* Microphone and Speech Controls */}
        <VoiceControls
          state={voiceState}
          onToggleMic={handleToggleMic}
          onStopSpeaking={handleStopSpeaking}
          interimTranscript={interimTranscript}
          errorMessage={errorMessage}
          isMicSupported={isMicSupported}
          onClearError={() => setErrorMessage(null)}
        />

        {/* Text Command Input Bar */}
        <CommandInput
          onSubmit={executeCommand}
          isProcessing={voiceState === 'processing'}
        />

        {/* Assistant Response Card */}
        <AssistantResponse
          latestTurn={latestTurn}
          onReplayVoice={handleReplayVoice}
          onOpenPanel={() => setIsActivityPanelOpen(true)}
          isSpeaking={voiceState === 'speaking'}
        />

        {/* Quick Shortcut Badges */}
        <QuickActions
          onSelectAction={executeCommand}
          disabled={voiceState === 'processing'}
        />
      </main>

      {/* Minimal Footer Status Line */}
      <footer className="w-full text-center py-2 text-[10px] text-slate-500 border-t border-slate-900/80 bg-[#070b10] flex-shrink-0">
        <span>NOVA+ Voice AI · Alexa Edition · Powered by Google Gemini · Zero Scroll Viewport</span>
      </footer>

      {/* Past Activities & Tasks Side Panel */}
      <ActivitySidePanel
        isOpen={isActivityPanelOpen}
        onClose={() => setIsActivityPanelOpen(false)}
        activities={activities}
        onClearActivities={handleClearActivities}
        tasks={tasks}
        reminders={reminders}
        dayPlan={dayPlan}
        onAddTask={handleAddTask}
        onToggleTaskComplete={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onAddReminder={handleAddReminder}
        onDeleteReminder={handleDeleteReminder}
        onTogglePlanBlock={handleTogglePlanBlock}
        onRequestDayPlan={handleRequestDayPlan}
        themeColor={settings.themeColor || 'alexa-cyan'}
      />

      {/* Profile & Theme Color Modal */}
      <SettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          storageService.saveVoiceSettings(newSettings);
        }}
      />

      {/* Real-Time Reminder Alert Toast */}
      <ReminderToast
        activeReminder={activeReminderToast}
        onDismiss={handleDismissReminder}
        onSnooze={handleSnoozeReminder}
      />
    </div>
  );
}
