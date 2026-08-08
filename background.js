chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_RULES') updateRules();
});

chrome.runtime.onInstalled.addListener(() => {
  updateRules();
  chrome.alarms.create('scheduleCheck', { periodInMinutes: 1 });
});
chrome.runtime.onStartup.addListener(() => {
  updateRules();
  chrome.alarms.create('scheduleCheck', { periodInMinutes: 1 });
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'scheduleCheck') updateRules();
});

function isWithinSchedule(start, end) {
  const now = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  } else {
    // Schedule wraps past midnight, e.g. 22:00 - 06:00
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
}

function updateRules() {
  chrome.storage.sync.get(
    ['blockedSites', 'isEnabled', 'scheduleEnabled', 'startTime', 'endTime'],
    (data) => {
      const sites = data.blockedSites || [];
      const masterOn = data.isEnabled ?? true;
      const scheduleOn = data.scheduleEnabled ?? false;
      const start = data.startTime || '09:00';
      const end = data.endTime || '17:00';

      const effectivelyBlocking = masterOn && (!scheduleOn || isWithinSchedule(start, end));

      chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const oldIds = existingRules.map(r => r.id);

        const newRules = effectivelyBlocking ? sites.map((site, index) => ({
          id: index + 1,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: { extensionPath: '/blocked.html?site=' + encodeURIComponent(site) }
          },
          condition: {
            urlFilter: `||${site}`,
            resourceTypes: ['main_frame']
          }
        })) : [];

        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: oldIds,
          addRules: newRules
        });
      });
    }
  );
}
