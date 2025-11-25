# Ypsilon Script (YS)

A simple high-level language that compiles to C++ for microcontrollers.

## Overview

Ypsilon Script (YS) is designed to make microcontroller development accessible, structured, and type-safe. It provides a modern syntax with strong static typing that compiles directly to C++. Write clean, type-safe code with classes, enums, structs, and pattern matching, then compile to efficient C++ for your microcontroller.

## Features

- **Strong Static Typing**: All variables and functions must be explicitly typed
- **Modern Syntax**: Uses `fn`, `mut`, `self` keywords
- **Hardware Types**: Built-in hardware abstraction types with automatic setup (60+ types):
  - **Digital I/O**: `Digital`, `Led`, `RgbLed`, `Button`, `Buzzer`
  - **Analog & PWM**: `Analog`, `PWM`
  - **Motors**: `Servo`, `DCMotor`, `StepperMotor`, `Encoder`
  - **Communication**: `I2C`, `SPI`, `UART`, `Bluetooth`, `WiFi`, `LoRa`, `NRF24`
  - **Sensors**: `TempSensor`, `HumiditySensor`, `DistanceSensor`, `LightSensor`, `MotionSensor`, `Joystick`, `GPS`, and more
  - **Displays**: `LCD`, `OLED`, `NeoPixel`, `SevenSegment`, `TFT`, `Matrix`
  - **Actuators**: `Relay`, `Solenoid`, `Fan`, `Pump`, `Valve`, `Heater`
  - **Motor Drivers**: `HBridge`, `MotorDriver`, `ServoDriver`
  - **Multiplexers**: `Mux4`, `Mux8`, `Mux16`, `Mux32`
  - **Storage**: `SDCard`, `EEPROM`, `Flash`
  - **Power**: `Battery`, `Solar`
  - **Timing**: `Timer`, `RTC`
  - **Audio**: `Speaker`, `Microphone`, `DFPlayer`
- **Unit System**: Time (`ms`, `s`, `us`), frequency (`Hz`), angle (`deg`), distance (`cm`, `m`), speed (`rpm`)
- **Range Constraints**: `mut int value in 0...1023` for automatic bounds enforcement
- **Type Conversion**: `.as<type>()` syntax for explicit type casting
- **Collections**: `List` and `Map` types with standard methods
- **Arrays**: C++ array literals with `[element, ...]` syntax and subscript access
- **Object-Oriented Programming**: Classes with constructors and methods
- **Enums and Structs**: Rust-style enums and C++-like structs
- **Pattern Matching**: Match expressions like Rust for powerful control flow
- **Event-Driven Programming**: `on start {}`, `on loop {}` blocks
- **Tasks**: Periodic and background task execution
- **Reactive Variables**: Volatile reactive variables with `react`
- **Signals**: Event-driven signal/emit system
- **Time Literals**: `wait 200ms`, `timeout 5s`
- **Error Handling**: `!catch` syntax for error propagation
- **Atomic Blocks**: Interrupt-safe critical sections
- **Library Loading**: `load <Servo>`, `load <module.ys> as m`, `alias LED = 13`
- **Brace-Based Syntax**: Required braces, optional semicolons
- **Direct C++ Compilation**: Compiles to standard C++ code
- **No Performance Overhead**: Generates efficient C++ code

## Installation

**Note:** Ypsilon Script is not available on npm. You must clone the repository and install manually:

```bash
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script
npm install
npm link
```

## Quick Start

Create a simple program in `example.ys`:

```javascript
@main

# Modern Ypsilon Script Example

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

enum Mode { AUTO, MANUAL }

struct Point {
  int x
  int y
}

mut Mode currentMode = AUTO
mut int counter = 0

class Motor {
    mut int speed
    
    constructor(int s) { 
        self.speed = s 
    }
    
    fn run() { 
        print(self.speed) 
    }
}

mut Motor motor = new Motor(100)

on start {
    pinMode(13, OUTPUT)
    motor.run()
}

on loop {
    match currentMode {
        AUTO => digitalWrite(13, HIGH),
        MANUAL => digitalWrite(13, LOW)
    }
    
    wait 1s
}
```

Compile to C++:

```bash
ysc example.ys
```

This generates C++ code ready for your microcontroller.

## Project Structure

### Single File Projects

For simple projects, a single `.ys` file with `@main` and a config block is all you need:

```javascript
// blink.ys
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

const int LED = 13
on start { pinMode(LED, OUTPUT) }
on loop {
    digitalWrite(LED, HIGH)
    delay(1000)
    digitalWrite(LED, LOW)
    delay(1000)
}
```

Compile with:
```bash
ysc blink.ys
```

### Multi-File Projects (Recommended)

For larger projects, organize your code in folders with one main file:

```
my-robot/
  ├── robot.ys         # Main entry point with @main
  ├── motors.ys        # Motor control module (no @main)
  ├── sensors.ys       # Sensor library (no @main)
  └── utils.ys         # Helper functions (no @main)
```

**robot.ys** (main file):
```javascript
@main

load <motors.ys> as motors
load <sensors.ys> as sensors

on start {
    motors.init()
    sensors.init()
}

on loop {
    mut int distance = sensors.readUltrasonic()
    if (distance < 20) {
        motors.stop()
    }
}
```

**motors.ys** (module, no @main):
```javascript
# Motor control library

const int MOTOR_LEFT = 9
const int MOTOR_RIGHT = 10

fn init() {
    pinMode(MOTOR_LEFT, OUTPUT)
    pinMode(MOTOR_RIGHT, OUTPUT)
}

fn stop() {
    digitalWrite(MOTOR_LEFT, LOW)
    digitalWrite(MOTOR_RIGHT, LOW)
}
```

Compile the entire project:
```bash
ysc my-robot/
```

The compiler automatically finds the file with `@main` and compiles it.

### Important Rules for @main

- ✅ **One @main per project**: Exactly one file must have `@main`
- ✅ **Config block required**: Files with `@main` must include a config block with board settings
- ✅ **No main.ys**: The main file cannot be named `main.ys` (use descriptive names like `robot.ys`, `app.ys`)
- ✅ **At the top**: `@main` must be at the top of the file
- ✅ **Modules don't need @main**: Other files become modules/libraries
- ❌ **Multiple @main = Error**: Only one file can have `@main`
- ❌ **No @main = Error**: At least one file must have `@main` (unless using `--skip-main` for module compilation)
- ❌ **Missing config = Error**: `@main` files must have a complete config block

### Module Compilation

To compile a single module file without `@main` (for testing or library development):

```bash
ysc utils.ys --skip-main
```

This will show a warning but allow compilation. The output won't be a runnable program.

## Language Features

### Modern Syntax

All variables must be explicitly typed. Use `mut` for mutable variables:

```javascript
const int LED_PIN = 13
mut int counter = 0
mut float temperature = 23.5

// Width-specific integer types
mut u8 byteValue = 255          // 0 to 255
mut u16 shortValue = 65535      // 0 to 65535  
mut u32 longValue = 4294967295  // 0 to 4294967295
mut i8 signedByte = -128        // -128 to 127
mut i16 signedShort = -32768    // -32768 to 32767
mut i32 signedLong = -2147483648 // -2147483648 to 2147483647

// Float types
mut f32 singlePrecision = 3.14   // 32-bit float
mut f64 doublePrecision = 3.141592653589793  // 64-bit double
```

**Available Types:**
- **Basic types**: `int`, `float`, `bool`, `string`, `void`
- **Unsigned integers**: `u8`, `u16`, `u32`, `u64`
- **Signed integers**: `i8`, `i16`, `i32`, `i64`
- **Type aliases**: `byte` (u8), `short` (i16)
- **Float types**: `f32` (float), `f64` (double)
- **Hardware types**: `Digital`, `Analog`, `PWM`, `Led`, `Button`, etc.
- **Collections**: `List`, `Map`

**Important:** Every complete YS program must have exactly one file with `@main` at the top. This marks the entry point of your program.

```javascript
@main

# Your code here...
```

The `@main` directive marks which file is the main entry point. Other files in your project become modules.

### Enums (Rust-style)

Define enumerations with variants:

```javascript
enum Mode { AUTO, MANUAL, SLEEP }
enum State { IDLE, RUNNING, PAUSED }

mut Mode currentMode = AUTO
```

### Structs (C++-style)

Define data structures:

```javascript
struct Point {
  int x
  int y
}

struct Config {
  int threshold
  bool enabled
}

mut Point position = Point { x: 0, y: 0 }
```

### Classes with `self`

Create classes with constructors and methods. Use `self` instead of `this`:

```javascript
class Motor {
    mut int speed
    const int maxSpeed
    
    constructor(int s, int max) {
        self.speed = s
        self.maxSpeed = max
    }
    
    fn accelerate(int amount) {
        self.speed = self.speed + amount
        if (self.speed > self.maxSpeed) {
            self.speed = self.maxSpeed
        }
    }
}

mut Motor motor = new Motor(100, 255)
```

### Functions with `fn`

Define functions using the `fn` keyword:

```javascript
fn add(int a, int b) -> int {
    return a + b
}

fn blink(int pin, int duration) {
    digitalWrite(pin, HIGH)
    wait duration
}
```

### Event Blocks

Use `on <event> {}` syntax for event handling:

```javascript
on start {
    pinMode(13, OUTPUT)
    print("System initialized")
}

on loop {
    digitalWrite(13, HIGH)
    wait 1s
    digitalWrite(13, LOW)
    wait 1s
}
```

### Match Expressions (Rust-style)

Pattern matching for control flow:

```javascript
enum Status { OK, ERROR, PENDING }

mut Status status = OK

match status {
    OK => print("All good"),
    ERROR => print("Something wrong"),
    PENDING => print("Waiting")
}
```

### Switch Statements (C++-style)

Traditional switch-case statements with braces:

```javascript
mut int value = 1

switch value {
    case 1 { print("One") }
    case 2 { print("Two") }
    default { print("Other") }
}
```

### Tasks

Periodic and background task execution:

```javascript
task blink every 500ms {
    digitalWrite(13, HIGH)
    wait 250ms
    digitalWrite(13, LOW)
}

task monitor background {
    checkSensors()
    wait 100ms
}
```

### Signals

Event-driven communication:

```javascript
signal buttonPressed

on start {
    emit buttonPressed
}
```

### Time Literals

Intuitive time units:

```javascript
wait 200ms
wait 2s
timeout 5s { connect() }
```

### Atomic Blocks

Interrupt-safe critical sections:

```javascript
atomic {
    criticalValue = criticalValue + 1
}
```

### Library Loading

```javascript
load <Servo>
alias LED = 13
```

### Control Flow

**If Statements:**
```javascript
if (sensorValue > 512) {
    led.on()
} else {
    led.off()
}
```

**While Loops:**
```javascript
while (button.pressed()) {
    wait 10ms
}
```

**For Loops:**
```javascript
for (mut i: int = 0; i < 10; i = i + 1) {
    print(i)
}
```

**Repeat Loops:**
```javascript
# Repeat a fixed number of times
repeat(3) {
    led.toggle()
    wait 500ms
}
```

### Hardware Types

YS provides built-in hardware abstraction types that automatically handle pin mode configuration:

#### Digital Type
```javascript
mut Digital led = new Digital(13)

led.high()        // Sets pin HIGH (auto-configures OUTPUT mode)
led.low()         // Sets pin LOW
led.toggle()      // Toggles pin state
led.isHigh()      // Returns bool (auto-configures INPUT mode)
led.isLow()       // Returns bool
led.read()        // Returns int
led.write(HIGH)   // Writes value
```

#### Analog Type
```javascript
mut Analog sensor = new Analog(0)

mut int value = sensor.read()  // Returns 0-1023 (auto-configures INPUT mode)
```

#### PWM Type
```javascript
mut PWM motor = new PWM(9)

motor.set(128)         // Sets PWM value 0-255 (auto-configures OUTPUT mode)
mut int speed = motor.get()  // Returns current PWM value
```

The PWM type automatically detects your board and uses the appropriate implementation:
- AVR boards (Uno, Nano, Mega): Uses `analogWrite()`
- ESP boards (ESP32, ESP8266): Uses LEDC functions

### Unit System

YS supports unit literals that are automatically converted at compile time:

```javascript
# Time units
wait 500ms      // milliseconds
wait 2s         // seconds
wait 100us      // microseconds
wait 1min       // minutes
wait 1h         // hours

# Frequency units
const int freq = 50Hz
const int audioFreq = 440Hz

# Angle units
const int angle = 90deg
const int radians = 3.14rad

# Distance units
const int distance = 10cm
const int height = 2m
const int length = 5mm

# Speed units
const int motorSpeed = 1000rpm
```

### Range Constraints

Variables can have automatic range enforcement:

```javascript
mut int sensorValue in 0...1023 = 512  // Automatically constrained to range
mut int pwmValue in 0...255 = 128      // Values outside range are clamped
```

### Type Conversion

Explicit type conversion using `.as<type>()` syntax:

```javascript
const int a = 5
mut float b = a.as<float>()           // int to float

const float voltage = 3.3
mut int millivolts = voltage.as<int>()  // float to int
```

### Arrays

C++ arrays with automatic size inference from initializer lists:

```javascript
// Array literal initialization
mut u8 bytes = [1, 2, 3, 4, 5]
const i32 values = [10, 20, 30]
mut f32 temperatures = [20.5, 21.0, 22.5]
mut f64 precise = [3.141592, 2.718281]

// Subscript access for reading
mut u8 first = bytes[0]
mut i32 second = values[1]

// Subscript access for writing
bytes[2] = 100
values[0] = 50

// Use in expressions
mut u8 sum = bytes[0] + bytes[1] + bytes[2]
mut int index = 2
mut u8 value = bytes[index]
```

**Features:**
- Compiles to native C++ arrays (no wrapper overhead)
- Automatic size inference from initializer
- Support for all integer types (u8, u16, u32, i8, i16, i32, etc.)
- Support for float types (f32, f64)
- Subscript access with `array[index]`
- Works in expressions and as function parameters

**Generated C++ code:**
```cpp
uint8_t bytes[5] = {1, 2, 3, 4, 5};
const int32_t values[3] = {10, 20, 30};
float temperatures[3] = {20.5, 21.0, 22.5};
double precise[2] = {3.141592, 2.718281};
```

### Collections

#### List Type
```javascript
mut List numbers = new List()

numbers.push(10)              // Add element
numbers.push(20)
mut int value = numbers.get(0)  // Get element at index
numbers.set(0, 15)            // Set element at index
mut int size = numbers.length()  // Get size
mut int last = numbers.pop()    // Remove and return last element
```

#### Map Type
```javascript
mut Map data = new Map()

data.set(1, 100)              // Set key-value pair
mut int value = data.get(1)    // Get value by key
mut bool exists = data.has(1)  // Check if key exists
data.remove(1)                // Remove key-value pair
```

### Error Handling

Basic error handling using `!catch` syntax:

```javascript
mut Analog sensor = new Analog(0)

mut int value = sensor.read() !catch {
  print("Sensor failed")
}
```

### Built-in Functions

YS provides access to standard microcontroller functions:

- **Pin Control**: `pinMode()`, `digitalWrite()`, `digitalRead()`
- **Analog I/O**: `analogRead()`, `analogWrite()`
- **Timing**: `delay()`, `millis()`
- **Serial**: `print()` (outputs to serial)
- **Constants**: `HIGH`, `LOW`, `INPUT`, `OUTPUT`, `INPUT_PULLUP`

## Hardware Types

Ypsilon Script provides built-in hardware abstraction types that automatically handle pin configuration and provide clean, type-safe APIs for common hardware components.

### Digital I/O Types

#### Led
```javascript
mut Led statusLed = new Led(13)
mut Led dimmable = new Led(9, true)  // PWM-capable

statusLed.on()
statusLed.off()
statusLed.toggle()
dimmable.setBrightness(128)  // 0-255
```

#### RgbLed
```javascript
mut RgbLed rgb = new RgbLed(9, 10, 11)
mut RgbLed rgbAnode = new RgbLed(9, 10, 11, true)  // Common anode

rgb.red()
rgb.green()
rgb.blue()
rgb.yellow()
rgb.cyan()
rgb.magenta()
rgb.white()
rgb.orange()
rgb.purple()
rgb.pink()
rgb.set(255, 128, 64)  // Custom RGB
rgb.off()
```

#### Button
```javascript
mut Button btn = new Button(2)
mut Button customBtn = new Button(3, false, true)  // pullup, activeLow

if (btn.pressed()) { }
if (btn.released()) { }
if (btn.justPressed()) { }    // Edge detection
if (btn.justReleased()) { }   // Edge detection
```

#### Buzzer
```javascript
mut Buzzer buz = new Buzzer(8)
mut Buzzer toneBuz = new Buzzer(9, true)  // Tone-capable

buz.on()
buz.off()
buz.beep(500)  // Duration in ms
toneBuz.tone(440, 1000)  // Frequency, duration
toneBuz.noTone()
```

### Analog & PWM Types

#### Digital
```javascript
mut Digital pin = new Digital(7)

pin.high()
pin.low()
pin.toggle()
if (pin.isHigh()) { }
if (pin.isLow()) { }
```

#### Analog
```javascript
mut Analog sensor = new Analog(0)

mut int value = sensor.read()  // 0-1023
```

#### PWM
```javascript
mut PWM motor = new PWM(9)

motor.set(128)  // 0-255
mut int current = motor.get()
```

### Motor Control Types

#### Servo
```javascript
mut Servo servo = new Servo(9)
mut Servo customServo = new Servo(10, 1000, 2000)  // pin, minUs, maxUs

servo.attach(9)
servo.detach()
servo.writeAngle(90)  // 0-180 degrees
servo.writeMicroseconds(1500)
mut u16 angle = servo.readAngle()
mut u16 us = servo.readMicroseconds()
```

#### DCMotor
```javascript
mut DCMotor motor = new DCMotor(9, 8)        // PWM, DIR
mut DCMotor motor2 = new DCMotor(9, 8, 7)    // PWM, DIR1, DIR2

motor.setSpeed(150)   // -255 to 255
motor.forward(200)    // 0-255
motor.reverse(150)    // 0-255
motor.stop()
motor.brake()
```

#### StepperMotor
```javascript
mut StepperMotor stepper = new StepperMotor(2, 3, 200)  // step, dir, stepsPerRev

stepper.setSpeed(60)  // RPM
stepper.moveSteps(200)  // Positive or negative
mut i32 pos = stepper.position()
stepper.resetPosition()
```

#### Encoder
```javascript
mut Encoder enc = new Encoder(2, 3, 400)  // pinA, pinB, pulsesPerRev

mut i32 pos = enc.position()
enc.reset()
mut i32 speed = enc.rpm(1000)  // Window in ms
```

### Communication Types

#### I2C
```javascript
mut I2C bus = new I2C()
mut I2C i2c1 = new I2C(1)  // Bus number

bus.begin()
bus.write(0x50, [0x00, 0x01, 0x02])  // address, data
mut List response = bus.read(0x50, 4)  // address, length
mut List devices = bus.scan()  // Returns list of addresses
```

#### SPI
```javascript
mut SPI spi = new SPI()
mut SPI spi1 = new SPI(1)  // Bus number

spi.begin()
mut u8 response = spi.transfer(0x42)
mut List result = spi.transferBuffer([0x01, 0x02])
spi.setClock(1000000)  // Frequency in Hz
spi.setMode(0)  // 0-3
spi.setBitOrder(1)  // 0=LSB, 1=MSB
```

#### UART
```javascript
mut UART serial = new UART(115200)
mut UART debug = new UART(9600, 1)  // Baud, port

serial.print("Hello")
serial.println("World")
mut i16 data = serial.read()
mut u16 available = serial.available()
serial.flush()
```

### Multiplexer Types

#### Mux4, Mux8, Mux16, Mux32
```javascript
mut Mux4 mux4 = new Mux4(sigPin, s0, s1)
mut Mux8 mux8 = new Mux8(sigPin, s0, s1, s2)
mut Mux16 mux16 = new Mux16(sigPin, s0, s1, s2, s3)
mut Mux32 mux32 = new Mux32(sigPin, s0, s1, s2, s3, s4)

mux16.selectChannel(5)
mut int value = mux16.read(3)
mux16.enable()
mux16.disable()
```

### Sensor Types

#### TempSensor
```javascript
mut TempSensor temp = new TempSensor(A0)

mut float celsius = temp.readCelsius()
mut float fahrenheit = temp.readFahrenheit()
mut float kelvin = temp.readKelvin()
mut int raw = temp.readRaw()
```

#### HumiditySensor
```javascript
mut HumiditySensor humidity = new HumiditySensor(A1)

mut float percent = humidity.readPercent()
mut int raw = humidity.readRaw()
```

#### DistanceSensor
```javascript
mut DistanceSensor sonar = new DistanceSensor(trigPin, echoPin)

mut float cm = sonar.readCm()
mut float inches = sonar.readInches()
mut bool detected = sonar.inRange(5, 50)
```

#### LightSensor
```javascript
mut LightSensor ldr = new LightSensor(A0)

mut int value = ldr.read()
mut int percent = ldr.readPercent()
if (ldr.isDark()) { }
if (ldr.isBright()) { }
```

#### MotionSensor
```javascript
mut MotionSensor pir = new MotionSensor(2)

if (pir.detected()) { }
if (pir.isIdle(5000)) { }
mut u32 time = pir.timeSinceMotion()
```

#### Potentiometer
```javascript
mut Potentiometer pot = new Potentiometer(A0)

mut int value = pot.read()
mut int percent = pot.readPercent()
mut int mapped = pot.readMapped(0, 180)
```

#### Joystick
```javascript
mut Joystick joy = new Joystick(A0, A1, btnPin)

mut int x = joy.readX()
mut int y = joy.readY()
if (joy.isPressed()) { }
joy.calibrate()
```

#### RotaryEncoder
```javascript
mut RotaryEncoder enc = new RotaryEncoder(pinA, pinB, btnPin)

enc.update()
mut i32 pos = enc.position()
enc.reset()
if (enc.isPressed()) { }
```

### Display Types

#### LCD
```javascript
mut LCD display = new LCD(rs, en, d4, d5, d6, d7, 16, 2)

display.begin()
display.clear()
display.setCursor(0, 0)
display.print("Hello World")
display.backlight()
```

#### OLED
```javascript
mut OLED display = new OLED(128, 64)

display.begin()
display.clear()
display.setCursor(0, 0)
display.print("Hello")
display.drawLine(0, 0, 128, 64)
display.display()
```

#### NeoPixel
```javascript
mut NeoPixel strip = new NeoPixel(pin, numLeds)

strip.begin()
strip.setPixel(0, 255, 0, 0)  // Red
strip.fill(0, 0, 255)          // All blue
strip.setBrightness(128)
strip.show()
```

#### SevenSegment
```javascript
mut SevenSegment seg = new SevenSegment(a, b, c, d, e, f, g)

seg.display(5)
seg.clear()
```

### Actuator Types

#### Relay
```javascript
mut Relay relay = new Relay(7)

relay.on()
relay.off()
relay.toggle()
if (relay.isOn()) { }
```

#### Solenoid
```javascript
mut Solenoid sol = new Solenoid(6)

sol.activate()
sol.deactivate()
sol.pulse(100)  // 100ms pulse
```

#### Fan
```javascript
mut Fan cooler = new Fan(9)

cooler.on()
cooler.off()
cooler.setSpeed(200)  // 0-255
```

#### Pump
```javascript
mut Pump waterPump = new Pump(9)

waterPump.on()
waterPump.off()
waterPump.setSpeed(150)
```

#### Valve
```javascript
mut Valve valve = new Valve(8)

valve.open()
valve.close()
if (valve.isOpen()) { }
```

### Wireless Communication Types

#### Bluetooth
```javascript
mut Bluetooth bt = new Bluetooth(rxPin, txPin, 9600)

bt.begin()
if (bt.available()) { }
mut char data = bt.read()
bt.print("Hello")
```

#### WiFi
```javascript
mut WiFi wifi = new WiFi()

wifi.connect("SSID", "password")
if (wifi.isConnected()) { }
mut String ip = wifi.localIP()
mut int rssi = wifi.rssi()
```

#### LoRa
```javascript
mut LoRa lora = new LoRa(ssPin, rstPin, dioPin)

lora.begin(915000000)
lora.print("Hello LoRa")
if (lora.available()) { }
mut int rssi = lora.packetRssi()
```

#### NRF24
```javascript
mut NRF24 radio = new NRF24(cePin, csPin)

radio.begin()
radio.openWritingPipe(address)
radio.write(data, len)
if (radio.available()) { }
```

### Storage Types

#### SDCard
```javascript
mut SDCard sd = new SDCard(csPin)

sd.begin()
if (sd.exists("data.txt")) { }
sd.remove("old.txt")
sd.mkdir("/logs")
```

#### EEPROM
```javascript
mut EEPROM eeprom = new EEPROM(512)

mut u8 value = eeprom.read(0)
eeprom.write(0, 42)
eeprom.update(0, 42)  // Only writes if different
```

### Power Types

#### Battery
```javascript
mut Battery batt = new Battery(A0, 4.2, 3.0)

mut float voltage = batt.readVoltage()
mut int percent = batt.readPercent()
if (batt.isLow(20)) { }
```

#### Solar
```javascript
mut Solar panel = new Solar(voltagePin, currentPin)

mut float voltage = panel.readVoltage()
mut float current = panel.readCurrent()
mut float power = panel.readPower()
```

### Motor Driver Types

#### HBridge
```javascript
mut HBridge motor = new HBridge(in1, in2, enablePin)

motor.forward(200)
motor.reverse(150)
motor.stop()
motor.brake()
```

#### MotorDriver
```javascript
mut MotorDriver driver = new MotorDriver(pwmA, dirA, pwmB, dirB)

driver.setMotorA(255)
driver.setMotorB(-128)
driver.stopAll()
```

#### ServoDriver
```javascript
mut ServoDriver servos = new ServoDriver(0x40, 16)

servos.begin()
servos.setPWMFreq(50)
servos.setAngle(0, 90)
servos.setPulse(1, 1500)
```

### Timing Types

#### Timer
```javascript
mut Timer timer = new Timer()

timer.start(5000)  // 5 seconds
if (timer.isExpired()) { }
mut u32 remaining = timer.remaining()
timer.reset()
```

#### RTC
```javascript
mut RTC clock = new RTC()

clock.begin()
mut int hour = clock.hour()
mut int minute = clock.minute()
clock.setTime(12, 30, 0)
clock.setDate(25, 12, 2024)
```

### Audio Types

#### Speaker
```javascript
mut Speaker spk = new Speaker(8)

spk.tone(440)         // 440Hz
spk.tone(440, 500)    // 440Hz for 500ms
spk.beep(1000, 200)   // 1kHz for 200ms
spk.noTone()
```

#### Microphone
```javascript
mut Microphone mic = new Microphone(A0)

mut int level = mic.read()
mut int amplitude = mic.readAmplitude()
if (mic.isLoud()) { }
```

#### DFPlayer
```javascript
mut DFPlayer player = new DFPlayer(rxPin, txPin)

player.begin()
player.play(1)
player.pause()
player.setVolume(20)
player.playFolder(2, 5)
```

### Additional Sensor Types

#### PressureSensor
```javascript
mut PressureSensor pressure = new PressureSensor(A0)

mut float value = pressure.read()
mut int raw = pressure.readRaw()
```

#### TouchSensor
```javascript
mut TouchSensor touch = new TouchSensor(A0)

if (touch.isTouched()) { }
mut int value = touch.read()
touch.setThreshold(600)
```

#### SoundSensor
```javascript
mut SoundSensor sound = new SoundSensor(A0)

mut int level = sound.read()
if (sound.isLoud()) { }
```

#### GasSensor
```javascript
mut GasSensor gas = new GasSensor(A0)

mut int level = gas.read()
if (gas.detected()) { }
gas.setThreshold(400)
```

#### ColorSensor
```javascript
mut ColorSensor color = new ColorSensor(s0, s1, s2, s3, out)

mut int red = color.readRed()
mut int green = color.readGreen()
mut int blue = color.readBlue()
```

#### Accelerometer
```javascript
mut Accelerometer accel = new Accelerometer(xPin, yPin, zPin)

mut float x = accel.readX()
mut float y = accel.readY()
mut float z = accel.readZ()
```

#### Gyroscope
```javascript
mut Gyroscope gyro = new Gyroscope(xPin, yPin, zPin)

mut float x = gyro.readX()
mut float y = gyro.readY()
mut float z = gyro.readZ()
```

#### GPS
```javascript
mut GPS gps = new GPS(rxPin, txPin)

gps.begin(9600)
if (gps.update()) {
    mut float lat = gps.latitude()
    mut float lon = gps.longitude()
    mut int sats = gps.satellites()
}
```

### Hardware Type Features

- **Automatic Setup**: Pin modes and hardware initialization handled automatically
- **Type Safety**: Compile-time checking prevents using wrong methods on wrong types
- **No Manual pinMode**: Hardware types configure pins automatically
- **Clean API**: Intuitive method names matching hardware behavior
- **Multiple Instances**: Create as many instances as needed for your hardware
- **Auto-Include**: Required libraries (Servo.h, Wire.h, SPI.h) included automatically
- **60+ Hardware Types**: Comprehensive coverage for sensors, displays, actuators, communication, and more

## Syntax Summary

YS syntax:

- **Braces required**: All blocks use `{` and `}`
- **Semicolons optional**: Not required, only when multiple statements on one line
- **Strong static typing**: All variables and functions must be typed
- **`fn` keyword**: Modern function syntax (also supports `function`)
- **`self` keyword**: Class member access (also supports `this`)
- **`mut` keyword**: Mutable variables (immutable by default with `const`)
- **Enums**: Rust-style enumerations
- **Structs**: C++-style data structures
- **Classes**: OOP with constructors and methods
- **`new` keyword**: Object instantiation
- **Hardware types**: 60+ built-in types with automatic setup including:
  - Digital I/O: `Digital`, `Led`, `RgbLed`, `Button`, `Buzzer`
  - Analog & PWM: `Analog`, `PWM`
  - Motors: `Servo`, `DCMotor`, `StepperMotor`, `Encoder`
  - Communication: `I2C`, `SPI`, `UART`, `Bluetooth`, `WiFi`, `LoRa`, `NRF24`
  - Sensors: `TempSensor`, `HumiditySensor`, `DistanceSensor`, `LightSensor`, `MotionSensor`, `GPS`
  - Displays: `LCD`, `OLED`, `NeoPixel`, `SevenSegment`, `TFT`
  - Actuators: `Relay`, `Solenoid`, `Fan`, `Pump`, `Valve`
  - Motor Drivers: `HBridge`, `MotorDriver`, `ServoDriver`
  - Multiplexers: `Mux4`, `Mux8`, `Mux16`, `Mux32`
  - Storage: `SDCard`, `EEPROM`, `Flash`
  - Power: `Battery`, `Solar`
  - Timing: `Timer`, `RTC`
  - Audio: `Speaker`, `Microphone`, `DFPlayer`
- **Unit literals**: Time, frequency, angle, distance, speed units
- **Range constraints**: `in min...max` for automatic bounds
- **Type conversion**: `.as<type>()` for explicit casting
- **Collections**: `List` and `Map` types
- **Event blocks**: `on start {}`, `on loop {}`
- **Match expressions**: Pattern matching with `=>`
- **Switch statements**: C++-style with braces
- **Repeat loop**: `repeat(count) {}` for fixed iterations
- **Tasks**: Periodic (`every`) and background execution
- **Signals**: Event-driven with `signal`/`emit`
- **Reactive vars**: Volatile variables with `react`
- **Time literals**: `ms`, `s`, `us`, `min`, `h`
- **Error handling**: `!catch` for error propagation
- **Atomic blocks**: Interrupt-safe with `atomic {}`
- **Library loading**: `load <lib>` for C++ headers, `load <file.ys> as name` for YS modules
- **Inline C++**: `@cpp {}` for direct C++ code

## Examples

### Complete Example

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

enum Mode { AUTO, MANUAL }

struct Point {
  int x
  int y
}

# Hardware types with automatic setup
mut Led statusLed = new Led(13)
mut Analog sensor = new Analog(0)

class Motor {
    mut int speed
    
    constructor(int speed) { 
        self.speed = speed 
    }
    
    fn run() { 
        print("Motor running at speed:")
        print(self.speed)
    }
    
    fn setSpeed(int newSpeed) {
        self.speed = newSpeed
    }
}

mut Motor motor = new Motor(100)
mut Mode currentMode = AUTO
mut Point position = Point { x: 0, y: 0 }

on start {
    # No pinMode needed - hardware types handle it
    motor.run()
    statusLed.on()
    print("Initialized")
}

on loop {
    match currentMode {
        AUTO => {
            motor.setSpeed(200)
            statusLed.on()
            print("Auto mode")
        },
        MANUAL => {
            motor.setSpeed(100)
            statusLed.off()
            print("Manual mode")
        }
    }
    
    mut int level = sensor.read() / 256
    
    switch level {
        case 1 { print("Low power") }
        case 2 { print("Medium power") }
        case 3 { print("High power") }
        default { print("Max power") }
    }
    
    # Blink status LED using repeat
    repeat(2) {
        statusLed.toggle()
        wait 100ms
    }
    
    wait 1s
}
```

### Enum Example

```javascript
@main

enum State { IDLE, RUNNING, STOPPED }

mut State machineState = IDLE

fn updateState(State newState) {
    machineState = newState
}

on loop {
    match machineState {
        IDLE => print("Waiting..."),
        RUNNING => print("Running..."),
        STOPPED => print("Stopped")
    }
}
```

### Struct Example

```javascript
@main

struct Config {
    int threshold
    float sensitivity
    bool enabled
}

mut Config config = Config {
    threshold: 512,
    sensitivity: 0.75,
    enabled: true
}

fn checkThreshold(int value) -> bool {
    return value > config.threshold
}
```

## CLI Usage

```bash
# Compile a YS file to C++
ysc input.ys
ysc compile input.ys

# Upload to board (requires Arduino CLI)
ysc upload input.ys

# Upload with code retrieval enabled (experimental)
ysc upload input.ys --r

# Compile, upload, and monitor serial (requires Arduino CLI)
ysc run input.ys

# Run with code retrieval enabled (experimental)
ysc run input.ys --retrieve

# Specify output file
ysc input.ys output.ino

# Show help
ysc --help

# Show version
ysc --version

# Show config diagnostics
ysc input.ys --config
```

### Code Retrieval Feature (Experimental)

The `--r` or `--retrieve` flag enables experimental code retrieval functionality:

```bash
ysc upload blink.ys --r
```

**Important Notes:**
- ⚠️ **Experimental**: This feature is in early development
- ⚠️ **Low-memory boards**: Use with caution on Arduino Uno and similar boards
- The board will listen for retrieval requests after reboot
- Requires firmware support in the generated code
- May cause instability on boards with limited memory

**Warning for Arduino Uno:**
When using `--r` on low-memory boards like Arduino Uno, you'll see:
```
⚠ Experimental Feature: Code retrieval on arduino_uno.
   Low-memory boards like Arduino Uno have limited resources.
   Use at your own risk. This feature may cause instability.
```

## Board Configuration

YS requires a `config {}` block in files with `@main` for board-specific settings:

```javascript
config {
  board: arduino_uno,    # Board type: arduino_uno, arduino_nano, arduino_mega, 
                         #             arduino_leonardo, esp32, esp8266
  clock: 16MHz,          # CPU clock frequency
  uart: on,              # Enable serial monitor (on/off)
  port: auto             # Serial port (auto-detect or specify like COM3, /dev/ttyUSB0)
}
```

**Required Fields for @main Files:**
- `board`: Board type (e.g., arduino_uno, esp32)
- `clock`: CPU clock frequency (e.g., 16MHz, 240MHz)

**Optional Fields:**
- `uart`: Enable/disable serial communication (default: off)
- `port`: Serial port for upload (default: auto)

The config system automatically:
- Maps board types to Arduino CLI FQBN
- Selects correct PWM implementation (analogWrite for AVR, LEDC for ESP)
- Detects serial ports for upload
- Configures build properties
- Validates all required fields are present

**Valid Board Names:**
- `arduino_uno` - Arduino Uno (ATmega328P)
- `arduino_nano` - Arduino Nano
- `arduino_mega` - Arduino Mega 2560
- `arduino_leonardo` - Arduino Leonardo
- `esp32` - ESP32 boards
- `esp8266` - ESP8266 boards

**Legacy Support:**
The old `mpu` and `cpu` field names are still supported for backward compatibility but are deprecated. Use `board` instead.

See [CONFIG.md](CONFIG.md) for detailed documentation.

## How It Works

1. **Lexer**: Tokenizes YS source code
2. **Parser**: Builds an Abstract Syntax Tree (AST) with type information
3. **Type Checker**: Validates types and structure
4. **Code Generator**: Transpiles AST to C++
5. **Output**: Standard C++ code ready for compilation

## Syntax Highlights

- **Brace-based blocks** (like C/C++/Rust)
- **No semicolons**: Clean, readable code
- **`fn` keyword**: For function definitions
- **`self` keyword**: For class member access (not `this`)
- **`mut` keyword**: Explicit mutability
- **Strong typing**: All variables and functions must declare types
- **Enums**: Rust-style enumerations
- **Structs**: C++-style data structures
- **Pattern matching**: `match` expressions for control flow
- **Switch statements**: C++-style switch with braces
- **Event blocks**: `on <event> {}` syntax
- **OOP support**: Classes, constructors, methods, and object instantiation
- **Module system**: Load YS files as namespaced modules with `load <file.ys> as name`
- **No async**: Async/await not supported yet

## Why Ypsilon Script?

**Traditional approach:**
```cpp
// Verbose, less structured
const int LED_PIN = 13;
int state = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  switch(state) {
    case 0:
      digitalWrite(LED_PIN, HIGH);
      break;
    case 1:
      digitalWrite(LED_PIN, LOW);
      break;
  }
  delay(1000);
}
```

**Ypsilon Script:**
```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

# Clean, type-safe, expressive with hardware types
enum LedState { ON, OFF }

# Hardware type with automatic pinMode
mut Led led = new Led(13)
mut LedState state = ON

on start {
    # No pinMode needed - Led type handles it
    print("System ready")
}

on loop {
    match state {
        ON => led.on(),
        OFF => led.off()
    }
    wait 1s
}
```

YS provides:
- **Better type safety** with strong static typing
- **Cleaner syntax** with no semicolons and modern features
- **Better code organization** with classes, structs, and enums
- **Pattern matching** for expressive control flow
- **Event-driven syntax** that's intuitive and readable

## Development

```bash
# Clone the repository
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script

# Install dependencies
npm install

# Run tests
npm test

# Try examples (if implemented)
node bin/ysc.js examples/motor.ys
```

## Project Structure

```
ypsilon-script/
├── bin/
│   └── ysc.js          # CLI tool
├── src/
│   ├── lexer.js        # Tokenizer with YS keywords
│   ├── parser.js       # AST builder with full YS support
│   ├── codegen.js      # C++ code generator
│   ├── compiler.js     # Main compiler
│   └── index.js        # Package entry point
├── examples/
│   └── ...             # YS example files
└── tests/
    └── ...             # Test files
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details

## Author

Youssef Charfi

## Links

- GitHub: https://github.com/ycharfi09/ypsilon-script
- Issues: https://github.com/ycharfi09/ypsilon-script/issues
