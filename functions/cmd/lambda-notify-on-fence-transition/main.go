package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	lambda.Start(func(ctx context.Context, event events.CloudWatchEvent) {
		var d = new(spot.GeofenceTransitionEvent)
		err := json.Unmarshal(event.Detail, d)
		if err != nil {
			log.Fatalln("error ", err)
		}
		cfg, err := config.LoadDefaultConfig(context.Background())
		if err != nil {
			log.Fatal(err)
		}
		if d.DeviceId == "fake-tracker" {
			return
		}
		notifications := spot.SendPushNotifications(cfg, d)
		fmt.Printf("sent %d push notifications\n", notifications)
	})
}
