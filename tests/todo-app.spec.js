// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const INDEX_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.describe('Todo App – Basic HTML Structure', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(INDEX_URL);
  });

  // ── Acceptance Criterion 1: index.html file exists ──────────────────────
  test('index.html loads successfully', async ({ page }) => {
    // The page title should be set
    await expect(page).toHaveTitle('Todo App');
  });

  // ── Acceptance Criterion 2: Has input field and add button ──────────────
  test('has a text input field for new todos', async ({ page }) => {
    const input = page.locator('#todo-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveAttribute('placeholder', /./); // has some placeholder
  });

  test('has an Add button', async ({ page }) => {
    const btn = page.locator('#add-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Add');
  });

  // ── Acceptance Criterion 3: Has todo list container ─────────────────────
  test('has a todo list container', async ({ page }) => {
    const list = page.locator('#todo-list');
    await expect(list).toBeAttached();
  });

  // ── Acceptance Criterion 4: Has modern CSS styling ──────────────────────
  test('header has styled title', async ({ page }) => {
    const h1 = page.locator('header h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('Todo App');
    // Check that the title has custom styling (not default black)
    const color = await h1.evaluate(el => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(0, 0, 0)');
  });

  test('input and button have modern rounded styling', async ({ page }) => {
    const input = page.locator('#todo-input');
    const btn = page.locator('#add-btn');

    const inputRadius = await input.evaluate(el => getComputedStyle(el).borderRadius);
    const btnRadius = await btn.evaluate(el => getComputedStyle(el).borderRadius);

    // border-radius should be > 0 (modern styling)
    expect(parseFloat(inputRadius)).toBeGreaterThan(0);
    expect(parseFloat(btnRadius)).toBeGreaterThan(0);
  });

  test('body has a non-white background (modern design)', async ({ page }) => {
    const bg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  // ── Functional smoke tests ──────────────────────────────────────────────
  test('can add a todo item', async ({ page }) => {
    await page.fill('#todo-input', 'Buy groceries');
    await page.click('#add-btn');

    const item = page.locator('.todo-item');
    await expect(item).toHaveCount(1);
    await expect(item.locator('span')).toHaveText('Buy groceries');
  });

  test('can add multiple todo items', async ({ page }) => {
    const todos = ['Buy groceries', 'Walk the dog', 'Read a book'];
    for (const todo of todos) {
      await page.fill('#todo-input', todo);
      await page.click('#add-btn');
    }
    await expect(page.locator('.todo-item')).toHaveCount(3);
  });

  test('input clears after adding a todo', async ({ page }) => {
    await page.fill('#todo-input', 'Test todo');
    await page.click('#add-btn');
    await expect(page.locator('#todo-input')).toHaveValue('');
  });

  test('does not add empty todos', async ({ page }) => {
    await page.click('#add-btn');
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  test('screenshot - empty state', async ({ page }) => {
    await page.screenshot({ path: '/workspace/proof/screenshot-empty-state.png', fullPage: true });
  });

  test('screenshot - with todos', async ({ page }) => {
    const todos = ['Buy groceries', 'Walk the dog', 'Read a book'];
    for (const todo of todos) {
      await page.fill('#todo-input', todo);
      await page.click('#add-btn');
    }
    await page.screenshot({ path: '/workspace/proof/screenshot-with-todos.png', fullPage: true });
  });
});
