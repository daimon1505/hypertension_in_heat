"""
make_slides.py — turns the two slide pages in docs/ into JPG images for presentations.

Run from the project folder:
    python3 scripts/make_slides.py

It writes (1920 x 1080, rendered at 2x for sharp text):
    Demostration/user-journey-map.jpg
    Demostration/service-system-map.jpg

Edit docs/slide-journey.html or docs/slide-system.html, then run this again.
Needs Google Chrome installed (used to take the picture) — macOS only for the JPG step.
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Demostration"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

SLIDES = [
    ("docs/slide-journey.html", "user-journey-map"),
    ("docs/slide-system.html", "service-system-map"),
]
WIDTH, HEIGHT, SCALE, QUALITY = 1920, 1080, 2, 92


def main():
    if not Path(CHROME).exists():
        sys.exit("Google Chrome not found — install it, or open the HTML files and screenshot them by hand.")
    OUT.mkdir(exist_ok=True)
    for src, name in SLIDES:
        png = OUT / f"{name}.png"
        jpg = OUT / f"{name}.jpg"
        subprocess.run([
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
            f"--window-size={WIDTH},{HEIGHT}",
            f"--force-device-scale-factor={SCALE}",
            "--virtual-time-budget=5000",
            f"--screenshot={png}",
            (ROOT / src).as_uri(),
        ], check=True, capture_output=True)
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(QUALITY),
                        str(png), "--out", str(jpg)], check=True, capture_output=True)
        png.unlink()
        size = jpg.stat().st_size // 1024
        print(f"{jpg.relative_to(ROOT)}  {WIDTH * SCALE}x{HEIGHT * SCALE}px  {size} KB")


if __name__ == "__main__":
    main()
