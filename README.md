# MOHAMMED · Watches & Silver with Gemstones

A concept jewelry and watch store built as a scroll-driven 3D experience. Brand, products and prices are fictional (a sales demo for jewelers and watch sellers).

- **Hero scroll story (WebGL, three.js):** a silver watch ticking in the visitor's own time, an exploded view with labelled layers, a ruby ring, prayer beads of glowing amber flowing across the screen and a name plate that turns to face you. Floating gems stay behind the pieces and drift slowly. Everything is generated in code (no model files) and driven by scroll progress, so it plays forward and backward.
- **Real brilliant-cut gems:** faceted stones (table, star, kite and girdle facets) rendered as a translucent shell over a reflective interior; cabochon, oval and step cuts for the rest.
- **Catalogue in plain 2D:** 31 products (6 watches, 7 rings, 6 name plates, 6 chains and torcs, 6 prayer-bead sets) with studio-lit WebP images rendered from the same 3D models, quick view with two angles and hover zoom, ring size, chain length and name-engraving options. No WebGL on the catalogue.
- **Atelier (design your own piece):** a drag-to-rotate 3D designer. Ring: 8 styles, 15 stones, 4 cuts, stone size, silver thickness, finish, band pattern, side stones, initials on the signet, inside engraving, size and a notes box ("we'll find the closest thing to your request"). Watch: dial, strap, case size and finish, gem bezel, name on the dial, caseback engraving. Prayer beads: 10 materials, 33/66/99 beads, tassel, cap engraving. Live price estimate, add to bag, save a picture of the design and send the details on WhatsApp.
- **Bag to WhatsApp:** prices in Turkish lira, a bag saved locally (catalogue items and custom designs) and a ready-made WhatsApp message in the visitor's language. Change the number in `js/content.js` (`CONFIG.wa`).
- **AR / EN / TR** with a circular page-reveal switcher (View Transitions); the layout stays left-to-right in all three languages and Arabic text runs right-to-left inside its own block.
- **Three colour palettes** (Obsidian warm black + champagne, deep Emerald, Burgundy) switched from the header, saved locally and available as `?theme=`.
- **Sound (off by default):** synthesized with Web Audio, no files: a clock tick that follows the second hand, stone glints, a bead click and an order seal.
- **Light on memory:** the WebGL scenes are built when they approach the screen and fully disposed when they leave it, and catalogue images far from the viewport are released and reloaded on return. Section links jump instantly instead of scrolling through the 3D hero. Works on phones; respects `prefers-reduced-motion`.

Static site (vanilla ES modules, three.js r172 vendored). Open `index.html` through any static server.

Designed and developed by Muhammed Elhuseyin · MOHAMMED Web Studio.
