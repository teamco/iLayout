[![Publish to NPM](https://github.com/teamco/iLayout/actions/workflows/publish.yml/badge.svg)](https://github.com/teamco/iLayout/actions/workflows/publish.yml)

# @teamco/anthill-layout-embed

Embed [Anthill Layout](https://github.com/teamco/iLayout) on any website. Works as a React component or a plain `<script>` tag.

## Install

```bash
npm i @teamco/anthill-layout-embed
```

## Usage

### React

```tsx
import { WidgetLayout } from '@teamco/anthill-layout-embed';
import '@teamco/anthill-layout-embed/style.css';

// Load by layout ID
<WidgetLayout layoutId="abc-123" />

// Load from URL
<WidgetLayout layoutUrl="https://cdn.example.com/my-layout.json" />

// Pass layout JSON directly
<WidgetLayout layout={myLayoutData} />
```

### Script tag (no build tools)

```html
<script src="https://unpkg.com/@teamco/anthill-layout-embed/dist/embed.js"></script>

<div data-widget-layout="abc-123"></div>
```

Or load from a URL:

```html
<div data-widget-layout-url="https://cdn.example.com/my-layout.json"></div>
```

The script finds all `[data-widget-layout]` and `[data-widget-layout-url]` elements and renders them automatically.

### Programmatic (vanilla JS)

```js
AntHillLayout.mount(document.getElementById('my-container'), {
  layoutUrl: 'https://cdn.example.com/my-layout.json',
  theme: { colorPrimary: '#1a73e8' },
});
```

## Props

| Prop        | HTML attribute           | Description                                   |
| ----------- | ------------------------ | --------------------------------------------- |
| `layoutId`  | `data-widget-layout`     | Layout ID, fetched from API                   |
| `layout`    | --                       | Inline layout JSON (React only)               |
| `layoutUrl` | `data-widget-layout-url` | URL to a layout JSON file                     |
| `fullPage`  | `data-full-page`         | Stretch to full viewport                      |
| `theme`     | `data-theme`             | Theme object (JSON string in HTML)            |
| `apiBase`   | `data-api-base`          | API base URL (optional, defaults to built-in) |
| `apiKey`    | `data-api-key`           | API anon key (optional, defaults to built-in) |
| `onLoad`    | --                       | Callback after layout loads (React only)      |
| `onError`   | --                       | Callback on error (React only)                |

Priority when multiple sources are provided: `layout` > `layoutUrl` > `layoutId`.

## Theming

Pass a theme object to customize the look:

```tsx
<WidgetLayout
  layoutId="abc-123"
  theme={{
    colorPrimary: '#1a73e8',
    colorBg: '#ffffff',
    colorText: '#1f1f1f',
    colorBorder: '#e8e8e8',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    borderRadius: 8,
    spacing: 4,
  }}
/>
```

Or override CSS variables directly:

```css
.al-root {
  --al-color-primary: #1a73e8;
  --al-color-bg: #ffffff;
  --al-font-family: Inter, sans-serif;
}
```

### CSS variables

| Variable             | Default           | Description          |
| -------------------- | ----------------- | -------------------- |
| `--al-color-primary` | `#1677ff`         | Primary accent color |
| `--al-color-bg`      | `#ffffff`         | Background color     |
| `--al-color-text`    | `#1f1f1f`         | Text color           |
| `--al-color-border`  | `#e8e8e8`         | Border color         |
| `--al-font-family`   | system font stack | Font family          |
| `--al-font-size`     | `14px`            | Base font size       |
| `--al-border-radius` | `6px`             | Border radius        |
| `--al-spacing`       | `0px`             | Gap between panels   |

## Display modes

**Container (default)** -- fills its parent element. Set width/height on the parent:

```html
<div style="width: 800px; height: 600px;">
  <div data-widget-layout="abc-123"></div>
</div>
```

**Full page** -- stretches to the entire viewport:

```tsx
<WidgetLayout layoutId="abc-123" fullPage />
```

```html
<div data-widget-layout="abc-123" data-full-page="true"></div>
```

## Bundle sizes

| Build             | File             | Size (gzip) | React           |
| ----------------- | ---------------- | ----------- | --------------- |
| ESM (npm)         | `dist/index.mjs` | ~3 KB       | peer dependency |
| IIFE (script tag) | `dist/embed.js`  | ~176 KB     | bundled         |
| CSS               | `dist/embed.css` | ~0.7 KB     | --              |

## License

[MIT](./LICENSE)
