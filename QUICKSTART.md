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

const int LED = 13

on start {
    pinMode(LED, OUTPUT)
    print("Hello from Ypsilon Script!")
}

on loop {
    digitalWrite(LED, HIGH)
    delay(1000)
    digitalWrite(LED, LOW)
    delay(1000)
}
```

**Important:** Every YS program must have exactly one file with `@main` at the top. This marks the entry point of your program.

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
- Use `fn` for functions
- Use `self` in classes (not `this`)
- Use `mut` for mutable variables
- Variables declared as `type name` (e.g., `int x`)

### Powerful Features
- Enums (Rust-style)
- Structs (C++-style)
- Classes with constructors and methods
- Pattern matching with `match`
- Switch statements
- Event blocks (`on start {}`, `on loop {}`)

## Common Patterns

### Basic LED Control

```javascript
@main

const int LED = 13

on start {
    pinMode(LED, OUTPUT)
}

on loop {
    digitalWrite(LED, HIGH)
    delay(1000)
    digitalWrite(LED, LOW)
    delay(1000)
}
```

### Using Enums

```javascript
@main

enum State { ON, OFF }

mut State ledState = OFF
const int LED_PIN = 13

on start {
    pinMode(LED_PIN, OUTPUT)
}

on loop {
    match ledState {
        ON => {
            digitalWrite(LED_PIN, HIGH)
            ledState = OFF
        },
        OFF => {
            digitalWrite(LED_PIN, LOW)
            ledState = ON
        }
    }
    delay(1000)
}
```

### Using Structs

```javascript
@main

struct Config {
    int threshold
    bool enabled
}

const int SENSOR = 0
mut Config config = Config { threshold: 512, enabled: true }

on loop {
    if (config.enabled) {
        mut int value = analogRead(SENSOR)
        if (value > config.threshold) {
            print("Threshold exceeded!")
        }
    }
    delay(100)
}
```

### Using Classes

```javascript
@main

class Motor {
    mut int speed
    const int pin
    
    constructor(int motorPin) {
        self.pin = motorPin
        self.speed = 0
        pinMode(self.pin, OUTPUT)
    }
    
    fn setSpeed(int newSpeed) {
        self.speed = newSpeed
        analogWrite(self.pin, self.speed)
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
}

on loop {
    motor.run()
    delay(1000)
}
```

### Pattern Matching

```javascript
@main

enum Mode { AUTO, MANUAL, SLEEP }

mut Mode currentMode = AUTO

on loop {
    match currentMode {
        AUTO => print("Automatic mode"),
        MANUAL => print("Manual control"),
        SLEEP => print("Power saving")
    }
    delay(1000)
}
```

### Switch Statements

```javascript
@main

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
    delay(1000)
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
