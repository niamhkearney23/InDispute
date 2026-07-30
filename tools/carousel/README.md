# Carousel render pipeline

Setup (once per session):
```
npm init -y && npm install @fontsource/tiktok-sans playwright-core
```

Usage: edit the slide content dicts in build.py, then:
```
python3 build.py && node shoot.mjs   # PNGs land in ./out/
```

Chromium binary: /opt/pw-browsers/chromium (pre-installed in the remote environment).
