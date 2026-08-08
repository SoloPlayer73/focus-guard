Focus Guard

A lightweight Chrome/Edge extension that blocks distracting websites so you can actually get work done.
It contains scheduling, a stats tracker, and an optional "strict mode" to stop you from talking yourself out of it.

Features
Site blocking — add any site (e.g. youtube.com) to a block list; visiting it redirects to a custom "Stay Focused" page instead.
Schedule mode — set a start/end time (e.g. 9 AM–5 PM) so blocking only kicks in during work hours, checked automatically every minute.
Strict mode — requires typing a randomly generated confirmation code before you can disable blocking or remove a site, 
so a 5-second impulse doesn't undo your focus session.
Stats tracking — counts how many times a site has been blocked, with a reset button.
Dark themed popup UI — simple toggle switches, live-updating site list, no clutter.

Tech stack
Manifest V3 (Chrome Extensions platform)
Vanilla JavaScript, HTML, CSS — no frameworks, no build step
chrome.storage.sync for persisting settings across devices
chrome.declarativeNetRequest for blocking/redirecting requests
chrome.alarms for periodic schedule checks

Installation (developer mode)
1.Clone or download this repository.
2.Go to chrome://extensions (or edge://extensions).
3.Enable Developer mode (top right).
4.Click Load unpacked and select the project folder.
5.Pin the extension and click the icon to open the popup.

File structure
File |	Purpose
manifest.json	| Extension configuration and permissions
popup.html/css/js	| The popup UI and its logic
background.js	| Builds and updates blocking rules, runs the schedule checker
blocked.html/css/js	| The page shown when a site is blocked
icons |	Extension icons (16px, 48px, 128px)

Support
If you find this useful, you can buy me a coffee ☕

