package main

import (
	"context"
	"fmt"
	"log"
	"time"

	spot "github.com/mattdsteele/query-spot"
)

func main() {
	// spot.Handler(context.Background())
	err := spot.SaveLatestTimestap(context.Background())
	res, err := spot.GetLatestTimestamp(context.Background())
	fmt.Println(res.Format(time.RFC3339))
	if err != nil {
		log.Fatal(err)
	}

	// feedId := os.Getenv("SPOT_FEED_ID")
	// feedPw := os.Getenv("SPOT_FEED_PW")
	// positions, err := spot.GetPositions(context.Background(), feedId, feedPw)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// fmt.Println(positions)
}
