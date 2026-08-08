const siteInput = document.getElementById('siteInput');
const addBtn = document.getElementById('addBtn');
const siteList = document.getElementById('siteList');
const masterToggle = document.getElementById('masterToggle');
const scheduleToggle = document.getElementById('scheduleToggle');
const scheduleRow = document.getElementById('scheduleRow');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const strictToggle = document.getElementById('strictToggle');
const statsText = document.getElementById('statsText');
const resetStats = document.getElementById('resetStats');

const strictModal = document.getElementById('strictModal');
const codeDisplay = document.getElementById('codeDisplay');
const codeInput = document.getElementById('codeInput');
const codeCancel = document.getElementById('codeCancel');
const codeConfirm = document.getElementById('codeConfirm');

let pendingAction = null; // function to run if strict-mode code is confirmed

// ---- Load saved state ----
function loadState() {
  chrome.storage.sync.get(
    ['blockedSites', 'isEnabled', 'scheduleEnabled', 'startTime', 'endTime', 'strictMode', 'blockCount'],
    (data) => {
      renderList(data.blockedSites || []);
      masterToggle.checked = data.isEnabled ?? true;
      scheduleToggle.checked = data.scheduleEnabled ?? false;
      startTime.value = data.startTime || '09:00';
      endTime.value = data.endTime || '17:00';
      strictToggle.checked = data.strictMode ?? false;
      scheduleRow.style.opacity = scheduleToggle.checked ? '1' : '0.4';
      statsText.textContent = `${data.blockCount || 0} blocks total`;
    }
  );
}
loadState();

function pushUpdate() {
  chrome.runtime.sendMessage({ type: 'UPDATE_RULES' });
}

// ---- Strict mode gate ----
function isStrict(cb) {
  chrome.storage.sync.get(['strictMode'], (data) => {
    if (data.strictMode) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      codeDisplay.textContent = code;
      codeInput.value = '';
      strictModal.classList.remove('hidden');
      pendingAction = () => {
        if (codeInput.value.trim() === code) {
          strictModal.classList.add('hidden');
          cb();
        } else {
          codeInput.style.borderColor = '#ff6b6b';
        }
      };
    } else {
      cb();
    }
  });
}

codeConfirm.addEventListener('click', () => pendingAction && pendingAction());
codeCancel.addEventListener('click', () => strictModal.classList.add('hidden'));

// ---- Master toggle (guarded by strict mode when turning OFF) ----
masterToggle.addEventListener('change', () => {
  const turningOff = !masterToggle.checked;
  if (turningOff) {
    isStrict(() => {
      chrome.storage.sync.set({ isEnabled: false }, pushUpdate);
    });
    masterToggle.checked = true; // revert visually until confirmed
    // Actually re-check after confirm resolves; simplest: re-load on confirm
    const originalConfirm = pendingAction;
    if (originalConfirm) {
      pendingAction = () => {
        originalConfirm();
        setTimeout(loadState, 150);
      };
    }
  } else {
    chrome.storage.sync.set({ isEnabled: true }, pushUpdate);
  }
});

// ---- Schedule ----
scheduleToggle.addEventListener('change', () => {
  scheduleRow.style.opacity = scheduleToggle.checked ? '1' : '0.4';
  chrome.storage.sync.set({ scheduleEnabled: scheduleToggle.checked }, pushUpdate);
});
startTime.addEventListener('change', () => {
  chrome.storage.sync.set({ startTime: startTime.value }, pushUpdate);
});
endTime.addEventListener('change', () => {
  chrome.storage.sync.set({ endTime: endTime.value }, pushUpdate);
});

// ---- Strict mode toggle itself ----
strictToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ strictMode: strictToggle.checked });
});

// ---- Add site ----
addBtn.addEventListener('click', () => {
  const site = siteInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!site) return;
  chrome.storage.sync.get(['blockedSites'], (data) => {
    const sites = data.blockedSites || [];
    if (!sites.includes(site)) {
      sites.push(site);
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        renderList(sites);
        pushUpdate();
      });
    }
    siteInput.value = '';
  });
});
siteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addBtn.click(); });

// ---- Remove site (guarded by strict mode) ----
function removeSite(site) {
  isStrict(() => {
    chrome.storage.sync.get(['blockedSites'], (data) => {
      const sites = (data.blockedSites || []).filter(s => s !== site);
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        renderList(sites);
        pushUpdate();
      });
    });
  });
}

function renderList(sites) {
  siteList.innerHTML = '';
  sites.forEach(site => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${site}</span><button data-site="${site}">✕</button>`;
    siteList.appendChild(li);
  });
  document.querySelectorAll('#siteList button').forEach(btn => {
    btn.addEventListener('click', () => removeSite(btn.dataset.site));
  });
}

// ---- Stats ----
resetStats.addEventListener('click', () => {
  chrome.storage.sync.set({ blockCount: 0 }, () => {
    statsText.textContent = '0 blocks total';
  });
});

// Refresh stats when popup regains focus (in case a block happened while open elsewhere)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockCount) {
    statsText.textContent = `${changes.blockCount.newValue || 0} blocks total`;
  }
});
