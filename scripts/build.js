// scripts/build.js
/* eslint-disable no-undef */

const fs = require("fs-extra");
const path = require("path");

async function main() {
    const root = process.cwd();
    const outDir = path.join(root, "dist");
    const cfignorePath = path.join(root, ".cfignore");
    const gitignorePath = path.join(root, ".gitignore");

    // 1. 刪除舊的 dist 資料夾
    await fs.remove(outDir);

    // 2. 讀取 .cfignore，解析排除清單
    let cfIgnoreExcludeList = [];
    if (await fs.pathExists(cfignorePath)) {
        const content = await fs.readFile(cfignorePath, "utf8");
        cfIgnoreExcludeList = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));
    }

    let gitIgnoreExcludeList = [];
    if (await fs.pathExists(gitignorePath)) {
        const content = await fs.readFile(gitignorePath, "utf8");
        gitIgnoreExcludeList = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));
    }

    // 3. 加入預設要排除的項目
    const defaults = [".git", ".cfignore", ".gitignore", "dist"];
    const exclude = new Set([
        ...cfIgnoreExcludeList,
        ...gitIgnoreExcludeList,
        ...defaults,
    ]);

    // 4. 複製非排除項目到 dist
    const items = await fs.readdir(root);
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
