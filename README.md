# Ypsilon Script (YS)

A lightweight, high-level language for microcontrollers that makes Arduino development easier and more enjoyable.

## Overview

Ypsilon Script (YS) is designed to make Arduino development accessible and clean. It provides a modern, Python/JavaScript-inspired syntax that compiles directly to Arduino C++. Write readable code, compile to fast AVR C++, and upload normally with the Arduino IDE.

## Features

- **Clean, Modern Syntax**: Python/JavaScript-inspired syntax without the verbosity of C++
- **Auto-Generated Setup & Loop**: Focus on your logic, not boilerplate
- **Built-in Arduino Functions**: Simple access to pins, sensors, and timing
- **Direct Arduino Compilation**: Compiles to standard Arduino C++ code
- **No Performance Overhead**: Generates efficient C++ code
- **Easy to Learn**: Intuitive syntax for beginners and experts alike

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

```python
# Classic Arduino Blink Example
const LED_PIN = 13

function setup():
    pinMode(LED_PIN, OUTPUT)

function loop():
    digitalWrite(LED_PIN, HIGH)
    delay(1000)
    digitalWrite(LED_PIN, LOW)
    delay(1000)
```

Compile to Arduino C++:

```bash
ysc blink.ys
```

This generates `blink.ino` which you can open in the Arduino IDE and upload to your board.

## Language Features

### Variables

```python
# Variable declaration
var sensorValue = 0
const LED_PIN = 13
```

### Functions

```python
function blink_led(pin, duration):
    digitalWrite(pin, HIGH)
    delay(duration)
    digitalWrite(pin, LOW)
    delay(duration)
```

### Control Flow

**If Statements:**
```python
if sensorValue > 512:
    digitalWrite(LED_PIN, HIGH)
else:
    digitalWrite(LED_PIN, LOW)
```

**While Loops:**
```python
while digitalRead(BUTTON_PIN) == HIGH:
    delay(10)
```

**For Loops:**
```python
# Range-based iteration
for i in range(10):
    print(i)

# With start and end
for i in range(0, 256, 5):
    analogWrite(LED_PIN, i)
    delay(30)
```

### Built-in Functions

Ypsilon Script includes all standard Arduino functions:

- **Pin Control**: `pinMode()`, `digitalWrite()`, `digitalRead()`
- **Analog I/O**: `analogRead()`, `analogWrite()`
- **Timing**: `delay()`, `millis()`
- **Serial**: `print()` (maps to `Serial.println()`)
- **Constants**: `HIGH`, `LOW`, `INPUT`, `OUTPUT`, `INPUT_PULLUP`

### Comments

```python
# Single-line comments start with #
```

## Examples

### Button Input

```python
const BUTTON_PIN = 2
const LED_PIN = 13

function setup():
    pinMode(BUTTON_PIN, INPUT_PULLUP)
    pinMode(LED_PIN, OUTPUT)

function loop():
    var buttonState = digitalRead(BUTTON_PIN)
    
    if buttonState == LOW:
        digitalWrite(LED_PIN, HIGH)
    else:
        digitalWrite(LED_PIN, LOW)
    
    delay(10)
```

### PWM Fade

```python
const LED_PIN = 9

function setup():
    pinMode(LED_PIN, OUTPUT)

function loop():
    # Fade in
    for brightness in range(0, 256, 5):
        analogWrite(LED_PIN, brightness)
        delay(30)
    
    # Fade out
    for brightness in range(255, -1, -5):
        analogWrite(LED_PIN, brightness)
        delay(30)
```

### Sensor Reading

```python
const SENSOR_PIN = 0
const LED_PIN = 13
const THRESHOLD = 512

function setup():
    pinMode(LED_PIN, OUTPUT)

function loop():
    var sensorValue = analogRead(SENSOR_PIN)
    
    if sensorValue > THRESHOLD:
        digitalWrite(LED_PIN, HIGH)
    else:
        digitalWrite(LED_PIN, LOW)
    
    delay(100)
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
2. **Parser**: Builds an Abstract Syntax Tree (AST)
3. **Code Generator**: Transpiles AST to Arduino C++
4. **Output**: Standard `.ino` file ready for Arduino IDE

## Syntax Highlights

- **Indentation-based blocks** (like Python)
- **Colon after control structures**: `if`, `while`, `for`, `function`
- **No semicolons required** (added automatically in generated C++)
- **Simplified operators**: Use `and`, `or`, `not` instead of `&&`, `||`, `!`
- **Auto-generated boilerplate**: `#include <Arduino.h>`, type declarations

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
```python
const LED_PIN = 13
const BUTTON_PIN = 2

function setup():
    pinMode(LED_PIN, OUTPUT)
    pinMode(BUTTON_PIN, INPUT_PULLUP)

function loop():
    var buttonState = digitalRead(BUTTON_PIN)
    if buttonState == LOW:
        digitalWrite(LED_PIN, HIGH)
    else:
        digitalWrite(LED_PIN, LOW)
    delay(10)
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
```

## Project Structure

```
ypsilon-script/
├── bin/
│   └── ysc.js          # CLI tool
├── src/
│   ├── lexer.js        # Tokenizer
│   ├── parser.js       # AST builder
│   ├── codegen.js      # C++ code generator
│   ├── compiler.js     # Main compiler
│   └── index.js        # Package entry point
├── examples/
│   ├── blink.ys        # LED blink example
│   ├── button.ys       # Button input example
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
