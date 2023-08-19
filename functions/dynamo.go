package spot

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
)

var LatestPingTable = "spot-tracker-latest-ping"
var FenceEventsTable = "spot-tracker-fence-events"
var SubscriptionTable = "spot-tracker-subscriptions"

func SaveLatestTimestap(config aws.Config, timestamp time.Time) error {
	client := dynamodb.NewFromConfig(config)
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			LatestPingTable: {
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"id":    &types.AttributeValueMemberS{Value: "latest-entry"},
							"value": &types.AttributeValueMemberN{Value: fmt.Sprint(timestamp.Unix())},
						},
					},
				},
			},
		},
	}
	res, err := client.BatchWriteItem(context.Background(), input)
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

func GetLatestTimestamp(config aws.Config) (*time.Time, error) {
	client := dynamodb.NewFromConfig(config)
	item, err := client.GetItem(context.Background(), &dynamodb.GetItemInput{
		TableName: aws.String(LatestPingTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: "latest-entry"},
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

func SaveFenceTransition(config aws.Config, loc *FenceTransitionDetails) error {
	latitude := fmt.Sprint(loc.Location[1])
	longitude := fmt.Sprint(loc.Location[0])
	client := dynamodb.NewFromConfig(config)
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			FenceEventsTable: {
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"uuid":      &types.AttributeValueMemberS{Value: uuid.NewString()},
							"deviceId":  &types.AttributeValueMemberS{Value: loc.DeviceId},
							"eventType": &types.AttributeValueMemberS{Value: loc.EventType},
							"geofence":  &types.AttributeValueMemberS{Value: loc.Geofence},
							"eventTime": &types.AttributeValueMemberS{Value: loc.EventTime},
							"location":  &types.AttributeValueMemberNS{Value: []string{longitude, latitude}},
						},
					},
				},
			},
		},
	}
	res, err := client.BatchWriteItem(context.Background(), input)
	if err != nil {
		return err
	}
	if len(res.UnprocessedItems) > 0 {
		fmt.Println(res.UnprocessedItems)
	}
	return nil
}

func GetFenceTransitions(config aws.Config) ([]FenceTransitionDetails, error) {
	client := dynamodb.NewFromConfig(config)
	results, err := client.Scan(context.Background(), &dynamodb.ScanInput{
		TableName: &FenceEventsTable,
	})
	if err != nil {
		return nil, err
	}
	fmt.Println("Found items: ", results.Count)
	return toFenceTransitionDetails(results.Items)
}

func toFenceTransitionDetails(transitions []map[string]types.AttributeValue) ([]FenceTransitionDetails, error) {
	var dtos []FenceTransitionDetails
	err := attributevalue.UnmarshalListOfMaps(transitions, &dtos)
	if err != nil {
		return nil, err
	}
	return dtos, nil
}

func saveSubscriptionInDb(config aws.Config, subscription string) error {
	client := dynamodb.NewFromConfig(config)
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			SubscriptionTable: {
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"subscription": &types.AttributeValueMemberS{Value: subscription},
						},
					},
				},
			},
		},
	}
	_, err := client.BatchWriteItem(context.Background(), input)
	return err
}

func GetSubscriptions(config aws.Config) ([]webpush.Subscription, error) {
	var subs []webpush.Subscription
	client := dynamodb.NewFromConfig(config)
	results, err := client.Scan(context.Background(), &dynamodb.ScanInput{
		TableName: &SubscriptionTable,
	})
	if err != nil {
		return nil, err
	}

	for _, r := range results.Items {
		s := r["subscription"]
		var sub string
		attributevalue.Unmarshal(s, &sub)

		var subscription webpush.Subscription
		err = json.Unmarshal([]byte(sub), &subscription)
		if err != nil {
			fmt.Println("error unmarshalling")
			fmt.Println(err)
		}
		subs = append(subs, subscription)

	}
	return subs, nil
}
