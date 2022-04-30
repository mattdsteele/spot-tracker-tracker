package spot

type Wrapper struct {
	Response Response `json:"response"`
}
type Response struct {
	Errors              *Errors              `json:"errors,omitempty"`
	FeedMessageResponse *FeedMessageResponse `json:"feedMessageResponse,omitempty"`
}
type FeedMessageResponse struct {
	MessageWrapper MessageWrapper `json:"messages"`
}
type Errors struct {
	Error Error `json:"error"`
}
type Error struct {
	Code        string `json:"code"`
	Text        string `json:"text"`
	Description string `json:"description"`
}

type MessageWrapper struct {
	Messages []Message `json:"message"`
}
type Message struct {
	Id           int     `json:"id"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	DateTime     string  `json:"dateTime"`
	BatteryState string  `json:"batteryState"`
	Altitude     int     `json:"altitude"`
}
