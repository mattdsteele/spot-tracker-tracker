import webpush from 'web-push';
export async function sendPushEvent(pushSubscription: webpush.PushSubscription, text: string) {
    const publicKey = process.env.SPOT_VAPID_PUBLIC_KEY!;
    const privateKey = process.env.SPOT_VAPID_PRIVATE_KEY!;
    const options: webpush.RequestOptions = {
        vapidDetails: {
            subject: 'mailto:matt@steele.blue',
            privateKey,
            publicKey
        }
    }
    webpush.sendNotification(pushSubscription, text, options)
}