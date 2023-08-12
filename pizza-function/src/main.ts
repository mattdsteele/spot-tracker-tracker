import { main } from "./caseys-playwright";

const { CASEYS_ZIP, CASEYS_TIME } = process.env;
main({ time: CASEYS_TIME!, zip: CASEYS_ZIP! }, { headless: false });