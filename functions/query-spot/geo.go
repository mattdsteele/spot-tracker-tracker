package spot

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/location"
	"github.com/aws/aws-sdk-go-v2/service/location/types"
)

func GetPositionHistory(ctx context.Context) ([]types.DevicePosition, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatal(err)
	}
	client := location.NewFromConfig(cfg)
	his, err := client.GetDevicePositionHistory(ctx, &location.GetDevicePositionHistoryInput{
		TrackerName: aws.String("spot-tracker-tracker"),
		DeviceId:    aws.String("foobar"),
	})
	if err != nil {
		return nil, err
	}
	fmt.Println(len(his.DevicePositions))
	return his.DevicePositions, nil
}

func UpdatePosition(ctx context.Context, lon, lat float64) error {
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
			Position:   []float64{lon, lat},
		}},
	}
	output, err := client.BatchUpdateDevicePosition(ctx, positionInput)
	if err != nil {
		log.Fatal(err)
	}
	if len(output.Errors) > 0 {
		return errors.New(fmt.Sprint(output.Errors))
	}
	return nil
}
