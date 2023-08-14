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

func resolveNextToken(token *string) *string {
	if token != nil {
		awsToken := aws.String(*token)
		return awsToken
	}
	return nil
}
func GetTrackerPositionHistory(cfg aws.Config, daysBack int) ([]types.DevicePosition, error) {
	client := location.NewFromConfig(cfg)
	allResultsFound := false
	var nextToken *string
	now := time.Now().AddDate(0, 0, -daysBack)
	positions := make([]types.DevicePosition, 0)
	for !allResultsFound {
		x := &location.GetDevicePositionHistoryInput{
			TrackerName:        aws.String(TrackerName),
			StartTimeInclusive: aws.Time(now),
			DeviceId:           aws.String(DeviceId),
			NextToken:          resolveNextToken(nextToken),
		}

		his, err := client.GetDevicePositionHistory(context.Background(), x)
		if err != nil {
			return nil, err
		}
		if his.NextToken == nil {
			allResultsFound = true
		}
		nextToken = his.NextToken
		positions = append(positions, his.DevicePositions...)
	}
	return positions, nil
}

func UpdatePosition(cfg aws.Config, lon, lat float64, sampleTime time.Time) error {
	return UpdatePositionWithDeviceId(cfg, lon, lat, sampleTime, DeviceId)
}

func UpdatePositionWithDeviceId(cfg aws.Config, lon, lat float64, sampleTime time.Time, deviceId string) error {
	client := location.NewFromConfig(cfg)
	positionInput := &location.BatchUpdateDevicePositionInput{
		TrackerName: aws.String(TrackerName),
		Updates: []types.DevicePositionUpdate{{
			DeviceId:   aws.String(deviceId),
			SampleTime: aws.Time(sampleTime),
			Position:   []float64{lon, lat},
		}},
	}
	output, err := client.BatchUpdateDevicePosition(context.Background(), positionInput)
	if err != nil {
		fmt.Println(err)
		log.Fatal(err)
	}
	if len(output.Errors) > 0 {
		fmt.Println("Output included error!")
		for _, err := range output.Errors {
			fmt.Println((err.DeviceId))
			fmt.Println(err.Error.Code)
			fmt.Println(err.Error.Message)
		}
		return errors.New(fmt.Sprint(output.Errors))
	}
	fmt.Printf("Saved position %f,%f at %s\n", lon, lat, sampleTime.Format(time.RFC3339))

	return nil
}
func DeletePositions(cfg aws.Config) error {
	client := location.NewFromConfig(cfg)
	deleteRequest := &location.BatchDeleteDevicePositionHistoryInput{
		DeviceIds:   aws.ToStringSlice([]*string{&DeviceId}),
		TrackerName: aws.String(TrackerName),
	}
	output, err := client.BatchDeleteDevicePositionHistory(context.TODO(), deleteRequest)
	if err != nil {
		fmt.Println(err)
		log.Fatal(err)
	}
	if len(output.Errors) > 0 {
		fmt.Println("Output included error!")
		fmt.Println(output.Errors)
		return errors.New(fmt.Sprint(output.Errors))
	}
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
