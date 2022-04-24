package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	spot "github.com/mattdsteele/query-spot"
)

func main() {
	cfg, _ := config.LoadDefaultConfig(context.Background())
	hist, _ := spot.GetTrackerPositionHistory(cfg)
	for _, i := range hist {
		fmt.Printf("%s %f %f\n", i.SampleTime.Format(time.RFC3339), i.Position[0], i.Position[1])
	}
}
