// src/JetTreeMarkViewProvider.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class JetTreeMarkViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private pending: any[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    // Allow scripts & local loading
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'src', 'webview-ui-dist')
      ]
    };

    // Load the built HTML
    const folder = path.join(this.extensionUri.fsPath, 'src', 'webview-ui-dist');
    let html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');

    // Rewrite all <link href> and <script src> to use webview.asWebviewUri
    html = html.replace(/(href|src)="(.+?)"/g, (_, attr, src) => {
      // normalize the path
      let rel = src;
      if (rel.startsWith('/')) {rel = rel.slice(1);}
      if (!rel.startsWith('assets/') && !rel.startsWith('./')) {
        return `${attr}="${src}"`;   // leave untouched
      }
    
      // remove any leading "./"
      rel = rel.replace(/^\.\//, '');
      // map to disk path under media/webview
      const diskPath = path.join(folder, rel);
      // get a proper vscode-webview:// URI
      const uri = webviewView.webview.asWebviewUri(
        vscode.Uri.file(diskPath)
      );
      return `${attr}="${uri}"`;
    });

    webviewView.webview.html = html;

    // Listen for copyTree messages from the webview
    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'copyTree') {
        vscode.env.clipboard.writeText(msg.treeText);
      }
    });

    // Flush any pending addFolder messages
    this.pending.forEach(m => this.view!.webview.postMessage(m));
    this.pending = [];
  }

  public postMessage(msg: any) {
    if (this.view) {
      this.view.webview.postMessage(msg);
    } else {
      this.pending.push(msg);
    }
  }
}