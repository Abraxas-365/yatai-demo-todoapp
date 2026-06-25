// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const INDEX_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

// ── Acceptance Criteria Tests ──────────────────────────────────────────────

test.describe('Todo App — Acceptance Criteria', () => {

  test('AC1: index.html file exists', async ({}) => {
    const fs = require('fs');
    const filePath = path.resolve(__dirname, '..', 'index.html');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('AC2: Has input field and add button', async ({ page }) => {
    await page.goto(INDEX_URL);

    const input = page.locator('#todo-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'What needs to be done?');

    const addBtn = page.locator('#add-btn');
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toHaveText('Add');
  });

  test('AC3: Has todo list container', async ({ page }) => {
    await page.goto(INDEX_URL);

    const todoList = page.locator('#todo-list');
    await expect(todoList).toBeVisible();
    // The container is a <ul> element
    await expect(todoList).toHaveAttribute('id', 'todo-list');
  });

  test('AC4: Has modern CSS styling', async ({ page }) => {
    await page.goto(INDEX_URL);

    // Check the app container has rounded corners (border-radius)
    const app = page.locator('.app');
    await expect(app).toBeVisible();
    const borderRadius = await app.evaluate(el =>
      getComputedStyle(el).borderRadius
    );
    expect(borderRadius).not.toBe('0px');

    // Check body has a gradient background
    const bgImage = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundImage
    );
    expect(bgImage).toContain('gradient');

    // Check the header exists and has styling
    const header = page.locator('.header');
    await expect(header).toBeVisible();
    const headerBg = await header.evaluate(el =>
      getComputedStyle(el).backgroundImage
    );
    expect(headerBg).toContain('gradient');

    // Check box-shadow on app container
    const boxShadow = await app.evaluate(el =>
      getComputedStyle(el).boxShadow
    );
    expect(boxShadow).not.toBe('none');
  });
});

// ── Functional Tests ───────────────────────────────────────────────────────

test.describe('Todo App — Functionality', () => {

  test('Header displays app title', async ({ page }) => {
    await page.goto(INDEX_URL);
    const h1 = page.locator('.header h1');
    await expect(h1).toHaveText('Todo App');
  });

  test('Can add a todo by clicking Add button', async ({ page }) => {
    await page.goto(INDEX_URL);

    await page.fill('#todo-input', 'Buy groceries');
    await page.click('#add-btn');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(items.first().locator('span')).toHaveText('Buy groceries');
  });

  test('Can add a todo by pressing Enter', async ({ page }) => {
    await page.goto(INDEX_URL);

    await page.fill('#todo-input', 'Read a book');
    await page.press('#todo-input', 'Enter');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(items.first().locator('span')).toHaveText('Read a book');
  });

  test('Does not add empty todos', async ({ page }) => {
    await page.goto(INDEX_URL);

    await page.click('#add-btn');
    await page.fill('#todo-input', '   ');
    await page.click('#add-btn');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(0);
  });

  test('Can mark a todo as completed', async ({ page }) => {
    await page.goto(INDEX_URL);

    await page.fill('#todo-input', 'Finish project');
    await page.click('#add-btn');

    const checkbox = page.locator('.todo-item input[type="checkbox"]');
    await checkbox.check();

    const item = page.locator('.todo-item');
    await expect(item).toHaveClass(/completed/);
  });

  test('Can delete a todo', async ({ page }) => {
    await page.goto(INDEX_URL);

    await page.fill('#todo-input', 'Temporary task');
    await page.click('#add-btn');
    await expect(page.locator('.todo-item')).toHaveCount(1);

    await page.click('.todo-item .delete-btn');
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  test('Item counter updates correctly', async ({ page }) => {
    await page.goto(INDEX_URL);

    const counter = page.locator('#todo-count');
    await expect(counter).toHaveText('0 items left');

    // Add first todo
    await page.fill('#todo-input', 'Task 1');
    await page.click('#add-btn');
    await expect(counter).toHaveText('1 item left');

    // Add second todo
    await page.fill('#todo-input', 'Task 2');
    await page.click('#add-btn');
    await expect(counter).toHaveText('2 items left');

    // Complete one
    await page.locator('.todo-item').first().locator('input[type="checkbox"]').check();
    await expect(counter).toHaveText('1 item left');
  });

  test('Input is cleared after adding a todo', async ({ page }) => {
    await page.goto(INDEX_URL);

    await page.fill('#todo-input', 'Some task');
    await page.click('#add-btn');

    await expect(page.locator('#todo-input')).toHaveValue('');
  });

  test('Empty state message shows when no todos', async ({ page }) => {
    await page.goto(INDEX_URL);

    // The empty state is shown via CSS ::after pseudo-element on the empty list
    const listBox = await page.locator('#todo-list').boundingBox();
    // The list should have some height due to the ::after content
    expect(listBox).not.toBeNull();
    expect(listBox.height).toBeGreaterThan(0);
  });
});
