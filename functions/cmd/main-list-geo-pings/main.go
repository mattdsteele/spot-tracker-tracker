package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	cfg, _ := config.LoadDefaultConfig(context.Background())
	positions, err := spot.GetTrackerPositionHistory(cfg, 30)
	for _, i := range positions {
		fmt.Printf("%s %f %f\n", i.SampleTime.Format(time.RFC3339), i.Position[0], i.Position[1])
	}
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(len(positions))
	devices := spot.ListDevices(cfg)
	fmt.Println(len(devices))
	for _, i := range devices {
		fmt.Println(*i.DeviceId)
		fmt.Println(i.Position)
		fmt.Println(i.SampleTime.Format(time.RFC3339))
	}
}
