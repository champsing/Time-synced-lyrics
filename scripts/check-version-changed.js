// check-version-changed.js
/* eslint-disable no-undef */
// 提醒更新版本號
// 如果想略過一次，到 pre-commit 鈎子中註解 "set -e" 即可

const { execSync } = require("child_process");

try {
    const changedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf-8",
    })
        .split("\n")
        .filter(Boolean);

    const ignoreVN = changedFiles.every(
        (file) =>
            file.startsWith("public/") ||
            file.startsWith("py_tools/") ||
            file.startsWith("src/") ||
            file === "web/utils/config.js"
    );

    if (ignoreVN) {
        console.log("🟢 全部變更都在 public/ 或非前端，允許不改版本號。");
        process.exit(0);
    }

    const packageChanged = changedFiles.some(
        (file) => file === "web/utils/base-version.js"
    );

    if (!packageChanged) {
        console.warn(
            "❌ 你修改了除了 public/ 以外的檔案，但沒更新 base-version.js 的版本號！"
        );
        process.exit(1);
    }

    console.log("✅ 偵測到 base-version.js 已變更，通過版本號檢查。");
    process.exit(0);
} catch (err) {
    console.error("🚨 發生錯誤：", err);
    process.exit(1);
}
