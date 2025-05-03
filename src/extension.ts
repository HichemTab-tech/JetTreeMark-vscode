import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { JetTreeMarkViewProvider } from './JetTreeMarkViewProvider';
import { collectDirectoryGitignorePatterns, shouldExcludeByGitignore, GitignorePattern } from './gitignore-utils';

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
 * @param dir Directory path
 * @param parentPatterns Optional gitignore patterns from parent directories
 * @param forceUncheck
 * @returns TreeNodeType representing the directory
 */
export function buildTreeNode(dir: string, parentPatterns: GitignorePattern[] = [], forceUncheck: boolean = false): TreeNodeType {
  const name = path.basename(dir) || dir;

  // Collect gitignore patterns for this directory
  const directoryPatterns = collectDirectoryGitignorePatterns(dir);

  // Combine with parent patterns (parent patterns take precedence)
  const allPatterns = [...directoryPatterns, ...parentPatterns];

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
    const isDirectory = entry.isDirectory();

    // Check if this file/folder should be excluded based on gitignore patterns
    const shouldExclude = shouldExcludeByGitignore(fullPath, dir, allPatterns, isDirectory);

    if (isDirectory) {
      // Process subdirectory, passing down the combined patterns
      const childNode = buildTreeNode(fullPath, allPatterns, shouldExclude || forceUncheck);

      // If the directory itself matches gitignore patterns, mark it as unchecked
      if (shouldExclude || forceUncheck) {
        childNode.checked = false;
      }

      node.children!.push(childNode);
    } else {
      // Add file node
      node.children!.push({
        id: fullPath,
        name: entry.name,
        type: 'file',
        checked: !shouldExclude && !forceUncheck // Set checked to false if it matches gitignore patterns
      });
    }
  }

  return node;
}
