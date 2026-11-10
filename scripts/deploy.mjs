#!/usr/bin/env node

import { execSync } from "child_process";
import https from "https";

// Colors for terminal output
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

function run(cmd, label) {
  if (label) console.log(cyan(`\n➤ ${label}...`));
  try {
    return execSync(cmd, { stdio: "inherit", encoding: "utf-8" });
  } catch (err) {
    console.error(red(`\n✖ Command failed: ${cmd}`));
    process.exit(1);
  }
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf-8" }).trim();
  } catch (err) {
    return "";
  }
}

async function checkLiveHealth(url, maxAttempts = 6, intervalMs = 5000) {
  console.log(cyan(`\n➤ Verifying live deployment at ${url}...`));
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isUp = await new Promise((resolve) => {
      https.get(url, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      }).on("error", () => resolve(false));
    });

    if (isUp) {
      console.log(green(`✔ Live site is online and responding (HTTP 200)!`));
      return true;
    }

    if (attempt < maxAttempts) {
      console.log(yellow(`  Waiting for Hostinger build container to activate (attempt ${attempt}/${maxAttempts})...`));
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  console.log(yellow(`ℹ Hostinger build in progress in background. Check https://kialna.shop shortly.`));
  return false;
}

async function main() {
  console.log(bold("\n========================================================"));
  console.log(bold("  🚀 Kialna One-Click Production Deployment (Hostinger)  "));
  console.log(bold("========================================================"));

  // Step 1: Pre-flight Verification (Build test)
  run("npm run build", "Step 1/4: Running pre-flight build check");
  console.log(green("✔ Local build succeeded cleanly."));

  // Step 2: Check Git status & commit if changes exist
  const status = runSilent("git status --porcelain");
  const rawMsg = process.argv.slice(2).join(" ").trim();
  const commitMsg = rawMsg || `deploy: production update ${new Date().toISOString().replace("T", " ").substring(0, 16)}`;

  if (status) {
    console.log(cyan(`\n➤ Step 2/4: Staging and committing changes...`));
    console.log(`  Commit message: "${commitMsg}"`);
    run("git add -A");
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    console.log(green("✔ Changes committed."));
  } else {
    console.log(yellow(`\nℹ Step 2/4: No uncommitted local changes, proceeding to push...`));
  }

  // Step 3: Push to primary GitHub repository (origin)
  run("git push origin main", "Step 3/4: Pushing to GitHub (origin/main)");
  console.log(green("✔ Pushed to origin/main."));

  // Step 4: Push to Hostinger auto-deployment repository (marketing)
  run("git push marketing main", "Step 4/4: Pushing to Hostinger (marketing/main)");
  console.log(green("✔ Pushed to marketing/main. Hostinger build triggered!"));

  // Step 5: Verification ping
  await checkLiveHealth("https://kialna.shop");

  console.log(bold(green("\n✨ Deployment task finished successfully!\n")));
}

main().catch((err) => {
  console.error(red("\n✖ Deployment failed:"), err);
  process.exit(1);
});
