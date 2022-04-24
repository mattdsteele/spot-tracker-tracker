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
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func SaveLatestTimestap(ctx context.Context) error {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatal(err)
	}
	client := dynamodb.NewFromConfig(cfg)
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			"spot-tracker-latest-ping": {
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"id":    &types.AttributeValueMemberS{Value: "latest-entry"},
							"value": &types.AttributeValueMemberN{Value: fmt.Sprint(time.Now().Unix())},
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
