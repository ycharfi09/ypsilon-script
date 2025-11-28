<p align="center">
  <img src="yslogo.png" alt="Ypsilon Script Logo" width="150">
</p>

# Quick Start Guide

## Installation

```bash
npm install -g ypsilon-script
```

Or use without installing:
```bash
npx ypsilon-script yourfile.ys
```

## Your First Program

Create `hello.ys`:

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

# Hardware type with automatic setup
mut Led led = new Led(13)

on start {
    # No pinMode needed - Led type handles it
    print("Hello from Ypsilon Script!")
}

on loop {
    led.on()
    wait 1s
    led.off()
    wait 1s
}
```

**Important:** Every YS program must have exactly one file with `@main` at the top and a config block. This marks the entry point of your program.

## Compile It

```bash
ysc hello.ys
```

This creates C++ code ready for your microcontroller.

## Understanding @main

The `@main` directive marks the entry point of your program:
- **Required**: Every complete project needs exactly one file with `@main`
- **Position**: Must be at the top of the file (first non-comment line)
- **Naming**: The main file cannot be named `main.ys` - use descriptive names like `app.ys`, `project.ys`, or `blink.ys`

### Single File vs. Module

**With @main** (complete program):
```javascript
@main

const int LED = 13
on start { pinMode(LED, OUTPUT) }
on loop { digitalWrite(LED, HIGH) }
```

**Without @main** (module/library):
```javascript
# utils.ys - A reusable module

class Helper {
    mut int value
    constructor(int v) { self.value = v }
}
```

Modules can be compiled with the `--skip-main` flag if needed, but they won't produce a runnable program on their own.

## Project Structure

For larger projects, organize your code in folders:

```
my-robot/
  ├── robot.ys         # Main file with @main
  ├── motors.ys        # Motor control module
  ├── sensors.ys       # Sensor library
  └── utils.ys         # Helper functions
```

To compile a project folder:
```bash
ysc my-robot/
```

The compiler will automatically find the file with `@main` and compile it.

**Important Rules:**
- ✅ Only one file can have `@main` per project
- ✅ The main file cannot be named `main.ys`
- ✅ Other files become modules (no `@main` needed)
- ❌ Multiple files with `@main` will cause an error
- ❌ No file with `@main` will cause an error

## Key Features

### Strongly Typed
- All variables must declare their type
- All functions must declare parameter and return types
- Catch type errors at compile time

### Modern Syntax
- Braces required for all blocks
- No semicolons needed
- Use `@main` to mark the entry file
- Config block required with board settings
- Use `fn` for functions
- Use `self` in classes (not `this`)
- Use `mut` for mutable variables
- Use hardware types (Led, Button, PWM, etc.) instead of manual pinMode
- Use `wait` with time units instead of delay
- Variables declared as `type name` (e.g., `int x`)

### Powerful Features
- **60+ Hardware types** including:
  - Digital I/O: `Digital`, `Led`, `RgbLed`, `Button`, `Buzzer`
  - Motors: `Servo`, `DCMotor`, `StepperMotor`, `Encoder`
  - Sensors: `TempSensor`, `DistanceSensor`, `LightSensor`, `MotionSensor`, `GPS`, and more
  - Displays: `LCD`, `OLED`, `NeoPixel`, `SevenSegment`
  - Actuators: `Relay`, `Solenoid`, `Fan`, `Pump`, `Valve`
  - Communication: `I2C`, `SPI`, `UART`, `Bluetooth`, `WiFi`, `LoRa`
  - Timing: `Timer`, `RTC`
  - Audio: `Speaker`, `Microphone`
- Enums (Rust-style)
- Structs (C++-style)
- Classes with constructors and methods
- Pattern matching with `match`
- Switch statements
- Repeat loops for fixed iterations
- Event blocks (`on start {}`, `on loop {}`)
- Time literals (`wait 500ms`, `wait 2s`)

## Common Patterns

### Basic LED Control

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

# Hardware type with automatic setup
mut Led led = new Led(13)

on start {
    # No pinMode needed - Led type handles it
    print("Blink started")
}

on loop {
    led.on()
    wait 1s
    led.off()
    wait 1s
}
```

### Using Enums

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

enum State { ON, OFF }

mut State ledState = OFF
mut Led led = new Led(13)

on start {
    # No pinMode needed - Led type handles it
    print("State machine started")
}

on loop {
    match ledState {
        ON => {
            led.on()
            ledState = OFF
        },
        OFF => {
            led.off()
            ledState = ON
        }
    }
    wait 1s
}
```

### Using Structs

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

struct Config {
    int threshold
    bool enabled
}

mut Analog sensor = new Analog(0)
mut Config config = Config { threshold: 512, enabled: true }

on loop {
    if (config.enabled) {
        mut int value = sensor.read()
        if (value > config.threshold) {
            print("Threshold exceeded!")
        }
    }
    wait 100ms
}
```

### Using Classes

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

class Motor {
    mut int speed
    mut PWM pwm
    
    constructor(int motorPin) {
        self.pwm = new PWM(motorPin)
        self.speed = 0
    }
    
    fn setSpeed(int newSpeed) {
        self.speed = newSpeed
        self.pwm.set(self.speed)
    }
    
    fn run() {
        print("Motor running at:")
        print(self.speed)
    }
}

mut Motor motor

on start {
    motor = new Motor(9)
    motor.setSpeed(128)
    print("Motor initialized")
}

on loop {
    motor.run()
    wait 1s
}
```

### Pattern Matching

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

enum Mode { AUTO, MANUAL, SLEEP }

mut Mode currentMode = AUTO

on loop {
    match currentMode {
        AUTO => print("Automatic mode"),
        MANUAL => print("Manual control"),
        SLEEP => print("Power saving")
    }
    wait 1s
}
```

### Switch Statements

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut int command = 1

on loop {
    switch command {
        case 1 { 
            print("Start")
            command = 2
        }
        case 2 { 
            print("Running")
            command = 3
        }
        case 3 {
            print("Stop")
            command = 1
        }
        default {
            print("Error")
        }
    }
    wait 1s
}
```

### Repeat Loops

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut Led statusLed = new Led(13)

on start {
    print("Blink sequence demo")
}

on loop {
    # Blink LED 5 times
    repeat(5) {
        statusLed.toggle()
        wait 200ms
    }
    wait 1s
}
```
```

## Next Steps

1. Check out the [examples](examples/) directory
2. Read the [Language Reference](LANGUAGE_REFERENCE.md)
3. Join the community and [contribute](CONTRIBUTING.md)

## Tips

1. **Add `@main` to Your Entry File**: Every program needs exactly one file with `@main`
2. **Use Descriptive Names**: Name your main file after your project (e.g., `robot.ys`, `blink.ys`), not `main.ys`
3. **Organize in Folders**: Keep related files together in project folders
4. **Compile Folders**: Use `ysc my-project/` to compile entire projects
5. **Single Modules**: Use `--skip-main` flag to compile individual module files
6. **Use Explicit Types**: All variables and functions must be typed in `type name` format
7. **Use `mut` for Variables**: Make mutability explicit
8. **Use `self` in Classes**: Access instance members with `self`
9. **Use Enums for States**: Better than magic numbers
10. **Use Structs for Data**: Group related fields together
11. **Use Match for Enums**: More expressive than if-else
12. **Add Comments**: Use `#` for comments

## Help

- Read the full [README](README.md)
- Check [Language Reference](LANGUAGE_REFERENCE.md)
- Report issues on GitHub
- Contribute improvements

Happy coding! 🚀
