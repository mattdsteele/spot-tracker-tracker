package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
	"github.com/tormoder/fit"
)

func main() {
	lambda.Start(func(ctx context.Context) (events.LambdaFunctionURLResponse, error) {
		config, _ := config.LoadDefaultConfig(ctx)
		files := spot.GetFilesInBucket(config)
		latestFile := files[0]
		fileContents := spot.DownloadFile(*latestFile.Key, config)
		fitFile := spot.ParseFitData(bytes.NewReader(fileContents))
		course := toCourse(fitFile)
		j, err := json.Marshal(course)
		var body string
		if err != nil {
			body = err.Error()
		} else {
			body = string(j)
		}
		return events.LambdaFunctionURLResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: body,
		}, nil
	})

}

func toCourse(fitFile *fit.File) (course spot.Course) {
	c, err := fitFile.Course()
	if err != nil {
		log.Fatal(err)
	}
	course.Name = c.Course.Name
	points := make([]spot.Point, 0)
	for _, p := range c.Records {
		points = append(points, spot.Point{
			Latitude:  p.PositionLat.Degrees(),
			Longitude: p.PositionLong.Degrees(),
		})
	}
	course.Route = points
	pointsOfInterest := make([]spot.PointOfInterest, 0)
	for _, p := range c.CoursePoints {
		pointsOfInterest = append(pointsOfInterest, spot.PointOfInterest{
			Latitude:  p.PositionLat.Degrees(),
			Longitude: p.PositionLong.Degrees(),
			Name:      p.Name,
		})
	}
	course.CoursePoints = pointsOfInterest
	return course
}
