import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
// Make sure you export buildTreeNode from your extension entrypoint
import { buildTreeNode } from '../extension';
import * as fs from 'fs';
import * as os from "os";

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
});