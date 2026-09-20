# How to undo the restyle

These are the files exactly as they were before the "Style sample" restyle (2026-09-19).
To go back, run this from the project folder:

    cp backup-before-restyle/style.css site/css/style.css
    cp backup-before-restyle/map.js site/js/map.js

Then refresh the browser. Nothing else changed, so that is the whole undo.
(The font files in site/vendor/fonts/ can stay — they are simply unused after a revert.)
