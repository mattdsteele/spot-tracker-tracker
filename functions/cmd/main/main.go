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
	hist, err := spot.GetTrackerPositionHistory(cfg, 30)
	if err != nil {
		log.Fatal(err)
	}
	for _, i := range hist {
		fmt.Printf("%s %f %f\n", i.SampleTime.Format(time.RFC3339), i.Position[0], i.Position[1])
	}
	fmt.Println(len(hist))
}
