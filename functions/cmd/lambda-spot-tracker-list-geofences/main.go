package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/location/types"
	"github.com/mattdsteele/spot"
)

type fence struct {
	Geometry  [][][]float64 `json:"geometry"`
	FenceName *string       `json:"fence-name"`
}

func toLocation(e types.ListGeofenceResponseEntry) (f fence) {
	f.FenceName = e.GeofenceId
	f.Geometry = make([][][]float64, 0)
	for _, p := range e.Geometry.Polygon {
		f.Geometry = append(f.Geometry, p)
	}
	return f
}

func main() {
	lambda.Start(func(ctx context.Context) (events.LambdaFunctionURLResponse, error) {
		config, _ := config.LoadDefaultConfig(ctx)
		fencesResponse := spot.ListGeofences(config)
		fences := make([]fence, 0)
		for _, f := range fencesResponse {
			fences = append(fences, toLocation(f))
		}
		j, err := json.Marshal(fences)
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
