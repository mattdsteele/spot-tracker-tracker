package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	fmt.Println("Hello")
	cfg, _ := config.LoadDefaultConfig(context.Background())
	peanut := []float64{41.274247, -95.990457}
	// ww := []float64{40.869963, -96.139978}
	home := []float64{41.276497, -95.988033}

	isAtHome := true
	var lon, lat float64
	if isAtHome {
		lon = home[1]
		lat = home[0]
	} else {
		lon = peanut[1]
		lat = peanut[0]
	}
	sampleTime := time.Now()
	deviceId := "fake-tracker"

	spot.UpdatePositionWithDeviceId(cfg, lon, lat, sampleTime, deviceId)
	fmt.Printf("Updated fake tracker. %d\n", isAtHome)
}
