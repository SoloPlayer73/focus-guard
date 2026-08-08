// Show which site was blocked
const params = new URLSearchParams(window.location.search);
const site = params.get('site');
if (site) {
  document.getElementById('siteText').textContent = `${site} is blocked right now.`;
}

// Increment the block counter (once per page load)
chrome.storage.sync.get(['blockCount'], (data) => {
  const newCount = (data.blockCount || 0) + 1;
  chrome.storage.sync.set({ blockCount: newCount });
});
