// check-version-changed.js
/* eslint-disable no-undef */
// 提醒更新版本號

const { execSync } = require("child_process");

try {
  const changedFiles = execSync("git diff --cached --name-only", {
    encoding: "utf-8"
  }).split("\n").filter(Boolean);

  const onlyMappings = changedFiles.every(file => file.startsWith("public/mappings/"));

  if (onlyMappings) {
    console.log("🟢 全部變更都在 public/mappings/，允許不改版本號。");
    process.exit(0);
  }

  const packageChanged = changedFiles.some(file => file === "package.json");

  if (!packageChanged) {
    console.warn("❌ 你修改了除了 public/mappings/ 以外的檔案，但沒更新 package.json 的版本號！");
    process.exit(1);
  }

  console.log("✅ 偵測到 package.json 已變更，通過版本號檢查。");
  process.exit(0);

} catch (err) {
  console.error("🚨 發生錯誤：", err);
  process.exit(1);
}