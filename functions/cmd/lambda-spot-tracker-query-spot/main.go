package main

import (
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/mattdsteele/spot"
)

func main() {
	lambda.Start(spot.NewGeofencePositions)
}
