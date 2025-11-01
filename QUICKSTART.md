# Quick Start Guide

## Installation

```bash
npm install -g ypsilon-script
```

Or use without installing:
```bash
npx ypsilon-script yourfile.ys
```

## Your First Program

Create `hello.ys`:

```javascript
const int LED = 13;

function void setup() {
    pinMode(LED, OUTPUT);
    print("Hello from Ypsilon Script!");
}

function void loop() {
    digitalWrite(LED, HIGH);
    delay(1000);
    digitalWrite(LED, LOW);
    delay(1000);
}
```

## Compile It

```bash
ysc hello.ys
```

This creates `hello.ino` which you can open in Arduino IDE.

## Upload to Arduino

1. Open Arduino IDE
2. Open the generated `.ino` file
3. Select your board and port
4. Click Upload

## What Just Happened?

Your YS code was transpiled to this C++:

```cpp
#include <Arduino.h>

const int LED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  Serial.println("Hello from Ypsilon Script!");
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(1000);
  digitalWrite(LED, LOW);
  delay(1000);
}
```

## Key Features

### Strictly Typed
- All variables must declare their type
- All functions must declare return type and parameter types
- Catch type errors at compile time

### Object-Oriented
- Full class support with constructors, properties, and methods
- Create reusable components with clean encapsulation
- Use objects to organize your code better

### Brace-Based Syntax
- Modern C-style blocks with `{` and `}`
- Familiar to C, C++, Java, and JavaScript developers
- Use `and`, `or`, `not` instead of `&&`, `||`, `!`

### Auto-Generated Boilerplate
- Includes added automatically
- `Serial.begin()` added when using `print()`
- Proper C++ class structure generated

### Built-in Functions
All Arduino functions work as expected:
- `pinMode(pin, mode)`
- `digitalWrite(pin, value)`
- `digitalRead(pin)`
- `analogRead(pin)`
- `analogWrite(pin, value)`
- `delay(ms)`
- `millis()`
- `print(message)`

## Common Patterns

### Button Input

```javascript
const int BUTTON = 2;
const int LED = 13;

function void setup() {
    pinMode(BUTTON, INPUT_PULLUP);
    pinMode(LED, OUTPUT);
}

function void loop() {
    if (digitalRead(BUTTON) == LOW) {
        digitalWrite(LED, HIGH);
    } else {
        digitalWrite(LED, LOW);
    }
}
```

### Analog Sensor

```javascript
const int SENSOR = 0;
const int THRESHOLD = 512;

function void loop() {
    int value = analogRead(SENSOR);
    if (value > THRESHOLD) {
        print("Threshold exceeded!");
    }
    delay(100);
}
```

### Custom Function

```javascript
function void blink_times(int pin, int times, int duration) {
    for (int i = 0; i < times; i = i + 1) {
        digitalWrite(pin, HIGH);
        delay(duration);
        digitalWrite(pin, LOW);
        delay(duration);
    }
}

function void loop() {
    blink_times(13, 3, 500);
    delay(2000);
}
```

### Using Classes (OOP)

```javascript
class LED {
    int pin;
    
    constructor(int ledPin) {
        this.pin = ledPin;
        pinMode(this.pin, OUTPUT);
    }
    
    void turnOn() {
        digitalWrite(this.pin, HIGH);
    }
    
    void turnOff() {
        digitalWrite(this.pin, LOW);
    }
    
    void blink(int duration) {
        this.turnOn();
        delay(duration);
        this.turnOff();
        delay(duration);
    }
}

LED statusLED;

function void setup() {
    statusLED = new LED(13);
}

function void loop() {
    statusLED.blink(1000);
}
```

### Advanced OOP Example

```javascript
class Sensor {
    int pin;
    int threshold;
    
    constructor(int sensorPin, int thresholdValue) {
        this.pin = sensorPin;
        this.threshold = thresholdValue;
    }
    
    int read() {
        return analogRead(this.pin);
    }
    
    bool isActive() {
        return this.read() > this.threshold;
    }
}

class Indicator {
    int pin;
    
    constructor(int ledPin) {
        this.pin = ledPin;
        pinMode(this.pin, OUTPUT);
    }
    
    void show(bool active) {
        digitalWrite(this.pin, active ? HIGH : LOW);
    }
}

const int SENSOR_PIN = 0;
const int LED_PIN = 13;
const int THRESHOLD = 512;

Sensor sensor;
Indicator led;

function void setup() {
    sensor = new Sensor(SENSOR_PIN, THRESHOLD);
    led = new Indicator(LED_PIN);
}

function void loop() {
    led.show(sensor.isActive());
    delay(100);
}
```

## Next Steps

1. Check out the [examples](examples/) directory
2. Read the [Language Reference](LANGUAGE_REFERENCE.md)
3. Join the community and [contribute](CONTRIBUTING.md)

## Tips

1. **Use Types**: Explicit types help catch errors early
2. **Use Classes**: Encapsulate related data and behavior
3. **Use Constants**: Define pin numbers and config values as constants
4. **Name Things Well**: Use descriptive names like `LED_PIN` not `x`
5. **Test Incrementally**: Compile often to catch errors early
6. **Add Comments**: Use `#` for comments to explain your logic

## Help

- Read the full [README](README.md)
- Check [Language Reference](LANGUAGE_REFERENCE.md)
- Report issues on GitHub
- Contribute improvements

Happy coding! 🚀
