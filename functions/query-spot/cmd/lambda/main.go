package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	spot "github.com/mattdsteele/query-spot"
)

func main() {
	lambda.Start(spot.NewGeofencePositions(context.Background()))
}
