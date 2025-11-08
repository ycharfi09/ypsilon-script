# Ypsilon Script Language Reference

## Overview

Ypsilon Script (YS) is a simple high-level language that compiles to C++ for microcontrollers. It features strong static typing, modern syntax with braces, and no semicolons.

## Syntax Features

- **Required Braces**: All blocks use `{` and `}`
- **No Semicolons**: Code is cleaner without semicolons
- **`@main` Entry Point**: Every program must declare an entry file with `@main`
- **`fn` keyword**: For function definitions
- **`self` keyword**: For class member access (not `this`)
- **`mut` keyword**: Explicit mutability for variables
- **Event blocks**: `on <event> {}` syntax
- **Pattern matching**: `match` expressions like Rust
- **Switch statements**: C++-style with braces

## Entry Point

Every YS program must have exactly one file that declares itself as the entry point using the `@main` directive:

```javascript
@main

# Your program code...
```

**Rules:**
- `@main` must be at the top of the file (first non-comment line)
- Only one file in your project can have `@main`
- The main file cannot be named `main.ys` - use descriptive names like `app.ys`, `robot.ys`, or `project.ys`
- Other files become modules and don't need `@main`

**Project Structure:**

Single file project:
```
blink.ys          # Has @main
```

Multi-file project (recommended for larger projects):
```
my-robot/
  ├── robot.ys         # Has @main (main entry point)
  ├── motors.ys        # Module (no @main)
  └── sensors.ys       # Module (no @main)
```

**Compilation:**

```bash
# Compile single file
ysc blink.ys

# Compile project folder (finds @main automatically)
ysc my-robot/

# Compile module without @main (for testing)
ysc motors.ys --skip-main
```

**Error Messages:**
- **No @main found**: `Error: No @main directive found in <file>. Every Ypsilon Script project needs exactly one file with @main at the top.`
- **Multiple @main files**: `Error: Multiple entry points detected in folder. Only one file per project can have @main.`
- **main.ys filename**: `Error: The main file cannot be named 'main.ys'. Suggestion: Rename your file to something descriptive like 'app.ys', 'project.ys', or '<project-name>.ys'.`
- **Compiling without @main**: Shows a warning but allows compilation with `--skip-main` flag

## Type System

All variables and functions must be explicitly typed.

### Built-in Types

- `int` - Integer
- `float` - Floating-point number
- `bool` - Boolean (true/false)
- `string` - String type
- User-defined types: enums, structs, classes

## Variables

### Constant Declaration
```javascript
const int LED_PIN = 13
const float PI = 3.14159
const bool DEBUG = true
```

### Mutable Variable Declaration
```javascript
mut int counter = 0
mut float temperature = 23.5
mut bool isActive = false
```

### Type Annotations
All variables must have explicit type annotations in the format `type name`:
```javascript
mut int value = 100
const int threshold = 512
```

## Enums

Enums define a type with a set of named variants (Rust-style):

### Syntax
```javascript
enum <EnumName> {
    VARIANT1,
    VARIANT2,
    VARIANT3
}
```

### Example
```javascript
enum Mode { 
    AUTO, 
    MANUAL, 
    SLEEP 
}

enum State {
    IDLE,
    RUNNING,
    PAUSED,
    ERROR
}

mut Mode currentMode = AUTO
mut State systemState = IDLE
```

### Usage
```javascript
# Assignment
currentMode = MANUAL

# Comparison
if (currentMode == AUTO) {
    print("Auto mode active")
}

# With match
match currentMode {
    AUTO => print("Automatic"),
    MANUAL => print("Manual control"),
    SLEEP => print("Power saving")
}
```

## Structs

Structs define data structures with named fields (C++-style):

### Syntax
```javascript
struct <StructName> {
    type1 field1
    type2 field2
    type3 field3
}
```

### Example
```javascript
struct Point { 
    int x
    int y
}

struct Config {
    int threshold
    float sensitivity
    bool enabled
}

struct Sensor {
    int pin
    int value
}

mut Point position = Point { x: 10, y: 20 }
mut Config config = Config { threshold: 512, sensitivity: 0.75, enabled: true }
```

### Initialization
```javascript
mut Point position = Point { x: 0, y: 0 }
mut Config settings = Config {
    threshold: 512,
    sensitivity: 0.75,
    enabled: true
}
```

### Access
```javascript
# Read field
mut int xValue = position.x

# Update field  
position.x = 100
position.y = 200
```

## Functions

Functions are defined using the `fn` keyword.

### Syntax
```javascript
fn <name>(<type1> <param1>, <type2> <param2>, ...) -> <returnType> {
    # function body
}

# For void functions (no return)
fn <name>(<type1> <param1>, ...) {
    # function body
}
```

### Examples
```javascript
# Function with return type
fn add(int a, int b) -> int {
    return a + b
}

# Void function (no return value)
fn blink(int pin, int duration) {
    digitalWrite(pin, HIGH)
    delay(duration)
    digitalWrite(pin, LOW)
    delay(duration)
}

# Function returning bool
fn isAboveThreshold(int value, int threshold) -> bool {
    return value > threshold
}
```

## Event Blocks

Event blocks use the `on <event> {}` syntax for defining event handlers:

### Syntax
```javascript
on <eventName> {
    # event handler code
}
```

### Standard Events

#### on start
Runs once at startup (equivalent to setup in traditional microcontroller programming):
```javascript
on start {
    pinMode(13, OUTPUT)
    print("System initialized")
}
```

#### on loop
Runs repeatedly (the main loop):
```javascript
on loop {
    digitalWrite(13, HIGH)
    delay(1000)
    digitalWrite(13, LOW)
    delay(1000)
}
```

### Example
```javascript
const LED_PIN: int = 13

on start {
    pinMode(LED_PIN, OUTPUT)
}

on loop {
    digitalWrite(LED_PIN, HIGH)
    delay(500)
    digitalWrite(LED_PIN, LOW)
    delay(500)
}
```

## Object-Oriented Programming

### Class Declaration

Use `self` to refer to the current instance (not `this`).

```javascript
class <ClassName> {
    mut <property1>: <type1>
    const <property2>: <type2>
    
    constructor(<param1>: <type1>, ...) {
        # initialization code
    }
    
    fn <methodName>(<param>: <type>, ...) -> <returnType> {
        # method body
    }
}
```

### Example

```javascript
class Motor {
    mut speed: int
    const maxSpeed: int
    
    constructor(initialSpeed: int, max: int) {
        self.speed = initialSpeed
        self.maxSpeed = max
    }
    
    fn accelerate(amount: int) {
        self.speed = self.speed + amount
        if (self.speed > self.maxSpeed) {
            self.speed = self.maxSpeed
        }
    }
    
    fn getSpeed() -> int {
        return self.speed
    }
    
    fn run() {
        print("Running at speed:")
        print(self.speed)
    }
}
```

### Object Instantiation

```javascript
mut motor: Motor = new Motor(100, 255)

on start {
    motor.run()
    motor.accelerate(50)
}
```

### Accessing Members

```javascript
motor.run()                              # Call method
mut currentSpeed: int = motor.getSpeed() # Get return value
motor.accelerate(25)                     # Call method with parameter
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
    digitalWrite(LED_PIN, HIGH)
} else {
    digitalWrite(LED_PIN, LOW)
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
    delay(10)
}
```

### For Loop

```javascript
for (mut <var>: <type> = <init>; <condition>; <update>) {
    # code
}
```

Examples:
```javascript
for (mut i: int = 0; i < 10; i = i + 1) {
    print(i)
}

for (mut brightness: int = 0; brightness < 256; brightness = brightness + 5) {
    analogWrite(LED_PIN, brightness)
    delay(30)
}

for (mut i: int = 10; i > 0; i = i - 1) {
    print(i)
}
```

### Match Expression

Pattern matching for control flow (Rust-style):

```javascript
match <expression> {
    <pattern1> => <action1>,
    <pattern2> => <action2>,
    _ => <default_action>
}
```

Examples:
```javascript
# Match with enum
enum Mode { AUTO, MANUAL, SLEEP }
mut mode: Mode = Mode.AUTO

match mode {
    AUTO => print("Automatic mode"),
    MANUAL => print("Manual control"),
    SLEEP => print("Power saving mode")
}

# Match with values
mut level: int = 2

match level {
    1 => print("Low"),
    2 => print("Medium"),
    3 => print("High"),
    _ => print("Unknown level")
}

# Match with blocks
match status {
    OK => {
        digitalWrite(LED_PIN, HIGH)
        print("All systems operational")
    },
    ERROR => {
        digitalWrite(LED_PIN, LOW)
        print("Error detected")
    }
}
```

### Switch Statement

Traditional switch-case with braces (C++-style):

```javascript
switch <expression> {
    case <value1> {
        # code
    }
    case <value2> {
        # code
    }
    default {
        # code
    }
}
```

Examples:
```javascript
mut command: int = 1

switch command {
    case 1 {
        print("Start")
        digitalWrite(LED_PIN, HIGH)
    }
    case 2 {
        print("Stop")
        digitalWrite(LED_PIN, LOW)
    }
    case 3 {
        print("Reset")
    }
    default {
        print("Unknown command")
    }
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
- `&&` Logical AND
- `||` Logical OR
- `!` Logical NOT

### Assignment
- `=` Assign value

## Built-in Functions

### Pin Control
```javascript
pinMode(pin: int, mode: int)
digitalWrite(pin: int, value: int)
mut value: int = digitalRead(pin)
```

### Analog I/O
```javascript
mut value: int = analogRead(pin)    # 0-1023
analogWrite(pin: int, value: int)   # 0-255 (PWM)
```

### Timing
```javascript
delay(milliseconds: int)
mut time: int = millis()
```

### Serial Communication
```javascript
print(value)     # Prints value
print("Hello")   # Prints string
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
enum Mode { AUTO, MANUAL }

struct Point { x: int, y: int }

class Motor {
    mut speed: int
    const maxSpeed: int
    
    constructor(initialSpeed: int, max: int) {
        self.speed = initialSpeed
        self.maxSpeed = max
    }
    
    fn run() {
        print("Motor running at:")
        print(self.speed)
    }
    
    fn setSpeed(newSpeed: int) {
        if (newSpeed <= self.maxSpeed) {
            self.speed = newSpeed
        } else {
            self.speed = self.maxSpeed
        }
    }
}

const SENSOR_PIN: int = 0
const LED_PIN: int = 13
mut motor: Motor = new Motor(100, 255)
mut mode: Mode = Mode.AUTO
mut position: Point = Point { x: 0, y: 0 }

on start {
    pinMode(LED_PIN, OUTPUT)
    motor.run()
}

on loop {
    match mode {
        AUTO => {
            motor.setSpeed(200)
            digitalWrite(LED_PIN, HIGH)
        },
        MANUAL => {
            motor.setSpeed(100)
            digitalWrite(LED_PIN, LOW)
        }
    }
    
    mut sensorValue: int = analogRead(SENSOR_PIN)
    mut level: int = sensorValue / 256
    
    switch level {
        case 0 { print("Very low") }
        case 1 { print("Low") }
        case 2 { print("Medium") }
        case 3 { print("High") }
        default { print("Very high") }
    }
    
    delay(100)
}
```

## Compilation

YS code is compiled to C++:

```bash
ysc myprogram.ys         # Creates output file
ysc input.ys output.cpp  # Custom output name
```

## Best Practices

1. **Use explicit types**: All variables and functions must be typed
2. **Use `mut` for mutable variables**: Makes mutability explicit and clear
3. **Use `self` in classes**: For accessing instance members
4. **Use enums for states**: Better than magic numbers or strings
5. **Use structs for data**: Group related data together
6. **Use match for enums**: More expressive than if-else chains
7. **Keep functions small**: One task per function
8. **Add comments**: Use `#` to explain what your code does
9. **Use const for values that don't change**: Makes intent clear
10. **Use event blocks**: `on start {}` and `on loop {}` for main handlers

## Syntax Summary

YS features:

1. **Braces required**: All blocks use `{` and `}`
2. **No semicolons**: Cleaner code without semicolons
3. **Strong static typing**: All variables and functions must be typed
4. **`fn` keyword**: For function definitions
5. **`self` keyword**: For class member access (not `this`)
6. **`mut` keyword**: Explicit mutability
7. **Enums**: Rust-style enumerations
8. **Structs**: C++-style data structures
9. **Classes**: Object-oriented programming with constructors and methods
10. **`new` keyword**: For object instantiation
11. **Event blocks**: `on start {}` and `on loop {}`
12. **Match expressions**: Pattern matching like Rust
13. **Switch statements**: C++-style with braces
14. **No async**: Async/await not supported yet

## Future Features

Planned for future versions:
- Arrays and collections
- String operations
- Async/await support
- More advanced pattern matching
- Inheritance and polymorphism
- Interfaces/traits

## Advanced Features

### Interrupts

Interrupt handlers allow you to respond instantly to hardware events:

```javascript
# Basic interrupt syntax
interrupt on PIN# (rising|falling|change|low|high) {
  # interrupt handler code
}

# Named interrupt for clarity
interrupt myISR on PIN# mode {
  # interrupt handler code
}
```

#### Interrupt Modes

- `rising` - Trigger on rising edge (LOW to HIGH)
- `falling` - Trigger on falling edge (HIGH to LOW)
- `change` - Trigger on any change
- `low` - Trigger when pin is LOW
- `high` - Trigger when pin is HIGH

#### Example

```javascript
alias ENCODER_PIN = 2
react mut pulseCount: int = 0

interrupt encoderISR on ENCODER_PIN rising {
  pulseCount = pulseCount + 1
}

on start {
  pinMode(ENCODER_PIN, INPUT_PULLUP)
}

on loop {
  print("Pulses:")
  print(pulseCount)
  delay(1000)
}
```

#### ISR Restrictions

For safety and performance, interrupt handlers have restrictions:

**Allowed operations:**
- Variable assignment
- Arithmetic operations
- Updating reactive variables
- Emitting signals

**Forbidden operations:**
- `print()` - Serial communication is too slow
- `delay()` - Blocks other interrupts
- `wait` - Blocking operations
- Loops (`while`, `for`) - Could take too long
- Function calls (unless marked `@ininterrupt` safe - future feature)

**Variable Safety:**

Variables used in interrupts are automatically marked `volatile`:

```javascript
mut int counter = 0  # Used in ISR

interrupt on 2 rising {
  counter = counter + 1  # counter is marked volatile
}

# Compiles to: volatile int counter = 0;
```

Reactive variables are already volatile:

```javascript
react mut rpm: int = 0  # Always volatile

interrupt on 2 rising {
  rpm = rpm + 1
}
```

### Reactive Variables

Reactive variables are automatically volatile for interrupt safety:

```javascript
react mut rpm: int = 0
react mut temperature: int = 0

# Use in interrupt handlers or with volatile access
interrupt on 2 rising {
  rpm = rpm + 1
}
```

### Signals

Signals enable event-driven communication:

```javascript
signal buttonPressed
signal dataReady

# Emit signals
on start {
  emit buttonPressed
}

# Handler for signals (future feature)
on buttonPressed {
  print("Button was pressed")
}
```

### Tasks

Tasks enable periodic and background execution:

```javascript
# Periodic task
task blink every 500ms {
  toggle(LED)
}

# Background task (runs in loop)
task monitor background {
  checkSensors()
  wait 100ms
}
```

### Time Literals

Use intuitive time units:

```javascript
wait 200ms        # Wait 200 milliseconds
wait 2s           # Wait 2 seconds
wait 500us        # Wait 500 microseconds

timeout 5s {
  connect()
}
```

Supported units:
- `ms` - milliseconds
- `s` - seconds
- `us` - microseconds
- `min` - minutes
- `h` - hours

### Atomic Blocks

Ensure atomic execution (disables interrupts):

```javascript
atomic {
  criticalValue = criticalValue + 1
  updateDisplay()
}
```

Compiles to:
```cpp
noInterrupts();
criticalValue = criticalValue + 1;
updateDisplay();
interrupts();
```

### Library Loading

Load Arduino C++ libraries:

```javascript
load <Servo>
load <WiFi>
load <Wire>
```

Load YS module files as namespaces:

```javascript
# Load a YS module with default namespace (filename without extension)
load <motor.ys>
motor.Motor m = new motor.Motor(9)
motor.helper()

# Load with custom namespace using 'as' keyword
load <motor.ys> as m
m.Motor myMotor = new m.Motor(9)
m.helper()
myMotor.setSpeed(m.MAX_SPEED)
```

**Module Loading Details:**
- `.ys` files are loaded and compiled into C++ namespaces
- All classes, functions, and variables in the module are wrapped in the namespace
- Default namespace name is the filename without extension
- Use `as` keyword to specify a custom namespace name
- Access module members using dot notation: `namespace.Member`
- Generated C++ uses `::` for namespace access
- Backward compatible: non-.ys loads still generate `#include` directives

### Aliases

Create aliases for pins or constants:

```javascript
alias LED_PIN = 13
alias BUTTON = D2
alias MOTOR_PWM = PWM1
```

Compiles to C++ `#define` macros.

### Configuration Block

Specify target configuration:

```javascript
config {
  cpu: atmega328p,
  clock: 16MHz,
  uart: on,
  i2c: on
}
```

### Inline C++

When you need direct C++ code:

```javascript
@cpp {
  Serial.println("Direct C++")
  digitalWrite(13, HIGH)
}
```

### Resource Ownership

Declare resource usage (for safety checking):

```javascript
use I2C1
use SPI
use UART0
```

## Complete Modern Example

```javascript
load <Servo>
alias LED_PIN = 13

enum Mode { AUTO, MANUAL }
struct Point { x: int, y: int }

signal modeChange
react mut sensorValue: int = 0

mut Mode currentMode = AUTO
mut int counter = 0

class Motor {
  mut int speed
  
  constructor(int s) {
    self.speed = s
  }
  
  fn setSpeed(int s) {
    self.speed = s
  }
  
  fn run() {
    print(self.speed)
  }
}

mut Motor motor = new Motor(100)

on start {
  pinMode(LED_PIN, OUTPUT)
  print("System ready")
}

on loop {
  atomic {
    sensorValue = analogRead(0)
  }
  
  match currentMode {
    AUTO => {
      motor.setSpeed(sensorValue / 4)
    },
    MANUAL => {
      motor.setSpeed(100)
    }
  }
  
  wait 10ms
}

task blink every 500ms {
  digitalWrite(LED_PIN, HIGH)
  wait 250ms
  digitalWrite(LED_PIN, LOW)
}
```

## Syntax Comparison

### Traditional Arduino
```cpp
const int LED = 13;
int state = 0;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  switch(state) {
    case 0:
      digitalWrite(LED, HIGH);
      break;
    case 1:
      digitalWrite(LED, LOW);
      break;
  }
  delay(1000);
}
```

### Modern Ypsilon Script
```javascript
alias LED = 13
enum State { ON, OFF }

mut State currentState = ON

on start {
  pinMode(LED, OUTPUT)
}

on loop {
  match currentState {
    ON => digitalWrite(LED, HIGH),
    OFF => digitalWrite(LED, LOW)
  }
  wait 1s
}
```

## Updated Syntax Summary

1. **Braces required**: All blocks use `{` and `}`
2. **No semicolons**: Optional, only when multiple statements on one line
3. **Strong static typing**: All variables and functions must be typed
4. **`fn` keyword**: Modern function syntax (also supports `function`)
5. **`self` keyword**: Class member access (also supports `this`)
6. **`mut` keyword**: Mutable variables (immutable by default with `const`)
7. **Enums**: Rust-style enumerations
8. **Structs**: C++-style data structures
9. **Classes**: OOP with constructors and methods
10. **`new` keyword**: Object instantiation
11. **Event blocks**: `on start {}`, `on loop {}`
12. **Interrupt handlers**: `interrupt <name?> on PIN# (rising|falling|change|low|high) { }`
13. **Match expressions**: Pattern matching with `=>`
14. **Switch statements**: C++-style with braces
15. **Tasks**: Periodic (`every`) and background execution
16. **Signals**: Event-driven communication
17. **Reactive vars**: Volatile variables with `react`
18. **Time literals**: `ms`, `s`, `us`, `min`, `h`
19. **Atomic blocks**: Interrupt-safe regions
20. **Library loading**: `load <lib>` and `load <module.ys> as name`
21. **Aliases**: `alias name = value`
22. **Config blocks**: Target configuration
23. **Inline C++**: `@cpp { }`
