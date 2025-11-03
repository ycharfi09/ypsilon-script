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

**Important:** Every YS program must start with `@main` on the first non-empty line.

## Compile It

```bash
ysc hello.ys
```

This creates C++ code ready for your microcontroller.

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

1. **Add `@main` First**: Every program must have `@main` as the first non-empty line
2. **Use Explicit Types**: All variables and functions must be typed in `type name` format
3. **Use `mut` for Variables**: Make mutability explicit
4. **Use `self` in Classes**: Access instance members with `self`
5. **Use Enums for States**: Better than magic numbers
6. **Use Structs for Data**: Group related fields together
7. **Use Match for Enums**: More expressive than if-else
8. **Add Comments**: Use `#` for comments

## Help

- Read the full [README](README.md)
- Check [Language Reference](LANGUAGE_REFERENCE.md)
- Report issues on GitHub
- Contribute improvements

Happy coding! 🚀
