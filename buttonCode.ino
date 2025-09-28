// constants won't change. They're used here to set pin numbers:
const int greenButtonPin = 2;  // the number of the pushbutton pin
const int yellowButtonPin = 3;
const int redButtonPin = 4;

// variables will change:
int greenButtonState = 0;  // variable for reading the pushbutton status
int yellowButtonState = 0;
int redButtonState = 0;

void setup() {
  Serial.begin(9600);
  // initialize the pushbutton pin as an input:
  pinMode(greenButtonPin, INPUT);
  pinMode(yellowButtonPin, INPUT);
  pinMode(redButtonPin, INPUT);

}

void loop() {
  // read the state of the pushbutton value:
  greenButtonState = digitalRead(greenButtonPin);
  yellowButtonState = digitalRead(yellowButtonPin);
  redButtonState = digitalRead(redButtonPin);

  // check if the pushbutton is pressed. If it is, the buttonState is HIGH:
  if (greenButtonState == HIGH) {
    Serial.println("Good");
    delay(1000);
  } 

  // check if the pushbutton is pressed. If it is, the buttonState is HIGH:
  if (yellowButtonState == HIGH) {
    Serial.println("Fair");
    delay(1000);
  } 

  // check if the pushbutton is pressed. If it is, the buttonState is HIGH:
  if (redButtonState == HIGH) {
    Serial.println("Poor");
    delay(1000);
  }
}
