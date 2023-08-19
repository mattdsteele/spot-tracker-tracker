import { APIGatewayProxyResult, EventBridgeEvent, Handler } from "aws-lambda";
import { addMinutes, isBefore, startOfHour } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { main } from "./caseys-playwright";

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
    console.log('Did not match pizza criteria, returning')
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Did not trigger event" }),
    };
  }
  const { zip, time } = resolvePizzaLocationAndDetails(detail);
  await main(
    { time, zip },
    {
      args,
      headless: true
    },
  );

  await sendDiscordAnnouncement(event.detail.DeviceId, time, zip, event.detail.GeofenceId, event.detail.EventType);

  return {
    statusCode: 200,
    body: JSON.stringify(event, null, 2),
  };
};

function shouldTriggerEvent(detail: GeofenceType) {
  const supportedAction = "EXIT";
  const supportedFences = ['arlington', 'home'];

  return (
    detail.EventType === supportedAction &&
    supportedFences.includes(detail.GeofenceId.toLowerCase())
  );
}
async function sendDiscordAnnouncement(deviceId: string, time: string, zip: string, geofence: string, action: string) {
  const url = process.env.CASEYS_DISCORD_WEBHOOK_URL;
  await fetch(url!, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      content: `Pizza ordered for device ${deviceId} from zip ${zip} scheduled for ${time}, based on ${action} from geofence ${geofence}`
    })
  });
}

function resolvePizzaLocationAndDetails(detail: GeofenceType): { zip: string; time: string; } {
  type Mapping = {
    zip: string;
    distanceToTravel: number;
  }
  const mappings: { [k: string]: Mapping } = {
    arlington: {
      zip: '68064',
      distanceToTravel: 14.2
    },
    home: {
      zip: '68104',
      distanceToTravel: 1
    }
  }
  const fenceId = detail.GeofenceId.toLowerCase();
  const locationSettings = mappings[fenceId];

  if (!locationSettings) {
    console.warn("Could not resolve pizza locations, just using defaults from env");
    const { CASEYS_ZIP, CASEYS_TIME } = process.env;
    return { zip: CASEYS_ZIP!, time: CASEYS_TIME! };
  }

  const travelSpeed = 11;
  const minutesToTravelDistance = Math.round((locationSettings.distanceToTravel / travelSpeed) * 60);
  const eventTime = new Date(detail.SampleTime);
  const exactPickupTime = addMinutes(eventTime, minutesToTravelDistance);
  console.log('exact pickup time', exactPickupTime);
  const topOfHour = startOfHour(exactPickupTime);
  let pickupTime = topOfHour;
  let challenge = addMinutes(topOfHour, 15);
  while (isBefore(challenge, exactPickupTime)) {
    pickupTime = challenge;
    challenge = addMinutes(pickupTime, 15);
  }
  console.log('found actual time ', pickupTime);
  const time = formatInTimeZone(pickupTime, 'America/Chicago', 'hh:mm bb')
  console.log('time found: ', time);

  return { zip: locationSettings.zip, time };
}

