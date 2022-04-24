package spot

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/location"
	"github.com/aws/aws-sdk-go-v2/service/location/types"
)

func Handler(ctx context.Context) error {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatal(err)
	}
	client := location.NewFromConfig(cfg)
	positionInput := &location.BatchUpdateDevicePositionInput{
		TrackerName: aws.String("spot-tracker-tracker"),
		Updates: []types.DevicePositionUpdate{{
			DeviceId:   aws.String("foobar"),
			SampleTime: aws.Time(time.Now()),
			Position:   []float64{-95.98805, 41.27695},
		}},
	}
	output, err := client.BatchUpdateDevicePosition(ctx, positionInput)
	if err != nil {
		log.Fatal(err)
	}
	his, err := client.GetDevicePositionHistory(ctx, &location.GetDevicePositionHistoryInput{
		TrackerName: aws.String("spot-tracker-tracker"),
		DeviceId:    aws.String("foobar"),
	})
	res, err := client.BatchEvaluateGeofences(ctx, &location.BatchEvaluateGeofencesInput{
		CollectionName: aws.String("spot-tracker-tracker"),
		DevicePositionUpdates: []types.DevicePositionUpdate{{
			DeviceId:   aws.String("foobar"),
			SampleTime: aws.Time(time.Now()),
			Position:   []float64{-95.98805, 41.27695},
		}},
	})
	fmt.Println(output, his, res)
	if err != nil {
		log.Fatal(err)
	}
	return nil
}
