package spot

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
)

type MyEvent struct {
	Name string `json:"name"`
}

func NewGeofencePositions(ctx context.Context, event MyEvent) (string, error) {
	feedId := os.Getenv("SPOT_FEED_ID")
	feedPw := os.Getenv("SPOT_FEED_PW")
	positions, err := GetRecentSpotPositions(context.Background(), feedId, feedPw)
	if err != nil {
		log.Fatal(err)
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	latest, err := GetLatestTimestamp(cfg)
	if err != nil {
		log.Fatal(err)
	}
	for _, p := range SortByChronological(positions) {
		st := ParseSpotTime(p.DateTime)
		if st.After(*latest) {
			fmt.Printf("Found a later timestamp, populating %s\n", p.DateTime)
			UpdatePosition(cfg, p.Longitude, p.Latitude, st)
			SaveLatestTimestap(cfg, st)
			latest = &st
		}
	}
	if err != nil {
		log.Fatal(err)
	}
	return "success", nil
}
