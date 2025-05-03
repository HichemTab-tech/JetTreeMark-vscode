import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  parseGitignoreContent,
  parseGitignoreFile,
  matchesGitignorePatterns,
  collectDirectoryGitignorePatterns,
  collectGitignorePatterns,
  shouldExcludeByGitignore,
  GitignorePattern
} from '../gitignore-utils';
import { buildTreeNode } from '../extension';

suite('Gitignore Utils Test Suite', () => {
  suite('parseGitignoreContent', () => {
    test('parses empty content correctly', () => {
      const patterns = parseGitignoreContent('');
      assert.strictEqual(patterns.length, 0, 'Empty content should result in empty patterns array');
    });

    test('parses basic patterns correctly', () => {
      const content = `
        # This is a comment
        node_modules
        *.log
        !important.log
        /dist
        build/
      `;
      const patterns = parseGitignoreContent(content);

      assert.strictEqual(patterns.length, 5, 'Should parse 5 patterns');

      // Check node_modules pattern
      const nodeModulesPattern = patterns.find(p => p.pattern === 'node_modules');
      assert.ok(nodeModulesPattern, 'node_modules pattern should exist');
      assert.strictEqual(nodeModulesPattern!.isNegated, false, 'node_modules should not be negated');
      assert.strictEqual(nodeModulesPattern!.isDirectory, false, 'node_modules should not be marked as directory');
      assert.strictEqual(nodeModulesPattern!.isAbsolute, false, 'node_modules should not be absolute');

      // Check *.log pattern
      const logPattern = patterns.find(p => p.pattern === '*.log');
      assert.ok(logPattern, '*.log pattern should exist');
      assert.strictEqual(logPattern!.isNegated, false, '*.log should not be negated');

      // Check !important.log pattern
      const importantLogPattern = patterns.find(p => p.pattern === 'important.log');
      assert.ok(importantLogPattern, 'important.log pattern should exist');
      assert.strictEqual(importantLogPattern!.isNegated, true, 'important.log should be negated');

      // Check /dist pattern
      const distPattern = patterns.find(p => p.pattern === 'dist');
      assert.ok(distPattern, 'dist pattern should exist');
      assert.strictEqual(distPattern!.isAbsolute, true, 'dist should be absolute');

      // Check build/ pattern
      const buildPattern = patterns.find(p => p.pattern === 'build/');
      assert.ok(buildPattern, 'build/ pattern should exist');
      assert.strictEqual(buildPattern!.isDirectory, true, 'build/ should be marked as directory');
    });
  });

  suite('matchesGitignorePatterns', () => {
    test('matches basic patterns correctly', () => {
      const patterns: GitignorePattern[] = [
        { pattern: 'node_modules', isNegated: false, isDirectory: false, isAbsolute: false },
        { pattern: '*.log', isNegated: false, isDirectory: false, isAbsolute: false },
        { pattern: 'important.log', isNegated: true, isDirectory: false, isAbsolute: false },
        { pattern: 'dist', isNegated: false, isDirectory: false, isAbsolute: true },
        { pattern: 'build/', isNegated: false, isDirectory: true, isAbsolute: false }
      ];

      // Should match
      assert.strictEqual(
        matchesGitignorePatterns('node_modules', patterns, false),
        true,
        'node_modules should match'
      );

      assert.strictEqual(
        matchesGitignorePatterns('logs/error.log', patterns, false),
        true,
        '*.log should match error.log'
      );

      assert.strictEqual(
        matchesGitignorePatterns('dist', patterns, false),
        true,
        'dist should match'
      );

      assert.strictEqual(
        matchesGitignorePatterns('build', patterns, true),
        true,
        'build/ should match build directory'
      );

      // Should not match
      assert.strictEqual(
        matchesGitignorePatterns('important.log', patterns, false),
        false,
        'important.log should not match due to negation'
      );

      assert.strictEqual(
        matchesGitignorePatterns('src', patterns, false),
        false,
        'src should not match any pattern'
      );

      assert.strictEqual(
        matchesGitignorePatterns('build', patterns, false),
        false,
        'build/ should not match build file (only directory)'
      );
    });
  });

  suite('Integration with file system', () => {
    let tmpDir: string;

    suiteSetup(() => {
      // Create a temp directory
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitignore-test-'));

      // Create a .gitignore file
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), `
        # Test gitignore file
        node_modules
        *.log
        !important.log
        /dist
        build/
      `);

      // Create some files and directories
      fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content');
      fs.writeFileSync(path.join(tmpDir, 'error.log'), 'error');
      fs.writeFileSync(path.join(tmpDir, 'important.log'), 'important');

      fs.mkdirSync(path.join(tmpDir, 'src'));
      fs.writeFileSync(path.join(tmpDir, 'src', 'index.js'), 'console.log("Hello")');

      fs.mkdirSync(path.join(tmpDir, 'dist'));
      fs.writeFileSync(path.join(tmpDir, 'dist', 'bundle.js'), 'bundled code');

      fs.mkdirSync(path.join(tmpDir, 'build'));
      fs.writeFileSync(path.join(tmpDir, 'build', 'output.js'), 'output');

      fs.mkdirSync(path.join(tmpDir, 'node_modules'));
      fs.writeFileSync(path.join(tmpDir, 'node_modules', 'package.json'), '{}');

      // Create a subdirectory with its own .gitignore
      fs.mkdirSync(path.join(tmpDir, 'subdir'));
      fs.writeFileSync(path.join(tmpDir, 'subdir', '.gitignore'), `
        # Subdir gitignore
        *.txt
        !important.txt
      `);
      fs.writeFileSync(path.join(tmpDir, 'subdir', 'file.txt'), 'content');
      fs.writeFileSync(path.join(tmpDir, 'subdir', 'important.txt'), 'important');
      fs.writeFileSync(path.join(tmpDir, 'subdir', 'code.js'), 'code');
    });

    suiteTeardown(() => {
      // Clean up
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('parseGitignoreFile reads file correctly', () => {
      const patterns = parseGitignoreFile(path.join(tmpDir, '.gitignore'));
      assert.ok(patterns.length > 0, 'Should parse patterns from file');
      assert.ok(patterns.some(p => p.pattern === 'node_modules'), 'Should include node_modules pattern');
    });

    test('collectDirectoryGitignorePatterns collects patterns from directory', () => {
      const patterns = collectDirectoryGitignorePatterns(tmpDir);
      assert.ok(patterns.length > 0, 'Should collect patterns from directory');
      assert.ok(patterns.some(p => p.pattern === 'node_modules'), 'Should include node_modules pattern');
    });

    test('collectGitignorePatterns collects patterns from directory and parents', () => {
      const patterns = collectGitignorePatterns(path.join(tmpDir, 'subdir'));
      assert.ok(patterns.length > 0, 'Should collect patterns from directory and parents');
      assert.ok(patterns.some(p => p.pattern === '*.txt'), 'Should include *.txt pattern from subdir');
    });

    test('shouldExcludeByGitignore correctly identifies excluded files', () => {
      // Files that should be excluded
      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'node_modules'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          true
        ),
        true,
        'node_modules directory should be excluded'
      );

      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'error.log'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          false
        ),
        true,
        'error.log should be excluded'
      );

      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'dist'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          true
        ),
        true,
        'dist directory should be excluded'
      );

      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'build'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          true
        ),
        true,
        'build directory should be excluded'
      );

      // Files that should not be excluded
      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'important.log'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          false
        ),
        false,
        'important.log should not be excluded due to negation'
      );

      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'file.txt'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          false
        ),
        false,
        'file.txt should not be excluded'
      );

      assert.strictEqual(
        shouldExcludeByGitignore(
          path.join(tmpDir, 'src'),
          tmpDir,
          collectDirectoryGitignorePatterns(tmpDir),
          true
        ),
        false,
        'src directory should not be excluded'
      );
    });

    test('buildTreeNode respects gitignore patterns', () => {
      const tree = buildTreeNode(tmpDir);

      // Check that the tree has the correct structure
      assert.strictEqual(tree.name, path.basename(tmpDir), 'Root node should have correct name');
      assert.strictEqual(tree.type, 'folder', 'Root node should be a folder');

      // Find nodes for various files/directories
      const findNode = (name: string) => {
        return tree.children!.find(node => node.name === name);
      };

      // Files/directories that should be included but unchecked
      const nodeModulesNode = findNode('node_modules');
      assert.ok(nodeModulesNode, 'node_modules should be in the tree');
      assert.strictEqual(nodeModulesNode!.checked, false, 'node_modules should be unchecked');

      const errorLogNode = findNode('error.log');
      assert.ok(errorLogNode, 'error.log should be in the tree');
      assert.strictEqual(errorLogNode!.checked, false, 'error.log should be unchecked');

      const distNode = findNode('dist');
      assert.ok(distNode, 'dist should be in the tree');
      assert.strictEqual(distNode!.checked, false, 'dist should be unchecked');

      const buildNode = findNode('build');
      assert.ok(buildNode, 'build should be in the tree');
      assert.strictEqual(buildNode!.checked, false, 'build should be unchecked');

      // Files/directories that should be included and checked
      const importantLogNode = findNode('important.log');
      assert.ok(importantLogNode, 'important.log should be in the tree');
      assert.strictEqual(importantLogNode!.checked, true, 'important.log should be checked');

      const fileTxtNode = findNode('file.txt');
      assert.ok(fileTxtNode, 'file.txt should be in the tree');
      assert.strictEqual(fileTxtNode!.checked, true, 'file.txt should be checked');

      const srcNode = findNode('src');
      assert.ok(srcNode, 'src should be in the tree');
      assert.strictEqual(srcNode!.checked, true, 'src should be checked');

      // Check subdirectory with its own gitignore
      const subdirNode = findNode('subdir');
      assert.ok(subdirNode, 'subdir should be in the tree');
      assert.strictEqual(subdirNode!.checked, true, 'subdir should be checked');

      // Find nodes in the subdirectory
      const subdirChildren = subdirNode!.children!;
      const findSubdirNode = (name: string) => {
        return subdirChildren.find(node => node.name === name);
      };

      const subdirFileTxtNode = findSubdirNode('file.txt');
      assert.ok(subdirFileTxtNode, 'subdir/file.txt should be in the tree');
      assert.strictEqual(subdirFileTxtNode!.checked, false, 'subdir/file.txt should be unchecked');

      const subdirImportantTxtNode = findSubdirNode('important.txt');
      assert.ok(subdirImportantTxtNode, 'subdir/important.txt should be in the tree');
      assert.strictEqual(subdirImportantTxtNode!.checked, true, 'subdir/important.txt should be checked');

      const subdirCodeJsNode = findSubdirNode('code.js');
      assert.ok(subdirCodeJsNode, 'subdir/code.js should be in the tree');
      assert.strictEqual(subdirCodeJsNode!.checked, true, 'subdir/code.js should be checked');
    });
  });
});