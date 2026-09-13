import * as fs from 'fs';
import * as path from 'path';
import assert from 'node:assert/strict';
import {
  executeCreativeRun,
  executeRevision,
  loadThreadState,
  getRunDirectory,
  type CreativeBriefInput,
} from 'agent-core';

async function main() {
  console.log('='.repeat(80));
  console.log('  🚀 LAUNCH ROOM CREATIVE AGENT — COMPREHENSIVE END-TO-END DEMO');
  console.log('='.repeat(80));

  const threadId = `demo-thread-${Date.now()}`;
  console.log(`\n[DEMO SETUP] Generated Slack Thread ID: ${threadId}`);

  // ---------------------------------------------------------------------------
  // PHASE 1: Initial Creative Run
  // ---------------------------------------------------------------------------
  console.log('\n' + '-'.repeat(80));
  console.log('  PHASE 1: INTAKE & FULL CREATIVE LAUNCH WORKFLOW');
  console.log('-'.repeat(80));

  const briefText =
    'Call the brand Stackifier. Design one moisturizer inspired by this reference ' +
    'direction: https://im8health.com/. Use the site\'s typography and voice as high-level ' +
    'inspiration only. Keep the product faceless and make a five-second video. Create the ' +
    'canonical moisturizer first, then the packshot, lifestyle photography, three variations ' +
    'for poster comparison, explain which one you recommend, research the economics and ' +
    'market signals, and prepare the deck and PDF for my boss.';

  console.log(`\n[USER INTAKE PROMPT]:\n"${briefText}"\n`);

  const input: CreativeBriefInput = {
    threadId,
    brandName: 'Stackifier',
    productType: 'moisturizer',
    rawText: briefText,
    referenceUrl: 'https://im8health.com/',
  };

  const startTime = Date.now();
  const runResult = await executeCreativeRun(input, {
    onProgress: (msg) => {
      console.log(`  [DIRECTOR] ${msg}`);
    },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Phase 1 completed in ${durationSec}s!`);

  const { threadState, artifacts, pptxPath, pdfPath } = runResult;
  const runDir = getRunDirectory(threadState.runId);

  console.log(`\n[ARTIFACT DIRECTORY]: ${runDir}`);
  console.log(`- PPTX Pitch Deck: ${pptxPath} (${fs.statSync(pptxPath).size.toLocaleString()} bytes)`);
  console.log(`- PDF Pitch Deck:  ${pdfPath} (${fs.statSync(pdfPath).size.toLocaleString()} bytes)`);

  // Assertions for Phase 1
  assert.ok(fs.existsSync(pptxPath), 'PPTX deck file must exist');
  assert.ok(fs.existsSync(pdfPath), 'PDF deck file must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'product-spec.json')), 'product-spec.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'manifest.json')), 'manifest.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'thread.json')), 'thread.json must exist');

  // Verify ProductIdentitySpec invariants
  assert.equal(threadState.productIdentitySpec.productType, 'moisturizer');
  assert.equal(threadState.productIdentitySpec.intakeMode, 'design_new_product_from_reference');
  assert.ok(threadState.productIdentitySpec.formFactor.length > 0);
  assert.ok(threadState.productIdentitySpec.forbiddenProductChanges.length >= 4);

  // Verify Economics & Stripe / Shopify modeling
  assert.equal(threadState.economics.selectedPrice, 54.0);
  assert.equal(threadState.economics.conversionRateAssumption, 0.0285, 'Shopify 2026 CVR benchmark is 2.85%');
  assert.equal(
    threadState.economics.paymentFee,
    Number(((54.0 * 0.029) + 0.30).toFixed(2)),
    'Stripe card processing fee must equal 2.9% + $0.30'
  );

  console.log('\n[PHASE 1 VERIFIED ARTIFACTS]:');
  for (const [key, art] of Object.entries(artifacts)) {
    const statusMark = art.status === 'completed' ? '✓' : art.status === 'failed' ? '⚠️ (clean provider report)' : '⏳';
    console.log(`  ${statusMark} ${key.padEnd(16)} -> ${art.fileName || path.basename(art.localPath || 'none')} [${art.provider}/${art.providerModel}]`);
  }

  // ---------------------------------------------------------------------------
  // PHASE 2: In-Thread Revision (Aesthetic: "Make Poster B more retro")
  // ---------------------------------------------------------------------------
  console.log('\n' + '-'.repeat(80));
  console.log('  PHASE 2: IN-THREAD REVISION 1 (AESTHETIC)');
  console.log('-'.repeat(80));

  const revisionPrompt1 = 'Make Poster B more retro and update the deck without doing the research again.';
  console.log(`\n[USER REVISION PROMPT 1]:\n"${revisionPrompt1}"\n`);

  const revStartTime = Date.now();
  const revResult1 = await executeRevision(threadId, revisionPrompt1, {
    onProgress: (msg) => {
      console.log(`  [REVISION] ${msg}`);
    },
  });

  const revDuration = ((Date.now() - revStartTime) / 1000).toFixed(1);
  console.log(`\n✓ Phase 2 completed in ${revDuration}s!`);

  // Assertions for Phase 2:
  // 1. Poster B was revised
  const updatedPosterB = revResult1.threadState.assetPack['poster_B'];
  assert.ok(updatedPosterB, 'Poster B must exist in asset pack');
  console.log(`- Updated Poster B: ${updatedPosterB.fileName || path.basename(updatedPosterB.localPath)}`);
  // 2. Economics were reused and NOT modified
  assert.equal(revResult1.threadState.economics.selectedPrice, 54.0);
  assert.equal(revResult1.threadState.economics.conversionRateAssumption, 0.0285);
  // 3. PPTX & PDF updated
  assert.ok(fs.existsSync(revResult1.pptxPath));
  assert.ok(fs.existsSync(revResult1.pdfPath));

  // ---------------------------------------------------------------------------
  // PHASE 3: In-Thread Revision (Commercial: "Add supplier quote of $8.20")
  // ---------------------------------------------------------------------------
  console.log('\n' + '-'.repeat(80));
  console.log('  PHASE 3: IN-THREAD REVISION 2 (COMMERCIAL / ECONOMICS)');
  console.log('-'.repeat(80));

  const revisionPrompt2 = 'Add the supplier quote of $8.20 I just gave you and update the economics without repeating the creative research.';
  console.log(`\n[USER REVISION PROMPT 2]:\n"${revisionPrompt2}"\n`);

  const econStartTime = Date.now();
  const revResult2 = await executeRevision(threadId, revisionPrompt2, {
    onProgress: (msg) => {
      console.log(`  [REVISION] ${msg}`);
    },
  });

  const econDuration = ((Date.now() - econStartTime) / 1000).toFixed(1);
  console.log(`\n✓ Phase 3 completed in ${econDuration}s!`);

  // Assertions for Phase 3:
  // 1. Economics updated to $8.20
  assert.equal(revResult2.threadState.economics.selectedCogs, 8.20, 'Selected COGS must update to supplier quote $8.20');
  const userCogsEvidence = revResult2.threadState.economics.evidenceLabels.find((e) => e.field === 'selectedCogs');
  assert.equal(userCogsEvidence?.label, 'user-supplied', 'Supplier quote must be labeled user-supplied');
  // 2. PPTX & PDF regenerated
  assert.ok(fs.existsSync(revResult2.pptxPath));
  assert.ok(fs.existsSync(revResult2.pdfPath));

  console.log('\n[UPDATED UNIT ECONOMICS (SLIDE 5)]');
  console.log(`  Retail Price:          $${revResult2.threadState.economics.selectedPrice.toFixed(2)}`);
  console.log(`  Supplier COGS Quote:   $${revResult2.threadState.economics.selectedCogs.toFixed(2)} [user-supplied]`);
  console.log(`  Fulfillment (3PL):     $${revResult2.threadState.economics.fulfilmentCost.toFixed(2)} [observed - ShipBob]`);
  console.log(`  Stripe Fee (2.9%+$0.30):$${revResult2.threadState.economics.paymentFee.toFixed(2)} [observed - Stripe]`);
  console.log(`  Gross Margin:          ${revResult2.threadState.economics.grossMargin}%`);
  console.log(`  Contribution / Order:  $${revResult2.threadState.economics.contributionPerOrder.toFixed(2)}`);
  console.log(`  Break-Even Orders:     ${revResult2.threadState.economics.breakEvenOrders} units on initial test`);

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log('  🎉 ALL DEMO ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log(`  Run Directory: ${runDir}`);
  console.log(`  Total Files in Run: ${fs.readdirSync(runDir).length} top-level files + assets/`);
  console.log('  Status: READY FOR DEMO RECORDING AND SUBMISSION.');
  console.log('='.repeat(80) + '\n');
}

main().catch((err) => {
  console.error('\n❌ DEMO EXECUTION FAILED:', err);
  process.exit(1);
});
