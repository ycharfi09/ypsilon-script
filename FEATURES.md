# Ypsilon Script - Complete Features List

## Core Language Features

### 0. Entry Point Declaration
- **`@main` Directive**: Every program must declare an entry file
- Must be the first non-empty line
- Only one file can have `@main`
  ```javascript
  @main
  
  # Your program code...
  ```

### 1. Type System
- **Strong Static Typing**: All variables and functions must be explicitly typed
- **Built-in Types**: `int`, `float`, `bool`, `string`
- **User-Defined Types**: Enums, Structs, Classes
- **Type Inference**: Function return types can be inferred from return statements

### 2. Variable Declarations
- **Mutable Variables**: `mut TYPE name = value`
  ```javascript
  mut int counter = 0
  mut float temperature = 23.5
  ```
- **Constants**: `const TYPE name = value`
  ```javascript
  const int LED_PIN = 13
  const float PI = 3.14159
  ```
- **Reactive Variables**: `react mut TYPE name = value` (volatile for interrupt safety)
  ```javascript
  react mut int sensorValue = 0
  ```

### 3. Object-Oriented Programming

#### Classes
- Class declarations with properties and methods
- Constructor support
- `self` keyword for member access (also supports `this`)
- Method definitions using `fn` keyword
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
      }
  }
  ```

### 4. Data Structures

#### Enums (Rust-style)
- Named variants for state management
- Pattern matching support
  ```javascript
  enum Mode { AUTO, MANUAL, SLEEP }
  mut Mode currentMode = AUTO
  ```

#### Structs (C++-style)
- Named fields with types
- Field access using dot notation
  ```javascript
  struct Point {
    int x
    int y
  }
  
  struct Config {
    int threshold
    bool enabled
  }
  ```

### 5. Functions
- **Modern Syntax**: `fn` keyword (also supports `function`)
- **Typed Parameters**: `fn name(TYPE param1, TYPE param2)`
- **Return Types**: `fn name(TYPE param) -> TYPE`
- **Type Inference**: Return type can be inferred
  ```javascript
  fn add(int a, int b) -> int {
      return a + b
  }
  
  fn blink(int pin, int duration) {
      digitalWrite(pin, HIGH)
      wait duration
  }
  ```

### 6. Control Flow

#### If Statements
```javascript
if (condition) {
    # code
} else {
    # code
}
```

#### While Loops
```javascript
while (condition) {
    # code
}
```

#### For Loops
```javascript
for (mut i: int = 0; i < 10; i = i + 1) {
    print(i)
}
```

#### Repeat Loops
```javascript
repeat(3) {
    blink()
}
```

#### Match Expressions (Rust-style)
```javascript
match currentMode {
    AUTO => digitalWrite(13, HIGH),
    MANUAL => digitalWrite(13, LOW),
    SLEEP => print("Sleeping")
}
```

#### Switch Statements (C++-style)
```javascript
switch value {
    case 1 { print("One") }
    case 2 { print("Two") }
    default { print("Other") }
}
```

### 7. Event-Driven Programming

#### Event Blocks
- **on start**: Runs once at startup (equivalent to setup())
- **on loop**: Main loop (equivalent to loop())
  ```javascript
  on start {
      pinMode(13, OUTPUT)
      print("Initialized")
  }
  
  on loop {
      digitalWrite(13, HIGH)
      wait 1s
  }
  ```

#### Signals
- Signal declarations and emission
- Event-driven communication
  ```javascript
  signal buttonPressed
  
  on start {
      emit buttonPressed
  }
  ```

### 8. Task System

#### Periodic Tasks
```javascript
task blink every 500ms {
    digitalWrite(13, HIGH)
    wait 250ms
    digitalWrite(13, LOW)
}
```

#### Background Tasks
```javascript
task monitor background {
    checkSensors()
    wait 100ms
}
```

### 9. Time Management

#### Time Literals
- Supported units: `ms`, `s`, `us`, `min`, `h`
  ```javascript
  wait 200ms
  wait 2s
  delay 500us
  ```

#### Timeout Statements
```javascript
timeout 5s {
    connect()
}
```

### 10. Concurrency & Safety

#### Atomic Blocks
- Interrupt-safe critical sections
- Automatically handles interrupt disabling/enabling
  ```javascript
  atomic {
      criticalValue = criticalValue + 1
      updateDisplay()
  }
  ```

### 11. Library & Resource Management

#### Library Loading
```javascript
load <Servo>
load <WiFi>
load <Wire>
```

#### Aliases
```javascript
alias LED_PIN = 13
alias BUTTON = D2
alias MOTOR_PWM = PWM1
```

#### Resource Declarations
```javascript
use I2C1
use SPI
use UART0
```

### 12. Advanced Features

#### Configuration Blocks
```javascript
config {
    cpu: atmega328p,
    clock: 16MHz,
    uart: on,
    i2c: on
}
```

#### Inline C++
```javascript
@cpp {
    Serial.println("Direct C++")
    digitalWrite(13, HIGH)
}
```

### 13. Built-in Functions

#### Pin Control
- `pinMode(pin: int, mode: int)`
- `digitalWrite(pin: int, value: int)`
- `digitalRead(pin: int) -> int`

#### Analog I/O
- `analogRead(pin: int) -> int` (0-1023)
- `analogWrite(pin: int, value: int)` (0-255, PWM)

#### Timing
- `delay(milliseconds: int)`
- `millis() -> int`

#### Serial Communication
- `print(value)` - Prints to serial
- Automatically adds `Serial.begin(9600)` when print is used

#### Constants
- `HIGH` - Digital high (1)
- `LOW` - Digital low (0)
- `INPUT` - Pin input mode
- `OUTPUT` - Pin output mode
- `INPUT_PULLUP` - Pin input with pullup resistor

### 14. Operators

#### Arithmetic
- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `%` Modulo

#### Comparison
- `==` Equal
- `!=` Not equal
- `<` Less than
- `>` Greater than
- `<=` Less than or equal
- `>=` Greater than or equal

#### Logical
- `&&` Logical AND (also supports `and`)
- `||` Logical OR (also supports `or`)
- `!` Logical NOT (also supports `not`)

#### Assignment
- `=` Assign value

### 15. Syntax Rules

- **Braces Required**: All blocks use `{` and `}`
- **Semicolons Optional**: Not required, only when multiple statements on one line
- **Comments**: `#` for single-line comments
- **No Trailing Commas**: In enums, structs (except last item can have comma)

## Compilation Features

### Code Generation
- **Compiles to C++**: Standard C++ code compatible with Arduino
- **No Runtime Overhead**: Direct translation to C++
- **Type Safety**: Compile-time type checking
- **Memory Efficient**: No garbage collection, stack-based allocation

### CLI Usage
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

## Current Limitations

- **No Arrays**: Array support not yet implemented
- **No String Operations**: Limited string functionality
- **No Module System**: No imports/exports yet
- **No Async/Await**: Async operations not supported
- **No Inheritance**: Class inheritance not implemented
- **No Interfaces/Traits**: Not yet supported
- **No Global Struct Initialization**: Struct initialization only works in function scope

## Feature Summary by Category

### Type System: ✅ Complete
- Strong static typing
- Type inference
- User-defined types (enums, structs, classes)

### Object-Oriented: ✅ Core Features
- Classes with constructors and methods
- `self` keyword
- Properties (public only)

### Functional: ✅ Basic Support
- Function declarations with `fn`
- Typed parameters and return values
- Type inference for returns

### Control Flow: ✅ Complete
- if/else, while, for, repeat
- match expressions (pattern matching)
- switch statements

### Event-Driven: ✅ Complete
- Event blocks (on start, on loop)
- Signals and emit
- Task system (periodic and background)

### Concurrency: ✅ Basic Support
- Atomic blocks
- Reactive variables
- Interrupt safety

### Time Management: ✅ Complete
- Time literals (ms, s, us, min, h)
- wait statements
- timeout statements

### Hardware Integration: ✅ Complete
- Pin control (digital and analog)
- Built-in Arduino functions
- Library loading
- Resource management

### Metaprogramming: ✅ Basic Support
- Inline C++ blocks
- Configuration blocks
- Aliases

## Examples Available

The repository includes 17 working examples demonstrating:
1. `blink.ys` - Basic LED blinking
2. `blink-modern.ys` - Modern syntax blink
3. `button.ys` - Button input and LED control
4. `complete-example.ys` - Complete feature showcase
5. `complete-showcase.ys` - All modern features
6. `constants.ys` - Arduino constants usage
7. `enum-match.ys` - Enums with pattern matching
8. `fade.ys` - PWM LED fading
9. `led_class.ys` - Object-oriented LED control
10. `modern-syntax.ys` - All modern syntax features
11. `sensor.ys` - Analog sensor reading
12. `serial.ys` - Serial communication
13. `smart-led.ys` - RGB LED controller with tasks
14. `syntax-demo.ys` - Syntax demonstration
15. `test-new-features.ys` - New features testing
16. `traffic-light.ys` - Traffic light controller
17. `ultrasonic.ys` - Distance sensor example

All examples compile successfully and demonstrate real-world usage patterns.
