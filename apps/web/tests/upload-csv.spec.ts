import { test, expect } from "@playwright/test"
import * as fs from "fs"
import * as path from "path"

const SCREENSHOTS = path.resolve("screenshots")
const CSV_FILE = path.resolve(
  "../../apps/api/sample_data/bank_statement_q2_2026.csv"
)

function shot(name: string) {
  return path.join(SCREENSHOTS, name)
}

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS))
    fs.mkdirSync(SCREENSHOTS, { recursive: true })
})

// ──────────────────────────────────────────────────────────────────────────────
// Sign in with demo account
// ──────────────────────────────────────────────────────────────────────────────
async function signInDemo(page: import("@playwright/test").Page) {
  await page.goto("http://localhost:3000/auth/sign-in")
  await page.waitForLoadState("networkidle")
  await page.locator("button").filter({ hasText: /demo/i }).first().click()
  await page.waitForURL("**/app/overview**", { timeout: 10_000 })
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1500)
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 1: Upload real CSV file
// ──────────────────────────────────────────────────────────────────────────────
test("Upload real CSV file — fresh DB", async ({ page }) => {
  await signInDemo(page)

  // 1. Overview — should show zero state (DB is fresh)
  await page.screenshot({
    path: shot("upload_01_overview_empty.png"),
    fullPage: true,
  })

  // 2. Go to import page
  await page.goto("http://localhost:3000/app/import")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(500)
  await page.screenshot({
    path: shot("upload_02_import_ready.png"),
    fullPage: true,
  })

  // 3. Upload CSV via the file input (id="statement")
  const fileInput = page.locator("#statement")
  await expect(fileInput).toBeAttached({ timeout: 10_000 })

  // setInputFiles triggers onChange automatically → process() runs
  await fileInput.setInputFiles(CSV_FILE)

  // 4. Wait for the progress stages: Uploading → Validating → Classifying → Saving → Complete
  await expect(page.locator("text=/Đang tải|Uploading/i")).toBeVisible({
    timeout: 5_000,
  })
  await page.screenshot({
    path: shot("upload_03_processing.png"),
    fullPage: true,
  })

  // Wait for "Hoàn tất" or "Complete"
  await expect(page.locator("text=/Hoàn tất|Complete/i")).toBeVisible({
    timeout: 15_000,
  })
  await page.waitForTimeout(800)
  await page.screenshot({
    path: shot("upload_04_complete.png"),
    fullPage: true,
  })

  // Verify row count text appears
  const resultText = await page.locator("body").innerText()
  const rowMatch = resultText.match(/(\d+)\s*(giao dịch|transaction)/i)
  console.log(`Upload result: "${rowMatch?.[0] ?? "not found"}"`)

  // 5. Transactions page — must show data
  await page.goto("http://localhost:3000/app/transactions")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1500)
  await page.screenshot({
    path: shot("upload_05_transactions.png"),
    fullPage: true,
  })

  const txBody = await page.locator("body").innerText()
  const hasTx = /Highlands|Salary|payroll|Grab|Apple|Netflix|Airlines/i.test(
    txBody
  )
  console.log(`Transactions page has data: ${hasTx}`)
  expect(hasTx).toBeTruthy()

  // 6. Review queue
  await page.goto("http://localhost:3000/app/review")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await page.screenshot({ path: shot("upload_06_review.png"), fullPage: true })

  // 7. Overview with real data
  await page.goto("http://localhost:3000/app/overview")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: shot("upload_07_overview_data.png"),
    fullPage: true,
  })

  // 8. Spending analysis
  await page.goto("http://localhost:3000/app/spending")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1500)
  await page.screenshot({
    path: shot("upload_08_spending.png"),
    fullPage: true,
  })

  const captured = fs
    .readdirSync(SCREENSHOTS)
    .filter((f) => f.startsWith("upload_") && f.endsWith(".png"))
    .sort()
  console.log(`\n✅ ${captured.length} screenshots: ${captured.join(", ")}`)
  expect(captured.length).toBeGreaterThanOrEqual(7)
})

// ──────────────────────────────────────────────────────────────────────────────
// TEST 2: Sample CSV button
// ──────────────────────────────────────────────────────────────────────────────
test("Use sample CSV button — after DB reset", async ({ page }) => {
  // Reset DB via API (delete all transactions for demo-user)
  const resetRes = await page.request.delete(
    "http://localhost:8000/transactions",
    {
      headers: { "x-user-id": "demo-user" },
    }
  )
  console.log(`DB reset status: ${resetRes.status()}`)

  await signInDemo(page)

  // 1. Import page
  await page.goto("http://localhost:3000/app/import")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(500)
  await page.screenshot({ path: shot("sample_01_before.png"), fullPage: true })

  // 2. Click sample button
  const sampleBtn = page
    .locator("button")
    .filter({ hasText: /CSV mẫu|sample CSV/i })
  await expect(sampleBtn).toBeVisible({ timeout: 10_000 })
  await sampleBtn.click()

  // 3. Wait for progress
  await expect(page.locator("text=/Đang tải|Uploading/i")).toBeVisible({
    timeout: 5_000,
  })
  await page.screenshot({
    path: shot("sample_02_processing.png"),
    fullPage: true,
  })

  await expect(page.locator("text=/Hoàn tất|Complete/i")).toBeVisible({
    timeout: 15_000,
  })
  await page.waitForTimeout(800)
  await page.screenshot({
    path: shot("sample_03_complete.png"),
    fullPage: true,
  })

  // 4. Transactions
  await page.goto("http://localhost:3000/app/transactions")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: shot("sample_04_transactions.png"),
    fullPage: true,
  })

  // 5. Overview
  await page.goto("http://localhost:3000/app/overview")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1500)
  await page.screenshot({
    path: shot("sample_05_overview.png"),
    fullPage: true,
  })

  console.log("\n✅ Sample CSV complete")
})

test("Import page shows validation error for non-CSV files", async ({
  page,
}) => {
  await signInDemo(page)

  await page.goto("http://localhost:3000/app/import")
  await page.waitForLoadState("networkidle")

  const invalidFile = {
    name: "statement.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a csv statement"),
  }
  await page.locator("#statement").setInputFiles(invalidFile)

  await expect(
    page.locator("text=/Chỉ chấp nhận file CSV|Only CSV files/i")
  ).toBeVisible()
  await page.screenshot({
    path: shot("validation_non_csv.png"),
    fullPage: true,
  })
})
