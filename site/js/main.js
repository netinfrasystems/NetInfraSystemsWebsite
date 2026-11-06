(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Header background on scroll
  var header = $(".site-header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav
  var toggle = $(".nav-toggle"), nav = $("#site-nav");
  var setNav = function (open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  // Reveal on scroll
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  // Click-to-play YouTube (no third-party requests until the visitor clicks)
  $$(".video[data-yt]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-yt");
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      f.title = btn.getAttribute("aria-label") || "Video";
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      var wrap = document.createElement("div");
      wrap.className = "video";
      wrap.appendChild(f);
      btn.replaceWith(wrap);
    }, { once: true });
  });

  // Lightbox
  var lb = $("#lightbox");
  var links = $$("#gallery a");
  var idx = 0;
  if (lb && typeof lb.showModal === "function") {
    var lbImg = $("img", lb);
    var show = function (i) {
      idx = (i + links.length) % links.length;
      lbImg.src = links[idx].getAttribute("href");
      lbImg.alt = $("img", links[idx]).alt;
    };
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) { e.preventDefault(); show(i); lb.showModal(); });
    });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  // Google Form. The form is cross-origin, so we can't see inside it, but the frame fires "load" each time
  // Google shows a new page. Every link in Google's form opens in a new tab and only the form itself submits
  // inside the frame, so once someone has used the form, the next load means it was submitted. We then
  // replace the frame with our own confirmation: no leftover frame to trap touch-scrolling, no empty space.
  var formCard = $("#consultation-form");
  var formFrame = formCard && $("iframe", formCard);
  if (formFrame) {
    var formSrc = formFrame.src, usedForm = false;
    var done = $(".form-done", formCard);
    // Clicking into a cross-origin frame blurs this window and makes the frame the active element.
    window.addEventListener("blur", function () {
      setTimeout(function () { if (document.activeElement === formFrame) usedForm = true; }, 0);
    });
    formFrame.addEventListener("load", function () {
      if (!usedForm) return; // first load, or Google's own redirects before anyone touched the form
      usedForm = false;
      formCard.classList.add("done");
      formFrame.hidden = true;
      done.hidden = false;
      $(".form-done-title", done).focus({ preventScroll: true }); // pull focus out of the hidden frame
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#form-again", done).addEventListener("click", function () {
      formCard.classList.remove("done");
      done.hidden = true;
      formFrame.hidden = false;
      formFrame.src = formSrc; // fresh, empty form; its load is ignored until it's used again
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
