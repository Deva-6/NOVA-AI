/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, History, Check, Trash2, Plus, Calendar, Bell, ListTodo, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Task, Reminder, DayPlan, Priority, PastActivity, AlexaTheme } from '../types/assistant';

interface ActivitySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activities: PastActivity[];
  onClearActivities: () => void;
  tasks: Task[];
  reminders: Reminder[];
  dayPlan: DayPlan;
  onAddTask: (title: string, priority: Priority, dueDate?: string, category?: string) => void;
  onToggleTaskComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddReminder: (title: string, time: string) => void;
  onDeleteReminder: (id: string) => void;
  onTogglePlanBlock: (blockId: string) => void;
  onRequestDayPlan: () => void;
  themeColor: AlexaTheme;
}

export const ActivitySidePanel: React.FC<ActivitySidePanelProps> = ({
  isOpen,
  onClose,
  activities,
  onClearActivities,
  tasks,
  reminders,
  dayPlan,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
  onAddReminder,
  onDeleteReminder,
  onTogglePlanBlock,
  onRequestDayPlan,
  themeColor,
}) => {
  const [activeTab, setActiveTab] = useState<'activities' | 'tasks' | 'reminders' | 'planner'>('activities');

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Work');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Reminder form
  const [newRemTitle, setNewRemTitle] = useState('');
  const [newRemTime, setNewRemTime] = useState('');

  if (!isOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), newTaskPriority, newTaskDue.trim() || undefined, newTaskCategory.trim() || undefined);
    setNewTaskTitle('');
    setNewTaskDue('');
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemTitle.trim() || !newRemTime.trim()) return;
    onAddReminder(newRemTitle.trim(), newRemTime.trim());
    setNewRemTitle('');
    setNewRemTime('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'pending') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm transition-opacity duration-200">
      <div className="w-full max-w-md bg-[#0b1118] border-l border-slate-800/90 h-full flex flex-col shadow-2xl relative animate-slide-left">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800/80 bg-[#0e1622] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00CAFF] animate-pulse" />
            <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-wide font-['Plus_Jakarta_Sans',sans-serif]">
              Alexa Activity &amp; Records
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 pt-2 pb-2 bg-[#090e15] border-b border-slate-800/80">
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b1118] rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === 'activities'
                  ? 'bg-[#00CAFF]/20 text-[#00CAFF] border border-[#00CAFF]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5 mb-0.5" />
              <span>Activities</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === 'tasks'
                  ? 'bg-[#00CAFF]/20 text-[#00CAFF] border border-[#00CAFF]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 mb-0.5" />
              <span>Tasks ({tasks.filter(t => !t.completed).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === 'reminders'
                  ? 'bg-[#00CAFF]/20 text-[#00CAFF] border border-[#00CAFF]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 mb-0.5" />
              <span>Reminders ({reminders.filter(r => !r.triggered).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === 'planner'
                  ? 'bg-[#00CAFF]/20 text-[#00CAFF] border border-[#00CAFF]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 mb-0.5" />
              <span>Day Plan</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* TAB 1: PAST ACTIVITIES TRACK */}
          {activeTab === 'activities' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Activity History</span>
                {activities.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearActivities}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                  <History className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No past activities yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Speak or type a command to see your activity timeline here.</p>
                </div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-[#0f1724] border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#00CAFF]">
                        {act.category === 'task' ? 'Task Action' : act.category === 'reminder' ? 'Reminder Action' : act.category === 'planner' ? 'Day Planner' : 'Alexa Query'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {act.timestamp}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200">
                      &ldquo;{act.query}&rdquo;
                    </p>

                    <p className="text-[11px] text-slate-400 leading-relaxed bg-[#0b1118] p-2 rounded-lg border border-slate-800/60">
                      {act.response}
                    </p>

                    {act.actionSummary && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium pt-0.5">
                        <Check className="w-3 h-3" />
                        <span>{act.actionSummary}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <form onSubmit={handleCreateTask} className="p-3 rounded-xl bg-[#0f1724] border border-slate-800/80 space-y-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task..."
                  className="w-full bg-[#0b1118] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00CAFF]"
                />
                <div className="flex items-center gap-1.5 text-xs">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                    className="bg-[#0b1118] border border-slate-800 rounded-md px-2 py-1 text-slate-300 text-xs focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input
                    type="text"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    placeholder="Due (Tomorrow)"
                    className="flex-1 bg-[#0b1118] border border-slate-800 rounded-md px-2 py-1 text-slate-300 text-xs placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-[#00CAFF] hover:bg-[#24d2e8] text-slate-950 disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <div className="flex items-center gap-1">
                  {(['all', 'pending', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTaskFilter(filter)}
                      className={`px-2 py-0.5 rounded capitalize ${taskFilter === filter ? 'bg-slate-800 text-[#00CAFF] font-medium' : 'hover:text-white'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <span>{filteredTasks.length} tasks</span>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-[#0f1724]/40 rounded-xl border border-slate-800/60">
                  No tasks to display
                </div>
              ) : (
                filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-start justify-between p-2.5 rounded-xl border transition-all ${
                      t.completed ? 'bg-[#090e15] border-slate-900 opacity-60' : 'bg-[#0f1724] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTaskComplete(t.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          t.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 hover:border-[#00CAFF]'
                        }`}
                      >
                        {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium break-words ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span className={t.priority === 'high' ? 'text-rose-400' : t.priority === 'low' ? 'text-slate-400' : 'text-amber-400'}>
                            {t.priority}
                          </span>
                          {t.dueDate && (
                            <>
                              <span>·</span>
                              <span>{t.dueDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-3">
              <form onSubmit={handleCreateReminder} className="p-3 rounded-xl bg-[#0f1724] border border-slate-800/80 space-y-2">
                <input
                  type="text"
                  value={newRemTitle}
                  onChange={(e) => setNewRemTitle(e.target.value)}
                  placeholder="Remind me to..."
                  className="w-full bg-[#0b1118] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00CAFF]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRemTime}
                    onChange={(e) => setNewRemTime(e.target.value)}
                    placeholder="Time (7:00 PM / in 15 mins)"
                    className="flex-1 bg-[#0b1118] border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newRemTitle.trim() || !newRemTime.trim()}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-[#00CAFF] hover:bg-[#24d2e8] text-slate-950 disabled:opacity-40 transition-colors"
                  >
                    Set
                  </button>
                </div>
              </form>

              {reminders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-[#0f1724]/40 rounded-xl border border-slate-800/60">
                  No reminders scheduled
                </div>
              ) : (
                reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1724] border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className={`w-3.5 h-3.5 ${r.triggered ? 'text-emerald-400' : 'text-[#00CAFF]'}`} />
                      <div>
                        <p className="text-xs font-medium text-slate-200">{r.title}</p>
                        <p className="text-[10px] text-slate-500">{r.time} {r.triggered && '· Triggered'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteReminder(r.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: DAY PLAN */}
          {activeTab === 'planner' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-200">Today&apos;s Schedule</span>
                <button
                  type="button"
                  onClick={onRequestDayPlan}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#00CAFF] text-slate-950 hover:bg-[#24d2e8] transition-colors"
                >
                  Generate Plan
                </button>
              </div>

              {dayPlan.blocks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-[#0f1724]/40 rounded-xl border border-slate-800/60">
                  No plan generated yet. Tap &ldquo;Generate Plan&rdquo; or ask Alexa.
                </div>
              ) : (
                dayPlan.blocks.map((block) => (
                  <div
                    key={block.id}
                    className={`p-2.5 rounded-xl border ${
                      block.completed ? 'bg-[#090e15] border-slate-900 opacity-60' : 'bg-[#0f1724] border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => onTogglePlanBlock(block.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          block.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 hover:border-[#00CAFF]'
                        }`}
                      >
                        {block.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <div>
                        <span className="text-[10px] font-mono font-medium text-[#00CAFF]">{block.timeSlot}</span>
                        <p className={`text-xs font-medium ${block.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {block.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-800/80 bg-[#090e15] text-center text-[10px] text-slate-500">
          Maintained locally on device · Alexa+ Experience
        </div>
      </div>
    </div>
  );
};
