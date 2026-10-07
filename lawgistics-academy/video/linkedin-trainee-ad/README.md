# LinkedIn ad: the litigation trainee programme

`index.html` is a HyperFrames composition, 1080 by 1350 (4:5) and 25
seconds, in the Lawgistics house style: cream with a navy close, Playfair
Display with one italic phrase per statement, TikTok Sans for the detail,
steel-blue as the only accent, kicker top left, facts bottom left, wordmark
bottom right. Fonts (SIL Open Font License) and GSAP are in `assets/`.

`out/` holds what gets posted: the video, two stills for an image post, and
`POST.md` with the post text. Nothing here is posted automatically.

Every claim comes from the programme's own copy in the app
(`src/content/programme.ts`, `src/content/programme-plan.ts` and the trainee
page). When the intake, the weeks or the certification rule change, change
this too. To render it again:

```bash
cd video/linkedin-trainee-ad
npx hyperframes@0.8.137 check
npx hyperframes@0.8.137 render -o /tmp/raw.mp4
ffmpeg -i /tmp/raw.mp4 -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -movflags +faststart -an out/linkedin-trainee-ad.mp4
```
