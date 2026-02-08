import type { Task, TodaySession } from '../domain/types';

/**
 * Storage Adapter Interface
 * Does not depend on any specific storage implementation like localStorage or IndexedDB.
 */

export interface StorageData {
  tasks: Task[];
  todaySessions: TodaySession | null;
  currentView: string;
}

export interface StorageAdapter {
  // Task related methods
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  updateTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;

  // TodaySession related methods
  getTodaySessions(): Promise<TodaySession | null>;
  saveTodaySessions(session: TodaySession): Promise<void>;
  clearTodaySessions(): Promise<void>;

  // View state
  getCurrentView(): Promise<string>;
  saveCurrentView(view: string): Promise<void>;

  // Archived Task related methods
  getArchivedTasks(logicalDate?: string): Promise<Task[]>;
  getYesterdayIncompleteTasks(): Promise<Task[]>;
  updateArchivedTasks(logicalDate: string, task: Task): Promise<void>;

  // All tasks
  getAllTasks(): Promise<Task[]>;
}
