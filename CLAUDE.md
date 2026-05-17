# Stillpoint

Static marketing site. No build step — open `index.html` to view.

For now only make changes to `index.html` and `styles.css` and `scripts.js`.

In the future we will upgrade this repo to an html template friendly framework.

## For agents working in this repo

Before making changes, read:

- `.cursor/rules/frontend-engineer.mdc` — engineering principles (semantic HTML first, fluid CSS, accessibility non-negotiables). Auto-loads in Cursor; non-Cursor agents should read it explicitly. IMPORTANT TO START HERE because it influences your efficacy on the next two items.

- `.dev/responsive-design-plan.md` — how the responsive CSS system works, especially the wordmark positioning, fluid space tokens, and sidebar sticky behavior. Read this before touching any layout-level CSS or sizing variables.

- `.dev/backlog.md` — in-flight watches, deferred architectural decisions, and open design questions. Check here for what's pending, why, and the trigger conditions for revisiting deferred work.

These three files are the source of truth for state and conventions across sessions. The in-session task tools don't persist — anything worth carrying forward goes in `.dev/backlog.md`.

## Directory Context

There are some "dot" directories - these are primarily for agent context and assitance.

- `.design` UI Design files for assisting with design asks
- `.dev` Code planning, context, and tasks to assist with new agent context windows. **Please keep these updated after you complete a task**
- `.cursor` Is currently home to the agent rules as mentioned above.
