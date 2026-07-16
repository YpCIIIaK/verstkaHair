# Вахитовна — лендинг косметолога

Вёрстка в стандартах Factum: чистые **HTML + CSS + ванильный JS**, без сборщиков,
progressive enhancement. Структура повторяет UAK_trade.

## Структура

```
index.html                # главная (скелет с секциями-заготовками)
assets/images/            # WebP из Figma, с явными width/height
assets/logo/              # SVG-логотип
assets/fonts/             # woff2 (положить и раскомментировать @font-face в fonts.css)
assets/favicon/           # fav-32.png
assets/vendor/            # самохостинг библиотек (lenis.min.js), pinned-версии
src/styles/main.css       # точка входа — только @import в порядке каскада
  ├ vars.css              # дизайн-токены :root (цвета/типографика/отступы)
  ├ fonts.css             # @font-face
  ├ global.css            # reset, типографика, утилиты, reveal
  ├ header.css            # шапка + мобильное меню
  ├ footer.css            # футер
  └ style.css             # кнопки + блоки страниц
src/lib/main.js           # единый IIFE: Lenis, меню, якоря, reveal
```

## Правила (как в UAK_trade)

- **Один main.css** — только `@import`, порядок = каскад.
- Новые стили блока → `style.css`; медиа-запросы блока класть **сразу за блоком**.
- Правки шапки/футера → в их файлы; новые токены → `vars.css`.
- После правки файла бампать его `?v=` в main.css (и `?v=` main.css в HTML при правке main.css).
- Инлайн-стилей нет. JS-хуки через `data-*`, состояния — классы `is-*`.
- Значения (отступы/шрифты/цвета) — из токенов, не «магические».

## Плейсхолдеры к замене

- [ ] Палитра `--color-*` и шрифты `--font-*` в vars.css — из макета.
- [ ] Шрифты woff2 в assets/fonts + раскомментировать fonts.css.
- [ ] Логотип, favicon, hero-картинка (preload + fetchpriority).
- [ ] Телефон, соцсети, ссылки, canonical/OG/JSON-LD.
- [ ] Отправка формы (WordPress REST / CF7 — тема vakhitovna).
```
