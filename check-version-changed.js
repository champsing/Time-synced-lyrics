// check-version-changed.js
/* eslint-disable no-undef */
// 提醒更新版本號

const { execSync } = require("child_process");

const changedFiles = execSync("git diff --cached --name-only").toString();
if (changedFiles.includes("base-version.js")) {
  // OK
  process.exit(0);
}

console.warn("⚠️ 你似乎忘了更新版本號 (base-version.js 沒有變更)");
process.exit(1);