package spot

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/location"
	"github.com/aws/aws-sdk-go-v2/service/location/types"
)

func GetTrackerPositionHistory(cfg aws.Config) ([]types.DevicePosition, error) {
	client := location.NewFromConfig(cfg)
	his, err := client.GetDevicePositionHistory(context.Background(), &location.GetDevicePositionHistoryInput{
		TrackerName: aws.String("spot-tracker-tracker"),
		DeviceId:    aws.String("foobar"),
	})
	if err != nil {
		return nil, err
	}
	fmt.Println(len(his.DevicePositions))
	return his.DevicePositions, nil
}

func UpdatePosition(cfg aws.Config, lon, lat float64, time time.Time) error {
	client := location.NewFromConfig(cfg)
	positionInput := &location.BatchUpdateDevicePositionInput{
		TrackerName: aws.String("spot-tracker-tracker"),
		Updates: []types.DevicePositionUpdate{{
			DeviceId:   aws.String("foobar"),
			SampleTime: aws.Time(time),
			Position:   []float64{lon, lat},
		}},
	}
	output, err := client.BatchUpdateDevicePosition(context.Background(), positionInput)
	if err != nil {
		log.Fatal(err)
	}
	if len(output.Errors) > 0 {
		return errors.New(fmt.Sprint(output.Errors))
	}

	return nil
}
