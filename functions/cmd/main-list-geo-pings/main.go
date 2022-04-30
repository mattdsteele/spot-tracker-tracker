package main

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	cfg, _ := config.LoadDefaultConfig(context.Background())
	positions, err := spot.GetTrackerPositionHistory(cfg, 30)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(len(positions))
	devices := spot.ListDevices(cfg)
	fmt.Println(len(devices))
	for _, i := range devices {
		fmt.Println(*i.DeviceId)
		fmt.Println(i.Position)
	}
}
