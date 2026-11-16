import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('MascotCustomizerPanel Smoke Test (Contract C11)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/MascotCustomizerPanel.tsx');

  test('file exists and exports MascotCustomizerPanel with required controls', () => {
    assert.ok(fs.existsSync(componentPath), 'components/MascotCustomizerPanel.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('MascotCustomizerPanel'), 'Must export MascotCustomizerPanel');
    assert.ok(content.includes('Customize Mascot'), 'Must include collapsed pill toggle');
    assert.ok(content.includes('resetAll'), 'Must connect to resetAll');
  });
});
