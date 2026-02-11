import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Task, TodaySession } from '../../core/domain/types';
import type { StorageAdapter } from '../../core/storage/StorageAdapter';
import { StorageData } from '../../core/storage/StorageAdapter';
import { computeLogicalDate } from '../../core/utils/logicalDate';

/**
 * Storage Adapter Implementation using VSCode Memento API
 */

export class VSCodeStorageAdapter implements StorageAdapter {
  private storageFile: vscode.Uri;
  private archiveDir: vscode.Uri;

  constructor(private context: vscode.ExtensionContext) {
    this.storageFile = vscode.Uri.joinPath(context.globalStorageUri, 'data.json');
    this.archiveDir = vscode.Uri.joinPath(context.globalStorageUri, 'archive');
  }

  /**
   * Load storage data from file
   */
  private async loadData(): Promise<StorageData> {
    try {
      await fs.mkdir(path.dirname(this.storageFile.fsPath), { recursive: true });

      const data = await fs.readFile(this.storageFile.fsPath, 'utf-8');
      const parsed: StorageData = JSON.parse(data);

      const currentLogicalDate = computeLogicalDate(new Date());
      // Start a new day!
      if (parsed.todaySessions && parsed.todaySessions.logicalDate !== currentLogicalDate) {
        await this.archiveOldData(parsed);
        return {
          tasks: [],
          todaySessions: null,
          currentView: 'briefing',
        };
      }

      return {
        tasks: parsed.tasks.map((task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          doneAt: task.doneAt ? new Date(task.doneAt) : null,
        })),
        todaySessions: parsed.todaySessions
          ? {
              ...parsed.todaySessions,
              startedAt: new Date(parsed.todaySessions.startedAt),
            }
          : null,
        currentView: parsed.currentView || 'briefing',
      };
    } catch (error) {
      // If file does not exist, return default values
      return {
        tasks: [],
        todaySessions: null,
        currentView: 'briefing',
      };
    }
  }

  // Archive old data
  private async archiveOldData(oldData: StorageData): Promise<void> {
    if (!oldData.todaySessions) {
      return;
    }
    const archiveFileName = `${oldData.todaySessions.logicalDate}.json`;
    const archiveFilePath = vscode.Uri.joinPath(this.archiveDir, archiveFileName);

    try {
      await fs.mkdir(this.archiveDir.fsPath, { recursive: true });
      await fs.writeFile(archiveFilePath.fsPath, JSON.stringify(oldData, null, 2), 'utf-8');
      console.log(`Archived data to ${archiveFilePath.fsPath}`);
    } catch (error) {
      console.error('Failed to archive old data:', error);
    }
  }

  private async saveData(data: StorageData): Promise<void> {
    await fs.mkdir(path.dirname(this.storageFile.fsPath), { recursive: true });
    await fs.writeFile(this.storageFile.fsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Task related methods
  async getTasks(): Promise<Task[]> {
    const data = await this.loadData();
    return data.tasks;
  }

  async saveTask(task: Task): Promise<void> {
    const data = await this.loadData();
    data.tasks.push(task);
    await this.saveData(data);
  }

  async updateTask(task: Task): Promise<void> {
    const data = await this.loadData();
    const index = data.tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      data.tasks[index] = task;
      await this.saveData(data);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const data = await this.loadData();
    data.tasks = data.tasks.filter((t) => t.id !== id);
    await this.saveData(data);
  }

  // TodaySession related methods
  async getTodaySessions(): Promise<TodaySession | null> {
    const data = await this.loadData();
    return data.todaySessions;
  }

  async saveTodaySessions(session: TodaySession): Promise<void> {
    const data = await this.loadData();
    data.todaySessions = session;
    await this.saveData(data);
  }

  async clearTodaySessions(): Promise<void> {
    const data = await this.loadData();
    data.todaySessions = null;
    await this.saveData(data);
  }

  // View state
  async getCurrentView(): Promise<string> {
    const data = await this.loadData();
    return data.currentView;
  }

  async saveCurrentView(view: string): Promise<void> {
    const data = await this.loadData();
    data.currentView = view;
    await this.saveData(data);
  }

  async getArchivedTasks(logicalDate?: string): Promise<Task[]> {
    try {
      if (logicalDate) {
        const archiveFile = vscode.Uri.joinPath(this.archiveDir, `${logicalDate}.json`);
        const data = await fs.readFile(archiveFile.fsPath, 'utf-8');
        const parsed: StorageData = JSON.parse(data);
        return parsed.tasks.map((task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          doneAt: task.doneAt ? new Date(task.doneAt) : null,
        }));
      } else {
        const files = await fs.readdir(this.archiveDir.fsPath);
        let allTasks: Task[] = [];

        for (const file of files) {
          if (file.endsWith('.json')) {
            const archiveFile = vscode.Uri.joinPath(this.archiveDir, file);
            const data = await fs.readFile(archiveFile.fsPath, 'utf-8');
            const parsed: StorageData = JSON.parse(data);
            const tasks = parsed.tasks.map((task) => ({
              ...task,
              createdAt: new Date(task.createdAt),
              doneAt: task.doneAt ? new Date(task.doneAt) : null,
            }));
            allTasks = allTasks.concat(tasks);
          }
        }
        return allTasks;
      }
    } catch (error) {
      console.error('Failed to get archived tasks:', error);
      return [];
    }
  }

  async updateArchivedTasks(task: Task, logicalDate?: string): Promise<void> {
    try {
      await fs.access(this.archiveDir.fsPath);
    } catch (error) {
      throw new Error('Archive directory does not exist');
    }

    let targetDate = logicalDate;
    // If no logicalDate specified, find the archive containing this task
    if (!targetDate) {
      const files = await fs.readdir(this.archiveDir.fsPath);
      const archiveFiles = files
        .filter((file: string) => file.endsWith('.json'))
        .sort()
        .reverse();

      for (const file of archiveFiles) {
        const archiveFile = vscode.Uri.joinPath(this.archiveDir, file);
        const data = await fs.readFile(archiveFile.fsPath, 'utf-8');
        const parsed: StorageData = JSON.parse(data);

        if (parsed.tasks.some((t) => t.id === task.id)) {
          targetDate = path.basename(file, '.json');
          break;
        }
      }
      if (!targetDate) {
        throw new Error(`Task ${task.id} not found in any archive`);
      }
    }

    const archiveFile = vscode.Uri.joinPath(this.archiveDir, `${targetDate}.json`);
    const data = await fs.readFile(archiveFile.fsPath, 'utf-8');
    const parsed: StorageData = JSON.parse(data);

    const index = parsed.tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      parsed.tasks[index] = task;
      await fs.writeFile(archiveFile.fsPath, JSON.stringify(parsed, null, 2), 'utf-8');
    } else {
      throw new Error(`Task ${task.id} not found in archive ${targetDate}`);
    }
  }

  async getLatestIncompleteTasks(): Promise<Task[]> {
    try {
      await fs.access(this.archiveDir.fsPath);
    } catch (error) {
      return [];
    }

    const files = await fs.readdir(this.archiveDir.fsPath);
    const archiveFiles = files
      .filter((file: string) => file.endsWith('.json'))
      .sort()
      .reverse();

    if (archiveFiles.length === 0) {
      return [];
    }

    // Search for the most recent archive with incomplete tasks
    for (const file of archiveFiles) {
      const archiveFile = vscode.Uri.joinPath(this.archiveDir, file);
      const data = await fs.readFile(archiveFile.fsPath, 'utf-8');
      const parsed: StorageData = JSON.parse(data);
      const incompleteTasks = parsed.tasks
        .filter((task) => !task.isDone)
        .map((task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          doneAt: task.doneAt ? new Date(task.doneAt) : null,
        }));

      if (incompleteTasks.length > 0) {
        return incompleteTasks;
      }
    }
    return [];
  }

  // All tasks
  async getAllTasks(): Promise<Task[]> {
    const todayTasks = await this.loadData();
    const archivedTasks = await this.getArchivedTasks();
    const data: StorageData = {
      tasks: [...todayTasks.tasks, ...archivedTasks],
      todaySessions: todayTasks.todaySessions,
      currentView: todayTasks.currentView,
    };
    return data.tasks;
  }
}
