package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/mattdsteele/spot"
)

func main() {
	cfg, _ := config.LoadDefaultConfig(context.Background())
	err := spot.DeletePositions(cfg)
	if err == nil {
		fmt.Println("done")
	} else {
		fmt.Println(err)
		panic(err)
	}
}
