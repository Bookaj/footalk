// Footalk Content Script
// Requires languages.js to be loaded first

const footalkState = {
    level: 0,
    language: 'ru', // default
    enabled: true,
    hoverEnabled: true,
    originalTextMap: new WeakMap(),
    processedNodes: new WeakSet()
};

// State Management for clean updates
// "originalTextMap" stores the RAW text of the node before ANY modification.
// If language changes, we must restore RAW text, then apply NEW language.

const CUMULATIVE_MAPS = {}; // Cache: maps "lang_level" -> rule array

function getReplacementRules(lang, level) {
    const cacheKey = `${lang}_${level}`;
    if (CUMULATIVE_MAPS[cacheKey]) return CUMULATIVE_MAPS[cacheKey];

    // Build logic
    // We assume LANGUAGES[lang].levels[level] contains the full map for that level
    if (!LANGUAGES[lang] || !LANGUAGES[lang].levels[level]) return [];

    const mapObj = LANGUAGES[lang].levels[level];
    const rules = Object.entries(mapObj).map(([k, v]) => ({ k, v }));

    // Sort by length desc
    rules.sort((a, b) => b.k.length - a.k.length);

    CUMULATIVE_MAPS[cacheKey] = rules;
    return rules;
}

// --- Text Walker ---

const IGNORED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT', 'IFRAME', 'CANVAS', 'SVG', 'FOOTALK-TOOLTIP'
]);

function shouldProcessNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return false;
    const parent = node.parentNode;
    if (!parent || !parent.tagName) return false;

    const tag = parent.tagName.toUpperCase();
    if (IGNORED_TAGS.has(tag)) return false;

    if (parent.closest && parent.closest('footalk-tooltip')) return false;

    if (parent.isContentEditable) return false;
    if (parent.closest && parent.closest('[contenteditable="true"]')) return false;
    return true;
}

function processNode(node, level, lang) {
    // 1. Restore ORIGINAL text if exists (Reactivity/Lang Switch Fix)
    if (node.__footalkOriginal !== undefined) {
        node.nodeValue = node.__footalkOriginal;
    }

    const originalText = node.nodeValue;
    if (!originalText.trim()) return;

    // 2. Prepare for new replacement
    const rules = getReplacementRules(lang, level);
    if (rules.length === 0) {
        // Just restored, done.
        return;
    }

    // Conditional Normalization: Only for Korean modes to split Hangul syllables
    const isKorean = lang.toLowerCase().includes('korean');
    let newText = isKorean ? originalText.normalize('NFD') : originalText;

    rules.forEach(rule => {
        newText = newText.split(rule.k).join(rule.v);
    });

    // 3. Apply post-processing if defined (e.g. for Greek final sigma)
    if (LANGUAGES[lang].postProcess) {
        newText = LANGUAGES[lang].postProcess(newText);
    }

    // Conditional Re-normalization: Recompose Korean blocks if needed
    if (isKorean) {
        newText = newText.normalize('NFC');
    }

    // 4. Apply if changed
    if (newText !== originalText) {
        if (node.__footalkOriginal === undefined) {
            node.__footalkOriginal = originalText;
        }
        node.nodeValue = newText;
    }
}

function walkAndTransmute(root, level, lang) {
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                if (shouldProcessNode(node)) return NodeFilter.FILTER_ACCEPT;
                return NodeFilter.FILTER_REJECT;
            }
        }
    );

    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    nodes.forEach(node => processNode(node, level, lang));
}

// --- Tooltip Logic ---

let tooltipEl = null;

function createTooltip() {
    if (tooltipEl) return;
    tooltipEl = document.createElement('footalk-tooltip');
    document.body.appendChild(tooltipEl);
}

function showTooltip(text, x, y) {
    if (!tooltipEl) createTooltip();
    tooltipEl.textContent = text;
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = (y + 20) + 'px';
    tooltipEl.classList.add('visible');
}

function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('visible');
}

document.addEventListener('mousemove', (e) => {
    if (!footalkState.hoverEnabled || footalkState.level === 0) {
        if (tooltipEl) hideTooltip();
        return;
    }

    let textNode = null;

    if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range) textNode = range.startContainer;
    } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) textNode = pos.offsetNode;
    }

    // Checking propery on Node
    if (textNode && textNode.nodeType === Node.TEXT_NODE && textNode.__footalkOriginal) {
        showTooltip(textNode.__footalkOriginal, e.clientX, e.clientY);
    } else {
        hideTooltip();
    }
}, { passive: true });


// --- Init & Messages ---

function updateState(newState) {
    // If language changed, we effectively need a full refresh of text nodes (handled by processNode restoring original)
    if (newState.language !== undefined) footalkState.language = newState.language;
    if (newState.enabled !== undefined) footalkState.enabled = newState.enabled;
    if (newState.level !== undefined) footalkState.level = newState.level;

    const effectiveLevel = footalkState.enabled ? footalkState.level : 0;

    walkAndTransmute(document.body, effectiveLevel, footalkState.language);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPDATE_STATE') {
        updateState(request.state);
        sendResponse({ status: 'updated' });
    }
});

// Load Settings
chrome.storage.sync.get(['selectedLanguage', 'disabledSites'], (result) => {
    const lang = result.selectedLanguage || 'ru';
    const disabledSites = result.disabledSites || [];
    const hostname = window.location.hostname;
    const enabled = !disabledSites.includes(hostname);

    // Now get level for that language
    const langLevelKey = `level_${lang}`;
    chrome.storage.sync.get([langLevelKey], (res2) => {
        const level = res2[langLevelKey] || 0;
        updateState({ language: lang, level, enabled });
    });
});

const observer = new MutationObserver((mutations) => {
    const effectiveLevel = footalkState.enabled ? footalkState.level : 0;
    if (effectiveLevel === 0) return;

    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            // Ignore Tooltip explicitly
            if (node.tagName === 'FOOTALK-TOOLTIP') return;

            if (node.nodeType === Node.ELEMENT_NODE) {
                walkAndTransmute(node, effectiveLevel, footalkState.language);
            } else if (node.nodeType === Node.TEXT_NODE) {
                if (shouldProcessNode(node)) {
                    processNode(node, effectiveLevel, footalkState.language);
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });
