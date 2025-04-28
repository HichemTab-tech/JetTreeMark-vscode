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

    // 1) compute the folder URI for assets
    const baseUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src', 'webview-ui-dist')
    ) + '/';

    // 2) inject the <base> so that all "./…" references resolve correctly
    html = html.replace(
      /<head([^>]*)>/,
      `<head$1><base href="${baseUri}">`
    );

    // 3) now do your existing href/src rewrite to rewrite only the HTML tags
    html = html.replace(/(href|src)="(.+?)"/g, (_, attr, src) => {
      // only rewrite links that aren’t absolute URLs (http, https, vscode-*)
      if (/^(https?:|vscode-webview:)/.test(src)) {
        return `${attr}="${src}"`;
      }
      // Every other href/src (i.e. "./assets/…" or "assets/…") now resolves via <base>
      return `${attr}="${src}"`;
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