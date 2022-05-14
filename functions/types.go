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

type FenceTransitionDetails struct {
	EventType string    `json:"eventType"`
	Geofence  string    `json:"geofence"`
	DeviceId  string    `json:"deviceId"`
	EventTime string    `json:"eventTime"`
	Location  []float64 `json:"location"`
}

type Course struct {
	Name         string            `json:"name"`
	Route        []Point           `json:"route"`
	CoursePoints []PointOfInterest `json:"pointsOfInterest"`
}
type Point struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
type PointOfInterest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Name      string  `json:"name"`
}
