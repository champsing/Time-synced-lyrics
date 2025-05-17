// scripts/build.js
/* eslint-disable no-undef */

let fs = require("fs-extra");
let path = require("path");

async function main() {
    const root = process.cwd();
    const outDir = path.join(root, "dist");

    // 1. 刪除舊的 dist 資料夾
    await fs.remove(outDir);

    // 2. 列出根目錄所有檔案與資料夾
    const items = await fs.readdir(root);

    // 3. 要排除的檔名/資料夾
    const exclude = new Set([
        ".git",
        ".gitignore",
        ".cfignore",
        "py_tools",
        "scripts", // 若 scripts 資料夾只放 build 腳本，可視情況保留
        "package.json",
        "package-lock.json",
        "eslint.config.mjs",
        "readme.md",
        "LICENSE",
        "node_modules",
        "jsconfig.json",
        "dist", // 避免遞歸複製
    ]);

    // 4. 複製所有非排除項目到 dist
    for (const name of items) {
        if (exclude.has(name)) continue;
        const src = path.join(root, name);
        const dest = path.join(outDir, name);
        await fs.copy(src, dest);
    }

    console.log("✅ Build complete: output in dist/");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
