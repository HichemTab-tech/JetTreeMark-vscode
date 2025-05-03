import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
// Make sure you export buildTreeNode from your extension entrypoint
import { buildTreeNode } from '../extension';
import * as fs from 'fs';
import * as os from "os";
// Import tree-utils functions for testing context menu options
import { 
  checkAllChildren, 
  checkAllFolders, 
  uncheckAllChildren, 
  checkWithoutChildren,
  checkOnlyFoldersAtLevel,
  checkOnlyFilesAtLevel,
  checkAllChildrenAtLevel
} from './tree-utils';

suite('JetTreeMark-vscode Test Suite', () => {
	test('Extension is present in the registry', () => {
		const ext = vscode.extensions.getExtension('hichemtab-tech.jettreemark');
		assert.ok(ext, 'Extension not found');
	});

	test('Extension activates successfully', async () => {
		const ext = vscode.extensions.getExtension('hichemtab-tech.jettreemark')!;
		await ext.activate();
		assert.strictEqual(ext.isActive, true, 'Extension failed to activate');
	});

	test('buildTreeNode throws on missing folder', () => {
		assert.throws(
			() => buildTreeNode('/path/does/not/exist'),
			/ENOENT/,
			'Expected buildTreeNode to throw ENOENT for non-existent folder'
		);
	});

	suite('JetTreeMark-vscode Test Suite (dynamic fixtures)', () => {
		let tmpDir: string;

		suiteSetup(() => {
			// 1) Create a temp directory
			tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jtt-test-'));

			// 2) Populate it: a.txt, and a subfolder with b.txt
			fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'hello');
			const sub = path.join(tmpDir, 'subdir');
			fs.mkdirSync(sub);
			fs.writeFileSync(path.join(sub, 'b.txt'), 'world');
		});

		suiteTeardown(() => {
			// Clean up after all tests
			fs.rmSync(tmpDir, { recursive: true, force: true });
		});

		test('buildTreeNode returns correct shape for dynamic folder', () => {
			const root = buildTreeNode(tmpDir);
			assert.strictEqual(root.name, path.basename(tmpDir));
			assert.strictEqual(root.type, 'folder');
			assert.ok(Array.isArray(root.children));

			// Expect a.txt
			const fileNode = root.children!.find(n => n.name === 'a.txt');
			assert.ok(fileNode, 'a.txt should exist');
			assert.strictEqual(fileNode!.type, 'file');

			// Expect subdir/b.txt
			const subNode = root.children!.find(n => n.name === 'subdir');
			assert.ok(subNode && subNode.type === 'folder', 'subdir should exist');
			const bNode = subNode!.children!.find(n => n.name === 'b.txt');
			assert.ok(bNode && bNode.type === 'file', 'b.txt should exist in subdir');
		});
	});
	// Test suite for context menu options
	suite('Context Menu Options Tests', () => {
		// Sample tree structure for testing
		let sampleTree: any[];

		setup(() => {
			// Create a sample tree structure before each test
			sampleTree = [
				{
					id: 'root',
					name: 'root',
					type: 'folder',
					checked: false,
					indeterminate: false,
					children: [
						{
							id: 'folder1',
							name: 'folder1',
							type: 'folder',
							checked: false,
							indeterminate: false,
							children: [
								{
									id: 'file1',
									name: 'file1.txt',
									type: 'file',
									checked: false
								},
								{
									id: 'file2',
									name: 'file2.txt',
									type: 'file',
									checked: false
								}
							]
						},
						{
							id: 'folder2',
							name: 'folder2',
							type: 'folder',
							checked: false,
							indeterminate: false,
							children: [
								{
									id: 'file3',
									name: 'file3.txt',
									type: 'file',
									checked: false
								}
							]
						},
						{
							id: 'file4',
							name: 'file4.txt',
							type: 'file',
							checked: false
						}
					]
				}
			];
		});

		test('checkAllChildren sets all nodes to checked', () => {
			const result = checkAllChildren(sampleTree);

			// Check that all nodes are checked
			assert.strictEqual(result[0].checked, true, 'Root node should be checked');
			assert.strictEqual(result[0].children![0].checked, true, 'folder1 should be checked');
			assert.strictEqual(result[0].children![0].children![0].checked, true, 'file1 should be checked');
			assert.strictEqual(result[0].children![0].children![1].checked, true, 'file2 should be checked');
			assert.strictEqual(result[0].children![1].checked, true, 'folder2 should be checked');
			assert.strictEqual(result[0].children![1].children![0].checked, true, 'file3 should be checked');
			assert.strictEqual(result[0].children![2].checked, true, 'file4 should be checked');
		});

		test('checkAllFolders sets only folder nodes to checked', () => {
			const result = checkAllFolders(sampleTree);

			// Check that only folder nodes are checked
			assert.strictEqual(result[0].checked, true, 'Root node should be checked');
			assert.strictEqual(result[0].children![0].checked, true, 'folder1 should be checked');
			assert.strictEqual(result[0].children![0].children![0].checked, false, 'file1 should not be checked');
			assert.strictEqual(result[0].children![0].children![1].checked, false, 'file2 should not be checked');
			assert.strictEqual(result[0].children![1].checked, true, 'folder2 should be checked');
			assert.strictEqual(result[0].children![1].children![0].checked, false, 'file3 should not be checked');
			assert.strictEqual(result[0].children![2].checked, false, 'file4 should not be checked');
		});

		test('uncheckAllChildren sets all nodes to unchecked', () => {
			// First check all nodes
			sampleTree = checkAllChildren(sampleTree);

			// Then uncheck all nodes
			const result = uncheckAllChildren(sampleTree);

			// Check that all nodes are unchecked
			assert.strictEqual(result[0].checked, false, 'Root node should be unchecked');
			assert.strictEqual(result[0].children![0].checked, false, 'folder1 should be unchecked');
			assert.strictEqual(result[0].children![0].children![0].checked, false, 'file1 should be unchecked');
			assert.strictEqual(result[0].children![0].children![1].checked, false, 'file2 should be unchecked');
			assert.strictEqual(result[0].children![1].checked, false, 'folder2 should be unchecked');
			assert.strictEqual(result[0].children![1].children![0].checked, false, 'file3 should be unchecked');
			assert.strictEqual(result[0].children![2].checked, false, 'file4 should be unchecked');
		});

		test('checkWithoutChildren checks a node without affecting its children', () => {
			// Apply checkWithoutChildren to folder1
			const folder1 = sampleTree[0].children![0];
			const result = checkWithoutChildren(folder1);

			// Check that folder1 is checked but its children are not
			assert.strictEqual(result.checked, true, 'folder1 should be checked');
			assert.strictEqual(result.children![0].checked, false, 'file1 should not be checked');
			assert.strictEqual(result.children![1].checked, false, 'file2 should not be checked');
		});

		test('checkOnlyFoldersAtLevel checks only folder nodes at a specific level', () => {
			// Apply checkOnlyFoldersAtLevel to root's children
			const result = checkOnlyFoldersAtLevel(sampleTree[0].children!);

			// Check that only folder nodes at this level are checked
			assert.strictEqual(result[0].checked, true, 'folder1 should be checked');
			assert.strictEqual(result[1].checked, true, 'folder2 should be checked');
			assert.strictEqual(result[2].checked, false, 'file4 should not be checked');
		});

		test('checkOnlyFilesAtLevel checks only file nodes at a specific level', () => {
			// Apply checkOnlyFilesAtLevel to root's children
			const result = checkOnlyFilesAtLevel(sampleTree[0].children!);

			// Check that only file nodes at this level are checked
			assert.strictEqual(result[0].checked, false, 'folder1 should not be checked');
			assert.strictEqual(result[1].checked, false, 'folder2 should not be checked');
			assert.strictEqual(result[2].checked, true, 'file4 should be checked');
		});

		test('checkAllChildrenAtLevel checks all nodes at a specific level', () => {
			// Apply checkAllChildrenAtLevel to root's children
			const result = checkAllChildrenAtLevel(sampleTree[0].children!);

			// Check that all nodes at this level are checked
			assert.strictEqual(result[0].checked, true, 'folder1 should be checked');
			assert.strictEqual(result[1].checked, true, 'folder2 should be checked');
			assert.strictEqual(result[2].checked, true, 'file4 should be checked');
		});
	});
});
