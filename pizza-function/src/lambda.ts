import { APIGatewayProxyResult, EventBridgeEvent, Handler } from "aws-lambda";
import { chromium } from "playwright";
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
  const { CASEYS_ZIP, CASEYS_TIME } = process.env;
  await main(
    { time: CASEYS_TIME!, zip: CASEYS_ZIP! },
    {
      args,
      headless: true
    },
  );
  return {
    statusCode: 200,
    body: JSON.stringify(event, null, 2),
  };
};

function shouldTriggerEvent(detail: GeofenceType) {
  const eventActionToTrigger = "EXIT";
  const geofenceToTrigger = "home";

  return (
    detail.EventType === eventActionToTrigger &&
    detail.GeofenceId === geofenceToTrigger
  );
}
