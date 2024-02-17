import { addMinutes, isBefore, startOfHour } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function getCheckoutTime(distanceToTravel: number, sampleTime: string) {
  const travelSpeed = 13;
  const minutesToTravelDistance = Math.round(
    (distanceToTravel / travelSpeed) * 60,
  );
  const eventTime = new Date(sampleTime);
  const exactPickupTime = addMinutes(eventTime, minutesToTravelDistance);
  // Stryker disable next-line all
  console.log("exact pickup time", exactPickupTime);
  const topOfHour = startOfHour(exactPickupTime);
  let pickupTime = topOfHour;
  let challenge = addMinutes(topOfHour, 15);
  while (isBefore(challenge, exactPickupTime)) {
    pickupTime = challenge;
    challenge = addMinutes(pickupTime, 15);
  }
  // Stryker disable next-line all
  console.log("found actual time ", pickupTime);
  const time = formatInTimeZone(pickupTime, "America/Chicago", "hh:mm aa");
  // Stryker disable next-line all
  console.log("time found: ", time);
  return time;
}
