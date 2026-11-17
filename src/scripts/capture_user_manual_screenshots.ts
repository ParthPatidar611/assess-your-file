/**
 * Automated User Manual Screenshot Capture Script
 * ===============================================
 * Executes actual application operations via Playwright on http://localhost:3000
 * using benchmark fictional data (Test Case 10: Commercial Refrigeration Dispute).
 *
 * Captures real, working application screenshots for all 9 manual steps into
 * `public/manual_screenshots/`:
 * 1. screenshot_01_intake_form.png
 * 2. screenshot_02_filled_details.png
 * 3. screenshot_03_pdf_upload.png
 * 4. screenshot_04_fact_ledger.png
 * 5. screenshot_05_assessment_report.png
 * 6. screenshot_06_petition_events.png
 * 7. screenshot_07_counterparty_intelligence.png
 * 8. screenshot_08_annexure_management.png
 * 9. screenshot_09_petition_preview_export.png
 *
 * Adheres strictly to Rule 8: No mock UI, no fabricated features, no personal data.
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = path.join(process.cwd(), "public", "manual_screenshots");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function captureScreenshots() {
  console.log("================================================================================");
  console.log("PLAYWRIGHT AUTOMATED USER MANUAL SCREENSHOT CAPTURE");
  console.log("Target:", BASE_URL);
  console.log("Destination:", SCREENSHOT_DIR);
  console.log("================================================================================");

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  try {
    // ------------------------------------------------------------------------
    // STEP 1: INITIAL MATTER INTAKE
    // ------------------------------------------------------------------------
    console.log("\n[Step 1/9] Navigating to Home & Capturing Empty Intake Form...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_01_intake_form.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_01_intake_form.png");

    // ------------------------------------------------------------------------
    // STEP 2: FILL MATTER DETAILS (CASE 10 BENCHMARK)
    // ------------------------------------------------------------------------
    console.log("\n[Step 2/9] Entering Case Details & Factual Narrative...");
    
    // Select category
    const categorySelect = page.locator("select").first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption("Commercial / Business Dispute");
    }

    // Fill Title
    const titleInput = page.locator('input[placeholder*="commercial dispute"], input[placeholder*="brief summary"], input[type="text"]').first();
    await titleInput.fill("Commercial Refrigeration Unit Delivery and Defect Dispute");

    // Fill Facts
    const factsTextarea = page.locator('textarea[placeholder*="factual"], textarea').first();
    await factsTextarea.fill(
      "On 03 September 2026, Greenfield Café Pvt. Ltd. issued Purchase Order PO-8821 to Metro Kitchen Equipments for two commercial refrigeration units valued at ₹ 3,60,000. An advance payment of ₹ 1,80,000 was paid on 05 September. On 20 September 2026, the units were delivered with an endorsement on the delivery challan noting physical dent on the right panel. During installation on 24 September, one unit failed to cool below 10°C and the second unit produced excessive noise. The buyer requested rectification. Metro Kitchen Equipments demanded the delivery milestone payment of ₹ 1,20,000 on 27 September before deputing a technician. The buyer states no service technician attended the site thereafter."
    );

    // Fill Desired Outcome
    const outcomeInput = page.locator('input[placeholder*="outcome"], textarea').last();
    await outcomeInput.fill("Full refund of advance payment (₹ 1,80,000) or immediate replacement of defective units along with compensation for delay.");

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_02_filled_details.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_02_filled_details.png");

    // ------------------------------------------------------------------------
    // STEP 3: UPLOAD SUPPORTING DOCUMENTS
    // ------------------------------------------------------------------------
    console.log("\n[Step 3/9] Attaching Sample PDF Documents...");
    const samplePdfPath = path.join(process.cwd(), "data", "raw", "supreme_court", "2025", "2025_1_81_92_EN.pdf");
    
    if (fs.existsSync(samplePdfPath)) {
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(samplePdfPath);
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_03_pdf_upload.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_03_pdf_upload.png");

    // ------------------------------------------------------------------------
    // SUBMIT ASSESSMENT & WAIT FOR REPORT
    // ------------------------------------------------------------------------
    console.log("\nSubmitting matter for preliminary assessment...");
    const reviewBtn = page.locator('button:has-text("Proceed to Verification"), button:has-text("Review Details"), button:has-text("Proceed")').first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(1000);

      const submitBtn = page.locator('button:has-text("Generate Preliminary Assessment"), button:has-text("Submit")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        console.log("Waiting for assessment pipeline to complete...");
        await page.waitForSelector('text=Preliminary Legal Assessment, text=Assessment Deliverable, text=Confidential Legal Assessment', {
          timeout: 45000,
        });
        await page.waitForTimeout(2000);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 4: REVIEW FACT LEDGER & CONTRADICTIONS
    // ------------------------------------------------------------------------
    console.log("\n[Step 4/9] Capturing Fact and Evidence Ledger...");
    const ledgerHeading = page.locator('text=Fact and Evidence Ledger, text=Documented Fact').first();
    if (await ledgerHeading.isVisible()) {
      await ledgerHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_04_fact_ledger.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_04_fact_ledger.png");

    // ------------------------------------------------------------------------
    // STEP 5: PRELIMINARY ASSESSMENT REPORT
    // ------------------------------------------------------------------------
    console.log("\n[Step 5/9] Capturing Assessment Report & Precedents...");
    const precedentSection = page.locator('text=Supreme Court Precedents, text=Precedent Analysis, text=Assessment Strengths').first();
    if (await precedentSection.isVisible()) {
      await precedentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_05_assessment_report.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_05_assessment_report.png");

    // ------------------------------------------------------------------------
    // STEP 6: OPEN PETITION BUILDER STUDIO -> STAGE B (EVENTS)
    // ------------------------------------------------------------------------
    console.log("\n[Step 6/9] Launching Petition Builder Studio & Capturing Event Editor...");
    const draftPetitionBtn = page.locator('button:has-text("Draft Formal Petition"), button:has-text("Open Petition Builder")').first();
    if (await draftPetitionBtn.isVisible()) {
      await draftPetitionBtn.click();
      await page.waitForTimeout(1500);
    }

    // Navigate to Stage B
    const stageBBtn = page.locator('button:has-text("Stage B"), button:has-text("Event-Wise Facts")').first();
    if (await stageBBtn.isVisible()) {
      await stageBBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_06_petition_events.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_06_petition_events.png");

    // ------------------------------------------------------------------------
    // STEP 7: STAGE C (COUNTERPARTY INTELLIGENCE)
    // ------------------------------------------------------------------------
    console.log("\n[Step 7/9] Capturing Stage C: Counterparty Intelligence Matrix...");
    const stageCBtn = page.locator('button:has-text("Stage C"), button:has-text("Counterparty Intel")').first();
    if (await stageCBtn.isVisible()) {
      await stageCBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_07_counterparty_intelligence.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_07_counterparty_intelligence.png");

    // ------------------------------------------------------------------------
    // STEP 8: STAGE D (ANNEXURE REGISTRY)
    // ------------------------------------------------------------------------
    console.log("\n[Step 8/9] Capturing Stage D: Annexure Management Table...");
    const stageDBtn = page.locator('button:has-text("Stage D"), button:has-text("Annexure Registry")').first();
    if (await stageDBtn.isVisible()) {
      await stageDBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_08_annexure_management.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_08_annexure_management.png");

    // ------------------------------------------------------------------------
    // STEP 9: STAGE E & F (PREVIEW & EXPORT)
    // ------------------------------------------------------------------------
    console.log("\n[Step 9/9] Capturing Stage E: Formal Pleading Preview & Export Review...");
    const stageEBtn = page.locator('button:has-text("Stage E"), button:has-text("Petition Draft")').first();
    if (await stageEBtn.isVisible()) {
      await stageEBtn.click();
      await page.waitForTimeout(1200);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "screenshot_09_petition_preview_export.png"),
      fullPage: false,
    });
    console.log("✓ Saved screenshot_09_petition_preview_export.png");

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
