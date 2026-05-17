/* ============================================================
   Mobile nav toggle.

   Pairs with .nav-toggle and #primary-nav in the markup, and
   the .nav-open body class in styles.css. Behavior:
     - Click toggle: flip aria-expanded and body.nav-open
     - Click any link inside the nav: close
     - Escape key: close and return focus to the toggle
     - Viewport widens past 40rem: clear the open state so
       desktop layout doesn't get stuck with overflow:hidden
   ============================================================ */

(function () {
	const toggle = document.querySelector(".nav-toggle");
	const nav = document.getElementById("primary-nav");
	if (!toggle || !nav) return;

	const MOBILE_QUERY = window.matchMedia("(max-width: 40rem)");

	function setOpen(open) {
		toggle.setAttribute("aria-expanded", String(open));
		toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		document.body.classList.toggle("nav-open", open);
	}

	toggle.addEventListener("click", () => {
		const isOpen = toggle.getAttribute("aria-expanded") === "true";
		setOpen(!isOpen);
	});

	// Close when a nav link is activated (covers click + keyboard activation)
	nav.addEventListener("click", (event) => {
		const target = event.target;
		if (target instanceof HTMLAnchorElement) {
			setOpen(false);
		}
	});

	// Escape closes and restores focus to the toggle
	document.addEventListener("keydown", (event) => {
		if (
			event.key === "Escape" &&
			toggle.getAttribute("aria-expanded") === "true"
		) {
			setOpen(false);
			toggle.focus();
		}
	});

	// If the viewport grows past the breakpoint while open, reset
	// state so desktop layout doesn't inherit body.nav-open's overflow:hidden.
	MOBILE_QUERY.addEventListener("change", (event) => {
		if (!event.matches) setOpen(false);
	});
})();

/* ============================================================
   Sidebar nav item rotation.

   Hovering a nav link rotates it 90° and pushes siblings down.
   The rotated state persists for a short grace period after the
   cursor leaves so it doesn't snap back immediately. Clicking an
   item locks the rotation on/off independently of hover.
   ============================================================ */

(function () {
	// How long (ms) the rotated state lingers after the cursor leaves.
	const LINGER = 600;

	const items = document.querySelectorAll(".sidebar-links li");
	if (!items.length) return;

	// Shared state: which item (if any) is click-locked.
	let lockedItem = null;

	// Per-item leave timers.
	const leaveTimers = new WeakMap();

	function unlockAll() {
		if (lockedItem) {
			lockedItem.classList.remove("is-rotated");
			lockedItem = null;
		}
	}

	items.forEach((li) => {
		function rotateIn() {
			clearTimeout(leaveTimers.get(li));
			li.classList.add("is-rotated");
		}

		function rotateOut() {
			clearTimeout(leaveTimers.get(li));
			if (lockedItem === li) return; // stay if this item is locked
			leaveTimers.set(li, setTimeout(() => {
				li.classList.remove("is-rotated");
			}, LINGER));
		}

		li.addEventListener("mouseenter", rotateIn);
		li.addEventListener("mouseleave", rotateOut);

		li.addEventListener("click", () => {
			if (lockedItem === li) {
				// Clicking the locked item unlocks it
				lockedItem = null;
				li.classList.remove("is-rotated");
			} else {
				// Lock this item; release whichever was locked before
				unlockAll();
				lockedItem = li;
				clearTimeout(leaveTimers.get(li));
				li.classList.add("is-rotated");
			}
		});
	});
})();

/* ============================================================
   CTA email copy-to-clipboard.

   Copies lucas@stillpoint-construction.com when any
   .js-copy-email button is clicked, then shows a brief
   confirmation message in the adjacent .copy-confirm span.
   ============================================================ */

(function () {
	const EMAIL = "lucas@stillpoint-construction.com";

	document.querySelectorAll(".js-copy-email").forEach((btn) => {
		btn.addEventListener("click", () => {
			const confirm = btn.closest(".cta-wrap")?.querySelector(".copy-confirm");

			navigator.clipboard.writeText(EMAIL).then(() => {
				if (!confirm) return;
				confirm.textContent = "Email copied to clipboard.";
				// Clear message after 3 seconds
				setTimeout(() => {
					confirm.textContent = "";
				}, 3000);
			}).catch(() => {
				// Fallback for older browsers
				const ta = document.createElement("textarea");
				ta.value = EMAIL;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
				if (!confirm) return;
				confirm.textContent = "Email copied to clipboard.";
				setTimeout(() => {
					confirm.textContent = "";
				}, 3000);
			});
		});
	});
})();

