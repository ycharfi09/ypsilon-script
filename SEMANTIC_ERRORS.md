# Semantic Error Checking - Examples

This document demonstrates the new semantic error checking capabilities added to Ypsilon Script.

## Undeclared Variables

### Example 1: Basic Undeclared Variable

**Code:**
```ys
@main
config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on
}

mut Analog statusLed = new Analog(24)

on loop {
  mut int value = status.read()  // Error: 'status' not declared
  wait 1s
}
```

**Error Message:**
```
Error at line 12: Undefined variable 'status'
  Did you mean 'statusLed'?
```

### Example 2: Typo in Variable Name

**Code:**
```ys
mut int counter = 0
mut int total = 100

on loop {
  counter = counter + 1
  
  if (couter > 10) {  // Error: typo 'couter' instead of 'counter'
    print("Counter exceeded 10")
  }
  
  wait 1s
}
```

**Error Message:**
```
Error at line 7: Undefined variable 'couter'
  Did you mean 'counter'?
```

### Example 3: Multiple Suggestions

**Code:**
```ys
function void test() {
  int value1 = 10
  int value2 = 20
  int value3 = 30
  int result = valu + 1  // Error: typo 'valu'
}
```

**Error Message:**
```
Error at line 5: Undefined variable 'valu'
  Did you mean 'value1'? Or perhaps: 'value2', 'value3'
```

## Supported Features

The semantic analyzer correctly handles:

### 1. Built-in Functions and Constants
```ys
pinMode(13, OUTPUT)      // ✓ Recognized
digitalWrite(13, HIGH)   // ✓ Recognized
delay(1000)             // ✓ Recognized
int x = millis()        // ✓ Recognized
```

### 2. Aliases
```ys
alias LED_PIN = 13

function void setup() {
  pinMode(LED_PIN, OUTPUT)  // ✓ LED_PIN recognized
}
```

### 3. Enums
```ys
enum State { IDLE, RUNNING, STOPPED }

function void test() {
  State current = IDLE     // ✓ IDLE recognized
  if (current == RUNNING) { // ✓ RUNNING recognized
    print("running")
  }
}
```

### 4. Classes
```ys
class Motor {
  mut int speed
  
  constructor(int s) {
    self.speed = s         // ✓ self.speed recognized
  }
  
  fn getSpeed() -> int {
    return self.speed      // ✓ self.speed recognized
  }
}

function void test() {
  Motor m = new Motor(100) // ✓ Motor and m recognized
  int s = m.getSpeed()     // ✓ m recognized
}
```

### 5. Module Namespaces
```ys
load <utils.ys> as u

function void test() {
  u.helper()              // ✓ u recognized as module namespace
}
```

### 6. Scoped Variables
```ys
mut int global = 10

function void test() {
  print(global)           // ✓ global accessible
  
  if (true) {
    mut int local = 20
    print(local)          // ✓ local accessible in this scope
    print(global)         // ✓ global still accessible
  }
  
  print(local)            // ✗ Error: local not accessible here
}
```

### 7. Loop Variables
```ys
function void test() {
  for (int i = 0; i < 10; i = i + 1) {
    print(i)              // ✓ i accessible inside loop
  }
  
  print(i)                // ✗ Error: i not accessible outside loop
}
```

### 8. React Variables
```ys
react mut counter: int = 0

function void test() {
  counter = counter + 1   // ✓ counter recognized
}
```

## Hex Literal Support

The semantic analyzer also includes support for hexadecimal literals:

```ys
mut SPI spi = new SPI()

on loop {
  mut u8 result = spi.transfer(0x42)  // ✓ 0x42 properly parsed
  mut int value = 0xFF                // ✓ 0xFF properly parsed
}
```

## Error Prevention

The semantic analyzer prevents common errors:

### 1. Use Before Declaration
```ys
function void test() {
  print(x)      // ✗ Error: x used before declaration
  mut int x = 10
}
```

### 2. Self-Reference in Initialization
```ys
function void test() {
  mut int x = x + 1  // ✗ Error: x referenced in its own initialization
}
```

### 3. Scope Isolation
```ys
function void test() {
  if (true) {
    mut int x = 10
  }
  print(x)      // ✗ Error: x not accessible outside if block
}
```

## Benefits

1. **Catch errors early**: Errors are caught at compile time, not runtime
2. **Clear error messages**: Line numbers and suggestions help fix errors quickly
3. **Better IDE support**: Foundation for future IDE features like autocomplete
4. **Prevent C++ compilation errors**: Invalid code is caught before C++ compilation
5. **Improved code quality**: Encourages proper variable management
