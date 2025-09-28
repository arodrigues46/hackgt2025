const int greenButtonPin = 2;
const int yellowButtonPin = 3;
const int redButtonPin = 4;

int greenButtonState = 0;
int yellowButtonState = 0;
int redButtonState = 0;

void setup() {
  Serial.begin(9600);
  pinMode(greenButtonPin, INPUT);
  pinMode(yellowButtonPin, INPUT);
  pinMode(redButtonPin, INPUT);
}

void loop() {
  greenButtonState = digitalRead(greenButtonPin);
  yellowButtonState = digitalRead(yellowButtonPin);
  redButtonState = digitalRead(redButtonPin);

  String json = "{";

  if (greenButtonState == HIGH) {
    json += "\"value\": \"Good\"";
  } else if (yellowButtonState == HIGH) {
    json += "\"value\": \"Fair\"";
  } else if (redButtonState == HIGH) {
    json += "\"value\": \"Poor\"";
  } else {
    json += "\"value\": null";
  }

  json += "}";

  Serial.println(json);
  delay(500);
}
