package spot

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"reflect"
	"runtime"
	"testing"
)

func TestParseSuccess(t *testing.T) {
	data, err := ioutil.ReadFile("example.json")
	if err != nil {
		t.Fatal(err)
	}
	wrapper := Wrapper{}
	err = json.Unmarshal(data, &wrapper)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(wrapper)
	if wrapper.Response.Errors != nil {
		t.Fatal("errors is not nil")
	}
	Equals(t, 3, len(wrapper.Response.FeedMessageResponse.MessageWrapper.Messages))
}
func TestParseError(t *testing.T) {
	data, err := ioutil.ReadFile("error.json")
	if err != nil {
		t.Fatal(err)
	}
	wrapper := Wrapper{}
	err = json.Unmarshal(data, &wrapper)
	if err != nil {
		t.Fatal(err)
	}
	if wrapper.Response.FeedMessageResponse != nil {
		t.Fatal("response is not nil")
	}
	t.Log(wrapper)
	Equals(t, "No Messages to display", wrapper.Response.Errors.Error.Text)
}

// equals fails the test if exp is not equal to act.
func Equals(tb testing.TB, exp, act interface{}) {
	if !reflect.DeepEqual(exp, act) {
		_, file, line, _ := runtime.Caller(1)
		fmt.Printf("\033[31m%s:%d:\n\n\texp: %#v\n\n\tgot: %#v\033[39m\n\n", filepath.Base(file), line, exp, act)
		tb.FailNow()
	}
}
