#!/bin/sh
#
# An example hook script to verify what is about to be committed.
# Called by "git commit" with no arguments.  The hook should
# exit with non-zero status after issuing an appropriate message if
# it wants to stop the commit.
#
# To enable this hook, rename this file to "pre-commit".

# if want to ignore once, comment "set -e".
# set -e
node scripts/check-version-changed.js
echo "✅ check-version-changed.js 完成，exit code: $?"
node scripts/version-generator.js
echo "✅ version-generator.js 完成，exit code: $?"
git add web/utils/commit-info.js
echo "✅ git add web/utils/commit-info.js 完成，exit code: $?"