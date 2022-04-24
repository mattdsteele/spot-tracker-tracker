package main

import (
	"context"

	spot "github.com/mattdsteele/query-spot"
)

func main() {
	spot.NewGeofencePositions(context.Background())
}
