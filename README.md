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

🛠 Installation (The "Fast Track")
Since the extension is currently awaiting official approval in the Chrome Web Store, you can install it manually in about 30 seconds.

1. Download the code
Option A (For Devs): Clone this repository:

git clone https://github.com/Bookaj/footalk.git

Option B (For Humans): Click the green Code button above and select Download ZIP. Extract the files to a folder you won't delete (e.g., in your Documents).

2. Open Chrome Extensions
In your browser, go to: chrome://extensions/

Or: Click the Three Dots Menu > Extensions > Manage Extensions.

3. Enable Developer Mode
In the top right corner, toggle the Developer mode switch to ON.

4. Load the Extension
Click the Load unpacked button that appeared in the top left.

Select the entire folder where you extracted/cloned Footalk (the one containing manifest.json).

5. Pin for easy access
Click the Puzzle Piece icon in your toolbar and pin Footalk to keep the level slider always at hand!

⚠️ Note: Do not delete the folder after installation. If you move or delete it, the extension will stop working.

## Credits

[Buy me a coffee](https://buymeacoffee.com/dnum)
