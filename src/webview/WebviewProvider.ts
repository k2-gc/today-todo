import * as vscode from 'vscode';
import { AppController } from '../AppController';
import type { Task, ViewType } from '../../core/domain/types';
import type { WebviewMessage } from './type';
import { autoRefillFocus } from '../../core/commands';
import { StorageAdapter } from '../../core/storage/StorageAdapter';

/**
 * Generate Webview and handle connections between Webview and VSCode.
 */

export class WebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _storage: StorageAdapter;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _appController: AppController,
  ) {
    this._storage = _appController.getStorage();
  }

  /**
   * Called when the webview view is generated.
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Set initial HTML content
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    this._setWebviewMessageListener(webviewView.webview);

    console.log('Webview resolved.');
  }

  /**
   * Init: Send current state to Webview.
   */
  private async _initialize() {
    const { session, view } = await this._appController.initialize();
    const tasks = await this._appController.getTodayAllTasks();
    const allTasks = await this._appController.getAllTasks();

    this._postMessage({
      type: 'initialize',
      payload: {
        session,
        view,
        tasks,
        allTasks,
      },
    });
  }

  /**
   * Treat messages from Webview.
   */
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      try {
        switch (message.command) {
          case 'ready':
            await this._initialize();
            break;
          case 'addTask':
            await this._handleAddTask(message.title);
            break;
          case 'setFocusedTasks':
            await this._handleSetFocusedTasks(message.taskIds);
            break;
          case 'toggleDone':
            await this._handleToggleDone(message.taskId);
            break;
          case 'switchView':
            await this._handleSwitchView(message.view);
            break;
          case 'getYesterdayIncompleteTasks':
            await this._handleGetYesterdayIncompleteTasks();
            break;
          case 'carryOverTask':
            await this._handleCarryOverTask(message.yesterdayTask);
            break;
          case 'update':
            await this._handleUpdate();
            break;
        }
      } catch (error) {
        console.error(`Error handling message from webview: ${error}`);
        this._postMessage({
          command: 'error',
          payload: { message: error instanceof Error ? error.message : String(error) },
        });
      } finally {
        console.log('Finished handling message from webview.');
      }
    });
  }

  /**
   * Handle getYesterdayIncompleteTasks command.
   */
  private async _handleGetYesterdayIncompleteTasks() {
    const tasks = await this._appController.getYesterdayIncompleteTasks();

    this._postMessage({
      type: 'yesterdayIncompleteTasks',
      payload: {
        tasks,
      },
    });
  }

  /**
   * Handle carryOverTask command.
   */
  private async _handleCarryOverTask(yesterdayTask: Task) {
    const newTask = await this._appController.carryOverTask(yesterdayTask);
    const session = await this._appController.getCurrentSession();

    this._postMessage({
      type: 'carryOverTask',
      payload: {
        task: newTask,
        session,
        originalTaskId: yesterdayTask.id,
      },
    });
  }

  /**
   * Handle addTask command.
   */
  private async _handleAddTask(title: string) {
    const newTask = await this._appController.addNewTask(title);
    const session = await this._appController.getCurrentSession();

    this._postMessage({
      type: 'addTask',
      payload: {
        task: newTask,
        session,
      },
    });
  }

  /**
   * Handle setFocusedTasks command.
   */
  private async _handleSetFocusedTasks(taskIds: string[]) {
    await this._appController.setFocusedTasks(taskIds);
    const session = await this._appController.getCurrentSession();

    this._postMessage({
      type: 'viewChanged',
      payload: {
        view: 'focus',
        session,
      },
    });
  }

  /**
   * Handle toggleDone command.
   */
  private async _handleToggleDone(taskId: string) {
    const updatedTask = await this._appController.toggleTaskDone(taskId);

    // Auto refill focus if needed
    await autoRefillFocus(this._appController.getStorage());

    const session = await this._appController.getCurrentSession();
    const tasks = await this._appController.getTodayAllTasks();

    this._postMessage({
      type: 'taskUpdated',
      payload: {
        task: updatedTask,
        session,
        tasks,
      },
    });
  }

  /**
   * Handle switchView command.
   */
  private async _handleSwitchView(view: ViewType) {
    await this._appController.switchView(view);

    this._postMessage({
      type: 'viewChanged',
      payload: {
        view,
      },
    });
  }
  /**
   * Handle update command.
   */
  private async _handleUpdate() {
    const allTasks = await this._appController.getAllTasks();
    this._postMessage({
      type: 'update',
      payload: {
        allTasks,
      },
    });
  }

  /**
   * Post message to Webview.
   */
  private _postMessage(message: any) {
    this._view?.webview.postMessage(message);
    console.log('Posted message to webview:', message);
  }

  /**
   * Generate HTML content for the webview.
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    // Load React app after building it.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'index.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'index.css'),
    );
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <link href="${styleUri}" rel="stylesheet">
      <title>Today-ToDo</title>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
