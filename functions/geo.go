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

var TrackerName string = "spot-tracker-tracker"
var FenceSetName string = "spot-tracker-tracker"
var DeviceId string = "foobar"

func GetTrackerPositionHistory(cfg aws.Config, daysBack int) ([]types.DevicePosition, error) {
	client := location.NewFromConfig(cfg)
	his, err := client.GetDevicePositionHistory(context.Background(), &location.GetDevicePositionHistoryInput{
		TrackerName:        aws.String(TrackerName),
		StartTimeInclusive: aws.Time(time.Now().AddDate(0, 0, -daysBack)),
		DeviceId:           aws.String(DeviceId),
	})
	if err != nil {
		return nil, err
	}
	return his.DevicePositions, nil
}

func UpdatePosition(cfg aws.Config, lon, lat float64, sampleTime time.Time) error {
	client := location.NewFromConfig(cfg)
	positionInput := &location.BatchUpdateDevicePositionInput{
		TrackerName: aws.String(TrackerName),
		Updates: []types.DevicePositionUpdate{{
			DeviceId:   aws.String(DeviceId),
			SampleTime: aws.Time(sampleTime),
			Position:   []float64{lon, lat},
		}},
	}
	fmt.Println("About to save")
	output, err := client.BatchUpdateDevicePosition(context.Background(), positionInput)
	if err != nil {
		fmt.Println("Save encountered error!")
		fmt.Println(err)
		log.Fatal(err)
	}
	if len(output.Errors) > 0 {
		fmt.Println("Output included error!")
		fmt.Println(output.Errors)
		return errors.New(fmt.Sprint(output.Errors))
	}
	fmt.Printf("Saved position %f,%f at %s\n", lon, lat, sampleTime.Format(time.RFC3339))

	return nil
}
func ListDevices(cfg aws.Config) []types.ListDevicePositionsResponseEntry {
	client := location.NewFromConfig(cfg)
	positions, err := client.ListDevicePositions(context.Background(), &location.ListDevicePositionsInput{
		TrackerName: aws.String(TrackerName),
	})
	if err != nil {
		log.Fatal(err)
	}
	return positions.Entries
}

func ListGeofences(cfg aws.Config) []types.ListGeofenceResponseEntry {
	client := location.NewFromConfig(cfg)
	fences, err := client.ListGeofences(context.Background(), &location.ListGeofencesInput{
		CollectionName: &FenceSetName,
	})
	if err != nil {
		log.Fatal(err)
	}
	return fences.Entries
}
