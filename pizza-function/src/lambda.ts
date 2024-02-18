import { APIGatewayProxyResult, EventBridgeEvent, Handler } from "aws-lambda";
import { main } from "./caseys-playwright";
import { getCheckoutTime } from "./dates";
import { sendPushEvent } from "./push";
import webpush from "web-push";
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {basename} from 'path';
import {readFile} from 'fs/promises';

// Stryker disable all
// https://github.com/VikashLoomba/AWS-Lambda-Docker-Playwright/blob/master/app/app.js
let args = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--disk-cache-size=33554432",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
  "--single-process",
];
// Stryker restore all

type GeofenceType = {
  GeofenceId: string;
  EventType: "ENTER" | "EXIT";
  DeviceId: string;
  SampleTime: string;
  // [lon, lat]
  Position: [number, number];
};

export const handler: Handler = async (
  event: EventBridgeEvent<"Location Geofence Event", GeofenceType>,
  context,
): Promise<APIGatewayProxyResult> => {
  console.debug(JSON.stringify(event, null, 2));
  const { detail } = event;

  if (!shouldTriggerEvent(detail)) {
    console.log("Did not match pizza criteria, returning");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Did not trigger event" }),
    };
  }
  const { zip, time } = resolvePizzaLocationAndDetails(detail);
  const isSimulation = detail.DeviceId === "fake-tracker";
  const { SPOT_PUSH_MATT_SUB } = process.env;
  const sub: webpush.PushSubscription = JSON.parse(SPOT_PUSH_MATT_SUB!);
  try {
    const results = await main(
      { time, zip, isSimulation, recordVideo: true },
      {
        args,
        headless: true,
      },
    );
    console.log(`Completed with result ${JSON.stringify(results)}`);
    if (results.video) {
      await uploadVideo(results.video);
    }
    if (results.simulation) {
      const result = await sendPushEvent(sub, "Pizza simulation");
      console.log("sent dummy notification");
      console.log(result.statusCode);
      console.log(result.body);
    } else {
      await sendPushEvent(
        sub,
        `🍕🍕🍕🍕🍕 Pizza Ordered for ${time} to zip ${zip} 🍕🍕🍕🍕🍕`,
      );
      await sendDiscordAnnouncement(
        event.detail.DeviceId,
        time,
        zip,
        event.detail.GeofenceId,
        event.detail.EventType,
      );
      console.log("sent real notifications");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(event, null, 2),
    };
  } catch (e) {
    console.error("Failed the request process");
    console.error(e);
    if (!isSimulation) {
      await sendPushEvent(sub, "Failed to order pizza");
    }
    throw e;
  }
};

function shouldTriggerEvent(detail: GeofenceType) {
  if (
    detail.DeviceId === "fake-tracker" &&
    detail.EventType === "EXIT" &&
    detail.GeofenceId.toLowerCase() === "home"
  ) {
    return true;
  }

  const supportedAction = "EXIT";
  const supportedFences = ["arlington"];

  return (
    detail.EventType === supportedAction &&
    supportedFences.includes(detail.GeofenceId.toLowerCase())
  );
}
async function sendDiscordAnnouncement(
  deviceId: string,
  time: string,
  zip: string,
  geofence: string,
  action: string,
) {
  const url = process.env.CASEYS_DISCORD_WEBHOOK_URL;
  await fetch(url!, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      content: `Pizza ordered for device ${deviceId} from zip ${zip} scheduled for ${time}, based on ${action} from geofence ${geofence}`,
    }),
  });
}

type Mapping = {
  zip: string;
  distanceToTravel: number;
};
function resolvePizzaLocationAndDetails(detail: GeofenceType): {
  zip: string;
  time: string;
} {
  const mappings: { [k: string]: Mapping } = {
    arlington: {
      zip: "68064",
      distanceToTravel: 14.2,
    },
    home: {
      zip: "68104",
      distanceToTravel: 40,
    },
  };
  const fenceId = detail.GeofenceId.toLowerCase();
  const locationSettings = mappings[fenceId];

  if (!locationSettings) {
    console.warn(
      "Could not resolve pizza locations, just using defaults from env",
    );
    const { CASEYS_ZIP, CASEYS_TIME } = process.env;
    return { zip: CASEYS_ZIP!, time: CASEYS_TIME! };
  }

  const time = getCheckoutTime(
    locationSettings.distanceToTravel,
    detail.SampleTime,
  );

  return { zip: locationSettings.zip, time };
}

async function uploadVideo(video: string) {
  const key = basename(video);
  console.log(`ready to save file ${video} as name ${key}`)

  try {
    const Body = await readFile(video);
    const client = new S3Client();
    const upload = new PutObjectCommand({
      Bucket: 'spot-caseys-pizza',
      Body,
      Key: key
    });
    const result = await client.send(upload);
    console.log('Sent video');
    console.log(result)
  } catch (e) {
    console.error('could not send video');
    console.error(e);

  }
}

