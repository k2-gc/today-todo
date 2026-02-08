import * as vscode from 'vscode';
import { AppController } from './AppController';
import { VSCodeStorageAdapter } from './storage/VSCodeStorageAdapter';
import { WebviewProvider } from './webview/WebviewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Today-ToDo is now activated!');

  // Initialize Storage Adapter and App Controller
  const storageAdapter = new VSCodeStorageAdapter(context);
  const appController = new AppController(storageAdapter);

  // Register WebView Provider
  const webviewProvider = new WebviewProvider(context.extensionUri, appController);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('today-todo.mainView', webviewProvider),
  );

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('today-todo.open', async () => {
      // Open the Today ToDo view
      await vscode.commands.executeCommand('workbench.view.extension.today-todo');
    }),
  );
}

export function deactivate() {
  console.log('Today-ToDo is now deactivated.');
}
