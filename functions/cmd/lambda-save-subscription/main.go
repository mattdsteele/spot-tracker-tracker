package main

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	lambda.Start(func(ctx context.Context, request events.APIGatewayProxyRequest) ([]webpush.Subscription, error) {
		config, _ := config.LoadDefaultConfig(ctx)
		body := request.Body
		var subscription webpush.Subscription
		if err := json.Unmarshal([]byte(body), &subscription); err != nil {
			return nil, errors.New("failed to unmarshall")
		}
		spot.SaveSubscription(config, subscription)
		subs, _ := spot.GetSubscriptions(config)
		return subs, nil
	})
}
