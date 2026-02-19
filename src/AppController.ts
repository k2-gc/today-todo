import type { StorageAdapter } from '../core/storage/StorageAdapter';
import type { Task, TodaySession, ViewType } from '../core/domain/types';
import { startToday, addTask, setFocusedTasks, toggleDone } from '../core/commands';
import { computeLogicalDate } from '../core/utils/logicalDate';
import { carryOverTask } from '../core/commands/carryOverTask';

/**
 * AppController to handle application state and commands.
 * Middleman between Webview and core/commands.
 */

export class AppController {
  constructor(private storage: StorageAdapter) {}

  /**
   * Initialize: check if today's session exists; if not, create new one.
   */
  async initialize(): Promise<{ session: TodaySession | null; view: ViewType }> {
    const todaySession = await this.storage.getTodaySessions();
    const currentLogicalDate = computeLogicalDate(new Date());

    // If no session or logical date mismatch, start new session
    if (!todaySession || todaySession.logicalDate !== currentLogicalDate) {
      const newSession = await startToday(this.storage);
      return { session: newSession, view: 'briefing' };
    }

    // Keep existing session
    const currentView = (await this.storage.getCurrentView()) as ViewType;
    return { session: todaySession, view: currentView };
  }

  /**
   * Allow access to storage for autoRefillFocus command.
   */
  getStorage(): StorageAdapter {
    return this.storage;
  }

  /**
   * Add a new task.
   */
  async addNewTask(title: string): Promise<Task> {
    return await addTask(title, this.storage);
  }

  /**
   * Set focused tasks (Complete Briefing).
   */
  async setFocusedTasks(taskIds: string[]): Promise<void> {
    await setFocusedTasks(taskIds, this.storage);
    await this.storage.saveCurrentView('focus');
  }

  /**
   * Toggle task done status.
   */
  async toggleTaskDone(taskId: string): Promise<Task> {
    return await toggleDone(taskId, this.storage);
  }

  /**
   * Switch current view.
   */
  async switchView(view: ViewType): Promise<void> {
    await this.storage.saveCurrentView(view);
  }

  /**
   * Obtain all tasks.
   */
  async getTodayAllTasks(): Promise<Task[]> {
    return await this.storage.getTasks();
  }

  /**
   * Obtain current TodaySession.
   */
  async getCurrentSession(): Promise<TodaySession | null> {
    return await this.storage.getTodaySessions();
  }

  /**
   * Obtain completed tasks (Today).
   */
  async getDoneTasksToday(): Promise<Task[]> {
    const session = await this.storage.getTodaySessions();
    if (!session) {
      return [];
    }

    const allTasks = await this.storage.getTasks();
    return allTasks.filter((task) => task.isDone && task.doneSessionId === session.id);
  }

  /**
   * Obtain completed tasks (All time).
   */
  async getAllDoneTasks(): Promise<Task[]> {
    const allTasks = await this.storage.getArchivedTasks();
    const allDoneTasks = allTasks.filter(
      (task) => task.isDone && task.doneSessionId !== null && task.doneSessionId !== undefined,
    );
    return allDoneTasks.sort((a, b) => {
      if (a.doneAt && b.doneAt) {
        return b.doneAt.getTime() - a.doneAt.getTime();
      }
      return 0;
    });
  }

  /**
   * Obtain latest incomplete tasks.
   */
  async getLatestIncompleteTasks(): Promise<Task[]> {
    return await this.storage.getLatestIncompleteTasks();
  }

  /**
   * Carry over latest incomplete task to today.
   */
  async carryOverTask(latestIncompleteTask: Task): Promise<Task> {
    return await carryOverTask(latestIncompleteTask, this.storage);
  }

  /**
   * Get all tasks (including archived).
   */
  async getAllTasks(): Promise<Task[]> {
    const allTasks = await this.storage.getAllTasks();
    return allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
