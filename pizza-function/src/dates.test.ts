import { test, expect } from "vitest";
import { getCheckoutTime } from "./dates";

test("validates functionality", () => {
  expect(1).toBe(1);
});

test("checkout time testing", () => {
  const eventTime = "2023-08-20T16:38:53Z";
  const distance = 14.2;
  const orderTime = getCheckoutTime(distance, eventTime);
  expect(orderTime).toEqual("12:30 PM");
});

test("additional checkout times", () => {
  const distance = 14.2;

  expect(getCheckoutTime(distance, "2023-08-20T16:39:53Z")).toEqual("12:45 PM");
  expect(getCheckoutTime(distance, "2023-08-20T15:39:53Z")).toEqual("11:45 AM");
  expect(getCheckoutTime(distance, "2023-08-20T03:39:53Z")).toEqual("11:45 PM");
  expect(getCheckoutTime(distance, "2023-08-20T03:55:53Z")).toEqual("12:00 AM");
});
