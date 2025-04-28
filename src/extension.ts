import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { JetTreeMarkViewProvider } from './JetTreeMarkViewProvider';

// noinspection JSUnusedGlobalSymbols
export function activate(ctx: vscode.ExtensionContext) {
  // Register the WebviewView (your “ToolWindow”)
  const provider = new JetTreeMarkViewProvider(ctx.extensionUri);
  ctx.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'jettreemark.view',
      provider
    )
  );  

  // Context‐menu command
  ctx.subscriptions.push(
    vscode.commands.registerCommand('jtt.showFolder', async (uri: vscode.Uri) => {
      console.log('ShowFolder invoked on', uri.fsPath);
      // 1) Switch to your JetTreeMark view container
      await vscode.commands.executeCommand('workbench.view.extension.jettreemark');
      console.log('➡ container revealed');
      // 2) Tell the Webview to add that folder
      const tree = buildTreeNode(uri.fsPath);
      provider.postMessage({
        command: 'addFolder',    // match whatever your webview listens for
        folderPath: uri.fsPath,
        tree: [tree]
      });
    })
  );
}

interface TreeNodeType {
  id: string
  name: string
  type: "file" | "folder"
  checked: boolean
  indeterminate?: boolean
  children?: TreeNodeType[]
}

/**
 * Build a TreeNodeType *for* the directory itself, including its contents.
 */
export function buildTreeNode(dir: string): TreeNodeType {
  const name = path.basename(dir) || dir;
  const node: TreeNodeType = {
    id: dir,
    name,
    type: 'folder',
    checked: true,
    indeterminate: false,
    children: []
  };

  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      node.children!.push(buildTreeNode(fullPath));
    } else {
      node.children!.push({
        id: fullPath,
        name: entry.name,
        type: 'file',
        checked: true
      });
    }
  }

  return node;
}