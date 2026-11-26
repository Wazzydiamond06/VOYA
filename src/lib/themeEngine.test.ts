import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextTheme,
  getThemeToggleMeta,
  resolveInitialTheme,
} from './themeEngine';

test('resolveInitialTheme defaults to dark and respects stored light preference', () => {
  assert.equal(resolveInitialTheme(null), 'dark');
  assert.equal(resolveInitialTheme(undefined), 'dark');
  assert.equal(resolveInitialTheme('invalid'), 'dark');
  assert.equal(resolveInitialTheme('dark'), 'dark');
  assert.equal(resolveInitialTheme('light'), 'light');
});

test('getNextTheme and getThemeToggleMeta alternate cleanly between dark and light', () => {
  assert.equal(getNextTheme('dark'), 'light');
  assert.equal(getNextTheme('light'), 'dark');

  const fromDark = getThemeToggleMeta('dark');
  assert.equal(fromDark.nextTheme, 'light');
  assert.equal(fromDark.ariaLabel, 'Switch to light mode');

  const fromLight = getThemeToggleMeta('light');
  assert.equal(fromLight.nextTheme, 'dark');
  assert.equal(fromLight.ariaLabel, 'Switch to dark mode');
});
