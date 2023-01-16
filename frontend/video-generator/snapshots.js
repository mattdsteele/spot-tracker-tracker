import puppeteer from "puppeteer";
import childProcess from "child_process";
import { promisify } from "util";
const exec = promisify(childProcess.exec);

const config = {
  start: new Date("2022-08-19T21:28:57Z"),
  end: new Date("2022-08-21T00:50:55Z"),
  fps: 20,
  videoSeconds: 15,
  viewport: {
    height: 480,
    width: 720,
  },
};

const getTimestamps = () => {
  const from = config.start.getTime();
  const to = config.end.getTime();
  const totalFrames = config.fps * config.videoSeconds;
  const deltaBetweenFrames = (to - from) / totalFrames;
  let timestampFrames = [];
  let currentTimestamp = from;
  while (currentTimestamp < to) {
    timestampFrames = [
      ...timestampFrames,
      Math.floor(currentTimestamp + deltaBetweenFrames),
    ];
    currentTimestamp += deltaBetweenFrames;
  }
  return timestampFrames;
};

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: config.viewport });
  const page = await browser.newPage();
  const times = getTimestamps();
  for (let from of times) {
    await page.goto(`http://localhost:5173?from=${from}`);
    await page.waitForSelector("#map .mapboxgl-popup-content");
    await page.screenshot({
      type: "png",
      path: `screenshots/screen-${from}.png`,
    });
    console.log(`snapped ${from} (${times.indexOf(from)} of ${times.length})`);
  }
  const cmd = `ffmpeg -framerate ${config.fps} -pattern_type glob -i 'screenshots/*.png' -c:v libx264 -pix_fmt yuv420p out.mp4`;
  await exec(cmd);
  console.log("generated video");
})();
