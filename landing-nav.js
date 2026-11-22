/* Hero sky: never show a paused video (native play overlay on iOS, Android, and desktop). */

(() => {
  const video = document.querySelector(".hero-video");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  video.controls = false;
  video.removeAttribute("controls");
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.playsInline = true;
  video.disablePictureInPicture = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const play = () => {
    const attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(() => {});
  };

  const unlock = () => play();

  video.addEventListener("playing", () => {
    video.classList.add("is-playing");
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("keydown", unlock);
  });

  video.addEventListener("pause", () => video.classList.remove("is-playing"));

  play();
  video.addEventListener("loadeddata", play);
  video.addEventListener("canplay", play);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") play();
  });
  document.addEventListener("pointerdown", unlock, { passive: true });
  document.addEventListener("touchstart", unlock, { passive: true });
  document.addEventListener("keydown", unlock);
})();

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
