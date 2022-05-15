package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/location/types"
	"github.com/mattdsteele/spot"
)

type location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Time      string  `json:"time"`
}

func toLocation(p types.DevicePosition) (l location) {
	l.Latitude = p.Position[1]
	l.Longitude = p.Position[0]
	l.Time = p.SampleTime.Format(time.RFC3339)
	return l
}
func main() {
	lambda.Start(func(ctx context.Context) (events.LambdaFunctionURLResponse, error) {
		config, _ := config.LoadDefaultConfig(ctx)
		positions, _ := spot.GetTrackerPositionHistory(config, 2)
		locations := make([]location, 0)
		for _, p := range positions {
			locations = append(locations, toLocation(p))
		}
		j, err := json.Marshal(locations)
		var body string
		if err != nil {
			body = err.Error()
		} else {
			body = string(j)
		}
		return events.LambdaFunctionURLResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: body,
		}, nil
	})
}
