# Ypsilon Script (YS)

A simple high-level language that compiles to C++ for microcontrollers.

## Overview

Ypsilon Script (YS) is designed to make microcontroller development accessible, structured, and type-safe. It provides a modern syntax with strong static typing that compiles directly to C++. Write clean, type-safe code with classes, enums, structs, and pattern matching, then compile to efficient C++ for your microcontroller.

## Features

- **Strong Static Typing**: All variables and functions must be explicitly typed
- **Object-Oriented Programming**: Classes with constructors and methods
- **Structs and Enums**: Rust-like enums and C++-like structs
- **Pattern Matching**: Match expressions like Rust for powerful control flow
- **Event-Driven Programming**: `on <event> {}` blocks for event handling
- **Brace-Based Syntax**: Required braces, no semicolons needed
- **Mutability Control**: `mut` keyword for mutable variables
- **Direct C++ Compilation**: Compiles to standard C++ code
- **No Performance Overhead**: Generates efficient C++ code

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

Create a simple program in `example.ys`:

```javascript
# Ypsilon Script Example

enum Mode { AUTO, MANUAL }

struct Point { x: int, y: int }

class Motor {
    mut speed: int
    
    constructor(speed: int) { 
        self.speed = speed 
    }
    
    fn run() { 
        print("Motor running") 
    }
}

mut motor = new Motor(100)

on start {
    motor.run()
}

on loop {
    match mode {
        AUTO => print("auto"),
        MANUAL => print("manual")
    }
    
    switch level {
        case 1 { print("low") }
        case 2 { print("mid") }
        default { print("high") }
    }
}
```

Compile to C++:

```bash
ysc example.ys
```

This generates C++ code ready for your microcontroller.

## Language Features

### Strong Static Typing

All variables must be explicitly typed. Use `mut` for mutable variables:

```javascript
const LED_PIN: int = 13
mut counter: int = 0
mut temperature: float = 23.5
const DEBUG: bool = true
```

### Enums (Rust-style)

Define enumerations with variants:

```javascript
enum Mode { 
    AUTO, 
    MANUAL 
}

enum State {
    IDLE,
    RUNNING,
    PAUSED
}

mut currentMode: Mode = Mode.AUTO
```

### Structs (C++-style)

Define data structures:

```javascript
struct Point { 
    x: int, 
    y: int 
}

struct Config {
    threshold: int,
    enabled: bool
}

mut position: Point = Point { x: 0, y: 0 }
```

### Classes with `self`

Create classes with constructors and methods. Use `self` instead of `this`:

```javascript
class Motor {
    mut speed: int
    const maxSpeed: int
    
    constructor(speed: int, max: int) {
        self.speed = speed
        self.maxSpeed = max
    }
    
    fn accelerate(amount: int) {
        self.speed = self.speed + amount
        if (self.speed > self.maxSpeed) {
            self.speed = self.maxSpeed
        }
    }
    
    fn run() {
        print("Running at speed: ")
        print(self.speed)
    }
}

mut motor = new Motor(100, 255)
```

### Functions with `fn`

Define functions using the `fn` keyword:

```javascript
fn add(a: int, b: int) -> int {
    return a + b
}

fn blink(pin: int, duration: int) {
    digitalWrite(pin, HIGH)
    delay(duration)
    digitalWrite(pin, LOW)
    delay(duration)
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
    delay(1000)
    digitalWrite(13, LOW)
    delay(1000)
}
```

### Match Expressions (Rust-style)

Pattern matching for control flow:

```javascript
enum Status { OK, ERROR, PENDING }

mut status: Status = Status.OK

match status {
    OK => print("All good"),
    ERROR => print("Something wrong"),
    PENDING => print("Waiting")
}

# Match with values
mut level: int = 2

match level {
    1 => print("Low"),
    2 => print("Medium"),
    3 => print("High"),
    _ => print("Unknown")
}
```

### Switch Statements (C++-style)

Traditional switch-case statements with braces:

```javascript
mut value: int = 1

switch value {
    case 1 { 
        print("One") 
    }
    case 2 { 
        print("Two") 
    }
    default { 
        print("Other") 
    }
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
for (mut i: int = 0; i < 10; i = i + 1) {
    print(i)
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
- **No semicolons**: Semicolons are not used
- **Strong static typing**: All variables and functions must be typed
- **Classes**: Support constructors and methods
- **Object creation**: Use `new` keyword
- **Member access**: Use `self` (not `this`)
- **Mutability**: Use `mut` keyword for mutable variables
- **Structs**: Like C++
- **Enums**: Like Rust
- **Event blocks**: `on <event> {}` syntax
- **Match expressions**: Like Rust
- **Switch statements**: Like C++
- **Functions**: Use `fn` keyword
- **No async**: Not supported yet
- **No imports**: Not supported yet

## Examples

### Complete Example

```javascript
enum Mode { AUTO, MANUAL }

struct Point { x: int, y: int }

class Motor {
    mut speed: int
    
    constructor(speed: int) { 
        self.speed = speed 
    }
    
    fn run() { 
        print("Motor running at speed:")
        print(self.speed)
    }
    
    fn setSpeed(newSpeed: int) {
        self.speed = newSpeed
    }
}

mut motor = new Motor(100)
mut currentMode: Mode = Mode.AUTO
mut position: Point = Point { x: 0, y: 0 }

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
    
    mut level: int = analogRead(0) / 256
    
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
enum State { IDLE, RUNNING, STOPPED }

mut machineState: State = State.IDLE

fn updateState(newState: State) {
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
struct Config {
    threshold: int,
    sensitivity: float,
    enabled: bool
}

mut config: Config = Config {
    threshold: 512,
    sensitivity: 0.75,
    enabled: true
}

fn checkThreshold(value: int) -> bool {
    return value > config.threshold
}
```

## CLI Usage

```bash
# Compile a YS file to C++
ysc input.ys

# Specify output file
ysc input.ys output.cpp

# Show help
ysc --help

# Show version
ysc --version
```

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
- **No async**: Async/await not supported yet
- **No imports**: Module system not supported yet

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
# Clean, type-safe, expressive
enum LedState { ON, OFF }

mut state: LedState = LedState.ON
const LED_PIN: int = 13

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
