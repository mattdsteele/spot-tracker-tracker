package spot

import (
	"bytes"
	"log"

	"github.com/tormoder/fit"
)

func ParseFitData(reader *bytes.Reader) *fit.File {
	f, err := fit.Decode(reader)
	if err != nil {
		log.Fatal(err)
	}
	return f
}
