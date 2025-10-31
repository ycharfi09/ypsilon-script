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

```python
const LED = 13

function setup():
    pinMode(LED, OUTPUT)
    print("Hello from Ypsilon Script!")

function loop():
    digitalWrite(LED, HIGH)
    delay(1000)
    digitalWrite(LED, LOW)
    delay(1000)
```

## Compile It

```bash
ysc hello.ys
```

This creates `hello.ino` which you can open in Arduino IDE.

## Upload to Arduino

1. Open Arduino IDE
2. Open the generated `.ino` file
3. Select your board and port
4. Click Upload

## What Just Happened?

Your YS code was transpiled to this C++:

```cpp
#include <Arduino.h>

const int LED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  Serial.println("Hello from Ypsilon Script!");
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(1000);
  digitalWrite(LED, LOW);
  delay(1000);
}
```

## Key Features

### Clean Syntax
- No semicolons
- Indentation-based blocks
- Use `and`, `or`, `not` instead of `&&`, `||`, `!`

### Auto-Generated Boilerplate
- Includes added automatically
- `Serial.begin()` added when using `print()`
- Type declarations handled for you

### Built-in Functions
All Arduino functions work as expected:
- `pinMode(pin, mode)`
- `digitalWrite(pin, value)`
- `digitalRead(pin)`
- `analogRead(pin)`
- `analogWrite(pin, value)`
- `delay(ms)`
- `millis()`
- `print(message)`

### Range-based Loops
```python
for i in range(10):        # 0 to 9
    delay(i)

for i in range(5, 15):     # 5 to 14
    print(i)

for i in range(0, 100, 5): # 0, 5, 10, ..., 95
    analogWrite(LED, i)
```

## Next Steps

1. Check out the [examples](examples/) directory
2. Read the [Language Reference](LANGUAGE_REFERENCE.md)
3. Join the community and [contribute](CONTRIBUTING.md)

## Common Patterns

### Button Input
```python
const BUTTON = 2
const LED = 13

function setup():
    pinMode(BUTTON, INPUT_PULLUP)
    pinMode(LED, OUTPUT)

function loop():
    if digitalRead(BUTTON) == LOW:
        digitalWrite(LED, HIGH)
    else:
        digitalWrite(LED, LOW)
```

### Analog Sensor
```python
const SENSOR = 0
const THRESHOLD = 512

function loop():
    var value = analogRead(SENSOR)
    if value > THRESHOLD:
        print("Threshold exceeded!")
    delay(100)
```

### Custom Function
```python
function blink_times(pin, times, duration):
    for i in range(times):
        digitalWrite(pin, HIGH)
        delay(duration)
        digitalWrite(pin, LOW)
        delay(duration)

function loop():
    blink_times(13, 3, 500)
    delay(2000)
```

## Tips

1. **Use Constants**: Define pin numbers as constants at the top
2. **Name Things Well**: Use descriptive names like `LED_PIN` not `x`
3. **Test Incrementally**: Compile often to catch errors early
4. **Add Comments**: Use `#` for comments to explain your logic

## Help

- Read the full [README](README.md)
- Check [Language Reference](LANGUAGE_REFERENCE.md)
- Report issues on GitHub
- Contribute improvements

Happy coding! 🚀
