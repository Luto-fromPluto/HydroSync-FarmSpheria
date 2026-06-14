# 🌱 HydroSync — "Why Hydroponics?" Animated Infographic

**Name:** Sharan Tilak  
**Topic:** Farmspherica - The Founder's web Hackathlon  
**Whats it about:** Learn about Hydroponics and how it will change the world of Agriculture  
**Email:** cold.executioner@gmail.com  

---

A bold, modern one-page scrolling infographic that sells the benefits of hydroponics through stunning visuals, heavy CSS/JS animations, and interactive elements.

---

## 📁 Project Structure

```
├── index.html   → Semantic HTML5 structure with all sections
├── style.css    → Complete design system, animations, and responsive layout
├── script.js    → Interactive animations, counters, effects, and accessibility
└── README.md    → This file
```

**Only 4 files. No frameworks. No build tools. No dependencies.**

---

## ✨ Features

### 🎯 Core Content
- **Hero Section** — Bold typographic intro with animated badge, parallax scrolling, and dual CTAs
- **Stat Counters** — 4 animated count-up statistics (90% less water, 3× faster growth, 0 pesticides, 365 days/year)
- **Benefits Grid** — 6 cards explaining why hydroponics matters
- **How It Works** — 5-step animated timeline with alternating layout
- **Comparison Table** — Hydroponics vs. Traditional farming side-by-side
- **FAQ Accordion** — 6 expandable questions with smooth animations
- **CTA Section** — "Join HydroSync" call-to-action with animated stripes
- **Footer** — Full links, social icons, and branding

### 🎨 Design & Aesthetics
- **Dark mode** with green neon accent palette
- **Diagonal green stripes** layered across the full background
- **Glassmorphism** cards with backdrop-filter blur
- **Animated grid background** with slow panning
- **Green gradient touches** throughout (buttons, borders, text, dividers)
- **Premium typography** — Outfit (display), Inter (body), Space Grotesk (mono)
- **Custom scrollbar** styled to match the green theme

### 🚀 Animations & Interactivity
| Feature | Type |
|---|---|
| Loading screen | CSS spinner + JS fade-out |
| Floating particles | 35 animated particles with randomized physics |
| Cursor glow | Smooth lerp-following radial gradient |
| Count-up stats | `requestAnimationFrame` + easeOutCubic easing |
| Scroll reveal | IntersectionObserver fade-in/slide/scale |
| Staggered reveals | Sequential child animations on scroll |
| Card tilt effect | 3D perspective transforms on mousemove |
| Card glow-follow | Mouse-tracking radial glow inside cards |
| Ripple on click | Dynamic ripple burst on stat card click |
| Magnetic CTA button | Follows cursor with subtle magnetic pull |
| Parallax hero | Smooth parallax on scroll with opacity fade |
| Reading progress bar | Top-bar showing scroll completion |
| Marquee banner | Infinite scroll with pause-on-hover |
| FAQ accordion | Smooth expand/collapse with icon rotation |
| Back-to-top button | Appears on scroll with spring animation |
| Toast notifications | Slide-up toast on CTA button clicks |
| Timeline dots | Sequential scale-in animation |
| Table rows | Staggered slide-in from left |
| Active nav highlight | Real-time section tracking |
| Navbar scroll shrink | Compact nav on scroll |
| Konami code easter egg | Rainbow particle burst (↑↑↓↓←→←→BA) |

### ♿ Accessibility
- Semantic HTML5 elements (`<nav>`, `<section>`, `<footer>`, `<blockquote>`)
- Keyboard-navigable FAQ (Tab + Enter/Space)
- ARIA roles on interactive elements
- Proper heading hierarchy (single `<h1>`)
- Descriptive meta tags for SEO

---

## 🛠️ How to Run

1. **Open directly** — Double-click `index.html` in any modern browser
2. **Or serve locally** — Use any simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (npx)
   npx serve .

   # VS Code
   # Install "Live Server" extension → right-click index.html → "Open with Live Server"
   ```
3. Open `http://localhost:8000` in your browser

---

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📝 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | Vanilla CSS3 (custom properties, animations, grid, flexbox, backdrop-filter) |
| Logic | Vanilla JavaScript (ES6+, IntersectionObserver, requestAnimationFrame, Web Animations API) |
| Fonts | Google Fonts (Outfit, Inter, Space Grotesk) |

---

## 👥 Credits

Built for the **HydroSync** hackathon project by **Team TFW Sharan**.

---

## 📄 License

MIT License — use freely for personal and commercial projects.
