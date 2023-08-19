package spot

import (
	"encoding/json"
	"fmt"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/aws/aws-sdk-go-v2/aws"
)

func SaveSubscription(config aws.Config, subscription webpush.Subscription) error {
	fmt.Println("saved subscription")
	sub, _ := json.Marshal(subscription)
	return saveSubscriptionInDb(config, string(sub))
}
