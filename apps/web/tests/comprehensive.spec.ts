import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test('AI Money Coach - comprehensive screenshots', async ({ page }) => {
  const screenshotsDir = path.resolve('screenshots')
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })

  // ─── 1. Sign-in Page ───────────────────────────────────────────────────────
  await page.goto('http://localhost:3000/auth/sign-in')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '01_signin.png'), fullPage: true })

  // Click "Dùng tài khoản demo" / "Use demo account"
  await page.locator('button').filter({ hasText: /demo/i }).first().click()
  await page.waitForURL('**/app/overview**', { timeout: 10000 })

  // ─── 2. Overview Dashboard ──────────────────────────────────────────────────
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(screenshotsDir, '02_overview.png'), fullPage: true })

  // ─── 3. Import Page (Before) ────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/import')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '03_import_before.png'), fullPage: true })

  // Click "Dùng CSV mẫu" button (now confirmed to exist)
  const sampleBtn = page.locator('button').filter({ hasText: /CSV mẫu|sample CSV/i })
  await expect(sampleBtn).toBeVisible({ timeout: 10000 })
  await sampleBtn.click()

  // Wait for success indicator (any alert or success text)
  await page.waitForTimeout(4000)
  await page.screenshot({ path: path.join(screenshotsDir, '04_import_after.png'), fullPage: true })

  // ─── 4. Transactions List ───────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/transactions')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '05_transactions.png'), fullPage: true })

  // ─── 5. Review Queue ────────────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/review')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '06_review.png'), fullPage: true })

  // ─── 6. Import History ──────────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/imports')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '07_imports_history.png'), fullPage: true })

  // ─── 7. Spending Analysis ───────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/spending')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(screenshotsDir, '08_spending.png'), fullPage: true })

  // ─── 8. Budgets ─────────────────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/budgets')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '09_budgets.png'), fullPage: true })

  // ─── 9. Recurring Transactions ──────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/recurring')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '10_recurring.png'), fullPage: true })

  // ─── 10. AI Coach ───────────────────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/coach')
  await page.waitForTimeout(800)
  const chatInput = page.locator('textarea, input[type="text"]').first()
  await expect(chatInput).toBeVisible({ timeout: 3000 })
  await chatInput.fill('Xin chào! Phân tích chi tiêu tháng này giúp tôi.')
  const sendBtn = page.locator('button[type="submit"], button').filter({ hasText: /Gửi|Send/i }).first()
  await expect(sendBtn).toBeVisible({ timeout: 2000 })
  await sendBtn.click()
  await expect(page.locator('text=/tổng chi tiêu|total spending|Tổng quan|overview/i').first()).toBeVisible({ timeout: 3000 })
  await expect(page.locator('text=/Nguồn đã đọc|Sources read/i').first()).toBeVisible({ timeout: 3000 })
  await expect(page.locator('text=/W4 learner guide/i').first()).toBeVisible({ timeout: 3000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(screenshotsDir, '11_coach.png'), fullPage: true })

  // ─── 11. Settings (Vietnamese) ──────────────────────────────────────────────
  await page.goto('http://localhost:3000/app/settings')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '12_settings_vi.png'), fullPage: true })

  // Try switching to English
  const enBtn = page.locator('button').filter({ hasText: /English/i }).first()
  if (await enBtn.isVisible({ timeout: 3000 })) {
    await enBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(screenshotsDir, '13_settings_en.png'), fullPage: true })
  }

  // Verify screenshots were created
  const shots = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png') && !f.startsWith('debug'))
  console.log(`✅ Captured ${shots.length} screenshots: ${shots.join(', ')}`)
  expect(shots.length).toBeGreaterThanOrEqual(11)
})
