// @ts-check
const { test } = require('@playwright/test');
const path = require('path');

const INDEX_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const PROOF_DIR = '/workspace/proof';

test('Screenshot 1: Empty state — initial app load', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await page.goto(INDEX_URL);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(PROOF_DIR, 'screenshot-01-empty-state.png'), fullPage: true });
});

test('Screenshot 2: App with several todos added', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await page.goto(INDEX_URL);

  const todos = ['Buy groceries', 'Read a book', 'Exercise for 30 mins', 'Write project report'];
  for (const todo of todos) {
    await page.fill('#todo-input', todo);
    await page.click('#add-btn');
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(PROOF_DIR, 'screenshot-02-with-todos.png'), fullPage: true });
});

test('Screenshot 3: Completed and active todos mix', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await page.goto(INDEX_URL);

  const todos = ['Buy groceries', 'Read a book', 'Exercise for 30 mins', 'Write project report'];
  for (const todo of todos) {
    await page.fill('#todo-input', todo);
    await page.click('#add-btn');
  }

  // Mark first and third as completed
  await page.locator('.todo-item').nth(0).locator('input[type="checkbox"]').check();
  await page.locator('.todo-item').nth(2).locator('input[type="checkbox"]').check();

  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(PROOF_DIR, 'screenshot-03-mixed-state.png'), fullPage: true });
});
