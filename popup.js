// Popup Logic
// Relies on LANGUAGES global from languages.js

const languageSelect = document.getElementById('languageSelect');
const slider = document.getElementById('gravitySlider');
const levelValue = document.getElementById('levelValue');
const levelDesc = document.getElementById('levelDesc');
const siteEnabled = document.getElementById('siteEnabled');
const funModesEnabled = document.getElementById('funModesEnabled');
const showCyrillicElem = document.getElementById('showCyrillic');
const showGreekElem = document.getElementById('showGreek');
const showArmenianElem = document.getElementById('showArmenian');
const showKoreanElem = document.getElementById('showKorean');

let selectedLanguage = 'ru'; // default
let currentHostname = '';

// Filter States
let showFunModes = false;
let showCyrillic = true;
let showGreek = true;
let showArmenian = true;
let showKorean = true;

// Fun/Historical modes keywords to filter
const FUN_MODES_KEYWORDS = ['phoenician', 'morse', 'futhark', 'glagolitic'];

// Helper to check script involvement
function involvesCyrillic(code, name) {
    return code.includes('cyr') || name.toLowerCase().includes('cyrillic');
}
function involvesGreek(code, name) {
    return code.includes('el') || code.includes('gre') || name.toLowerCase().includes('greek');
}
function involvesArmenian(code, name) {
    return code.includes('arm') || name.toLowerCase().includes('armenian');
}
function involvesKorean(code, name) {
    return code.includes('korean') || name.toLowerCase().includes('korean');
}

// Populate Language Dropdown
function initLanguages() {
    languageSelect.innerHTML = '';

    const currentVal = selectedLanguage;
    let foundCurrent = false;

    // Grouping logic
    const groups = {
        'Latin': [],
        'Cyrillic': [],
        'Greek': [],
        'Armenian': [],
        'Korean': [],
        'Other': []
    };

    Object.keys(LANGUAGES).forEach(code => {
        const lang = LANGUAGES[code];
        const langNameLower = lang.name.toLowerCase();

        // 1. Fun Mode Filter
        const isFun = FUN_MODES_KEYWORDS.some(k => code.includes(k) || langNameLower.includes(k));
        if (!showFunModes && isFun) return;

        // 2. Script Filters
        if (!showCyrillic && involvesCyrillic(code, lang.name)) return;
        if (!showGreek && involvesGreek(code, lang.name)) return;
        if (!showArmenian && involvesArmenian(code, lang.name)) return;
        if (!showKorean && involvesKorean(code, lang.name)) return;

        // Determine group by source script (before the "->")
        const sourceMatch = lang.name.match(/^([^-]+)\s*->/);
        const source = sourceMatch ? sourceMatch[1].trim() : 'Other';

        const targetGroup = groups[source] ? source : 'Other';
        groups[targetGroup].push({ code, name: lang.name });
    });

    // Render groups
    Object.keys(groups).forEach(groupName => {
        const items = groups[groupName];
        if (items.length === 0) return;

        const optgroup = document.createElement('optgroup');
        optgroup.label = `From ${groupName}`;

        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.code;
            opt.textContent = item.name;
            optgroup.appendChild(opt);
            if (item.code === currentVal) foundCurrent = true;
        });

        languageSelect.appendChild(optgroup);
    });

    // Handle selection restoration or fallback
    if (!foundCurrent && languageSelect.options.length > 0) {
        languageSelect.value = languageSelect.options[0].value;
        selectedLanguage = languageSelect.value;
        chrome.storage.sync.set({ selectedLanguage });
        updateContentForNewLang();
    } else if (foundCurrent) {
        languageSelect.value = currentVal;
    }
}

function updateUI(val) {
    levelValue.textContent = val;
    levelDesc.textContent = `Level ${val}`;
}

async function loadState() {
    chrome.storage.sync.get(null, (result) => {
        // Load settings
        showFunModes = result.hasOwnProperty('showFunModes') ? result.showFunModes : false;
        showCyrillic = result.hasOwnProperty('showCyrillic') ? result.showCyrillic : true;
        showGreek = result.hasOwnProperty('showGreek') ? result.showGreek : true;
        showArmenian = result.hasOwnProperty('showArmenian') ? result.showArmenian : true;
        showKorean = result.hasOwnProperty('showKorean') ? result.showKorean : true;

        if (funModesEnabled) funModesEnabled.checked = showFunModes;
        if (showCyrillicElem) showCyrillicElem.checked = showCyrillic;
        if (showGreekElem) showGreekElem.checked = showGreek;
        if (showArmenianElem) showArmenianElem.checked = showArmenian;
        if (showKoreanElem) showKoreanElem.checked = showKorean;

        // Init languages based on loaded preferences
        initLanguages();

        selectedLanguage = result.selectedLanguage || 'lat_to_cyr';

        // Ensure selected language is valid
        if (languageSelect.options.length > 0) {
            if (Array.from(languageSelect.options).some(o => o.value === selectedLanguage)) {
                languageSelect.value = selectedLanguage;
            } else {
                selectedLanguage = languageSelect.options[0].value;
                languageSelect.value = selectedLanguage;
            }
        }

        const langLevelKey = `level_${selectedLanguage}`;
        const level = result[langLevelKey] || 0;

        slider.value = level;
        updateUI(level);

        // Site Enabled
        const disabledSites = result.disabledSites || [];
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                try {
                    currentHostname = new URL(tabs[0].url).hostname;
                    siteEnabled.checked = !disabledSites.includes(currentHostname);
                } catch (e) { }
            }
        });
    });
}

function updateContentForNewLang() {
    if (!selectedLanguage) return;
    const langLevelKey = `level_${selectedLanguage}`;
    chrome.storage.sync.get([langLevelKey], (result) => {
        const level = result[langLevelKey] || 0;
        slider.value = level;
        updateUI(level);
        notifyContent({ language: selectedLanguage, level: level });
    });
}

// Logic to notify content script
function notifyContent(payload) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'UPDATE_STATE',
                state: payload
            });
        }
    });
}

// Listeners

languageSelect.addEventListener('change', (e) => {
    selectedLanguage = e.target.value;
    chrome.storage.sync.set({ selectedLanguage });
    updateContentForNewLang();
});

slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    updateUI(val);
    if (selectedLanguage) {
        const langLevelKey = `level_${selectedLanguage}`;
        chrome.storage.sync.set({ [langLevelKey]: val });
        notifyContent({ level: val, language: selectedLanguage });
    }
});

siteEnabled.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.sync.get(['disabledSites'], (result) => {
        let disabledSites = result.disabledSites || [];
        if (isEnabled) {
            disabledSites = disabledSites.filter(h => h !== currentHostname);
        } else {
            if (!disabledSites.includes(currentHostname) && currentHostname) {
                disabledSites.push(currentHostname);
            }
        }
        chrome.storage.sync.set({ disabledSites }, () => {
            notifyContent({ enabled: isEnabled });
        });
    });
});

// Filter Listeners
function setupFilterListener(elem, key) {
    if (!elem) return;
    elem.addEventListener('change', (e) => {
        const val = e.target.checked;
        const saveObj = {};
        saveObj[key] = val;
        chrome.storage.sync.set(saveObj);

        // Update global variable
        if (key === 'showFunModes') showFunModes = val;
        if (key === 'showCyrillic') showCyrillic = val;
        if (key === 'showGreek') showGreek = val;
        if (key === 'showArmenian') showArmenian = val;
        if (key === 'showKorean') showKorean = val;

        initLanguages();

        // Since list changed, selected language might have changed (e.g. forced fallback)
        selectedLanguage = languageSelect.value;
        updateContentForNewLang();
    });
}

setupFilterListener(funModesEnabled, 'showFunModes');
setupFilterListener(showCyrillicElem, 'showCyrillic');
setupFilterListener(showGreekElem, 'showGreek');
setupFilterListener(showArmenianElem, 'showArmenian');
setupFilterListener(showKoreanElem, 'showKorean');

// Init
loadState();
