// CI-only config for GitHub-hosted runners where Chromium sandboxing is unavailable.
module.exports = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ],
};
