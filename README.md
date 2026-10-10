# Trick or Treat '97

A late-90s style 3D trick-or-treating game that runs in the browser. Pick a costume, collect blue raspberry taffy, and knock on every porch with the light on in Sleepy Hollow.

Play it on a phone turned sideways, or on a computer with WASD and Space.

## What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | The page. Includes the security policy. |
| `style.css` | Look of the menus and on-screen counters. |
| `game.js` | The game itself. |
| `three.min.js` | Three.js r128, the 3D engine (MIT license, see `LICENSE-three.txt`). |
| `*.ttf` | Lilita One and VT323 fonts (SIL Open Font License, see the `OFL-*.txt` files). |
| `icon.svg` | The little pumpkin in the browser tab. |

## Why it's safe to share

- **Static files only.** There's no server code, database, login, form or analytics. Nothing is sent anywhere.
- **No outside requests.** The 3D engine and fonts are stored here, so the page loads only files from this site.
- **Locked down.** A Content-Security-Policy in `index.html` tells browsers to run scripts only from this site and to refuse everything else (no outside scripts, connections, frames or form posts).
- **No permissions.** It never asks for camera, microphone, location or notifications.
- **Tiny footprint.** The only thing stored is the visitor's costume pick, in their own browser.

## Putting it on GitHub Pages (free)

1. Sign in to GitHub. Make sure **two-factor authentication** is on (Settings → Password and authentication).
2. Create a new **public** repository, for example `trick-or-treat-97`. Leave it empty.
3. Click **Add file → Upload files**, select every file in this folder (there are no subfolders), and commit.
4. In the repo, go to **Settings → Pages**. Under "Build and deployment," set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.
5. Wait a minute or two. Your game will be at `https://YOUR-USERNAME.github.io/trick-or-treat-97/`.
6. On the same Pages screen, check **Enforce HTTPS**.

## Optional: your own domain

Buy a domain (for example through GoDaddy), then in **Settings → Pages → Custom domain** enter it and follow GitHub's DNS instructions. Keep **Enforce HTTPS** checked.

## Keeping it safe

- Only you should have write access to the repo. Don't add collaborators you don't need.
- If you change `game.js`, never add `<script>` tags that load from other websites. The security policy will block them anyway.
