package spot

import (
	"context"
	"fmt"
)

func Handler(ctx context.Context) error {
	fmt.Println("Hello world")
	return nil
}
