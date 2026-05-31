# JSONL Reader Chrome Extension

A Manifest V3 Chrome extension for reading JSON Lines (`.jsonl`) / NDJSON (`.ndjson`) files.

## Features

- Auto-renders `.jsonl` / `.ndjson` pages opened in Chrome.
- Each line is collapsed by default.
- Click a row to expand and view pretty-printed JSON.
- Shows line number, JSON type, validity, and a short preview.
- Supports search, expand all, collapse all.
- Includes a standalone viewer for file upload, drag-and-drop, URL fetch, or pasted JSONL.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project directory: `jsonl-reader`.

For local `file://` JSONL files, open extension details and enable **Allow access to file URLs**.

## Project structure

```text
manifest.json          Extension manifest
popup.html             Toolbar popup
viewer.html            Standalone JSONL viewer
src/background.js      Redirect .jsonl/.ndjson navigations before raw text paints
src/hide.css           Early hide fallback for direct content-script rendering
src/jsonl-renderer.js  Shared renderer
src/content.js         Auto-render content script fallback for .jsonl/.ndjson pages
src/content.css        Shared viewer styles
src/viewer.js          Standalone viewer interactions
src/viewer.css         Standalone viewer-only styles
src/popup.js           Popup interactions
src/popup.css          Popup styles
```
