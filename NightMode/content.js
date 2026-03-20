const LAYER_ID = 'jbuilds-nightmode-layer';

function getOverlayLayer() {
    let el = document.getElementById(LAYER_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = LAYER_ID;
        // Enforce !important to prevent sites from overriding the overlay
        el.style.cssText = `
            position: fixed !important;
            top: 0 !important; 
            left: 0 !important;
            width: 100vw !important; 
            height: 100vh !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            display: none;
            transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
        `;
        // Inject into body or fallback to html
        (document.body || document.documentElement).appendChild(el);
    }
    return el;
}

function applyVisualState(state) {
    const el = getOverlayLayer();
    
    if (!state.enabled) {
        el.style.display = 'none';
        return;
    }
    
    el.style.display = 'block';
    const alpha = state.intensity / 100;
    
    // Reset properties to avoid bleeding between mode swaps
    el.style.backgroundColor = 'transparent';
    el.style.backdropFilter = 'none';
    el.style.mixBlendMode = 'normal';

    switch (state.mode) {
        case 'amber':
            // Caps alpha at 0.6 so the text underneath remains legible at 100% intensity
            el.style.backgroundColor = `rgba(255, 140, 0, ${alpha * 0.6})`;
            el.style.mixBlendMode = 'multiply';
            break;
        case 'dim':
            el.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;
            break;
        case 'grayscale':
            el.style.backdropFilter = `grayscale(${state.intensity}%)`;
            break;
    }
}

// Initial hydration when page loads
chrome.storage.local.get(['enabled', 'intensity', 'mode'], applyVisualState);

// Listen for live updates from popup or background schedule
chrome.runtime.onMessage.addListener((state) => {
    applyVisualState(state);
});