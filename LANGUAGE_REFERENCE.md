# Ypsilon Script Language Reference

## Quick Syntax Guide

### Variables
```python
var myVar = 10          # Variable declaration
const MY_CONST = 100    # Constant declaration
```

### Functions
```python
function myFunction(param1, param2):
    # Function body
    return param1 + param2
```

### Control Flow

#### If Statement
```python
if condition:
    # code
else:
    # code
```

#### While Loop
```python
while condition:
    # code
```

#### For Loop
```python
for i in range(10):           # 0 to 9
    # code

for i in range(5, 10):        # 5 to 9
    # code

for i in range(0, 10, 2):     # 0, 2, 4, 6, 8
    # code
```

### Operators

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
- `and` Logical AND
- `or` Logical OR
- `not` Logical NOT

### Arduino Functions

#### Pin Control
```python
pinMode(pin, mode)          # mode: INPUT, OUTPUT, INPUT_PULLUP
digitalWrite(pin, value)    # value: HIGH, LOW
var value = digitalRead(pin)
```

#### Analog I/O
```python
var value = analogRead(pin)    # 0-1023
analogWrite(pin, value)        # 0-255 (PWM)
```

#### Timing
```python
delay(milliseconds)
var time = millis()
```

#### Constants
- `HIGH` - Digital high (1)
- `LOW` - Digital low (0)
- `INPUT` - Pin input mode
- `OUTPUT` - Pin output mode
- `INPUT_PULLUP` - Pin input with pullup resistor

### Comments
```python
# Single line comment
```

### Special Functions

#### setup()
Runs once at startup (required)
```python
function setup():
    # Initialization code
    pinMode(13, OUTPUT)
```

#### loop()
Runs repeatedly (required)
```python
function loop():
    # Main program logic
    digitalWrite(13, HIGH)
    delay(1000)
```

## Data Types

Currently, all variables are compiled to `int` in C++. String literals are supported and compiled to C-style strings.

## Code Structure

A typical Ypsilon Script program:

```python
# Constants and global variables
const LED_PIN = 13

# Setup function (runs once)
function setup():
    pinMode(LED_PIN, OUTPUT)

# Loop function (runs continuously)
function loop():
    digitalWrite(LED_PIN, HIGH)
    delay(1000)
    digitalWrite(LED_PIN, LOW)
    delay(1000)

# Custom functions
function customFunction(param):
    return param * 2
```

## Compilation

YS code is compiled to Arduino C++ (.ino files):

```bash
ysc myprogram.ys        # Creates myprogram.ino
ysc input.ys output.ino # Custom output name
```

The generated `.ino` file can be opened and uploaded with the Arduino IDE.

## Best Practices

1. **Use constants for pin numbers**: Makes code more readable
2. **Keep functions small**: One task per function
3. **Add comments**: Explain what your code does
4. **Use meaningful names**: `LED_PIN` instead of `x`
5. **Test incrementally**: Compile and test frequently

## Limitations

- All numeric variables are `int` (16-bit on most Arduino boards)
- String operations are limited
- No arrays or advanced data structures yet
- No floating-point support in current version

## Future Features

Planned for future versions:
- Float support
- Arrays
- String operations
- More Arduino libraries (Servo, SoftwareSerial, etc.)
- Type annotations
