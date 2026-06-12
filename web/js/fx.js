/* FX — sticky header, scroll-reveal, jemný parallax v hero.
   Vanilla JS, žádné závislosti. Respektuje prefers-reduced-motion. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll-reveal: třídu js přidáváme jen, když poběží i odhalování —
     bez JS (nebo s omezeným pohybem) zůstává obsah rovnou viditelný. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* Sticky header: zmenší se a ztmaví po opuštění vrcholu hero sekce. */
  var header = document.getElementById("site-header");
  var sentinel = document.getElementById("hero-sentinel");
  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("shrunk", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Decentní parallax pozadí hero — jen desktop, jen bez omezení pohybu.
     Nastavuje --parallax, kterou čte transform na #hero::before. */
  var hero = document.getElementById("hero");
  if (hero && !reduceMotion && window.matchMedia("(min-width: 861px)").matches) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, hero.offsetHeight);
        hero.style.setProperty("--parallax", (y * 0.12).toFixed(1) + "px");
        ticking = false;
      });
    }, { passive: true });
  }
})();
