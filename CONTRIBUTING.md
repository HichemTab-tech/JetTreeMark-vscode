# Contributing to JetTreeMark-vscode

Thanks for your interest in improving JetTreeMark-vscode! Your feedback, bug reports, and code contributions make this extension better for everyone. 🚀

---

## How to Contribute

- **Report Bugs**  
  If you encounter an issue, please open an issue under [JetTreeMark-vscode Issues](https://github.com/HichemTab-tech/JetTreeMark-vscode/issues) with clear steps to reproduce, your OS, and VS Code version.

- **Suggest Enhancements**  
  Have an idea for a new feature or improvement? Open a feature request in [Issues](https://github.com/HichemTab-tech/JetTreeMark-vscode/issues), and we’ll discuss the best approach.

- **Pull Requests**  
  1. Fork the repository.  
  2. Create a branch from `main`:
     ```bash
     git checkout -b feature/your-feature-name
     ```  
  3. Implement your changes.  
  4. Add or update tests if applicable.  
  5. Commit with a clear, descriptive message.  
  6. Push to your fork and open a PR against `main`.  

---

## Code Style

- Follow the existing TypeScript conventions:  
  - Use ESLint and Prettier (run `pnpm run lint`).  
  - Keep code modular, with small, focused functions.  
  - Document public APIs and React components as needed.

- VS Code extension best practices:  
  - Use the `vscode` namespace for API calls.  
  - Avoid synchronous file I/O on the UI thread when possible.  
  - Keep the Webview UI in `webview-ui/` isolated; treat it like a separate frontend project.

---

## Building & Testing Locally

1. **Clone & install**  
   ```bash
   git clone https://github.com/HichemTab-tech/JetTreeMark-vscode.git
   cd JetTreeMark-vscode
   pnpm install
   ```

2. **Build the Webview UI**  
   ```bash
   cd webview-ui
   npm install
   npm run build
   cd ..
   ```

3. **Compile the extension**  
   ```bash
   pnpm run compile
   ```

4. **Launch in development**  
   - Open in VS Code:  
     ```bash
     code .
     ```  
   - Press **F5** to run the Extension Development Host and try out your changes.

5. **Package a `.vsix`**  
   ```bash
   pnpm run package   # or: vsce package
   ```

---

## Thanks!

Your contributions help everyone share and document their project structures more easily. Happy coding!
