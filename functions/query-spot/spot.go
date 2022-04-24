package spot

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
)

func GetPositions(ctx context.Context, feedId, password string) ([]Message, error) {
	client := http.Client{}
	url := "https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/" + feedId + "/message.json?feedPassword=" + password
	res, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	if res.Body != nil {
		defer res.Body.Close()
	}
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	wrapper := Wrapper{}
	json.Unmarshal(body, &wrapper)
	if wrapper.Response.Errors != nil {
		return nil, errors.New(wrapper.Response.Errors.Error.Description)
	}
	return wrapper.Response.FeedMessageResponse.MessageWrapper.Messages, nil
}
