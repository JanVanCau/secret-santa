# 🎁 Secret Santa — Family Edition

A tiny static web app: type your name, watch the gift wobble and burst open, and see who you're buying a present for. Each name can only be used once. The app itself is in Dutch.

Participants: Jan, Charlotte, Sienna, Richard, Rik, Linda.

## How it works

- `scripts/draw.mjs` makes the draw ahead of time (nobody gets themselves) and writes it, lightly scrambled, into `assignments.js`. Run it again for a fresh draw; that also resets who has looked.
- When someone reveals, their name is marked as "used". GitHub Pages can't store anything, so that mark goes to a free **Firebase Realtime Database**. Without one, it's only remembered in that person's own browser.

## 1. Set up the shared "already used" list (5 min, free)

1. Go to https://console.firebase.google.com, then **Add project** (Analytics can be turned off).
2. In the left menu, open **Build → Realtime Database → Create database**. Pick a location (e.g. Belgium/europe-west1) and choose **Start in test mode**.
3. Open the **Rules** tab, paste this and click **Publish** (test mode rules expire after 30 days, these don't):
   ```json
   { "rules": { "rounds": { ".read": true, "$round": { "claimed": { "$name": { ".write": "!data.exists()" } } } } } }
   ```
   This lets anyone mark a name once, but nobody can undo or overwrite it from the website.
4. Copy the database URL shown at the top (like `https://xxx-default-rtdb.europe-west1.firebasedatabase.app`) and paste it into `config.js` as `databaseUrl`.

To let someone look again, delete their name under `rounds → <round> → claimed` in the Firebase console.

## 2. Publish on GitHub Pages

```bash
git init && git add . && git commit -m "Secret Santa"
gh repo create family-secret-santa --public --source . --push
gh api -X POST repos/{owner}/family-secret-santa/pages -f "source[branch]=main" -f "source[path]=/"
```

The site appears at `https://<your-github-username>.github.io/family-secret-santa/` after a minute.

> The draw sits in a public file, scrambled but not encrypted. Someone who really wants to peek could decode it. Fine for family, not for state secrets.

## Run locally

```bash
python3 -m http.server 8765
```
Then open http://localhost:8765.
