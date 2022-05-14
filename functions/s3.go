package spot

import (
	"context"
	"fmt"
	"log"
	"sort"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

var spotTrackerBucketName = "spot-tracker-courses"

func GetFilesInBucket(config aws.Config) []types.Object {
	c := s3.NewFromConfig(config)
	obj, err := c.ListObjectsV2(context.Background(), &s3.ListObjectsV2Input{
		Bucket: aws.String(spotTrackerBucketName),
	})
	if err != nil {
		log.Fatal(err)
	}
	for _, c := range obj.Contents {
		fmt.Println(*c.Key, c.LastModified)
	}
	sort.Slice(obj.Contents, func(i, j int) bool {
		return obj.Contents[i].LastModified.After(*obj.Contents[j].LastModified)
	})
	return obj.Contents
}
func DownloadFile(key string, config aws.Config) []byte {
	c := s3.NewFromConfig(config)
	d := manager.NewDownloader(c)
	buffer := manager.NewWriteAtBuffer([]byte{})
	_, err := d.Download(context.Background(), buffer, &s3.GetObjectInput{
		Bucket: aws.String(spotTrackerBucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		log.Fatal(err)
	}
	return buffer.Bytes()
}
