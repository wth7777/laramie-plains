# Laramie Plains: Echoes Beyond the Well — Kick Butt Build

A standalone, mobile-friendly 16-bit browser adventure set in a fictionalized 19th-century Wyoming frontier. No build tools or server required.

## Run locally
Open `index.html` in a modern browser, or serve this folder with any static web server.

## Deploy to GitHub Pages
1. Extract the ZIP.
2. Upload all four files (`index.html`, `style.css`, `game.js`, `README.md`) to the root of your GitHub repository.
3. Commit changes and let GitHub Pages publish.
4. Open the same Pages URL on your phone.

## Controls
- Touch arrow pad or keyboard arrows / WASD to move.
- A / Space / Enter interacts.
- B / X uses the survey hammer after finding it.
- MAP shows explored destinations; JOURNAL shows quest progress.
- Sound is generated in the browser with Web Audio. Tap SOUND once to enable audio on mobile if needed.
- Progress autosaves in browser local storage.

## Design notes
- The game uses original code-drawn pixel-art scenery, frontier props, a surveyor sprite, and procedural ambient effects.
- Trail openings are visibly marked in gold and labeled at the screen edge. The walkable corridors are aligned to those openings.
- This is a fresh prototype build. Syntax and ZIP integrity can be checked automatically, but it still needs a live playtest on a real phone for balance and collision edge cases.
