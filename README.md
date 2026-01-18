# Footalk - Learn any alphabet passively

**Footalk** is a Google Chrome extension designed to help you learn new alphabets (Cyrillic, Greek, Armenian, Korean, and more) through passive immersion. It replaces characters on websites you visit with their counterparts in the target script, gradually increasing the difficulty as you move the slider from Level 0 to 100.

## Features

-   **Multi-Language Support**: Learn Cyrillic, Greek, Armenian, Korean, and more.
-   **Granular Progression**: Scale from **Level 0 to 100**, introducing new characters proportionally across all modes.
-   **Smart Replacement**: Uses phonetic matching, digraph handling, and Unicode normalization (NFD/NFC) for accurate transliteration.
-   **Historical & Fun Modes**: Includes Phoenician, Elder Futhark, Morse Code, and Glagolitic.
-   **Customizable Filters**: Toggle specific script categories to tailor your learning experience.
-   **Domain Control**: Enable or disable the extension on specific websites with a single click.

## Installation

1.  Download the repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the extension directory.

## Usage

1.  Click the extension icon in your toolbar.
2.  Select your desired language mode (e.g., "Latin -> Cyrillic").
3.  Use the slider to adjust the immersion level (0-100).
4.  Browse the web and watch the characters transform!

## Development

-   `manifest.json`: Extension configuration.
-   `content.js`: Main logic for text replacement on web pages.
-   `languages.js`: Configuration file containing all language definitions and mapping rules.
-   `popup.html` & `popup.js`: The user interface for settings and controls.

## Credits

[Buy me a coffee](https://buymeacoffee.com/dnum)