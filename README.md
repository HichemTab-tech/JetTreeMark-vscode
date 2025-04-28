# JetTreeMark for VS Code

![Build](https://github.com/HichemTab-tech/JetTreeMark-vscode/actions/workflows/ci.yml/badge.svg)  
[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](https://github.com/HichemTab-tech/JetTreeMark-vscode/releases) [![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/HichemTab-tech/JetTreeMark-vscode/blob/master/LICENSE)

---

## 🚀 What is JetTreeMark?

**JetTreeMark** for VS Code brings the same lightning-fast,
one-click tree-view generation you know from the IntelliJ plugin into your favorite editor.  
Right-click any folder in the Explorer, choose **Show Tree View**,
and you’ll instantly get a clean, customizable markdown-compatible tree of your project—ready to copy, share,
or document.
😉

> **Looking for IntelliJ IDEA support?**  
> Check out the original [JetTreeMark plugin for IntelliJ IDEA](https://github.com/HichemTab-tech/JetTreeMark).

---

## ✨ Features

- 📂 **Generate** a neat tree view of any selected folder
- 📋 **Copy** the filtered structure to clipboard with one click
- ✔️ **Tri-state checkboxes** let you include/exclude subfolders & files
- ⚡ **Lightweight**—built as a native VS Code Webview extension
- 🎨 **Tailwind-powered** UI for a clean, responsive look

---

## 📷 Example Output

```
└── my-project/
    ├── src/
    │   ├── components/
    │   │   └── Button.tsx
    │   └── index.ts
    ├── README.md
    └── package.json
```

---

## 🛠️ Installation

### From the Marketplace

JetTreeMark is now available on the Visual Studio Marketplace!  
Install it directly from VS Code’s Extensions view—just search for **JetTreeMark** and click **Install**.


### Manual Installation

1. [Download the latest `.vsix` release](https://github.com/HichemTab-tech/JetTreeMark-vscode/releases/latest)
2. In VS Code, open the **Extensions** sidebar (Ctrl+Shift+X)
3. Click the **⋯** menu → **Install from VSIX...**
4. Select the downloaded file
5. Reload VS Code when prompted

---

### Building from Source

```bash
git clone https://github.com/HichemTab-tech/JetTreeMark-vscode.git
cd JetTreeMark-vscode

# 1) Build the Webview UI
cd webview-ui
npm install
npm run build
cd ..

# 2) Build the extension
pnpm install
pnpm run compile

# 3) Launch for development
code .
# Press F5 in VS Code to open a new Extension Development Host
```

Your compiled `.vsix` will be generated via:

```bash
vsce package
```

---

## 🎯 How to Use

1. **Right-click** on any folder in the Explorer.
2. Select **“Show Tree View”** from the context menu.

   ![How to use the JetTreeMark plugin from folder context menu](https://github.com/HichemTab-tech/JetTreeMark-vscode/blob/master/meta/screenshot-1.png "Screenshot -JetTreeMark in context menu-")

3. The **JetTreeMark** view opens in the Activity Bar.
4. Use the **tri-state checkboxes** to include/exclude items.

   ![How to use the JetTreeMark plugin to exclude nodes from the tree view result](https://github.com/HichemTab-tech/JetTreeMark-vscode/blob/master/meta/screenshot-2.png "Screenshot - filter nodes from tree results -")

5. Click **“Copy Selected Structure”** at the top to copy your markdown tree.

---

## ℹ️ About

This VS Code extension is a companion to the original IntelliJ IDEA plugin:

- **JetBrains/IntelliJ version**: [JetTreeMark](https://github.com/HichemTab-tech/JetTreeMark)
- **VS Code version**: [JetTreeMark-vscode](https://github.com/HichemTab-tech/JetTreeMark-vscode)

Both are MIT-licensed and developed by HichemTab-tech. Contributions, issues, and ⭐s are always welcome!

---

# 🌳 JetTreeMark — Draw your project structure, copy it instantly!