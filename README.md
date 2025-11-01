# Ypsilon Script (YS)

A modern, strictly-typed, object-oriented language for microcontrollers that makes Arduino development easier and more enjoyable.

## Overview

Ypsilon Script (YS) is designed to make Arduino development accessible, structured, and type-safe. It provides a modern, OOP-inspired syntax with strict typing that compiles directly to Arduino C++. Write clean, type-safe code with classes and objects, compile to fast AVR C++, and upload normally with the Arduino IDE.

## Features

- **Object-Oriented Programming**: Full class support with constructors, properties, and methods
- **Strict Type System**: All variables and functions must be explicitly typed
- **Brace-Based Syntax**: Modern C-style block syntax with curly braces
- **Built-in Arduino Functions**: Simple access to pins, sensors, and timing
- **Direct Arduino Compilation**: Compiles to standard Arduino C++ code
- **No Performance Overhead**: Generates efficient C++ code
- **Type Safety**: Catch errors at compile time, not runtime

## Installation

```bash
npm install -g ypsilon-script
```

Or clone and link locally:

```bash
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script
npm install
npm link
```

## Quick Start

Create a simple blink program in `blink.ys`:

```javascript
# Classic Arduino Blink Example
const int LED_PIN = 13

function start() {
    pinMode(LED_PIN, OUTPUT)
}

function loop() {
    digitalWrite(LED_PIN, HIGH)
    delay(1000)
    digitalWrite(LED_PIN, LOW)
    delay(1000)
}
```

Compile to Arduino C++:

```bash
ysc blink.ys
```

This generates `blink.ino` which you can open in the Arduino IDE and upload to your board.

## Language Features

### Strict Typing

All variables and functions must be explicitly typed:

```javascript
const int LED_PIN = 13
int sensorValue = 0
float temperature = 23.5
bool isActive = true
```

### Functions with Type Signatures and Inference

Functions can have explicit type signatures or infer return types from return statements:

```javascript
# Explicit return type
function void blink_led(int pin, int duration) {
    digitalWrite(pin, HIGH)
    delay(duration)
    digitalWrite(pin, LOW)
    delay(duration)
}

# Type inference - return type inferred as int
function add(int a, int b) {
    return a + b
}
```

### Optional Semicolons

Semicolons are now optional - write cleaner code without them:

```javascript
const int LED_PIN = 13

function loop() {
    digitalWrite(LED_PIN, HIGH)
    delay(1000)
    digitalWrite(LED_PIN, LOW)
    delay(1000)
}
```

### Object-Oriented Programming

Create classes with properties, constructors, and methods:

```javascript
class LED {
    int pin;
    int state;
    
    constructor(int ledPin) {
        this.pin = ledPin;
        this.state = LOW
        pinMode(this.pin, OUTPUT)
    }
    
    void turnOn() {
        this.state = HIGH
        digitalWrite(this.pin, HIGH)
    }
    
    void turnOff() {
        this.state = LOW
        digitalWrite(this.pin, LOW)
    }
    
    void toggle() {
        if (this.state == HIGH) {
            this.turnOff()
        } else {
            this.turnOn()
        }
    }
}

LED redLED

function start() {
    redLED = new LED(13)
}

function loop() {
    redLED.toggle()
    delay(1000)
}
```

### Control Flow

**If Statements:**
```javascript
if (sensorValue > 512) {
    digitalWrite(LED_PIN, HIGH)
} else {
    digitalWrite(LED_PIN, LOW)
}
```

**While Loops:**
```javascript
while (digitalRead(BUTTON_PIN) == HIGH) {
    delay(10)
}
```

**For Loops:**
```javascript
for (int i = 0; i < 10; i = i + 1) {
    print(i)
}

for (int brightness = 0; brightness < 256; brightness = brightness + 5) {
    analogWrite(LED_PIN, brightness)
    delay(30)
}
```

**Repeat Loops:**
```javascript
# Repeat a block of code N times
repeat(5) {
    digitalWrite(LED_PIN, HIGH)
    delay(100)
    digitalWrite(LED_PIN, LOW)
    delay(100)
}
```

### Built-in Functions

Ypsilon Script includes all standard Arduino functions:

- **Pin Control**: `pinMode()`, `digitalWrite()`, `digitalRead()`
- **Analog I/O**: `analogRead()`, `analogWrite()`
- **Timing**: `delay()`, `millis()`
- **Serial**: `print()` (maps to `Serial.println()`)
- **Constants**: `HIGH`, `LOW`, `INPUT`, `OUTPUT`, `INPUT_PULLUP`

### Comments

```javascript
# Single-line comments start with #
```

## Examples

### Button Input with OOP

```javascript
class Button {
    int pin;
    int lastState;
    
    constructor(int buttonPin) {
        this.pin = buttonPin;
        this.lastState = HIGH;
        pinMode(this.pin, INPUT_PULLUP);
    }
    
    bool isPressed() {
        int currentState = digitalRead(this.pin);
        return currentState == LOW;
    }
}

const int LED_PIN = 13;
Button button;

function void setup() {
    pinMode(LED_PIN, OUTPUT);
    button = new Button(2);
}

function void loop() {
    if (button.isPressed()) {
        digitalWrite(LED_PIN, HIGH);
    } else {
        digitalWrite(LED_PIN, LOW);
    }
    delay(10);
}
```

### PWM Fade

```javascript
const int LED_PIN = 9;

function void setup() {
    pinMode(LED_PIN, OUTPUT);
}

function void loop() {
    # Fade in
    for (int brightness = 0; brightness < 256; brightness = brightness + 5) {
        analogWrite(LED_PIN, brightness);
        delay(30);
    }
    
    # Fade out
    for (int brightness = 255; brightness > 0; brightness = brightness - 5) {
        analogWrite(LED_PIN, brightness);
        delay(30);
    }
}
```

## CLI Usage

```bash
# Compile a YS file to Arduino C++
ysc input.ys

# Specify output file
ysc input.ys output.ino

# View tokens (for debugging)
ysc input.ys --tokens

# View AST (for debugging)
ysc input.ys --ast

# Show help
ysc --help

# Show version
ysc --version
```

## How It Works

1. **Lexer**: Tokenizes YS source code
2. **Parser**: Builds an Abstract Syntax Tree (AST) with type information
3. **Type Checker**: Validates types and structure (future enhancement)
4. **Code Generator**: Transpiles AST to Arduino C++
5. **Output**: Standard `.ino` file ready for Arduino IDE

## Syntax Highlights

- **Brace-based blocks** (like C/C++/Java)
- **Optional semicolons**: Write clean code without semicolons
- **Type inference**: Function return types can be inferred from return statements
- **start() function**: Use `start()` instead of `setup()` (both supported)
- **repeat loop**: Simple syntax for repeating code N times
- **Strict type annotations**: Variables must declare their type
- **OOP support**: Classes, constructors, methods, and object instantiation
- **Logical operators**: Use `and`, `or`, `not` instead of `&&`, `||`, `!`
- **Auto-generated boilerplate**: `#include <Arduino.h>`, proper C++ class structure

## Why Ypsilon Script?

**Before (Arduino C++):**
```cpp
const int LED_PIN = 13;
const int BUTTON_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(10);
}
```

**After (Ypsilon Script):**
```javascript
const int LED_PIN = 13
const int BUTTON_PIN = 2

function start() {
    pinMode(LED_PIN, OUTPUT)
    pinMode(BUTTON_PIN, INPUT_PULLUP)
}

function loop() {
    int buttonState = digitalRead(BUTTON_PIN)
    if (buttonState == LOW) {
        digitalWrite(LED_PIN, HIGH)
    } else {
        digitalWrite(LED_PIN, LOW)
    }
    delay(10)
}
```

With OOP, even cleaner:
```javascript
class LED {
    int pin
    
    constructor(int p) {
        this.pin = p
        pinMode(this.pin, OUTPUT)
    }
    
    void setOn(bool on) {
        digitalWrite(this.pin, on ? HIGH : LOW)
    }
}

class Button {
    int pin
    
    constructor(int p) {
        this.pin = p
        pinMode(this.pin, INPUT_PULLUP)
    }
    
    bool isPressed() {
        return digitalRead(this.pin) == LOW
    }
}

LED led
Button button

function start() {
    led = new LED(13)
    button = new Button(2)
}

function loop() {
    led.setOn(button.isPressed())
    delay(10)
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script

# Install dependencies
npm install

# Run tests
npm test

# Try examples
node bin/ysc.js examples/blink.ys
node bin/ysc.js examples/led_class.ys
```

## Project Structure

```
ypsilon-script/
├── bin/
│   └── ysc.js          # CLI tool
├── src/
│   ├── lexer.js        # Tokenizer with type keywords
│   ├── parser.js       # AST builder with OOP support
│   ├── codegen.js      # C++ code generator
│   ├── compiler.js     # Main compiler
│   └── index.js        # Package entry point
├── examples/
│   ├── blink.ys        # LED blink example
│   ├── button.ys       # Button input example
│   ├── led_class.ys    # OOP LED class example
│   ├── fade.ys         # PWM fade example
│   └── sensor.ys       # Sensor reading example
└── tests/
    └── ...             # Test files
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details

## Author

Youssef Charfi

## Links

- GitHub: https://github.com/ycharfi09/ypsilon-script
- Issues: https://github.com/ycharfi09/ypsilon-script/issues
