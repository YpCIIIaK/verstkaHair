(function () {
  "use strict";

  const mq = (q) => window.matchMedia(q);
  const prefersReduced = mq("(prefers-reduced-motion: reduce)").matches;

  /* ==== Lenis smooth-scroll (самохостинг) ==== */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.5 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ==== Липкая шапка: прячем при скролле вниз ==== */
  const header = document.querySelector("[data-header]");
  if (header) {
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      header.classList.toggle("is-hidden", y > lastY && y > header.offsetHeight);
      lastY = y;
    }, { passive: true });
  }

  /* ==== Мобильное меню ==== */
  const burger = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        if (a.matches("[aria-haspopup]")) return;
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ==== Выпадающий список «Услуги» ====
     Показ/скрытие — на CSS (:hover и :focus-within), здесь только синхронизация
     aria-expanded и закрытие по Escape */
  document.querySelectorAll("[data-nav-drop]").forEach((item) => {
    /* «Услуги» — ссылка на страницу каталога, а не кнопка: по клику переходим,
       по наведению раскрываем список */
    const btn = item.querySelector("[aria-haspopup]");
    if (!btn) return;
    const set = (open) => {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    };

    btn.addEventListener("click", (e) => {
      if (!mq("(max-width: 767px)").matches || !item.closest("[data-nav]")) return;
      e.preventDefault();
      set(!item.classList.contains("is-open"));
    });

    item.addEventListener("mouseenter", () => set(true));
    item.addEventListener("mouseleave", () => set(false));
    item.addEventListener("focusin", () => set(true));
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) set(false);
    });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { set(false); btn.blur(); }
    });
  });

  /* ==== Сравнение до/после ====
     Тянем мышью, пальцем или стрелками. Позицию держит нативный range —
     он же даёт клавиатуру и скринридер, поэтому своих обработчиков drag не нужно */
  document.querySelectorAll("[data-compare]").forEach((box) => {
    const range = box.querySelector("[data-compare-range]");
    if (!range) return;

    const paint = () => box.style.setProperty("--split", range.value + "%");
    paint();

    range.addEventListener("input", paint);

    /* Клик по картинке = мгновенный перенос шторки: у range шаг был бы от текущей
       позиции thumb, а тут ждут прыжка ровно под курсор */
    box.addEventListener("pointerdown", (e) => {
      if (e.target === range) {
        const { left, width } = box.getBoundingClientRect();
        range.value = String(Math.round(((e.clientX - left) / width) * 100));
        paint();
      }
    });
  });

  /* ==== Слайдер на нативном скролле ====
     Листаем по одной карточке. Стрелка гаснет, когда листать больше некуда */
  document.querySelectorAll("[data-slider-track]").forEach((track) => {
    const scope = track.closest("section") || document;
    const prev = scope.querySelector("[data-slider-prev]");
    const next = scope.querySelector("[data-slider-next]");
    if (!prev || !next) return;

    const step = () => {
      const card = track.firstElementChild;
      if (!card) return 0;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    };

    const go = (dir) =>
      track.scrollBy({ left: dir * step(), behavior: prefersReduced ? "auto" : "smooth" });

    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });

  /* ==== Аккордеон FAQ ====
     Открыт всегда один: раскрывая вопрос, закрываем соседний */
  document.querySelectorAll("[data-accordion]").forEach((list) => {
    const items = [...list.querySelectorAll(".faq-item")];

    const set = (item, open) => {
      item.classList.toggle("is-open", open);
      const btn = item.querySelector("button");
      if (btn) btn.setAttribute("aria-expanded", String(open));
    };

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !list.contains(btn)) return;
      const item = btn.closest(".faq-item");
      const open = !item.classList.contains("is-open");
      items.forEach((i) => set(i, i === item && open));
    });
  });

  /* ==== Выпадающий список ====
     Значение уходит в скрытый input — форма отправляется как обычно */
  document.querySelectorAll("[data-select]").forEach((select) => {
    const toggle = select.querySelector(".select__toggle");
    const label = select.querySelector("[data-select-label]");
    const input = select.querySelector("[data-select-input]");
    const options = [...select.querySelectorAll('[role="option"]')];
    if (!toggle || !label || !input) return;

    const open = (state) => {
      select.classList.toggle("is-open", state);
      toggle.setAttribute("aria-expanded", String(state));
    };

    const choose = (option) => {
      options.forEach((o) => o.setAttribute("aria-selected", String(o === option)));
      label.textContent = option.textContent;
      input.value = option.dataset.value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      open(false);
      toggle.focus();
    };

    toggle.addEventListener("click", () => open(!select.classList.contains("is-open")));
    options.forEach((o) => o.addEventListener("click", () => choose(o)));

    select.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { open(false); toggle.focus(); return; }
      if (e.key === "Enter" || e.key === " ") {
        const o = e.target.closest('[role="option"]');
        if (o) { e.preventDefault(); choose(o); }
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      if (!select.classList.contains("is-open")) { open(true); options[0].focus(); return; }
      const i = options.indexOf(document.activeElement);
      const next = e.key === "ArrowDown" ? i + 1 : i - 1;
      options[(next + options.length) % options.length].focus();
    });

    /* Клик мимо — закрываем */
    document.addEventListener("click", (e) => {
      if (!select.contains(e.target)) open(false);
    });
  });

  /* ==== Модалки ====
     Нативный dialog сам держит фокус, Esc и подложку — здесь только открытие,
     закрытие по кнопке и клик мимо окна */
  document.querySelectorAll("[data-modal-open]").forEach((btn) => {
    const dlg = document.getElementById(btn.dataset.modalOpen);
    if (!dlg) return;
    btn.addEventListener("click", () => dlg.showModal());
  });

  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.querySelectorAll("[data-modal-close]").forEach((b) =>
      b.addEventListener("click", () => dlg.close())
    );
    /* Клик по подложке: она — часть самого dialog, поэтому сверяем с его рамкой */
    dlg.addEventListener("click", (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right &&
                     e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  });

  /* ==== История: таймлайн ====
     Лента едет через --active: шаг 337 задан шириной пункта, CSS считает сам */
  const histTrack = document.querySelector("[data-history-track]");
  const histBox = document.querySelector("[data-history-slides]");
  if (histTrack && histBox) {
    const years = [...histTrack.querySelectorAll("[data-history-item]")];
    const slides = [...histBox.querySelectorAll("[data-history-slide]")];
    let cur = 0;

    const show = (n) => {
      cur = Math.min(Math.max(n, 0), slides.length - 1);
      histTrack.style.setProperty("--active", cur);
      years.forEach((el, k) => el.classList.toggle("is-active", k === cur));
      slides.forEach((el, k) => el.classList.toggle("is-active", k === cur));
      /* Стрелки есть в каждом слайде — гасим во всех, видима всё равно одна пара */
      histBox.querySelectorAll("[data-history-prev]").forEach((b) => (b.disabled = cur === 0));
      histBox.querySelectorAll("[data-history-next]").forEach(
        (b) => (b.disabled = cur === slides.length - 1)
      );
    };

    histBox.addEventListener("click", (e) => {
      if (e.target.closest("[data-history-prev]")) show(cur - 1);
      else if (e.target.closest("[data-history-next]")) show(cur + 1);
    });

    show(0);
  }

  /* ==== Блог: фильтр по категориям ====
     Заголовочным делаем самый новый пост выбранной категории (для «Все» — просто
     самый новый). Он уезжает из сетки в широкую карточку, остальные — в сетку */
  const blogFeat = document.querySelector("[data-blog-featured]");
  const blogChips = [...document.querySelectorAll("[data-blog-filter]")];
  const blogCards = [...document.querySelectorAll("[data-blog-card]")];

  if (blogFeat && blogCards.length) {
    const esc = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const featuredHTML = (card) => {
      const q = (s) => card.querySelector(s);
      return `<article class="blog-featured">
          <div class="blog-featured__media">
            <img src="assets/images/blogImgBig.png" alt="" width="650" height="307" loading="lazy" />
          </div>
          <div class="blog-featured__body">
            <span class="blog-featured__date">${esc(q(".post-card__date").textContent)}</span>
            <div class="blog-featured__text">
              <h3>${esc(q("h3").textContent)}</h3>
              <p>${esc(q("p").textContent)}</p>
            </div>
            <div class="blog-featured__foot">
              <span class="post-card__tag">${esc(q(".post-card__tag").textContent)}</span>
              <a class="link-solid" href="${q("a").getAttribute("href")}">Читать статью</a>
            </div>
          </div>
        </article>`;
    };

    const apply = (cat) => {
      blogChips.forEach((c) => c.classList.toggle("is-active", c.dataset.blogFilter === cat));

      const visible = blogCards
        .filter((c) => cat === "all" || c.dataset.cat === cat)
        .sort((a, b) => b.dataset.date.localeCompare(a.dataset.date));

      const lead = visible[0] || null;
      blogCards.forEach((c) => (c.hidden = !visible.includes(c) || c === lead));
      blogFeat.innerHTML = lead ? featuredHTML(lead) : "";
    };

    blogChips.forEach((chip) =>
      chip.addEventListener("click", () => apply(chip.dataset.blogFilter))
    );
    apply("all");
  }

  /* ==== Якорная навигация с учётом липкой шапки ==== */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight + 12 : 0;
      if (lenis) lenis.scrollTo(target, { offset: -offset });
      else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset,
                             behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ==== Reveal-on-scroll ==== */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

})();
