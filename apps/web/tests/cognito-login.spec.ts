import { test, expect } from '@playwright/test';

test('Cognito Login Test on Custom UI', async ({ page }) => {
  // Go to the local app domain
  await page.goto('http://localhost:3001/');

  // Click the "Sign in" or "Đăng nhập" link on the landing page
  const headerSignInLink = page.locator('a[href="/auth/sign-in"]').first();
  await headerSignInLink.click();

  // Wait for client side routing to the sign-in page
  await page.waitForURL(/.*\/auth\/sign-in.*/, { timeout: 10000 });

  // Fill out the username and password fields on Custom UI
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', 'demo@example.com');
  
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  await page.fill('input[name="password"]', 'Password123!');

  // Click the submit button
  const signInButton = page.locator('button[type="submit"]', {
    hasText: /Đăng nhập|Sign in/
  }).first();
  await signInButton.click();
  
  // Wait for redirect to overview load directly
  await page.waitForURL(/.*app\/overview.*/, { timeout: 20000 }).catch(() => {
     console.log("Did not navigate to /app/overview, current URL: ", page.url());
  });

  // Verify successful login
  await expect(page.locator('text=/Dashboard|Tổng quan|Overview|Đăng xuất|Sign out/').first()).toBeVisible({ timeout: 15000 });
});
