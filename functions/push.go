package spot

import (
	"encoding/json"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/aws/aws-sdk-go-v2/aws"
)

func SaveSubscription(config aws.Config, subscription webpush.Subscription) error {
	sub, _ := json.Marshal(subscription)
	return saveSubscriptionInDb(config, string(sub))
}

func SendPushNotifications(config aws.Config, fenceTransition *FenceTransitionDetails) int {
	notifications := 0
	publicKey := os.Getenv("SPOT_VAPID_PUBLIC_KEY")
	privateKey := os.Getenv("SPOT_VAPID_PRIVATE_KEY")
	subs, _ := GetSubscriptions(config)
	for _, sub := range subs {
		resp, err := webpush.SendNotification([]byte("Hello from geofence event"), &sub, &webpush.Options{
			Subscriber:      "matt@steele.blue",
			VAPIDPublicKey:  publicKey,
			VAPIDPrivateKey: privateKey,
			TTL:             30,
		})
		if err != nil {
			panic(err)
		}
		notifications++
		defer resp.Body.Close()
	}
	return notifications
}
