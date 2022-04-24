package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	spot "github.com/mattdsteele/query-spot"
)

func main() {
	// spot.Handler(context.Background())
	// err := spot.SaveLatestTimestap(context.Background())
	// res, err := spot.GetLatestTimestamp(context.Background())
	// fmt.Println(res.Format(time.RFC3339))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// spot.UpdatePosition(context.Background(), -95.98805, 41.27695)
	his, err := spot.GetPositionHistory(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(len(his))
	for _, h := range his {
		fmt.Printf("%s %s: %f, %f\n", h.SampleTime.Format(time.RFC3339), h.ReceivedTime.Format(time.RFC3339), h.Position[0], h.Position[1])
	}

	feedId := os.Getenv("SPOT_FEED_ID")
	feedPw := os.Getenv("SPOT_FEED_PW")
	positions, err := spot.GetPositions(context.Background(), feedId, feedPw)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(positions)
}
