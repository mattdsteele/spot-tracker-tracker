import { Result, main } from "./caseys-playwright";
import webpush from 'web-push';
import { sendPushEvent } from "./push";

const { CASEYS_ZIP, CASEYS_TIME } = process.env;
const {SPOT_PUSH_MATT_SUB} = process.env;
(async () => {
const sub: webpush.PushSubscription  = JSON.parse(SPOT_PUSH_MATT_SUB!);
try {
const result = await main({ time: CASEYS_TIME!, zip: CASEYS_ZIP!, isSimulation: true }, { headless: false });
if (result.simulation) {
    console.log('was a simulation');
    sendPushEvent(sub, `Test simulation successful`)
} else {
    console.log('you better get that pizza')
}
} catch (e) {
    sendPushEvent(sub, `Failed ${e}`)
}
})();
