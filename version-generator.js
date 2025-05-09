/* eslint-disable no-undef */
// 用於生成帶有 Git commit 信息的版本文件
const { execSync } = require('child_process')

try {
  const commitHash = execSync('git rev-parse --short=12 HEAD').toString().trim()
  const content = `export const COMMIT_ID = '${commitHash}'`
  
  require('fs').writeFileSync('./web/utils/commit-info.js', content)
  console.log('✅ Commit ID generated')
} catch (error) {
  console.log('⚠️  Failed to get Git commit ID:', error.message)
  require('fs').writeFileSync('./web/utils/commit-info.js', 'export const COMMIT_ID = null')
}