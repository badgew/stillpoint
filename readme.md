## Web Development Guide

Let's get started.

### Repo design

Flat HTML/CSS/JS (possibly upgrade to something template friendly in the future).

### Local Development

At a minimum it is recommended to start a humble python web server to properly simulate a production environment.

1. Use your command line to start the server in this repo directory:

```
python3 -m http.server 8000
```

2. Open your browser to http://localhost:8000 and have fun

### Deploying to production

Deploys are triggered manually from the GitHub web UI — there is no auto-deploy on push.

1. Go to the repo on GitHub → **Actions** tab.
2. In the left sidebar, select the **Deploy to BigScoots** workflow.
3. Click the **Run workflow** dropdown on the right.
4. Pick the branch you want to deploy (usually `main`).
5. Choose **Dry run**:
   - `true` (default) — previews what would change without touching the server. Always run this first.
   - `false` — actually rsyncs files to BigScoots. Live changes.
6. Click **Run workflow**.
7. Open the run, expand the **Summary** step, and review the list of files that would be (or were) uploaded and deleted.

Recommended flow: run once with `dry_run: true`, confirm the file list looks right, then run again with `dry_run: false`.

The repo has AI agent files/directories built in to make your AI driven contributions more smooth. Read `./CLAUDE.md` for more info.
