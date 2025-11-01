# Ypsilon Script Language Reference

## Overview

Ypsilon Script (YS) is a simple high-level language that compiles to C++ for microcontrollers. It features strong static typing, modern syntax with braces, and no semicolons.

## Syntax Features

- **Required Braces**: All blocks use `{` and `}`
- **No Semicolons**: Code is cleaner without semicolons
- **`fn` keyword**: For function definitions
- **`self` keyword**: For class member access (not `this`)
- **`mut` keyword**: Explicit mutability for variables
- **Event blocks**: `on <event> {}` syntax
- **Pattern matching**: `match` expressions like Rust
- **Switch statements**: C++-style with braces

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
const LED_PIN: int = 13
const PI: float = 3.14159
const DEBUG: bool = true
```

### Mutable Variable Declaration
```javascript
mut counter: int = 0
mut temperature: float = 23.5
mut isActive: bool = false
```

### Type Annotations
All variables must have explicit type annotations:
```javascript
mut value: int = 100
const threshold: int = 512
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

mut currentMode: Mode = Mode.AUTO
mut systemState: State = State.IDLE
```

### Usage
```javascript
# Assignment
currentMode = Mode.MANUAL

# Comparison
if (currentMode == Mode.AUTO) {
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
    field1: type1,
    field2: type2,
    field3: type3
}
```

### Example
```javascript
struct Point { 
    x: int, 
    y: int 
}

struct Config {
    threshold: int,
    sensitivity: float,
    enabled: bool
}

struct Sensor {
    pin: int,
    lastReading: int,
    active: bool
}
```

### Initialization
```javascript
mut position: Point = Point { x: 0, y: 0 }
mut settings: Config = Config {
    threshold: 512,
    sensitivity: 0.75,
    enabled: true
}
```

### Access
```javascript
# Read field
mut xValue: int = position.x

# Update field  
position.x = 100
position.y = 200
```

## Functions

Functions are defined using the `fn` keyword.

### Syntax
```javascript
fn <name>(<param1>: <type1>, <param2>: <type2>, ...) -> <returnType> {
    # function body
}

# For void functions (no return)
fn <name>(<param1>: <type1>, ...) {
    # function body
}
```

### Examples
```javascript
# Function with return type
fn add(a: int, b: int) -> int {
    return a + b
}

# Void function (no return value)
fn blink(pin: int, duration: int) {
    digitalWrite(pin, HIGH)
    delay(duration)
    digitalWrite(pin, LOW)
    delay(duration)
}

# Function returning bool
fn isAboveThreshold(value: int, threshold: int) -> bool {
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
15. **No imports**: Module system not supported yet

## Future Features

Planned for future versions:
- Arrays and collections
- String operations
- Module system and imports
- Async/await support
- More advanced pattern matching
- Inheritance and polymorphism
- Interfaces/traits
