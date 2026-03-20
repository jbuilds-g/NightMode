// Boot script and set defaults if none exist
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['enabled'], (res) => {
        if (res.enabled === undefined) {
            chrome.storage.local.set({ 
                enabled: false, 
                intensity: 30, 
                mode: 'amber', 
                scheduled: false, 
                startTime: "20:00", 
                endTime: "07:00"
            });
        }
    });
    // Check the clock every minute
    chrome.alarms.create('checkSchedule', { periodInMinutes: 1 });
});

// Listen for manual overrides from popup.js
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "FORCE_SCHEDULE_CHECK") executeScheduleCheck();
});

// Background loop listener
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkSchedule') executeScheduleCheck();
});

function executeScheduleCheck() {
    chrome.storage.local.get(['scheduled', 'startTime', 'endTime', 'intensity', 'mode', 'enabled'], (res) => {
        if (!res.scheduled || !res.startTime || !res.endTime) return;
        
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const [sH, sM] = res.startTime.split(':').map(Number);
        const [eH, eM] = res.endTime.split(':').map(Number);
        const startMins = sH * 60 + sM;
        const endMins = eH * 60 + eM;

        let isNight = false;
        if (startMins > endMins) {
            // Schedule crosses midnight (e.g., 8 PM to 7 AM)
            isNight = currentMins >= startMins || currentMins < endMins;
        } else {
            // Schedule is within the same day (e.g., 9 AM to 5 PM)
            isNight = currentMins >= startMins && currentMins < endMins;
        }

        // Only broadcast if the state actually needs to change to avoid thrashing
        if (isNight !== res.enabled) {
            chrome.storage.local.set({ enabled: isNight });
            const state = { enabled: isNight, intensity: res.intensity, mode: res.mode };
            
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, state).catch(() => {}));
            });
        }
    });
}