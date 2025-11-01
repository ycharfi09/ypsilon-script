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
const LED: int = 13

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
- Use `fn` for functions
- Use `self` in classes (not `this`)
- Use `mut` for mutable variables

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
const LED: int = 13

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
enum State { ON, OFF }

mut ledState: State = State.OFF
const LED_PIN: int = 13

on start {
    pinMode(LED_PIN, OUTPUT)
}

on loop {
    match ledState {
        ON => {
            digitalWrite(LED_PIN, HIGH)
            ledState = State.OFF
        },
        OFF => {
            digitalWrite(LED_PIN, LOW)
            ledState = State.ON
        }
    }
    delay(1000)
}
```

### Using Structs

```javascript
struct Config {
    threshold: int,
    enabled: bool
}

const SENSOR: int = 0
mut config: Config = Config { threshold: 512, enabled: true }

on loop {
    if (config.enabled) {
        mut value: int = analogRead(SENSOR)
        if (value > config.threshold) {
            print("Threshold exceeded!")
        }
    }
    delay(100)
}
```

### Using Classes

```javascript
class Motor {
    mut speed: int
    const pin: int
    
    constructor(motorPin: int) {
        self.pin = motorPin
        self.speed = 0
        pinMode(self.pin, OUTPUT)
    }
    
    fn setSpeed(newSpeed: int) {
        self.speed = newSpeed
        analogWrite(self.pin, self.speed)
    }
    
    fn run() {
        print("Motor running at:")
        print(self.speed)
    }
}

mut motor: Motor

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
enum Mode { AUTO, MANUAL, SLEEP }

mut currentMode: Mode = Mode.AUTO

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
mut command: int = 1

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

1. **Use Explicit Types**: All variables and functions must be typed
2. **Use `mut` for Variables**: Make mutability explicit
3. **Use `self` in Classes**: Access instance members with `self`
4. **Use Enums for States**: Better than magic numbers
5. **Use Structs for Data**: Group related fields together
6. **Use Match for Enums**: More expressive than if-else
7. **Add Comments**: Use `#` for comments

## Help

- Read the full [README](README.md)
- Check [Language Reference](LANGUAGE_REFERENCE.md)
- Report issues on GitHub
- Contribute improvements

Happy coding! 🚀
