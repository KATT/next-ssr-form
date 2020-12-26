module.exports = {
  // used in /_next/data/:buildId/some-page.json
  generateBuildId: () => process.env.VERCEL_GIT_COMMIT_SHA,
}