package spot

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/aws/aws-sdk-go-v2/aws"
)

func SaveSubscription(config aws.Config, subscription webpush.Subscription) error {
	sub, _ := json.Marshal(subscription)
	return saveSubscriptionInDb(config, string(sub))
}

func SendPushNotifications(config aws.Config, fenceTransition *GeofenceTransitionEvent) int {
	notifications := 0
	subs, _ := GetSubscriptions(config)
	content := notificationPayload(fenceTransition)
	for _, sub := range subs {
		resp, err := SendNotification(config, sub, []byte(content))
		if err != nil {
			fmt.Printf("failed to send notification to %s due to %s\n", sub.Endpoint, err.Error())
		}
		notifications++
		defer resp.Body.Close()
	}
	return notifications
}

func SendNotification(config aws.Config, sub webpush.Subscription, message []byte) (*http.Response, error) {
	publicKey := os.Getenv("SPOT_VAPID_PUBLIC_KEY")
	privateKey := os.Getenv("SPOT_VAPID_PRIVATE_KEY")
	resp, err := webpush.SendNotification(message, &sub, &webpush.Options{
		Subscriber:      "matt@steele.blue",
		VAPIDPublicKey:  publicKey,
		VAPIDPrivateKey: privateKey,
		TTL:             30,
	})
	return resp, err
}

func notificationPayload(fenceTransition *GeofenceTransitionEvent) string {
	var action string
	if fenceTransition.EventType == "EXIT" {
		action = "exited"
	} else {
		action = "entered"
	}
	return "Matt just " + action + " stop " + fenceTransition.Geofence + "!"
}
