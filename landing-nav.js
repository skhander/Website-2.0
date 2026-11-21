/* Hamburger menu for phones and iPads. */

(() => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-dropdown");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Menu");
    menu.hidden = !open;
  };

  toggle.addEventListener("click", () => setOpen(menu.hidden));

  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !e.target.closest(".nav-menu")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
