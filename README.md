# Ypsilon Script (YS)

A simple high-level language that compiles to C++ for microcontrollers.

## Overview

Ypsilon Script (YS) is designed to make microcontroller development accessible, structured, and type-safe. It provides a modern syntax with strong static typing that compiles directly to C++. Write clean, type-safe code with classes, enums, structs, and pattern matching, then compile to efficient C++ for your microcontroller.

## Features

- **Strong Static Typing**: All variables and functions must be explicitly typed
- **Modern Syntax**: Uses `fn`, `mut`, `self` keywords
- **Hardware Types**: Built-in `Digital`, `Analog`, `PWM` types with auto pinMode detection
- **Unit System**: Time (`ms`, `s`, `us`), frequency (`Hz`), angle (`deg`), distance (`cm`, `m`), speed (`rpm`)
- **Range Constraints**: `mut int value in 0...1023` for automatic bounds enforcement
- **Type Conversion**: `.as<type>()` syntax for explicit type casting
- **Collections**: `List` and `Map` types with standard methods
- **Object-Oriented Programming**: Classes with constructors and methods
- **Enums and Structs**: Rust-style enums and C++-like structs
- **Pattern Matching**: Match expressions like Rust for powerful control flow
- **Event-Driven Programming**: `on start {}`, `on loop {}` blocks
- **Tasks**: Periodic and background task execution
- **Reactive Variables**: Volatile reactive variables with `react`
- **Signals**: Event-driven signal/emit system
- **Time Literals**: `wait 200ms`, `timeout 5s`
- **Error Handling**: `!catch` syntax for error propagation
- **Atomic Blocks**: Interrupt-safe critical sections
- **Library Loading**: `load <Servo>`, `load <module.ys> as m`, `alias LED = 13`
- **Brace-Based Syntax**: Required braces, optional semicolons
- **Direct C++ Compilation**: Compiles to standard C++ code
- **No Performance Overhead**: Generates efficient C++ code

## Installation

**Note:** Ypsilon Script is not available on npm. You must clone the repository and install manually:

```bash
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script
npm install
npm link
```

## Quick Start

Create a simple program in `example.ys`:

```javascript
@main

# Modern Ypsilon Script Example

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

enum Mode { AUTO, MANUAL }

struct Point {
  int x
  int y
}

mut Mode currentMode = AUTO
mut int counter = 0

class Motor {
    mut int speed
    
    constructor(int s) { 
        self.speed = s 
    }
    
    fn run() { 
        print(self.speed) 
    }
}

mut Motor motor = new Motor(100)

on start {
    pinMode(13, OUTPUT)
    motor.run()
}

on loop {
    match currentMode {
        AUTO => digitalWrite(13, HIGH),
        MANUAL => digitalWrite(13, LOW)
    }
    
    wait 1s
}
```

Compile to C++:

```bash
ysc example.ys
```

This generates C++ code ready for your microcontroller.

## Project Structure

### Single File Projects

For simple projects, a single `.ys` file with `@main` and a config block is all you need:

```javascript
// blink.ys
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

const int LED = 13
on start { pinMode(LED, OUTPUT) }
on loop {
    digitalWrite(LED, HIGH)
    delay(1000)
    digitalWrite(LED, LOW)
    delay(1000)
}
```

Compile with:
```bash
ysc blink.ys
```

### Multi-File Projects (Recommended)

For larger projects, organize your code in folders with one main file:

```
my-robot/
  ├── robot.ys         # Main entry point with @main
  ├── motors.ys        # Motor control module (no @main)
  ├── sensors.ys       # Sensor library (no @main)
  └── utils.ys         # Helper functions (no @main)
```

**robot.ys** (main file):
```javascript
@main

load <motors.ys> as motors
load <sensors.ys> as sensors

on start {
    motors.init()
    sensors.init()
}

on loop {
    mut int distance = sensors.readUltrasonic()
    if (distance < 20) {
        motors.stop()
    }
}
```

**motors.ys** (module, no @main):
```javascript
# Motor control library

const int MOTOR_LEFT = 9
const int MOTOR_RIGHT = 10

fn init() {
    pinMode(MOTOR_LEFT, OUTPUT)
    pinMode(MOTOR_RIGHT, OUTPUT)
}

fn stop() {
    digitalWrite(MOTOR_LEFT, LOW)
    digitalWrite(MOTOR_RIGHT, LOW)
}
```

Compile the entire project:
```bash
ysc my-robot/
```

The compiler automatically finds the file with `@main` and compiles it.

### Important Rules for @main

- ✅ **One @main per project**: Exactly one file must have `@main`
- ✅ **Config block required**: Files with `@main` must include a config block with board settings
- ✅ **No main.ys**: The main file cannot be named `main.ys` (use descriptive names like `robot.ys`, `app.ys`)
- ✅ **At the top**: `@main` must be at the top of the file
- ✅ **Modules don't need @main**: Other files become modules/libraries
- ❌ **Multiple @main = Error**: Only one file can have `@main`
- ❌ **No @main = Error**: At least one file must have `@main` (unless using `--skip-main` for module compilation)
- ❌ **Missing config = Error**: `@main` files must have a complete config block

### Module Compilation

To compile a single module file without `@main` (for testing or library development):

```bash
ysc utils.ys --skip-main
```

This will show a warning but allow compilation. The output won't be a runnable program.

## Language Features

### Modern Syntax

All variables must be explicitly typed. Use `mut` for mutable variables:

```javascript
const int LED_PIN = 13
mut int counter = 0
mut float temperature = 23.5
```

**Important:** Every complete YS program must have exactly one file with `@main` at the top. This marks the entry point of your program.

```javascript
@main

# Your code here...
```

The `@main` directive marks which file is the main entry point. Other files in your project become modules.

### Enums (Rust-style)

Define enumerations with variants:

```javascript
enum Mode { AUTO, MANUAL, SLEEP }
enum State { IDLE, RUNNING, PAUSED }

mut Mode currentMode = AUTO
```

### Structs (C++-style)

Define data structures:

```javascript
struct Point {
  int x
  int y
}

struct Config {
  int threshold
  bool enabled
}

mut Point position = Point { x: 0, y: 0 }
```

### Classes with `self`

Create classes with constructors and methods. Use `self` instead of `this`:

```javascript
class Motor {
    mut int speed
    const int maxSpeed
    
    constructor(int s, int max) {
        self.speed = s
        self.maxSpeed = max
    }
    
    fn accelerate(int amount) {
        self.speed = self.speed + amount
        if (self.speed > self.maxSpeed) {
            self.speed = self.maxSpeed
        }
    }
}

mut Motor motor = new Motor(100, 255)
```

### Functions with `fn`

Define functions using the `fn` keyword:

```javascript
fn add(int a, int b) -> int {
    return a + b
}

fn blink(int pin, int duration) {
    digitalWrite(pin, HIGH)
    wait duration
}
```

### Event Blocks

Use `on <event> {}` syntax for event handling:

```javascript
on start {
    pinMode(13, OUTPUT)
    print("System initialized")
}

on loop {
    digitalWrite(13, HIGH)
    wait 1s
    digitalWrite(13, LOW)
    wait 1s
}
```

### Match Expressions (Rust-style)

Pattern matching for control flow:

```javascript
enum Status { OK, ERROR, PENDING }

mut Status status = OK

match status {
    OK => print("All good"),
    ERROR => print("Something wrong"),
    PENDING => print("Waiting")
}
```

### Switch Statements (C++-style)

Traditional switch-case statements with braces:

```javascript
mut int value = 1

switch value {
    case 1 { print("One") }
    case 2 { print("Two") }
    default { print("Other") }
}
```

### Tasks

Periodic and background task execution:

```javascript
task blink every 500ms {
    digitalWrite(13, HIGH)
    wait 250ms
    digitalWrite(13, LOW)
}

task monitor background {
    checkSensors()
    wait 100ms
}
```

### Signals

Event-driven communication:

```javascript
signal buttonPressed

on start {
    emit buttonPressed
}
```

### Time Literals

Intuitive time units:

```javascript
wait 200ms
wait 2s
timeout 5s { connect() }
```

### Atomic Blocks

Interrupt-safe critical sections:

```javascript
atomic {
    criticalValue = criticalValue + 1
}
```

### Library Loading

```javascript
load <Servo>
alias LED = 13
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
for (mut i: int = 0; i < 10; i = i + 1) {
    print(i)
}
```

### Hardware Types

YS provides built-in hardware abstraction types that automatically handle pin mode configuration:

#### Digital Type
```javascript
mut Digital led = new Digital(13)

led.high()        // Sets pin HIGH (auto-configures OUTPUT mode)
led.low()         // Sets pin LOW
led.toggle()      // Toggles pin state
led.isHigh()      // Returns bool (auto-configures INPUT mode)
led.isLow()       // Returns bool
led.read()        // Returns int
led.write(HIGH)   // Writes value
```

#### Analog Type
```javascript
mut Analog sensor = new Analog(0)

mut int value = sensor.read()  // Returns 0-1023 (auto-configures INPUT mode)
```

#### PWM Type
```javascript
mut PWM motor = new PWM(9)

motor.set(128)         // Sets PWM value 0-255 (auto-configures OUTPUT mode)
mut int speed = motor.get()  // Returns current PWM value
```

The PWM type automatically detects your board and uses the appropriate implementation:
- AVR boards (Uno, Nano, Mega): Uses `analogWrite()`
- ESP boards (ESP32, ESP8266): Uses LEDC functions

### Unit System

YS supports unit literals that are automatically converted at compile time:

```javascript
# Time units
wait 500ms      // milliseconds
wait 2s         // seconds
wait 100us      // microseconds
wait 1min       // minutes
wait 1h         // hours

# Frequency units
const int freq = 50Hz
const int audioFreq = 440Hz

# Angle units
const int angle = 90deg
const int radians = 3.14rad

# Distance units
const int distance = 10cm
const int height = 2m
const int length = 5mm

# Speed units
const int motorSpeed = 1000rpm
```

### Range Constraints

Variables can have automatic range enforcement:

```javascript
mut int sensorValue in 0...1023 = 512  // Automatically constrained to range
mut int pwmValue in 0...255 = 128      // Values outside range are clamped
```

### Type Conversion

Explicit type conversion using `.as<type>()` syntax:

```javascript
const int a = 5
mut float b = a.as<float>()           // int to float

const float voltage = 3.3
mut int millivolts = voltage.as<int>()  // float to int
```

### Collections

#### List Type
```javascript
mut List numbers = new List()

numbers.push(10)              // Add element
numbers.push(20)
mut int value = numbers.get(0)  // Get element at index
numbers.set(0, 15)            // Set element at index
mut int size = numbers.length()  // Get size
mut int last = numbers.pop()    // Remove and return last element
```

#### Map Type
```javascript
mut Map data = new Map()

data.set(1, 100)              // Set key-value pair
mut int value = data.get(1)    // Get value by key
mut bool exists = data.has(1)  // Check if key exists
data.remove(1)                // Remove key-value pair
```

### Error Handling

Basic error handling using `!catch` syntax:

```javascript
mut Analog sensor = new Analog(0)

mut int value = sensor.read() !catch {
  print("Sensor failed")
}
```

### Built-in Functions

YS provides access to standard microcontroller functions:

- **Pin Control**: `pinMode()`, `digitalWrite()`, `digitalRead()`
- **Analog I/O**: `analogRead()`, `analogWrite()`
- **Timing**: `delay()`, `millis()`
- **Serial**: `print()` (outputs to serial)
- **Constants**: `HIGH`, `LOW`, `INPUT`, `OUTPUT`, `INPUT_PULLUP`

## Syntax Summary

YS syntax:

- **Braces required**: All blocks use `{` and `}`
- **Semicolons optional**: Not required, only when multiple statements on one line
- **Strong static typing**: All variables and functions must be typed
- **`fn` keyword**: Modern function syntax (also supports `function`)
- **`self` keyword**: Class member access (also supports `this`)
- **`mut` keyword**: Mutable variables (immutable by default with `const`)
- **Enums**: Rust-style enumerations
- **Structs**: C++-style data structures
- **Classes**: OOP with constructors and methods
- **`new` keyword**: Object instantiation
- **Hardware types**: `Digital`, `Analog`, `PWM` with auto pinMode
- **Unit literals**: Time, frequency, angle, distance, speed units
- **Range constraints**: `in min...max` for automatic bounds
- **Type conversion**: `.as<type>()` for explicit casting
- **Collections**: `List` and `Map` types
- **Event blocks**: `on start {}`, `on loop {}`
- **Match expressions**: Pattern matching with `=>`
- **Switch statements**: C++-style with braces
- **Tasks**: Periodic (`every`) and background execution
- **Signals**: Event-driven with `signal`/`emit`
- **Reactive vars**: Volatile variables with `react`
- **Time literals**: `ms`, `s`, `us`, `min`, `h`
- **Error handling**: `!catch` for error propagation
- **Atomic blocks**: Interrupt-safe with `atomic {}`
- **Library loading**: `load <lib>` for C++ headers, `load <file.ys> as name` for YS modules
- **Inline C++**: `@cpp {}` for direct C++ code

## Examples

### Complete Example

```javascript
@main

enum Mode { AUTO, MANUAL }

struct Point {
  int x
  int y
}

class Motor {
    mut int speed
    
    constructor(int speed) { 
        self.speed = speed 
    }
    
    fn run() { 
        print("Motor running at speed:")
        print(self.speed)
    }
    
    fn setSpeed(int newSpeed) {
        self.speed = newSpeed
    }
}

mut Motor motor = new Motor(100)
mut Mode currentMode = AUTO
mut Point position = Point { x: 0, y: 0 }

on start {
    motor.run()
    print("Initialized")
}

on loop {
    match currentMode {
        AUTO => {
            motor.setSpeed(200)
            print("Auto mode")
        },
        MANUAL => {
            motor.setSpeed(100)
            print("Manual mode")
        }
    }
    
    mut int level = analogRead(0) / 256
    
    switch level {
        case 1 { print("Low power") }
        case 2 { print("Medium power") }
        case 3 { print("High power") }
        default { print("Max power") }
    }
    
    delay(1000)
}
```

### Enum Example

```javascript
@main

enum State { IDLE, RUNNING, STOPPED }

mut State machineState = IDLE

fn updateState(State newState) {
    machineState = newState
}

on loop {
    match machineState {
        IDLE => print("Waiting..."),
        RUNNING => print("Running..."),
        STOPPED => print("Stopped")
    }
}
```

### Struct Example

```javascript
@main

struct Config {
    int threshold
    float sensitivity
    bool enabled
}

mut Config config = Config {
    threshold: 512,
    sensitivity: 0.75,
    enabled: true
}

fn checkThreshold(int value) -> bool {
    return value > config.threshold
}
```

## CLI Usage

```bash
# Compile a YS file to C++
ysc input.ys
ysc compile input.ys

# Upload to board (requires Arduino CLI)
ysc upload input.ys

# Upload with code retrieval enabled (experimental)
ysc upload input.ys --r

# Compile, upload, and monitor serial (requires Arduino CLI)
ysc run input.ys

# Run with code retrieval enabled (experimental)
ysc run input.ys --retrieve

# Specify output file
ysc input.ys output.ino

# Show help
ysc --help

# Show version
ysc --version

# Show config diagnostics
ysc input.ys --config
```

### Code Retrieval Feature (Experimental)

The `--r` or `--retrieve` flag enables experimental code retrieval functionality:

```bash
ysc upload blink.ys --r
```

**Important Notes:**
- ⚠️ **Experimental**: This feature is in early development
- ⚠️ **Low-memory boards**: Use with caution on Arduino Uno and similar boards
- The board will listen for retrieval requests after reboot
- Requires firmware support in the generated code
- May cause instability on boards with limited memory

**Warning for Arduino Uno:**
When using `--r` on low-memory boards like Arduino Uno, you'll see:
```
⚠ Experimental Feature: Code retrieval on arduino_uno.
   Low-memory boards like Arduino Uno have limited resources.
   Use at your own risk. This feature may cause instability.
```

## Board Configuration

YS requires a `config {}` block in files with `@main` for board-specific settings:

```javascript
config {
  board: arduino_uno,    # Board type: arduino_uno, arduino_nano, arduino_mega, 
                         #             arduino_leonardo, esp32, esp8266
  clock: 16MHz,          # CPU clock frequency
  uart: on,              # Enable serial monitor (on/off)
  port: auto             # Serial port (auto-detect or specify like COM3, /dev/ttyUSB0)
}
```

**Required Fields for @main Files:**
- `board`: Board type (e.g., arduino_uno, esp32)
- `clock`: CPU clock frequency (e.g., 16MHz, 240MHz)

**Optional Fields:**
- `uart`: Enable/disable serial communication (default: off)
- `port`: Serial port for upload (default: auto)

The config system automatically:
- Maps board types to Arduino CLI FQBN
- Selects correct PWM implementation (analogWrite for AVR, LEDC for ESP)
- Detects serial ports for upload
- Configures build properties
- Validates all required fields are present

**Valid Board Names:**
- `arduino_uno` - Arduino Uno (ATmega328P)
- `arduino_nano` - Arduino Nano
- `arduino_mega` - Arduino Mega 2560
- `arduino_leonardo` - Arduino Leonardo
- `esp32` - ESP32 boards
- `esp8266` - ESP8266 boards

**Legacy Support:**
The old `mpu` and `cpu` field names are still supported for backward compatibility but are deprecated. Use `board` instead.

See [CONFIG.md](CONFIG.md) for detailed documentation.

## How It Works

1. **Lexer**: Tokenizes YS source code
2. **Parser**: Builds an Abstract Syntax Tree (AST) with type information
3. **Type Checker**: Validates types and structure
4. **Code Generator**: Transpiles AST to C++
5. **Output**: Standard C++ code ready for compilation

## Syntax Highlights

- **Brace-based blocks** (like C/C++/Rust)
- **No semicolons**: Clean, readable code
- **`fn` keyword**: For function definitions
- **`self` keyword**: For class member access (not `this`)
- **`mut` keyword**: Explicit mutability
- **Strong typing**: All variables and functions must declare types
- **Enums**: Rust-style enumerations
- **Structs**: C++-style data structures
- **Pattern matching**: `match` expressions for control flow
- **Switch statements**: C++-style switch with braces
- **Event blocks**: `on <event> {}` syntax
- **OOP support**: Classes, constructors, methods, and object instantiation
- **Module system**: Load YS files as namespaced modules with `load <file.ys> as name`
- **No async**: Async/await not supported yet

## Why Ypsilon Script?

**Traditional approach:**
```cpp
// Verbose, less structured
const int LED_PIN = 13;
int state = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  switch(state) {
    case 0:
      digitalWrite(LED_PIN, HIGH);
      break;
    case 1:
      digitalWrite(LED_PIN, LOW);
      break;
  }
  delay(1000);
}
```

**Ypsilon Script:**
```javascript
@main

# Clean, type-safe, expressive
enum LedState { ON, OFF }

mut LedState state = ON
const int LED_PIN = 13

on start {
    pinMode(LED_PIN, OUTPUT)
}

on loop {
    match state {
        ON => digitalWrite(LED_PIN, HIGH),
        OFF => digitalWrite(LED_PIN, LOW)
    }
    delay(1000)
}
```

YS provides:
- **Better type safety** with strong static typing
- **Cleaner syntax** with no semicolons and modern features
- **Better code organization** with classes, structs, and enums
- **Pattern matching** for expressive control flow
- **Event-driven syntax** that's intuitive and readable

## Development

```bash
# Clone the repository
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script

# Install dependencies
npm install

# Run tests
npm test

# Try examples (if implemented)
node bin/ysc.js examples/motor.ys
```

## Project Structure

```
ypsilon-script/
├── bin/
│   └── ysc.js          # CLI tool
├── src/
│   ├── lexer.js        # Tokenizer with YS keywords
│   ├── parser.js       # AST builder with full YS support
│   ├── codegen.js      # C++ code generator
│   ├── compiler.js     # Main compiler
│   └── index.js        # Package entry point
├── examples/
│   └── ...             # YS example files
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
