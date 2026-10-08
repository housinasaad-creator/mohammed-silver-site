# MOHAMMED · Watches & Silver with Gemstones

A concept jewelry and watch store built as a scroll-driven 3D experience. Brand, products and prices are fictional (a sales demo for jewelers and watch sellers).

- **Hero scroll story (WebGL, three.js):** a silver watch ticking in the visitor's own time, an exploded view with labelled layers, a ruby ring among floating gemstones, prayer beads flowing across the screen and a name plate that turns to face you. Everything is generated in code (no model files) and driven by scroll progress, so it plays forward and backward.
- **Catalogue in plain 2D:** 31 products (6 watches, 7 rings, 6 name plates, 6 chains and torcs, 6 prayer-bead sets) with studio-lit images rendered from the same 3D models, quick view with two angles and hover zoom, ring size, chain length and name-engraving options.
- **Atelier:** a drag-to-rotate 3D configurator to swap the ring stone, the watch dial or the prayer-bead material.
- **Bag to WhatsApp:** prices in Turkish lira, a bag saved locally, and a ready-made WhatsApp message in the visitor's language. Change the number in `js/content.js` (`CONFIG.wa`).
- **AR / EN / TR** with a circular page-reveal switcher (View Transitions); the layout stays left-to-right in all three languages and Arabic text runs right-to-left inside its own block.
- **Sound (off by default):** synthesized with Web Audio, no files: a clock tick that follows the second hand, stone glints, a bead click and an order seal.
- **Light on memory:** the WebGL scenes are built when they approach the screen and fully disposed when they leave it, and catalogue images far from the viewport are released and reloaded on return. Works on phones; respects `prefers-reduced-motion`.

Static site (vanilla ES modules, three.js r172 vendored). Open `index.html` through any static server.

Designed and developed by Muhammed Elhuseyin · MOHAMMED Web Studio.
