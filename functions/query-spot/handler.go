package spot

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dynamoTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
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

func SaveLatestTimestap(ctx context.Context) error {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatal(err)
	}
	client := dynamodb.NewFromConfig(cfg)
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]dynamoTypes.WriteRequest{
			"spot-tracker-latest-ping": {
				{
					PutRequest: &dynamoTypes.PutRequest{
						Item: map[string]dynamoTypes.AttributeValue{
							"id":    &dynamoTypes.AttributeValueMemberS{Value: "latest-entry"},
							"value": &dynamoTypes.AttributeValueMemberN{Value: fmt.Sprint(time.Now().Unix())},
						},
					},
				},
			},
		},
	}
	res, err := client.BatchWriteItem(ctx, input)
	if err != nil {
		return err
	}
	if len(res.UnprocessedItems) > 0 {
		fmt.Println(res.UnprocessedItems)
	}
	return nil
}

type I struct {
	Id    string
	Value int64
}

func GetLatestTimestamp(ctx context.Context) (*time.Time, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}
	client := dynamodb.NewFromConfig(cfg)
	item, err := client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String("spot-tracker-latest-ping"),
		Key: map[string]dynamoTypes.AttributeValue{
			"id": &dynamoTypes.AttributeValueMemberS{Value: "latest-entry"},
		},
	})
	if err != nil {
		return nil, err
	}
	i := I{}
	err = attributevalue.UnmarshalMap(item.Item, &i)
	if err != nil {
		return nil, err
	}
	t := time.Unix(i.Value, 0)
	return &t, nil
}
