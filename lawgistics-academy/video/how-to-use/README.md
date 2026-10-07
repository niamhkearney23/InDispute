# How to use the Litigation Trainee Academy

`index.html` is the source of a 70 second portrait video for the firm's
trainees, to send by WhatsApp or email, and served at
`/video/how-to-use.mp4`. It is a HyperFrames composition, like the front
page video (see `../front-page/README.md`).

The phone shows real screens, captured from the app on the mock backend at
390 by 844 (`assets/screens/`). Screens carrying sample people, work or dates
are marked "Example" in the video. The diagnostic, the rounds and a question
are drawn instead, and the question uses blank lines so no legal content
appears that a lawyer has not signed off.

It names the firm and the start date, so change it when the programme's
dates, the round times or a screen it shows change. To render it again:

```bash
cd video/how-to-use
npx hyperframes@0.8.137 check
npx hyperframes@0.8.137 render -o /tmp/raw.mp4
ffmpeg -i /tmp/raw.mp4 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -movflags +faststart -an ../../public/video/how-to-use.mp4
```
