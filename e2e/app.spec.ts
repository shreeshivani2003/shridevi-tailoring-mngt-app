import { test, expect } from '@playwright/test';
import { navigationItems } from '../src/context/navigationContext';

const adminUser = { username: 'shivani', password: 'Ponni@2358' };

// Helper: login as a given user
async function login(page, { username, password }) {
  await page.goto('/login');
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Authentication', () => {
  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill('wrong');
    await page.getByPlaceholder('Password').fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid username or password/i)).toBeVisible();
  });

  test('should login as shivani and redirect to dashboard or orders', async ({ page }) => {
    await login(page, adminUser);
    await expect(page).toHaveURL(/(dashboard|orders)/);
    await expect(page.getByText(/shri devi tailoring/i)).toBeVisible();
  });
});

test.describe('Navigation and CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, adminUser);
  });

  test('should show sidebar navigation and navigate to each page', async ({ page }) => {
    for (const nav of navigationItems) {
      const link = page.getByRole('link', { name: new RegExp(nav.label, 'i') });
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await expect(page).toHaveURL(nav.path);
      }
    }
  });

  test('should add customers', async ({ page }) => {
    // Wait for sidebar to be visible
    await expect(page.getByText(/shri devi tailoring/i)).toBeVisible({ timeout: 5000 });
    // Try link, then button, then text
    if (await page.getByRole('link', { name: /customers/i }).isVisible().catch(() => false)) {
      await page.getByRole('link', { name: /customers/i }).click();
    } else if (await page.getByRole('button', { name: /customers/i }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /customers/i }).click();
    } else {
      await page.getByText(/customers/i, { exact: false }).click();
    }
    const customer = { name: 'Alice', phone: '9000000001' };
    await expect(page.getByRole('button', { name: /add new customer/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /add new customer/i }).click();
    await expect(page.getByLabel(/customer name/i)).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/customer name/i).fill(customer.name);
    await page.getByLabel(/phone number/i).fill(customer.phone);
    await expect(page.getByRole('button', { name: /add customer/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /add customer/i }).click();
    await expect(page.getByText(/customer added successfully/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Alice')).toBeVisible({ timeout: 5000 });
  });

  test('should add orders for all material types and order types with various due dates', async ({ page }) => {
    await page.getByRole('link', { name: /customers/i }).click();
    await expect(page.getByText('Alice')).toBeVisible({ timeout: 5000 });
    await page.getByText('Alice').click();
    const materialTypes = ['blouse', 'chudi', 'saree', 'works', 'others', 'lehenga'];
    const orderTypes = ['regular', 'emergency', 'alter'];
    for (const materialType of materialTypes) {
      for (const orderType of orderTypes) {
        await expect(page.getByRole('button', { name: /add order/i })).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: /add order/i }).click();
        await expect(page.getByLabel(/order type/i)).toBeVisible({ timeout: 5000 });
        await page.getByLabel(/order type/i).selectOption(orderType);
        await page.getByLabel(/material type/i).selectOption(materialType);
        await page.getByLabel(/description/i).fill(`${materialType} ${orderType} test order`);
        const today = new Date();
        let dueDate = today;
        if (orderType === 'regular') dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (orderType === 'emergency') dueDate = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
        if (orderType === 'alter') dueDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        await page.getByLabel(/delivery date|expected delivery date/i).fill(dueDateStr);
        await page.getByLabel(/approximate amount/i).fill('500');
        await expect(page.getByRole('button', { name: /create order/i })).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: /create order/i }).click();
        await expect(page.getByText(/successfully created|order created|order added/i)).toBeVisible({ timeout: 5000 });
      }
    }
    // Close the modal if needed
    const closeBtn = page.getByRole('button', { name: /close/i });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }
  });

  test('should change order statuses through all stages and verify dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /orders/i }).click();
    await page.waitForTimeout(2000);
    const materialTypes = ['blouse', 'chudi', 'saree', 'works', 'others', 'lehenga'];
    for (const materialType of materialTypes) {
      await expect(page.getByText(materialType, { exact: false })).toBeVisible({ timeout: 5000 });
      await page.getByText(materialType, { exact: false }).first().click();
      let done = false;
      while (!done) {
        const nextBtn = page.getByRole('button', { name: /next status|move to/i });
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          if (await page.getByText(/order .* completed|ready for delivery/i).isVisible().catch(() => false)) {
            done = true;
          }
        } else {
          done = true;
        }
      }
      await page.goBack();
    }
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page.getByText(/delivered/i)).toBeVisible();
    await expect(page.getByText(/pending/i)).toBeVisible();
  });
}); 