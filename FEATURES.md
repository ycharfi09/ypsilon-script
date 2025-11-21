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

### 13. Hardware Types

YS provides built-in hardware abstraction types with automatic pinMode management:

#### Digital Type
```javascript
mut Digital pin = new Digital(13)

# Methods
pin.high()      // Set pin HIGH (auto sets pinMode OUTPUT)
pin.low()       // Set pin LOW
pin.toggle()    // Toggle pin state
pin.isHigh()    // Returns bool (auto sets pinMode INPUT)
pin.isLow()     // Returns bool
pin.read()      // Returns int
pin.write(val)  // Write value
```

The Digital type automatically configures pinMode based on usage:
- Writing (high/low/toggle/write) → OUTPUT mode
- Reading (isHigh/isLow/read) → INPUT mode

#### Analog Type
```javascript
mut Analog sensor = new Analog(0)

# Method
sensor.read()  // Returns int 0-1023 (auto sets pinMode INPUT)
```

#### PWM Type
```javascript
mut PWM motor = new PWM(9)

# Methods
motor.set(value)  // Set PWM 0-255 (auto sets pinMode OUTPUT)
motor.get()       // Returns current PWM value
```

The PWM type detects board type and uses appropriate implementation:
- AVR boards (Uno, Nano, Mega): `analogWrite()`
- ESP boards (ESP32, ESP8266): LEDC functions with channel management

### 14. Unit System

Support for physical unit literals that are automatically converted at compile time:

#### Time Units
```javascript
const int delay1 = 500ms     // milliseconds → 500
const int delay2 = 2s        // seconds → 2000
const int delay3 = 100us     // microseconds → 0 (rounded down)
const int delay4 = 1min      // minutes → 60000
const int delay5 = 1h        // hours → 3600000
```

#### Frequency Units
```javascript
const int freq1 = 50Hz       // Hertz → 50
const int freq2 = 5kHz       // kiloHertz → 5000
const int freq3 = 1MHz       // MegaHertz → 1000000
```

#### Angle Units
```javascript
const int angle1 = 90deg     // degrees → 90
const int angle2 = 3.14rad   // radians → 180 (converted to degrees)
```

#### Distance Units
```javascript
const int dist1 = 10mm       // millimeters → 10
const int dist2 = 10cm       // centimeters → 100 (converted to mm)
const int dist3 = 1m         // meters → 1000 (converted to mm)
const int dist4 = 1km        // kilometers → 1000000 (converted to mm)
```

#### Speed Units
```javascript
const int speed = 1000rpm    // revolutions per minute → 1000
```

### 15. Range Constraints

Variables can have automatic range enforcement using the `in min...max` syntax:

```javascript
mut int sensorValue in 0...1023 = 512
mut int pwmValue in 0...255 = 128
mut int temperature in -40...125 = 20

# Values are automatically constrained using constrain()
sensorValue = 2000  // Automatically clamped to 1023
pwmValue = -10      // Automatically clamped to 0
```

Range constraints work with:
- Literal values: `in 0...100`
- Variable bounds: `in MIN...MAX`
- Any expression that evaluates to integers

### 16. Type Conversion

Explicit type conversion using `.as<type>()` syntax:

```javascript
# Numeric conversions
const int a = 5
mut float b = a.as<float>()     // int → float

const float voltage = 3.3
mut int mv = voltage.as<int>()  // float → int (truncates)

# Works with any types
mut Digital pin = new Digital(13)
mut int pinNum = pin.as<int>()  // Hardware type → int
```

Type conversion generates `static_cast<T>()` in C++ for type safety.

### 17. Collections

Built-in collection types implemented using C++ STL:

#### List Type
```javascript
mut List numbers = new List()

# Methods
numbers.push(10)              // Add element to end
numbers.push(20)
mut int val = numbers.get(0)   // Get element at index
numbers.set(0, 15)            // Set element at index
mut int size = numbers.length()  // Get number of elements
mut int last = numbers.pop()    // Remove and return last element
```

Internally uses `std::vector<T>` for efficient dynamic arrays.

#### Map Type
```javascript
mut Map data = new Map()

# Methods
data.set(key, value)          // Set key-value pair
mut int val = data.get(key)    // Get value by key
mut bool exists = data.has(key)  // Check if key exists
data.remove(key)              // Remove key-value pair
mut int count = data.size()    // Get number of entries
```

Internally uses `std::map<K, V>` for efficient key-value storage.

### 18. Error Handling

Basic error handling using `!catch` syntax:

```javascript
mut Analog sensor = new Analog(0)

# Inline error handling
mut int value = sensor.read() !catch {
  print("Sensor failed")
}

# Can be used with any expression
mut int result = calculation() !catch {
  print("Calculation error")
}
```

The error handling generates simple error checking code. For production use, this provides a foundation for more sophisticated error types.

### 19. Built-in Functions

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

- **No Arrays**: Traditional array support not yet implemented (use List instead)
- **Limited String Operations**: Basic string support only
- **Module System**: Module loading works but limited to file-level imports
- **No Async/Await**: Async operations not supported
- **No Inheritance**: Class inheritance not implemented
- **No Interfaces/Traits**: Not yet supported
- **No Global Struct Initialization**: Struct initialization only works in function scope
- **Error Handling**: Basic `!catch` syntax implemented but not full error types yet

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
- Frequency units (Hz, kHz, MHz)
- Angle units (deg, rad)
- Distance units (mm, cm, m, km)
- Speed units (rpm)
- wait statements
- timeout statements

### Hardware Integration: ✅ Advanced
- Hardware types (Digital, Analog, PWM)
- Auto pinMode detection
- Board-specific PWM implementation
- Pin control (digital and analog)
- Built-in Arduino functions
- Library loading
- Resource management

### Advanced Types: ✅ Complete
- Range constraints (in min...max)
- Type conversion (.as<type>())
- Collections (List, Map)
- Error handling (!catch)

### Metaprogramming: ✅ Basic Support
- Inline C++ blocks
- Configuration blocks
- Aliases

## Examples Available

The repository includes 24 working examples demonstrating:
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
18. `digital-hardware.ys` - Digital hardware type demo
19. `analog-sensor.ys` - Analog hardware type demo
20. `pwm-motor.ys` - PWM hardware type demo
21. `unit-system.ys` - Unit literals demonstration
22. `type-conversion.ys` - Type conversion examples
23. `range-constraints.ys` - Range constraints demo
24. `complete-hardware-demo.ys` - All hardware features together

All examples compile successfully and demonstrate real-world usage patterns.
