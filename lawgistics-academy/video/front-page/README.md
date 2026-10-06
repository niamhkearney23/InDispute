# The front page video

`index.html` is the source of the 32 second explainer at the top of the
academy's front page. It is a HyperFrames composition: HTML whose animation
is a paused GSAP timeline, rendered frame by frame to MP4. The fonts (Fraunces
and Inter, SIL Open Font License) and GSAP are copied into `assets/` so a
render does not depend on the network.

Everything it shows is something the academy does. If the matter, the round
times or the scoring rule change, change the video too.

To render it again (needs Node 22 and FFmpeg):

```bash
cd video/front-page
npx hyperframes@0.8.137 check
npx hyperframes@0.8.137 render -o /tmp/raw.mp4
ffmpeg -i /tmp/raw.mp4 -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
  -movflags +faststart -an ../../public/video/front-page.mp4
ffmpeg -ss 16.4 -i /tmp/raw.mp4 -frames:v 1 -q:v 4 ../../public/video/front-page-poster.jpg
```

The page plays it muted and looping, waits on the still for anyone whose
device asks for reduced motion, and always offers Pause and Full screen
(`src/components/front-page-video.tsx`).
