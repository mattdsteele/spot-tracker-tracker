package main

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	file := filepath.Join("cmd", "main-fit-explore", "gw-2021.fit")
	f, err := ioutil.ReadFile(file)
	if err != nil {
		log.Fatal(err)
	}
	d := spot.ParseFitData(bytes.NewReader(f))
	fmt.Println(d)
	act, err := d.Course()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(act.Course.Name)
	fmt.Println(len(act.Records))
	fmt.Println(len(act.CoursePoints))
	for _, p := range act.CoursePoints {
		fmt.Println(float32(p.Distance) / 160934) // in centimeters
		fmt.Println(p.Name)
		fmt.Println(p.Timestamp)
		fmt.Println(p.Type.String())
	}

	cfg, _ := config.LoadDefaultConfig(context.Background())
	files := spot.GetFilesInBucket(cfg)
	for _, f := range files {
		fmt.Println(f)
	}
	fileFromS3 := spot.DownloadFile(*files[1].Key, cfg)
	fit := spot.ParseFitData(bytes.NewReader(fileFromS3))
	c, _ := fit.Course()
	fmt.Println(c.Course.Name)
}
