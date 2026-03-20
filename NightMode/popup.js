const els = {
    toggle: document.getElementById('enableToggle'),
    slider: document.getElementById('intensitySlider'),
    intVal: document.getElementById('intVal'),
    mode: document.getElementById('modeSelect'),
    schedToggle: document.getElementById('scheduleToggle'),
    schedBox: document.getElementById('scheduleInputs'),
    start: document.getElementById('startTime'),
    end: document.getElementById('endTime')
};

// Hydrate UI from Storage
chrome.storage.local.get(['enabled', 'intensity', 'mode', 'scheduled', 'startTime', 'endTime'], (res) => {
    els.toggle.checked = res.enabled ?? false;
    els.slider.value = res.intensity ?? 30;
    els.mode.value = res.mode ?? 'amber';
    els.schedToggle.checked = res.scheduled ?? false;
    els.start.value = res.startTime ?? "20:00";
    els.end.value = res.endTime ?? "07:00";
    
    updateVisuals();
});

// Attach Listeners
Object.values(els).forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
        el.addEventListener('input', saveAndBroadcast);
    }
});

function updateVisuals() {
    els.intVal.innerText = `${els.slider.value}%`;
    if (els.schedToggle.checked) {
        els.schedBox.classList.remove('disabled');
    } else {
        els.schedBox.classList.add('disabled');
    }
}

function saveAndBroadcast() {
    updateVisuals();
    
    const state = { 
        enabled: els.toggle.checked, 
        intensity: parseInt(els.slider.value),
        mode: els.mode.value,
        scheduled: els.schedToggle.checked,
        startTime: els.start.value,
        endTime: els.end.value
    };
    
    // Save state
    chrome.storage.local.set(state);
    
    // Push directly to all open tabs for instant feedback
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, state).catch(() => {}));
    });
    
    // Ping background script to verify scheduling bounds immediately
    chrome.runtime.sendMessage({ action: "FORCE_SCHEDULE_CHECK" }).catch(() => {});
}