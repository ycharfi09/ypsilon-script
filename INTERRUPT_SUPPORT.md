<p align="center">
  <img src="yslogo.png" alt="Ypsilon Script Logo" width="150">
</p>

# Interrupt Support in Ypsilon Script

This document describes the interrupt support feature added to Ypsilon Script, enabling efficient hardware interrupt handling for microcontrollers.

## Overview

Interrupts allow your microcontroller to respond instantly to hardware events without polling. This is essential for:
- Encoder pulse counting
- Button debouncing
- Sensor event detection
- Real-time signal processing

## Syntax

```javascript
interrupt [name] on PIN# (rising|falling|change|low|high) {
  // interrupt handler code
}
```

### Components

- `name` (optional): A descriptive name for the ISR function
- `PIN#`: The pin number or alias to attach the interrupt to
- Mode: One of the interrupt trigger modes

### Interrupt Modes

| Mode      | Description                        | Use Case                    |
|-----------|------------------------------------|-----------------------------|
| `rising`  | Trigger on rising edge (LOW→HIGH)  | Encoder pulses, button press|
| `falling` | Trigger on falling edge (HIGH→LOW) | Button release              |
| `change`  | Trigger on any edge change         | Any state change detection  |
| `low`     | Trigger when pin is LOW            | Level-sensitive events      |
| `high`    | Trigger when pin is HIGH           | Level-sensitive events      |

## Examples

### Basic Counter

```javascript
alias SENSOR_PIN = 2
react mut pulseCount: int = 0

interrupt on SENSOR_PIN rising {
  pulseCount = pulseCount + 1
}

on start {
  pinMode(SENSOR_PIN, INPUT_PULLUP)
}

on loop {
  print(pulseCount)
  delay(1000)
}
```

### Named ISR with Debouncing

```javascript
alias BUTTON_PIN = 3
react mut lastPressTime: int = 0
mut int buttonCount = 0

interrupt buttonISR on BUTTON_PIN falling {
  mut int now = millis()
  if (now - lastPressTime > 50) {
    buttonCount = buttonCount + 1
    lastPressTime = now
  }
}

on start {
  pinMode(BUTTON_PIN, INPUT_PULLUP)
}
```

## ISR Restrictions

For safety and correct operation, interrupt handlers have the following restrictions:

### ✅ Allowed Operations

- Variable assignment
- Arithmetic operations (`+`, `-`, `*`, `/`, `%`)
- Logical operations (`&&`, `||`, comparisons)
- Updating reactive variables
- Emitting signals
- Reading hardware pins (`digitalRead`, `analogRead`, `millis`)

### ❌ Forbidden Operations

- `print()` - Serial communication is too slow and can corrupt data
- `delay()` - Blocks the processor and other interrupts
- `wait` - Same issue as delay
- Loops (`while`, `for`, `repeat`) - Could take too long
- Function calls - Unless marked `@ininterrupt` safe (future feature)

### Why These Restrictions?

Interrupt handlers should execute as quickly as possible (microseconds, not milliseconds). Long-running operations:
- Block other interrupts
- Cause missed events
- Lead to unpredictable behavior
- Can corrupt serial communication

## Variable Safety

### Automatic Volatile Marking

Variables accessed in interrupt handlers are automatically marked `volatile` to ensure proper memory synchronization:

```javascript
mut int counter = 0  // Regular variable

interrupt on 2 rising {
  counter = counter + 1  // Used in ISR
}

// Compiles to: volatile int counter = 0;
```

### Reactive Variables

Reactive variables are always volatile and recommended for ISR use:

```javascript
react mut pulseCount: int = 0  // Always volatile

interrupt on 2 rising {
  pulseCount = pulseCount + 1
}
```

### Selective Marking

Only variables actually used in ISRs are marked volatile:

```javascript
mut int a = 0  // Used in ISR → volatile
mut int b = 0  // Not used in ISR → not volatile

interrupt on 2 rising {
  a = a + 1
}

on loop {
  b = b + 1  // Only accessed in main loop
}
```

## Code Generation

The compiler generates:

1. **ISR Function**: A C++ function containing your interrupt handler code
2. **attachInterrupt Call**: Placed in `setup()` to register the ISR
3. **Volatile Variables**: Auto-marked for ISR-accessed variables

### Example Compilation

**YS Code:**
```javascript
mut int count = 0

interrupt myISR on 2 rising {
  count = count + 1
}
```

**Generated C++:**
```cpp
volatile int count = 0;

void myISR() {
  count = (count + 1);
}

void setup() {
  attachInterrupt(digitalPinToInterrupt(2), myISR, RISING);
}
```

## Best Practices

1. **Keep ISRs Short**: Only update variables and set flags
2. **Use Reactive Variables**: Declare ISR variables as `react mut`
3. **Debounce in ISR**: Use timing checks for mechanical switches
4. **Process in Loop**: Do heavy processing in the main loop
5. **Named ISRs**: Use descriptive names for clarity

### Good Pattern

```javascript
react mut eventFlag: bool = false
react mut eventTime: int = 0

interrupt on 2 rising {
  eventFlag = true
  eventTime = millis()
}

on loop {
  if (eventFlag) {
    eventFlag = false
    
    // Do expensive processing here
    processEvent(eventTime)
  }
}
```

## Multiple Interrupts

You can define multiple interrupt handlers:

```javascript
mut int counter1 = 0
mut int counter2 = 0

interrupt on 2 rising {
  counter1 = counter1 + 1
}

interrupt on 3 falling {
  counter2 = counter2 + 1
}
```

## Error Messages

The compiler validates your ISR code and provides clear error messages:

```javascript
interrupt on 2 rising {
  print("Error!")  // ❌ Error
}
// Error: print() is not allowed in interrupts

interrupt on 2 rising {
  while (true) {}  // ❌ Error
}
// Error: loops are not allowed in interrupts
```

## Testing

The interrupt feature includes comprehensive tests:
- Lexer tests for new keywords
- Parser tests for syntax validation
- Code generation tests
- ISR validation tests
- Integration tests

Run tests with:
```bash
npm test
```

## Hardware Compatibility

Interrupt support works with all Arduino-compatible boards:
- Arduino Uno (pins 2, 3)
- Arduino Mega (pins 2, 3, 18, 19, 20, 21)
- ESP32 (all GPIO pins)
- ESP8266 (all GPIO pins)

Check your board's documentation for available interrupt pins.

## Future Enhancements

Planned features:
- `@ininterrupt` annotation for marking functions as ISR-safe
- Pin change interrupts for non-hardware interrupt pins
- Interrupt priority configuration
- More granular control over interrupt behavior
