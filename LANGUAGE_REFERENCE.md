# Ypsilon Script Language Reference

## Overview

Ypsilon Script (YS) is a simple high-level language that compiles to C++ for microcontrollers. It features strong static typing, modern syntax with braces, and no semicolons.

## Syntax Features

- **Required Braces**: All blocks use `{` and `}`
- **No Semicolons**: Code is cleaner without semicolons
- **`@main` Entry Point**: Every program must declare an entry file with `@main`
- **`fn` keyword**: For function definitions
- **`self` keyword**: For class member access (not `this`)
- **`mut` keyword**: Explicit mutability for variables
- **Event blocks**: `on <event> {}` syntax
- **Pattern matching**: `match` expressions like Rust
- **Switch statements**: C++-style with braces

## Entry Point

Every YS program must have exactly one file that declares itself as the entry point using the `@main` directive:

```javascript
@main

# Your program code...
```

**Rules:**
- `@main` must be at the top of the file (first non-comment line)
- Only one file in your project can have `@main`
- The main file cannot be named `main.ys` - use descriptive names like `app.ys`, `robot.ys`, or `project.ys`
- Other files become modules and don't need `@main`

**Project Structure:**

Single file project:
```
blink.ys          # Has @main
```

Multi-file project (recommended for larger projects):
```
my-robot/
  ├── robot.ys         # Has @main (main entry point)
  ├── motors.ys        # Module (no @main)
  └── sensors.ys       # Module (no @main)
```

**Compilation:**

```bash
# Compile single file
ysc blink.ys

# Compile project folder (finds @main automatically)
ysc my-robot/

# Compile module without @main (for testing)
ysc motors.ys --skip-main
```

**Error Messages:**
- **No @main found**: `Error: No @main directive found in <file>. Every Ypsilon Script project needs exactly one file with @main at the top.`
- **Multiple @main files**: `Error: Multiple entry points detected in folder. Only one file per project can have @main.`
- **main.ys filename**: `Error: The main file cannot be named 'main.ys'. Suggestion: Rename your file to something descriptive like 'app.ys', 'project.ys', or '<project-name>.ys'.`
- **Compiling without @main**: Shows a warning but allows compilation with `--skip-main` flag

## Type System

All variables and functions must be explicitly typed.

### Built-in Types

- `int` - Integer
- `float` - Floating-point number
- `bool` - Boolean (true/false)
- `string` - String type
- **Width-specific integers**: `u8`, `u16`, `u32`, `u64` (unsigned), `i8`, `i16`, `i32`, `i64` (signed)
- **Type aliases**: `byte` (u8), `short` (i16)
- **Float types**: `f32` (32-bit float), `f64` (64-bit double)
- **Hardware types**: `Digital`, `Analog`, `PWM`, `Led`, `Button`, `Servo`, etc.
- **Collections**: `List`, `Map`
- User-defined types: enums, structs, classes

## Variables

### Constant Declaration
```javascript
const int LED_PIN = 13
const float PI = 3.14159
const bool DEBUG = true
```

### Mutable Variable Declaration
```javascript
mut int counter = 0
mut float temperature = 23.5
mut bool isActive = false

// Width-specific types
mut u8 byteValue = 255
mut i32 signedInt = -100000
mut f32 singleFloat = 3.14
mut f64 doubleFloat = 3.141592653589793
```

### Array Declaration
Arrays are declared with literal syntax and compile to native C++ arrays:

```javascript
// Array literals with automatic size inference
mut u8 bytes = [1, 2, 3, 4, 5]
const i32 values = [10, 20, 30]
mut f32 floats = [1.5, 2.5, 3.5]
mut f64 doubles = [3.14159, 2.71828]

// Array access with subscript
mut u8 first = bytes[0]
bytes[1] = 10
mut i32 sum = values[0] + values[1]
```

**Features:**
- Automatic size inference from initializer list
- Compiles to native C++ arrays (e.g., `uint8_t bytes[5] = {1, 2, 3, 4, 5}`)
- Subscript access for read/write operations
- Works with all integer and float types

### Type Annotations
All variables must have explicit type annotations in the format `type name`:
```javascript
mut int value = 100
const int threshold = 512
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

mut Mode currentMode = AUTO
mut State systemState = IDLE
```

### Usage
```javascript
# Assignment
currentMode = MANUAL

# Comparison
if (currentMode == AUTO) {
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
    type1 field1
    type2 field2
    type3 field3
}
```

### Example
```javascript
struct Point { 
    int x
    int y
}

struct Config {
    int threshold
    float sensitivity
    bool enabled
}

struct Sensor {
    int pin
    int value
}

mut Point position = Point { x: 10, y: 20 }
mut Config config = Config { threshold: 512, sensitivity: 0.75, enabled: true }
```

### Initialization
```javascript
mut Point position = Point { x: 0, y: 0 }
mut Config settings = Config {
    threshold: 512,
    sensitivity: 0.75,
    enabled: true
}
```

### Access
```javascript
# Read field
mut int xValue = position.x

# Update field  
position.x = 100
position.y = 200
```

## Functions

Functions are defined using the `fn` keyword.

### Syntax
```javascript
fn <name>(<type1> <param1>, <type2> <param2>, ...) -> <returnType> {
    # function body
}

# For void functions (no return)
fn <name>(<type1> <param1>, ...) {
    # function body
}
```

### Examples
```javascript
# Function with return type
fn add(int a, int b) -> int {
    return a + b
}

# Void function (no return value)
fn blink(int pin, int duration) {
    digitalWrite(pin, HIGH)
    delay(duration)
    digitalWrite(pin, LOW)
    delay(duration)
}

# Function returning bool
fn isAboveThreshold(int value, int threshold) -> bool {
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

### Repeat Loop

The `repeat` loop executes a block of code a fixed number of times (modern alternative to for loops when you just need to repeat an action):

```javascript
repeat(<count>) {
    # code
}
```

Examples:
```javascript
# Blink LED 3 times
repeat(3) {
    digitalWrite(LED_PIN, HIGH)
    wait 500ms
    digitalWrite(LED_PIN, LOW)
    wait 500ms
}

# Flash indicator 5 times quickly
repeat(5) {
    statusLed.toggle()
    wait 100ms
}

# Send pulse sequence
const int PULSE_COUNT = 10
repeat(PULSE_COUNT) {
    sendPulse()
    wait 50ms
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

## Hardware Types

YS provides built-in hardware abstraction types that automatically handle pin configuration and provide clean, type-safe APIs for common hardware components.

### Digital I/O Types

#### Digital
Basic digital I/O operations with automatic pinMode configuration:

```javascript
mut Digital pin = new Digital(7)

pin.high()        # Set HIGH (auto-configures OUTPUT)
pin.low()         # Set LOW
pin.toggle()      # Toggle state
pin.write(HIGH)   # Write value

# Reading (auto-configures INPUT)
if (pin.isHigh()) { }
if (pin.isLow()) { }
mut int value = pin.read()
```

#### Led
LED control with PWM support for brightness:

```javascript
mut Led statusLed = new Led(13)
mut Led dimmable = new Led(9, true)  # PWM-capable

statusLed.on()
statusLed.off()
statusLed.toggle()
dimmable.setBrightness(128)  # 0-255
```

#### RgbLed
RGB LED with predefined colors and custom RGB values:

```javascript
mut RgbLed rgb = new RgbLed(9, 10, 11)
mut RgbLed rgbAnode = new RgbLed(9, 10, 11, true)  # Common anode

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
rgb.set(255, 128, 64)  # Custom RGB
rgb.off()
```

#### Button
Button input with debouncing and edge detection:

```javascript
mut Button btn = new Button(2)
mut Button customBtn = new Button(3, false, true)  # pullup, activeLow

if (btn.pressed()) { }
if (btn.released()) { }
if (btn.justPressed()) { }    # Edge detection
if (btn.justReleased()) { }   # Edge detection
```

#### Buzzer
Buzzer control with tone generation:

```javascript
mut Buzzer buz = new Buzzer(8)
mut Buzzer toneBuz = new Buzzer(9, true)  # Tone-capable

buz.on()
buz.off()
buz.beep(500)  # Duration in ms
toneBuz.tone(440, 1000)  # Frequency, duration
toneBuz.noTone()
```

### Analog & PWM Types

#### Analog
Analog input reading:

```javascript
mut Analog sensor = new Analog(0)

mut int value = sensor.read()  # Returns 0-1023
```

#### PWM
PWM output control with automatic board detection:

```javascript
mut PWM motor = new PWM(9)

motor.set(128)  # 0-255 (auto-configures OUTPUT)
mut int current = motor.get()
```

The PWM type automatically detects board type:
- AVR boards (Uno, Nano, Mega): Uses `analogWrite()`
- ESP boards (ESP32, ESP8266): Uses LEDC functions

### Motor Control Types

#### Servo
Servo motor control with angle and microsecond positioning:

```javascript
mut Servo servo = new Servo(9)
mut Servo customServo = new Servo(10, 1000, 2000)  # pin, minUs, maxUs

servo.attach(9)
servo.detach()
servo.writeAngle(90)  # 0-180 degrees
servo.writeMicroseconds(1500)
mut u16 angle = servo.readAngle()
mut u16 us = servo.readMicroseconds()
```

#### DCMotor
DC motor control with direction and speed:

```javascript
mut DCMotor motor = new DCMotor(9, 8)        # PWM, DIR
mut DCMotor motor2 = new DCMotor(9, 8, 7)    # PWM, DIR1, DIR2

motor.setSpeed(150)   # -255 to 255
motor.forward(200)    # 0-255
motor.reverse(150)    # 0-255
motor.stop()
motor.brake()
```

#### StepperMotor
Stepper motor control with position tracking:

```javascript
mut StepperMotor stepper = new StepperMotor(2, 3, 200)  # step, dir, stepsPerRev

stepper.setSpeed(60)  # RPM
stepper.moveSteps(200)  # Positive or negative
mut i32 pos = stepper.position()
stepper.resetPosition()
```

#### Encoder
Rotary encoder with position and speed tracking:

```javascript
mut Encoder enc = new Encoder(2, 3, 400)  # pinA, pinB, pulsesPerRev

mut i32 pos = enc.position()
enc.reset()
mut i32 speed = enc.rpm(1000)  # Window in ms
```

### Communication Types

#### I2C
I2C bus communication:

```javascript
mut I2C bus = new I2C()
mut I2C i2c1 = new I2C(1)  # Bus number

bus.begin()
bus.write(0x50, [0x00, 0x01, 0x02])  # address, data
mut List response = bus.read(0x50, 4)  # address, length
mut List devices = bus.scan()  # Returns list of addresses
```

#### SPI
SPI bus communication:

```javascript
mut SPI spi = new SPI()
mut SPI spi1 = new SPI(1)  # Bus number

spi.begin()
mut u8 response = spi.transfer(0x42)
mut List result = spi.transferBuffer([0x01, 0x02])
spi.setClock(1000000)  # Frequency in Hz
spi.setMode(0)  # 0-3
spi.setBitOrder(1)  # 0=LSB, 1=MSB
```

#### UART
Serial UART communication:

```javascript
mut UART serial = new UART(115200)
mut UART debug = new UART(9600, 1)  # Baud, port

serial.print("Hello")
serial.println("World")
mut i16 data = serial.read()
mut u16 available = serial.available()
serial.flush()
```

### Multiplexer Types

YS provides multiplexer types for reading multiple analog signals through a single pin:

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

YS provides built-in types for common sensors:

#### TempSensor
```javascript
mut TempSensor temp = new TempSensor(A0)

mut float celsius = temp.readCelsius()
mut float fahrenheit = temp.readFahrenheit()
mut float kelvin = temp.readKelvin()
```

#### HumiditySensor
```javascript
mut HumiditySensor humidity = new HumiditySensor(A1)

mut float percent = humidity.readPercent()
```

#### DistanceSensor (Ultrasonic)
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
if (ldr.isDark()) { }
if (ldr.isBright()) { }
```

#### MotionSensor (PIR)
```javascript
mut MotionSensor pir = new MotionSensor(2)

if (pir.detected()) { }
if (pir.isIdle(5000)) { }
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
```

#### RotaryEncoder
```javascript
mut RotaryEncoder enc = new RotaryEncoder(pinA, pinB, btnPin)

enc.update()
mut i32 pos = enc.position()
enc.reset()
```

#### GPS
```javascript
mut GPS gps = new GPS(rxPin, txPin)

gps.begin(9600)
if (gps.update()) {
    mut float lat = gps.latitude()
    mut float lon = gps.longitude()
}
```

### Display Types

YS provides types for common displays:

#### LCD
```javascript
mut LCD display = new LCD(rs, en, d4, d5, d6, d7, 16, 2)

display.begin()
display.clear()
display.setCursor(0, 0)
display.print("Hello World")
```

#### OLED
```javascript
mut OLED display = new OLED(128, 64)

display.begin()
display.clear()
display.print("Hello")
display.display()
```

#### NeoPixel
```javascript
mut NeoPixel strip = new NeoPixel(pin, numLeds)

strip.begin()
strip.setPixel(0, 255, 0, 0)  # Red
strip.fill(0, 0, 255)          # All blue
strip.show()
```

#### SevenSegment
```javascript
mut SevenSegment seg = new SevenSegment(a, b, c, d, e, f, g)

seg.display(5)
seg.clear()
```

### Actuator Types

YS provides types for controlling actuators:

#### Relay
```javascript
mut Relay relay = new Relay(7)

relay.on()
relay.off()
relay.toggle()
```

#### Solenoid
```javascript
mut Solenoid sol = new Solenoid(6)

sol.activate()
sol.deactivate()
sol.pulse(100)  # 100ms pulse
```

#### Fan
```javascript
mut Fan cooler = new Fan(9)

cooler.on()
cooler.setSpeed(200)  # 0-255
```

#### Pump
```javascript
mut Pump waterPump = new Pump(9)

waterPump.on()
waterPump.setSpeed(150)
```

#### Valve
```javascript
mut Valve valve = new Valve(8)

valve.open()
valve.close()
```

### Wireless Communication Types

YS provides types for wireless communication:

#### Bluetooth
```javascript
mut Bluetooth bt = new Bluetooth(rxPin, txPin, 9600)

bt.begin()
if (bt.available()) { }
bt.print("Hello")
```

#### WiFi
```javascript
mut WiFi wifi = new WiFi()

wifi.connect("SSID", "password")
if (wifi.isConnected()) { }
mut String ip = wifi.localIP()
```

#### LoRa
```javascript
mut LoRa lora = new LoRa(ssPin, rstPin, dioPin)

lora.begin(915000000)
lora.print("Hello LoRa")
```

#### NRF24
```javascript
mut NRF24 radio = new NRF24(cePin, csPin)

radio.begin()
radio.write(data, len)
```

### Storage Types

YS provides types for data storage:

#### SDCard
```javascript
mut SDCard sd = new SDCard(csPin)

sd.begin()
if (sd.exists("data.txt")) { }
```

#### EEPROM
```javascript
mut EEPROM eeprom = new EEPROM(512)

mut u8 value = eeprom.read(0)
eeprom.write(0, 42)
```

### Power Types

YS provides types for power management:

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
mut float power = panel.readPower()
```

### Motor Driver Types

YS provides types for motor control:

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
servos.setAngle(0, 90)
```

### Module-Specific Hardware Types

YS also provides hardware types that map directly to specific IC modules commonly used in hobbyist and professional projects:

#### Module-Specific Motor Drivers

##### L298N
```javascript
mut L298N motor = new L298N(9, 8)

motor.forward(200)
motor.reverse(150)
motor.stop()
```

##### TB6612FNG
```javascript
mut TB6612FNG driver = new TB6612FNG(3, 4, 5, 6)

driver.setMotorA(255)
driver.setMotorB(-128)
driver.stopAll()
```

##### PCA9685
```javascript
mut PCA9685 servos = new PCA9685(0, 50)

servos.begin()
servos.setAngle(0, 90)
```

#### Module-Specific Sensors

##### DHT11/DHT22
```javascript
mut DHT11 humidity = new DHT11(2)
mut DHT22 humidity22 = new DHT22(3)

humidity.begin()
mut float temp = humidity.readTemperature()
mut float hum = humidity.readHumidity()
```

##### DS18B20
```javascript
mut DS18B20 temp = new DS18B20(2)

temp.begin()
mut float celsius = temp.readCelsius()
```

##### HC_SR04
```javascript
mut HC_SR04 sonar = new HC_SR04(9, 10)

mut float dist = sonar.readCm()
mut bool inRange = sonar.inRange(5, 50)
```

##### MPU6050
```javascript
mut MPU6050 accel = new MPU6050(0)

accel.begin()
mut float ax = accel.readAccelX()
mut float gx = accel.readGyroX()
```

##### BMP280
```javascript
mut BMP280 pressure = new BMP280(0)

pressure.begin()
mut float p = pressure.readPressure()
mut float alt = pressure.readAltitude()
```

#### Module-Specific Displays

##### SSD1306
```javascript
mut SSD1306 oled = new SSD1306(0, 128, 64)

oled.begin()
oled.clear()
oled.print("Hello")
oled.display()
```

##### WS2812
```javascript
mut WS2812 strip = new WS2812(6, 30)

strip.begin()
strip.setPixel(0, 255, 0, 0)
strip.fill(0, 0, 255)
strip.show()
```

##### TM1637
```javascript
mut TM1637 seg = new TM1637(2, 3)

seg.begin()
seg.setBrightness(5)
seg.displayNumber(1234)
```

#### Module-Specific Wireless

##### HC05
```javascript
mut HC05 bt = new HC05(10, 11, 9600)

bt.begin()
if (bt.available()) { }
bt.println("Hello Bluetooth")
```

##### NRF24L01
```javascript
mut NRF24L01 radio = new NRF24L01(9, 10)

radio.begin()
radio.startListening()
```

##### SX1278
```javascript
mut SX1278 lora = new SX1278(10, 9, 2)

lora.begin(915000000)
lora.print("Hello LoRa")
```

#### Module-Specific Timing

##### DS3231
```javascript
mut DS3231 rtc = new DS3231(0)

rtc.begin()
mut int h = rtc.hour()
mut int m = rtc.minute()
mut float temp = rtc.readTemperature()
```

### Timing Types

YS provides types for timing:

#### Timer
```javascript
mut Timer timer = new Timer()

timer.start(5000)  # 5 seconds
if (timer.isExpired()) { }
mut u32 remaining = timer.remaining()
```

#### RTC
```javascript
mut RTC clock = new RTC()

clock.begin()
mut int hour = clock.hour()
mut int minute = clock.minute()
```

### Audio Types

YS provides types for audio:

#### Speaker
```javascript
mut Speaker spk = new Speaker(8)

spk.tone(440)
spk.tone(440, 500)  # 440Hz for 500ms
spk.noTone()
```

#### Microphone
```javascript
mut Microphone mic = new Microphone(A0)

mut int level = mic.read()
if (mic.isLoud()) { }
```

#### DFPlayer
```javascript
mut DFPlayer player = new DFPlayer(rxPin, txPin)

player.begin()
player.play(1)
player.setVolume(20)
```

### Hardware Type Features

- **Automatic Setup**: Pin modes and hardware initialization handled automatically
- **Type Safety**: Compile-time checking prevents using wrong methods
- **No Manual pinMode**: Hardware types configure pins automatically
- **Clean API**: Intuitive method names matching hardware behavior
- **Multiple Instances**: Create as many instances as needed
- **Auto-Include**: Required libraries (Servo.h, Wire.h, SPI.h) included automatically
- **100+ Hardware Types**: Comprehensive coverage for sensors, displays, actuators, communication, and more
- **Module-Specific Types**: Direct support for popular ICs like TB6612FNG, L298N, PCA9685, DHT11, DS18B20, MPU6050, SSD1306, and more

## Built-in Functions

### Pin Control (Legacy - Use Hardware Types Instead)
```javascript
pinMode(pin: int, mode: int)
digitalWrite(pin: int, value: int)
mut value: int = digitalRead(pin)
```

**Note**: For new code, prefer using hardware types like `Digital`, `Led`, `Button` which handle pinMode automatically.

### Analog I/O (Legacy - Use Hardware Types Instead)
```javascript
mut value: int = analogRead(pin)    # 0-1023
analogWrite(pin: int, value: int)   # 0-255 (PWM)
```

**Note**: For new code, prefer using `Analog` and `PWM` types which provide cleaner APIs.

### Timing
```javascript
delay(milliseconds: int)
wait <time>  # Modern syntax: wait 500ms, wait 2s
mut time: int = millis()
```

### Serial Communication
```javascript
print(value)     # Prints value
print("Hello")   # Prints string
```

**Note**: For more control, use the `UART` hardware type.

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

# Hardware instances with automatic setup
mut Led statusLed = new Led(13)
mut Analog sensor = new Analog(0)

class Motor {
  mut int speed
  const int maxSpeed
  
  constructor(int initialSpeed, int max) {
    self.speed = initialSpeed
    self.maxSpeed = max
  }
  
  fn run() {
    print("Motor running at:")
    print(self.speed)
  }
  
  fn setSpeed(int newSpeed) {
    if (newSpeed <= self.maxSpeed) {
      self.speed = newSpeed
    } else {
      self.speed = self.maxSpeed
    }
  }
}

mut Motor motor = new Motor(100, 255)
mut Mode mode = AUTO
mut Point position = Point { x: 0, y: 0 }

on start {
  # No pinMode needed - hardware types handle it automatically
  motor.run()
  print("System initialized")
}

on loop {
  match mode {
    AUTO => {
      motor.setSpeed(200)
      statusLed.on()
    },
    MANUAL => {
      motor.setSpeed(100)
      statusLed.off()
    }
  }
  
  mut int sensorValue = sensor.read()
  mut int level = sensorValue / 256
  
  switch level {
    case 0 { print("Very low") }
    case 1 { print("Low") }
    case 2 { print("Medium") }
    case 3 { print("High") }
    default { print("Very high") }
  }
  
  # Flash LED 3 times using repeat
  repeat(3) {
    statusLed.toggle()
    wait 100ms
  }
  
  wait 1s
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
3. **Use hardware types**: Prefer `Led`, `Button`, `PWM`, etc. over manual `pinMode` and `digitalWrite`
4. **Use `self` in classes**: For accessing instance members
5. **Use enums for states**: Better than magic numbers or strings
6. **Use structs for data**: Group related data together
7. **Use match for enums**: More expressive than if-else chains
8. **Use `repeat` for fixed iterations**: Cleaner than for loops when you just need to repeat an action
9. **Use time literals**: `wait 500ms` instead of `delay(500)`
10. **Keep functions small**: One task per function
11. **Add comments**: Use `#` to explain what your code does
12. **Use const for values that don't change**: Makes intent clear
13. **Use event blocks**: `on start {}` and `on loop {}` for main handlers
14. **Include @main and config**: Every program needs `@main` and a config block

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

## Future Features

Planned for future versions:
- Arrays and collections
- String operations
- Async/await support
- More advanced pattern matching
- Inheritance and polymorphism
- Interfaces/traits

## Advanced Features

### Interrupts

Interrupt handlers allow you to respond instantly to hardware events:

```javascript
# Basic interrupt syntax
interrupt on PIN# (rising|falling|change|low|high) {
  # interrupt handler code
}

# Named interrupt for clarity
interrupt myISR on PIN# mode {
  # interrupt handler code
}
```

#### Interrupt Modes

- `rising` - Trigger on rising edge (LOW to HIGH)
- `falling` - Trigger on falling edge (HIGH to LOW)
- `change` - Trigger on any change
- `low` - Trigger when pin is LOW
- `high` - Trigger when pin is HIGH

#### Example

```javascript
alias ENCODER_PIN = 2
react mut pulseCount: int = 0

interrupt encoderISR on ENCODER_PIN rising {
  pulseCount = pulseCount + 1
}

on start {
  pinMode(ENCODER_PIN, INPUT_PULLUP)
}

on loop {
  print("Pulses:")
  print(pulseCount)
  delay(1000)
}
```

#### ISR Restrictions

For safety and performance, interrupt handlers have restrictions:

**Allowed operations:**
- Variable assignment
- Arithmetic operations
- Updating reactive variables
- Emitting signals

**Forbidden operations:**
- `print()` - Serial communication is too slow
- `delay()` - Blocks other interrupts
- `wait` - Blocking operations
- Loops (`while`, `for`) - Could take too long
- Function calls (unless marked `@ininterrupt` safe - future feature)

**Variable Safety:**

Variables used in interrupts are automatically marked `volatile`:

```javascript
mut int counter = 0  # Used in ISR

interrupt on 2 rising {
  counter = counter + 1  # counter is marked volatile
}

# Compiles to: volatile int counter = 0;
```

Reactive variables are already volatile:

```javascript
react mut rpm: int = 0  # Always volatile

interrupt on 2 rising {
  rpm = rpm + 1
}
```

### Reactive Variables

Reactive variables are automatically volatile for interrupt safety:

```javascript
react mut rpm: int = 0
react mut temperature: int = 0

# Use in interrupt handlers or with volatile access
interrupt on 2 rising {
  rpm = rpm + 1
}
```

### Signals

Signals enable event-driven communication:

```javascript
signal buttonPressed
signal dataReady

# Emit signals
on start {
  emit buttonPressed
}

# Handler for signals (future feature)
on buttonPressed {
  print("Button was pressed")
}
```

### Tasks

Tasks enable periodic and background execution:

```javascript
# Periodic task
task blink every 500ms {
  toggle(LED)
}

# Background task (runs in loop)
task monitor background {
  checkSensors()
  wait 100ms
}
```

### Time Literals

Use intuitive time units:

```javascript
wait 200ms        # Wait 200 milliseconds
wait 2s           # Wait 2 seconds
wait 500us        # Wait 500 microseconds

timeout 5s {
  connect()
}
```

Supported units:
- `ms` - milliseconds
- `s` - seconds
- `us` - microseconds
- `min` - minutes
- `h` - hours

### Atomic Blocks

Ensure atomic execution (disables interrupts):

```javascript
atomic {
  criticalValue = criticalValue + 1
  updateDisplay()
}
```

Compiles to:
```cpp
noInterrupts();
criticalValue = criticalValue + 1;
updateDisplay();
interrupts();
```

### Library Loading

Load Arduino C++ libraries:

```javascript
load <Servo>
load <WiFi>
load <Wire>
```

Load YS module files as namespaces:

```javascript
# Load a YS module with default namespace (filename without extension)
load <motor.ys>
motor.Motor m = new motor.Motor(9)
motor.helper()

# Load with custom namespace using 'as' keyword
load <motor.ys> as m
m.Motor myMotor = new m.Motor(9)
m.helper()
myMotor.setSpeed(m.MAX_SPEED)
```

**Module Loading Details:**
- `.ys` files are loaded and compiled into C++ namespaces
- All classes, functions, and variables in the module are wrapped in the namespace
- Default namespace name is the filename without extension
- Use `as` keyword to specify a custom namespace name
- Access module members using dot notation: `namespace.Member`
- Generated C++ uses `::` for namespace access
- Backward compatible: non-.ys loads still generate `#include` directives

### Aliases

Create aliases for pins or constants:

```javascript
alias LED_PIN = 13
alias BUTTON = D2
alias MOTOR_PWM = PWM1
```

Compiles to C++ `#define` macros.

### Configuration Block

Specify target configuration:

```javascript
config {
  cpu: atmega328p,
  clock: 16MHz,
  uart: on,
  i2c: on
}
```

### Inline C++

When you need direct C++ code:

```javascript
@cpp {
  Serial.println("Direct C++")
  digitalWrite(13, HIGH)
}
```

### Resource Ownership

Declare resource usage (for safety checking):

```javascript
use I2C1
use SPI
use UART0
```

## Complete Modern Example

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

load <Servo>

# Hardware types with automatic setup
mut Led statusLed = new Led(13)
mut Button modeBtn = new Button(2)
mut Analog sensor = new Analog(0)

enum Mode { AUTO, MANUAL }
struct Point { int x, int y }

signal modeChange
react mut int sensorValue = 0

mut Mode currentMode = AUTO
mut int counter = 0

class Motor {
  mut int speed
  
  constructor(int s) {
    self.speed = s
  }
  
  fn setSpeed(int s) {
    self.speed = s
  }
  
  fn run() {
    print(self.speed)
  }
}

mut Motor motor = new Motor(100)

on start {
  # No pinMode needed - hardware types handle it
  print("System ready")
  statusLed.on()
}

on loop {
  # Check button for mode toggle
  if (modeBtn.justPressed()) {
    currentMode = (currentMode == AUTO) ? MANUAL : AUTO
    emit modeChange
  }
  
  atomic {
    sensorValue = sensor.read()
  }
  
  match currentMode {
    AUTO => {
      motor.setSpeed(sensorValue / 4)
    },
    MANUAL => {
      motor.setSpeed(100)
    }
  }
  
  # Flash indicator using repeat
  repeat(2) {
    statusLed.toggle()
    wait 50ms
  }
  
  wait 10ms
}

task blink every 500ms {
  statusLed.toggle()
  wait 250ms
}
```

## Syntax Comparison

### Traditional Arduino
```cpp
const int LED = 13;
int state = 0;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  switch(state) {
    case 0:
      digitalWrite(LED, HIGH);
      break;
    case 1:
      digitalWrite(LED, LOW);
      break;
  }
  delay(1000);
}
```

### Modern Ypsilon Script
```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

# Hardware type with automatic pinMode
mut Led led = new Led(13)

enum State { ON, OFF }

mut State currentState = ON

on start {
  # No pinMode needed - Led type handles it
  print("System ready")
}

on loop {
  match currentState {
    ON => led.on(),
    OFF => led.off()
  }
  wait 1s
}
```

## Updated Syntax Summary

1. **Braces required**: All blocks use `{` and `}`
2. **No semicolons**: Optional, only when multiple statements on one line
3. **Strong static typing**: All variables and functions must be typed
4. **`fn` keyword**: Modern function syntax (also supports `function`)
5. **`self` keyword**: Class member access (also supports `this`)
6. **`mut` keyword**: Mutable variables (immutable by default with `const`)
7. **Enums**: Rust-style enumerations
8. **Structs**: C++-style data structures
9. **Classes**: OOP with constructors and methods
10. **`new` keyword**: Object instantiation
11. **Hardware types**: 100+ built-in types with automatic setup including:
    - Digital I/O: `Digital`, `Led`, `RgbLed`, `Button`, `Buzzer`
    - Analog & PWM: `Analog`, `PWM`
    - Motors: `Servo`, `DCMotor`, `StepperMotor`, `Encoder`
    - Communication: `I2C`, `SPI`, `UART`, `Bluetooth`, `WiFi`, `LoRa`, `NRF24`, `CAN`, `RS485`, `ZigBee`
    - Sensors: `TempSensor`, `HumiditySensor`, `DistanceSensor`, `LightSensor`, `MotionSensor`, `TouchSensor`, `SoundSensor`, `GasSensor`, `ColorSensor`, `Accelerometer`, `Gyroscope`, `Magnetometer`, `IMU`, `GPS`, `LoadCell`, `Potentiometer`, `Joystick`, `RotaryEncoder`, `IRRemote`, `RFID`
    - Displays: `LCD`, `OLED`, `SevenSegment`, `Matrix`, `TFT`, `NeoPixel`
    - Actuators: `Relay`, `Solenoid`, `Fan`, `Heater`, `Pump`, `Valve`
    - Motor Drivers: `HBridge`, `MotorDriver`, `ServoDriver`, `L298N`, `TB6612FNG`, `PCA9685`
    - Multiplexers: `Mux4`, `Mux8`, `Mux16`, `Mux32`
    - Storage: `SDCard`, `EEPROM`, `Flash`
    - Power: `Battery`, `Solar`, `LiPo`, `SolarPanel`
    - Timing: `Timer`, `RTC`, `DS3231`
    - Audio: `Speaker`, `Microphone`, `DFPlayer`, `DFPlayerMini`, `MAX4466`
    - Module-Specific: `DHT11`, `DHT22`, `DS18B20`, `HC_SR04`, `LM35`, `MPU6050`, `BMP280`, `SSD1306`, `WS2812`, `TM1637`, `HC05`, `NRF24L01`, `SX1278`, and more
12. **Event blocks**: `on start {}`, `on loop {}`
13. **Interrupt handlers**: `interrupt <name?> on PIN# (rising|falling|change|low|high) { }`
14. **Match expressions**: Pattern matching with `=>`
15. **Switch statements**: C++-style with braces
16. **Repeat loop**: `repeat(count) {}` for fixed iterations
17. **Tasks**: Periodic (`every`) and background execution
18. **Signals**: Event-driven communication
19. **Reactive vars**: Volatile variables with `react`
20. **Time literals**: `ms`, `s`, `us`, `min`, `h`
21. **Unit system**: Time, frequency, angle, distance, speed units
22. **Range constraints**: `in min...max` for automatic bounds
23. **Type conversion**: `.as<type>()` for explicit casting
24. **Collections**: `List` and `Map` types
25. **Error handling**: `!catch` for error propagation
26. **Atomic blocks**: Interrupt-safe regions
27. **Library loading**: `load <lib>` and `load <module.ys> as name`
28. **Aliases**: `alias name = value`
29. **Config blocks**: Target configuration with `@main`
30. **Inline C++**: `@cpp { }`
