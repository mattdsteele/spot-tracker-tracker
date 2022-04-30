package spot

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func SaveLatestTimestap(config aws.Config, timestamp time.Time) error {
	client := dynamodb.NewFromConfig(config)
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			"spot-tracker-latest-ping": {
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
		TableName: aws.String("spot-tracker-latest-ping"),
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
