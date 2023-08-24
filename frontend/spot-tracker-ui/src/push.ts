import '@shoelace-style/shoelace/dist/components/dialog/dialog';
import '@shoelace-style/shoelace/dist/components/button/button';
import '@shoelace-style/shoelace/dist/themes/light.css';
import type { SlDialog } from '@shoelace-style/shoelace';

async function handlePush() {
  if (!supportsWebPush()) {
    alert('does not support web push, exiting')
    return;
  }

  await registerSubscription();
}

handlePush();

function supportsWebPush() {
  return 'serviceWorker' in navigator;
}

async function subscribe() {
  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey =
    'BEKeU4siTHQ6_P4VUnmGiGNg9MUacQP4j912U2yN7bl9yVocd-d1No6rzH68xG0I4-g_DfAVOcJT8JR_CIoF8Lc';

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  await saveSubscription(subscription);
  console.log(JSON.stringify(subscription));
}

async function saveSubscription(subscription: PushSubscription) {
    const pushUrl = 'https://anuzig3fjs6osnz3zgsai2asa40nmcvo.lambda-url.us-east-2.on.aws/';
    const response = await fetch(pushUrl, {
        method: 'post',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(subscription)
    })
    console.log(response.status);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function registerSubscription() {
  navigator.serviceWorker.register('service-worker.js');
  const registration = await navigator.serviceWorker.ready;



  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.getSubscription();
  } catch (e) {
    // If we think it's Safari but doesn't have push manager, show specific instructions
    const ua = navigator.userAgent;
    if (ua.includes('iPhone') || ua.includes('iPad')) {
      const bell = document.querySelector('.notifications');
      bell.classList.toggle('hidden');
      bell.addEventListener('click', () => {
        const dialog: SlDialog = document.querySelector('.ios-notify-steps');
        dialog.show();
      });
      return;
    }
  }
  if (!subscription) {
    const bell = document.querySelector('.notifications');
    bell.classList.toggle('hidden');
    bell.addEventListener('click', () => {
      const dialog: SlDialog = document.querySelector('.notify-dialog');
      dialog.show();
      dialog.querySelector('sl-button').addEventListener('click', async () => {
        await subscribe();
        await dialog.hide();
        bell.classList.toggle('hidden');
      })
    });
  } else {
    console.log('already have a subscription');

    console.log(
      JSON.stringify({
        subscription: subscription,
      }),
    );
  }
}
