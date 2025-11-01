# Ypsilon Script Language Reference

## Overview

Ypsilon Script is a strictly-typed, object-oriented language with brace-based syntax that compiles to Arduino C++.

## Type System

All variables and functions must be explicitly typed.

### Built-in Types

- `int` - Integer (16-bit on most Arduino boards)
- `float` - Floating-point number
- `bool` - Boolean (true/false)
- `string` - String type (maps to Arduino String)
- `void` - No return value (for functions only)

## Variables

### Constant Declaration
```javascript
const int LED_PIN = 13;
const float PI = 3.14159;
const bool DEBUG = true;
```

### Variable Declaration (in functions)
```javascript
int sensorValue = 0;
float temperature = 23.5;
bool isActive = false;
```

### Class Instance Declaration
```javascript
LED myLED;
Button btn;
```

## Functions

Functions must specify return type and parameter types.

### Syntax
```javascript
function <returnType> <name>(<type> <param1>, <type> <param2>, ...) {
    # function body
}
```

### Examples
```javascript
function void blink(int pin, int duration) {
    digitalWrite(pin, HIGH);
    delay(duration);
    digitalWrite(pin, LOW);
    delay(duration);
}

function int add(int a, int b) {
    return a + b;
}

function float calculateAverage(int a, int b) {
    return (a + b) / 2.0;
}
```

### Special Functions

#### setup()
Runs once at startup (required)
```javascript
function void setup() {
    pinMode(13, OUTPUT);
}
```

#### loop()
Runs repeatedly (required)
```javascript
function void loop() {
    digitalWrite(13, HIGH);
    delay(1000);
}
```

## Object-Oriented Programming

### Class Declaration

```javascript
class <ClassName> {
    <type> <property1>;
    <type> <property2>;
    
    constructor(<type> <param1>, ...) {
        # initialization code
    }
    
    <returnType> <methodName>(<type> <param>, ...) {
        # method body
    }
}
```

### Example

```javascript
class LED {
    int pin;
    int state;
    
    constructor(int ledPin) {
        this.pin = ledPin;
        this.state = LOW;
        pinMode(this.pin, OUTPUT);
    }
    
    void turnOn() {
        this.state = HIGH;
        digitalWrite(this.pin, HIGH);
    }
    
    void turnOff() {
        this.state = LOW;
        digitalWrite(this.pin, LOW);
    }
    
    int getState() {
        return this.state;
    }
}
```

### Object Instantiation

```javascript
LED myLED;

function void setup() {
    myLED = new LED(13);
    myLED.turnOn();
}
```

### Accessing Members

```javascript
myLED.turnOn();           # Call method
int currentState = myLED.getState();  # Get return value
```

## Control Flow

### If Statement

```javascript
if (<condition>) {
    # code
} else {
    # code
}
```

Example:
```javascript
if (sensorValue > THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);
} else {
    digitalWrite(LED_PIN, LOW);
}
```

### While Loop

```javascript
while (<condition>) {
    # code
}
```

Example:
```javascript
while (digitalRead(BUTTON_PIN) == HIGH) {
    delay(10);
}
```

### For Loop

```javascript
for (<type> <var> = <init>; <condition>; <update>) {
    # code
}
```

Examples:
```javascript
for (int i = 0; i < 10; i = i + 1) {
    print(i);
}

for (int brightness = 0; brightness < 256; brightness = brightness + 5) {
    analogWrite(LED_PIN, brightness);
    delay(30);
}

for (int i = 10; i > 0; i = i - 1) {
    print(i);
}
```

## Operators

### Arithmetic
- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `%` Modulo

### Comparison
- `==` Equal
- `!=` Not equal
- `<` Less than
- `>` Greater than
- `<=` Less than or equal
- `>=` Greater than or equal

### Logical
- `and` Logical AND (compiles to `&&`)
- `or` Logical OR (compiles to `||`)
- `not` Logical NOT (compiles to `!`)

### Assignment
- `=` Assign value

## Arduino Functions

### Pin Control
```javascript
pinMode(pin, mode);          # mode: INPUT, OUTPUT, INPUT_PULLUP
digitalWrite(pin, value);    # value: HIGH, LOW
int value = digitalRead(pin);
```

### Analog I/O
```javascript
int value = analogRead(pin);    # 0-1023
analogWrite(pin, value);        # 0-255 (PWM)
```

### Timing
```javascript
delay(milliseconds);
int time = millis();
```

### Serial Communication
```javascript
print(value);    # Maps to Serial.println()
print("Hello");  # Prints string
```

### Constants
- `HIGH` - Digital high (1)
- `LOW` - Digital low (0)
- `INPUT` - Pin input mode
- `OUTPUT` - Pin output mode
- `INPUT_PULLUP` - Pin input with pullup resistor

## Comments

```javascript
# Single line comment
```

## Complete Example

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
    
    bool isAboveThreshold() {
        return this.read() > this.threshold;
    }
}

class Indicator {
    int ledPin;
    
    constructor(int pin) {
        this.ledPin = pin;
        pinMode(this.ledPin, OUTPUT);
    }
    
    void setState(bool on) {
        if (on) {
            digitalWrite(this.ledPin, HIGH);
        } else {
            digitalWrite(this.ledPin, LOW);
        }
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
    bool active = sensor.isAboveThreshold();
    led.setState(active);
    delay(100);
}
```

## Compilation

YS code is compiled to Arduino C++ (.ino files):

```bash
ysc myprogram.ys        # Creates myprogram.ino
ysc input.ys output.ino # Custom output name
```

The generated `.ino` file can be opened and uploaded with the Arduino IDE.

## Best Practices

1. **Use meaningful type names**: Helps catch errors early
2. **Use classes for reusable components**: Encapsulate related data and behavior
3. **Keep functions small**: One task per function
4. **Add comments**: Explain what your code does
5. **Use const for values that don't change**: Makes intent clear and enables optimizations
6. **Initialize in constructors**: Set up object state properly
7. **Use this for clarity**: Make it clear when accessing class members

## Key Differences from Old Syntax

### Old (Indentation-Based)
```python
const LED_PIN = 13

function setup():
    pinMode(LED_PIN, OUTPUT)

function loop():
    digitalWrite(LED_PIN, HIGH)
    delay(1000)
```

### New (Brace-Based, Typed, OOP)
```javascript
const int LED_PIN = 13;

function void setup() {
    pinMode(LED_PIN, OUTPUT);
}

function void loop() {
    digitalWrite(LED_PIN, HIGH);
    delay(1000);
}
```

### Changes Summary

1. **Types required**: All variables and functions must declare types
2. **Braces instead of indentation**: Use `{}` for blocks
3. **No colons after declarations**: Removed from function/class/control flow
4. **Semicolons required**: End statements with `;`
5. **OOP support**: Classes, constructors, methods
6. **Object instantiation**: Use `new` keyword
7. **Member access**: Use `.` notation
8. **This keyword**: Use `this` for class members

## Future Features

Planned for future versions:
- Arrays and collections
- String operations
- More Arduino libraries (Servo, SoftwareSerial, etc.)
- Static type checking at compile time
- Inheritance and polymorphism
- Interfaces
