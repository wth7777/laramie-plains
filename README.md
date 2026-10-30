# Laramie Plains: Echoes Beyond the Well — Swordbird-Inspired Upgrade

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
- B / X swings your sword. The survey hammer is still used to chip mineral seams after you find it.
- MAP shows explored destinations; JOURNAL shows quest progress.
- Sound is generated in the browser with Web Audio. Tap SOUND once to enable audio on mobile if needed.
- Progress autosaves in browser local storage.

## Latest mobile and story improvements
- Compact phone layout gives the playfield more of the available screen and reduces surrounding padding. Touch controls and HUD are smaller on short screens; help text and footer are hidden during mobile play.
- Story progression centers on the missing surveyor, the singing rail line, ancient star markings, and the sealed Star-Well. NPC dialogue and the journal/map support exploration.

## Swordbird-inspired upgrade
- Adds a narrated prologue when starting a new session, plus an animated storm-lit title treatment.
- Movement is now frame-rate independent and substantially faster, with diagonal movement normalized.
- Adds hostile prairie shades in the ridge, canyon, and Star-Well; they pursue the player, deal contact damage, and can be defeated.
- Sword attacks have directional hit detection, slash effects, hit flashes, particle bursts, and brief screen shake.
- Mobile action button is relabeled SWORD and remains pointer/touch friendly.

## Design notes
- The game uses original code-drawn pixel-art scenery, frontier props, a surveyor sprite, and procedural ambient effects.
- Trail openings are visibly marked in gold and labeled at the screen edge. The walkable corridors are aligned to those openings.
- This is a fresh prototype build. Syntax and ZIP integrity can be checked automatically, but it still needs a live playtest on a real phone for balance and collision edge cases.


## V5 Cinematic Edition
- Player-focused smooth camera push-in during sword attacks and nearby threats.
- Smooth camera pull-back when combat pressure ends.
- Screen-wide scene wipes when traveling between areas.
- Cinematic opening push-in, title fade, vignette, and subtle letterbox treatment.
- Existing story, map, mobile controls, and save data are preserved.

Deploy by replacing the existing GitHub Pages site files with the contents of this ZIP.


## V7 Zelda-style camera
- Replaced the old player-centered canvas transform with a smooth world-space follow camera.
- Camera zoom is closer (1.42x) and follows the player in both axes.
- Camera clamps to world boundaries to prevent empty/oversized edge regions appearing.
- HUD is rendered separately in screen space, so it stays fixed while the world scrolls.
