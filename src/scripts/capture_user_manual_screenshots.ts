/**
 * Automated User Manual Screenshot Capture Script
 * ===============================================
 * Executes actual application operations via Playwright on http://localhost:3005
 * using benchmark fictional data (Test Case 10: Commercial Refrigeration Dispute).
 *
 * Captures real, working application screenshots for all 9 manual steps into
 * `public/manual_screenshots/`:
 * 1. screenshot_01_intake_form.png
 * 2. screenshot_02_filled_details.png
 * 3. screenshot_03_pdf_upload.png
 * 4. screenshot_04_event_timeline.png  (REPLACES OBSOLETE FACT LEDGER SCREENSHOT)
 * 5. screenshot_05_assessment_report.png
 * 6. screenshot_06_petition_events.png
 * 7. screenshot_07_counterparty_intelligence.png
 * 8. screenshot_08_annexure_management.png
 * 9. screenshot_09_petition_preview_export.png
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = path.join(process.cwd(), "public", "manual_screenshots");
const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

async function captureScreenshots() {
  console.log("================================================================================");
  console.log("PLAYWRIGHT AUTOMATED USER MANUAL SCREENSHOT CAPTURE");
  console.log("Target:", BASE_URL);
  console.log("Destination:", SCREENSHOT_DIR);
  console.log("================================================================================");

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Remove obsolete screenshot_04_fact_ledger.png if present
  const obsoletePath = path.join(SCREENSHOT_DIR, "screenshot_04_fact_ledger.png");
  if (fs.existsSync(obsoletePath)) {
    fs.unlinkSync(obsoletePath);
    console.log("✓ Removed obsolete screenshot_04_fact_ledger.png");
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  const snap = async (filename: string) => {
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      animations: "disabled",
      timeout: 10000,
    });
    console.log(`✓ Saved ${filename}`);
  };

  try {
    // STEP 1: INITIAL MATTER INTAKE
    console.log("\n[Step 1/9] Capturing Empty Intake Form...");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);

    const newAssessBtn = page.locator('button:has-text("New Assessment +")');
    if (await newAssessBtn.isVisible()) {
      await newAssessBtn.click();
      await page.waitForTimeout(500);
    }
    await snap("screenshot_01_intake_form.png");

    // STEP 2: FILL MATTER DETAILS
    console.log("\n[Step 2/9] Filling Case Details & Narrative...");
    const categorySelect = page.locator("select").first();
    await categorySelect.waitFor({ state: "visible", timeout: 10000 });
    await categorySelect.selectOption("Commercial / Business Dispute");

    const titleInput = page.locator('input[placeholder*="Non-payment"], input[type="text"]').first();
    await titleInput.fill("Commercial Refrigeration Unit Delivery and Defect Dispute");

    const textareas = page.locator("textarea");
    await textareas.nth(0).fill(
      "On 03 September 2026, Greenfield Café Pvt. Ltd. issued Purchase Order PO-8821 to Metro Kitchen Equipments for two commercial refrigeration units valued at ₹ 3,60,000. An advance payment of ₹ 1,80,000 was paid on 05 September. On 20 September 2026, the units were delivered with an endorsement on the delivery challan noting physical dent on the right panel. During installation on 24 September, one unit failed to cool below 10°C and the second unit produced excessive noise. The buyer requested rectification. Metro Kitchen Equipments demanded the delivery milestone payment of ₹ 1,20,000 on 27 September before deputing a technician. The buyer states no service technician attended the site thereafter."
    );

    if ((await textareas.count()) > 1) {
      await textareas.nth(1).fill(
        "Full refund of advance payment (₹ 1,80,000) or immediate replacement of defective units along with compensation for delay."
      );
    }
    await snap("screenshot_02_filled_details.png");

    // STEP 3: UPLOAD SUPPORTING DOCUMENTS
    console.log("\n[Step 3/9] Attaching Sample PDF Documents...");
    const samplePdfPath = path.join(process.cwd(), "data", "raw", "supreme_court", "2025", "2025_1_81_92_EN.pdf");
    if (fs.existsSync(samplePdfPath)) {
      const fileInput = page.locator('input[type="file"]');
      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(samplePdfPath);
        await page.waitForTimeout(800);
      }
    }
    await snap("screenshot_03_pdf_upload.png");

    // SUBMIT ASSESSMENT
    console.log("\nSubmitting matter for assessment...");
    const nextBtn = page.locator('button:has-text("Next: Review & Submit")').first();
    await nextBtn.waitFor({ state: "visible", timeout: 10000 });
    await nextBtn.click({ noWaitAfter: true });
    await page.waitForTimeout(1200);

    const submitBtn = page.locator('button:has-text("Submit for Assessment")').first();
    await submitBtn.waitFor({ state: "visible", timeout: 10000 });
    await submitBtn.click({ noWaitAfter: true });
    console.log("Waiting for assessment pipeline to complete...");
    await page.waitForSelector("text=Draft Formal Petition", { timeout: 60000 });
    await page.waitForTimeout(1500);

    // STEP 4: CHRONOLOGICAL EVENT TIMELINE IN PETITION BUILDER
    console.log("\n[Step 4/9] Opening Event Timeline in Petition Studio (Stage B)...");
    const openStudioBtn = page.locator('button:has-text("Draft Formal Petition")').first();
    if (await openStudioBtn.isVisible()) {
      await openStudioBtn.click();
      await page.waitForTimeout(1500);

      // Navigate to Stage B (Event Timeline)
      const stageBTab = page.locator('button:has-text("Stage B"), button:has-text("Event Timeline")').first();
      if (await stageBTab.isVisible()) {
        await stageBTab.click();
        await page.waitForTimeout(800);
      }

      // Expand the first event row to reveal the 5 mentor-required fields
      const eventBar = page.locator('div[class*="cursor-pointer bg-[#FCFCFA]"]').first();
      if (await eventBar.isVisible()) {
        await eventBar.click();
        await page.waitForTimeout(800);
      }
    }
    await snap("screenshot_04_event_timeline.png");

    // STEP 5: PRELIMINARY ASSESSMENT REPORT DELIVERABLE
    console.log("\n[Step 5/9] Returning to Assessment Report Deliverable...");
    const backBtn = page.locator('button:has-text("← Back to Assessment Report")').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(1200);
    }
    const precedentSection = page.locator("text=01 - Chronology of Events, text=Executive Overview, text=Supreme Court Precedents").first();
    if (await precedentSection.isVisible()) {
      await precedentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
    }
    await snap("screenshot_05_assessment_report.png");

    // STEP 6: PETITION BUILDER STUDIO OVERVIEW
    console.log("\n[Step 6/9] Launching Petition Builder Studio (Stage B Overview)...");
    const reopenStudioBtn = page.locator('button:has-text("Draft Formal Petition")').first();
    if (await reopenStudioBtn.isVisible()) {
      await reopenStudioBtn.click();
      await page.waitForTimeout(1200);
    }
    const stageBNav = page.locator('button:has-text("Stage B"), button:has-text("Event Timeline")').first();
    if (await stageBNav.isVisible()) {
      await stageBNav.click();
      await page.waitForTimeout(800);
    }
    await snap("screenshot_06_petition_events.png");

    // STEP 7: COUNTERPARTY INTELLIGENCE
    console.log("\n[Step 7/9] Capturing Stage C: Counterparty Intelligence Matrix...");
    const stageCNav = page.locator('button:has-text("Stage C"), button:has-text("Counterparty Intel")').first();
    if (await stageCNav.isVisible()) {
      await stageCNav.click();
      await page.waitForTimeout(1000);
    }
    await snap("screenshot_07_counterparty_intelligence.png");

    // STEP 8: ANNEXURE REGISTRY
    console.log("\n[Step 8/9] Capturing Stage D: Annexure Management Registry...");
    const stageDNav = page.locator('button:has-text("Stage D"), button:has-text("Annexure Registry")').first();
    if (await stageDNav.isVisible()) {
      await stageDNav.click();
      await page.waitForTimeout(1000);
    }
    await snap("screenshot_08_annexure_management.png");

    // STEP 9: PETITION PREVIEW & EXPORT REVIEW
    console.log("\n[Step 9/9] Capturing Stage E: Formal Pleading Preview & Validation Inspector...");
    const stageENav = page.locator('button:has-text("Stage E"), button:has-text("Petition Draft")').first();
    if (await stageENav.isVisible()) {
      await stageENav.click();
      await page.waitForTimeout(1200);
    }
    await snap("screenshot_09_petition_preview_export.png");

    console.log("\n================================================================================");
    console.log("SUCCESS: All 9 real application screenshots captured into public/manual_screenshots/");
    console.log("================================================================================");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
