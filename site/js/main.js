(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
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

  // Package buttons pre-select the form
  var pkgSelect = $("#package-select");
  $$("[data-package]").forEach(function (a) {
    a.addEventListener("click", function () { pkgSelect.value = a.getAttribute("data-package"); });
  });

  // Contact options from runtime config (see docker/entrypoint)
  if (cfg.bookingUrl) {
    var bl = $("#booking-link");
    bl.href = cfg.bookingUrl;
    bl.hidden = false;
  }
  if (cfg.contactEmail) {
    var el = $("#contact-email-link");
    el.href = "mailto:" + cfg.contactEmail;
    el.textContent = cfg.contactEmail;
    $("#contact-direct").hidden = false;
  }

  // Contact form
  var form = $("#contact-form"), note = $("#form-note");
  var setNote = function (msg, kind) { note.textContent = msg; note.className = "form-note" + (kind ? " " + kind : ""); };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = null;
    $$("[required]", form).forEach(function (f) {
      var ok = f.value.trim() !== "" && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !bad) bad = f;
    });
    if (bad) { setNote("Please add your name and a valid email.", "err"); bad.focus(); return; }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
    var btn = $("button[type=submit]", form);

    if (cfg.formEndpoint) {
      btn.disabled = true; setNote("Sending...");
      fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        setNote("Thanks! We got your request and will be in touch shortly.", "ok");
      }).catch(function () {
        setNote("Something went wrong sending your request." + (cfg.contactEmail ? " Please email " + cfg.contactEmail + "." : ""), "err");
      }).then(function () { btn.disabled = false; });
      return;
    }

    if (cfg.contactEmail) {
      var lines = [
        "Name: " + data.name, "Email: " + data.email,
        "Organization: " + (data.organization || "-"), "Phone: " + (data.phone || "-"),
        "Event date: " + (data.date || "-"), "Package: " + (data["package"] || "Not sure yet"),
        "Event / location: " + (data.event || "-"), "", data.message || ""
      ];
      window.location.href = "mailto:" + cfg.contactEmail +
        "?subject=" + encodeURIComponent("Consultation request: " + (data.event || data.name)) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      setNote("Opening your email app to send the request...", "ok");
      return;
    }

    setNote("Online requests aren't set up yet. Please check back soon.", "err");
  });

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
