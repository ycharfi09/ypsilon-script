# Ypsilon Script - Complete Features List

## Core Language Features

### 0. Entry Point Declaration
- **`@main` Directive**: Every program must declare an entry file
- Must be the first non-empty line
- Only one file can have `@main`
  ```javascript
  @main
  
  # Your program code...
  ```

### 1. Type System
- **Strong Static Typing**: All variables and functions must be explicitly typed
- **Built-in Types**: `int`, `float`, `bool`, `string`
- **User-Defined Types**: Enums, Structs, Classes
- **Type Inference**: Function return types can be inferred from return statements

### 2. Variable Declarations
- **Mutable Variables**: `mut TYPE name = value`
  ```javascript
  mut int counter = 0
  mut float temperature = 23.5
  ```
- **Constants**: `const TYPE name = value`
  ```javascript
  const int LED_PIN = 13
  const float PI = 3.14159
  ```
- **Reactive Variables**: `react mut TYPE name = value` (volatile for interrupt safety)
  ```javascript
  react mut int sensorValue = 0
  ```

### 3. Object-Oriented Programming

#### Classes
- Class declarations with properties and methods
- Constructor support
- `self` keyword for member access (also supports `this`)
- Method definitions using `fn` keyword
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
      }
  }
  ```

### 4. Data Structures

#### Enums (Rust-style)
- Named variants for state management
- Pattern matching support
  ```javascript
  enum Mode { AUTO, MANUAL, SLEEP }
  mut Mode currentMode = AUTO
  ```

#### Structs (C++-style)
- Named fields with types
- Field access using dot notation
  ```javascript
  struct Point {
    int x
    int y
  }
  
  struct Config {
    int threshold
    bool enabled
  }
  ```

### 5. Functions
- **Modern Syntax**: `fn` keyword (also supports `function`)
- **Typed Parameters**: `fn name(TYPE param1, TYPE param2)`
- **Return Types**: `fn name(TYPE param) -> TYPE`
- **Type Inference**: Return type can be inferred
  ```javascript
  fn add(int a, int b) -> int {
      return a + b
  }
  
  fn blink(int pin, int duration) {
      digitalWrite(pin, HIGH)
      wait duration
  }
  ```

### 6. Control Flow

#### If Statements
```javascript
if (condition) {
    # code
} else {
    # code
}
```

#### While Loops
```javascript
while (condition) {
    # code
}
```

#### For Loops
```javascript
for (mut i: int = 0; i < 10; i = i + 1) {
    print(i)
}
```

#### Repeat Loops
```javascript
repeat(3) {
    blink()
}
```

#### Match Expressions (Rust-style)
```javascript
match currentMode {
    AUTO => digitalWrite(13, HIGH),
    MANUAL => digitalWrite(13, LOW),
    SLEEP => print("Sleeping")
}
```

#### Switch Statements (C++-style)
```javascript
switch value {
    case 1 { print("One") }
    case 2 { print("Two") }
    default { print("Other") }
}
```

### 7. Event-Driven Programming

#### Event Blocks
- **on start**: Runs once at startup (equivalent to setup())
- **on loop**: Main loop (equivalent to loop())
  ```javascript
  on start {
      pinMode(13, OUTPUT)
      print("Initialized")
  }
  
  on loop {
      digitalWrite(13, HIGH)
      wait 1s
  }
  ```

#### Signals
- Signal declarations and emission
- Event-driven communication
  ```javascript
  signal buttonPressed
  
  on start {
      emit buttonPressed
  }
  ```

### 8. Task System

#### Periodic Tasks
```javascript
task blink every 500ms {
    digitalWrite(13, HIGH)
    wait 250ms
    digitalWrite(13, LOW)
}
```

#### Background Tasks
```javascript
task monitor background {
    checkSensors()
    wait 100ms
}
```

### 9. Time Management

#### Time Literals
- Supported units: `ms`, `s`, `us`, `min`, `h`
  ```javascript
  wait 200ms
  wait 2s
  delay 500us
  ```

#### Timeout Statements
```javascript
timeout 5s {
    connect()
}
```

### 10. Concurrency & Safety

#### Atomic Blocks
- Interrupt-safe critical sections
- Automatically handles interrupt disabling/enabling
  ```javascript
  atomic {
      criticalValue = criticalValue + 1
      updateDisplay()
  }
  ```

### 11. Library & Resource Management

#### Library Loading
```javascript
load <Servo>
load <WiFi>
load <Wire>
```

#### Aliases
```javascript
alias LED_PIN = 13
alias BUTTON = D2
alias MOTOR_PWM = PWM1
```

#### Resource Declarations
```javascript
use I2C1
use SPI
use UART0
```

### 12. Advanced Features

#### Configuration Blocks
```javascript
config {
    cpu: atmega328p,
    clock: 16MHz,
    uart: on,
    i2c: on
}
```

#### Inline C++
```javascript
@cpp {
    Serial.println("Direct C++")
    digitalWrite(13, HIGH)
}
```

### 13. Hardware Types

YS provides built-in hardware abstraction types with automatic pinMode management:

#### Digital Type
```javascript
mut Digital pin = new Digital(13)

# Methods
pin.high()      // Set pin HIGH (auto sets pinMode OUTPUT)
pin.low()       // Set pin LOW
pin.toggle()    // Toggle pin state
pin.isHigh()    // Returns bool (auto sets pinMode INPUT)
pin.isLow()     // Returns bool
pin.read()      // Returns int
pin.write(val)  // Write value
```

The Digital type automatically configures pinMode based on usage:
- Writing (high/low/toggle/write) → OUTPUT mode
- Reading (isHigh/isLow/read) → INPUT mode

#### Analog Type
```javascript
mut Analog sensor = new Analog(0)

# Method
sensor.read()  // Returns int 0-1023 (auto sets pinMode INPUT)
```

#### PWM Type
```javascript
mut PWM motor = new PWM(9)

# Methods
motor.set(value)  // Set PWM 0-255 (auto sets pinMode OUTPUT)
motor.get()       // Returns current PWM value
```

The PWM type detects board type and uses appropriate implementation:
- AVR boards (Uno, Nano, Mega): `analogWrite()`
- ESP boards (ESP32, ESP8266): LEDC functions with channel management

#### Natural Variable Syntax

Hardware types that accept a single pin argument support natural variable-like syntax:
```javascript
# Natural syntax (like creating a normal variable)
mut Led led = 13
mut Button btn = 2
mut Analog sensor = A0

# Equivalent to:
mut Led led = new Led(13)
mut Button btn = new Button(2)
mut Analog sensor = new Analog(A0)
```

Supported natural syntax types: Digital, Analog, PWM, Led, Button, Buzzer, Relay, Solenoid, Fan, Heater, Pump, Valve, TempSensor, HumiditySensor, PressureSensor, LightSensor, MotionSensor, TouchSensor, SoundSensor, GasSensor, Potentiometer, Speaker, Microphone, Timer

#### Multiplexer Types
```javascript
# 4-channel multiplexer
mut Mux4 mux4 = new Mux4(sigPin, s0, s1)
mut Mux4 mux4en = new Mux4(sigPin, s0, s1, enablePin)
mux4.selectChannel(2)
mut int value = mux4.read(1)
mux4.enable()
mux4.disable()

# 8-channel multiplexer
mut Mux8 mux8 = new Mux8(sigPin, s0, s1, s2)

# 16-channel multiplexer (CD74HC4067)
mut Mux16 mux16 = new Mux16(sigPin, s0, s1, s2, s3)

# 32-channel multiplexer
mut Mux32 mux32 = new Mux32(sigPin, s0, s1, s2, s3, s4)
```

#### Sensor Types
```javascript
# Temperature sensor
mut TempSensor temp = new TempSensor(A0)
mut float celsius = temp.readCelsius()
mut float fahrenheit = temp.readFahrenheit()

# Humidity sensor
mut HumiditySensor humidity = new HumiditySensor(A1)
mut float percent = humidity.readPercent()

# Distance sensor (ultrasonic)
mut DistanceSensor sonar = new DistanceSensor(trigPin, echoPin)
mut float cm = sonar.readCm()
mut bool detected = sonar.inRange(5, 50)

# Light sensor
mut LightSensor ldr = new LightSensor(A0)
if (ldr.isDark()) { ... }
if (ldr.isBright()) { ... }

# Motion sensor (PIR)
mut MotionSensor pir = new MotionSensor(2)
if (pir.detected()) { ... }
if (pir.isIdle(5000)) { ... }

# Joystick
mut Joystick joy = new Joystick(A0, A1, btnPin)
mut int x = joy.readX()
mut int y = joy.readY()
if (joy.isPressed()) { ... }

# Potentiometer
mut Potentiometer pot = new Potentiometer(A0)
mut int percent = pot.readPercent()
mut int mapped = pot.readMapped(0, 180)

# Rotary encoder
mut RotaryEncoder enc = new RotaryEncoder(pinA, pinB, btnPin)
enc.update()
mut i32 pos = enc.position()
```

#### Display Types
```javascript
# OLED display
mut OLED display = new OLED(128, 64)
display.begin()
display.clear()
display.setCursor(0, 0)
display.print("Hello")
display.display()

# NeoPixel LED strip
mut NeoPixel strip = new NeoPixel(pin, numLeds)
strip.setPixel(0, 255, 0, 0)  # Red
strip.fill(0, 0, 255)          # All blue
strip.show()

# Seven-segment display
mut SevenSegment seg = new SevenSegment(a, b, c, d, e, f, g)
seg.display(5)
seg.clear()
```

#### Actuator Types
```javascript
# Relay
mut Relay relay = new Relay(7)
relay.on()
relay.off()
relay.toggle()

# Fan/Pump (PWM speed control)
mut Fan cooler = new Fan(9)
cooler.setSpeed(200)

# Valve
mut Valve valve = new Valve(8)
valve.open()
valve.close()

# Solenoid
mut Solenoid sol = new Solenoid(6)
sol.activate()
sol.pulse(100)  # 100ms pulse
```

#### Motor Driver Types
```javascript
# H-Bridge motor control
mut HBridge motor = new HBridge(in1, in2, enablePin)
motor.forward(200)
motor.reverse(150)
motor.stop()
motor.brake()

# Dual motor driver
mut MotorDriver driver = new MotorDriver(pwmA, dirA, pwmB, dirB)
driver.setMotorA(255)
driver.setMotorB(-128)
driver.stopAll()
```

#### Timing Types
```javascript
# Timer
mut Timer timer = new Timer()
timer.start(5000)  # 5 seconds
if (timer.isExpired()) { ... }
mut u32 remaining = timer.remaining()

# Real-time clock
mut RTC clock = new RTC()
mut int hour = clock.hour()
mut int minute = clock.minute()
```

#### Audio Types
```javascript
# Speaker
mut Speaker spk = new Speaker(8)
spk.tone(440, 500)  # 440Hz for 500ms
spk.beep(1000, 200)

# Microphone
mut Microphone mic = new Microphone(A0)
if (mic.isLoud()) { ... }
```

#### Power Types
```javascript
# Battery monitor
mut Battery batt = new Battery(A0, 4.2, 3.0)
mut int percent = batt.readPercent()
if (batt.isLow(20)) { ... }

# Solar panel monitor
mut Solar panel = new Solar(voltagePin, currentPin)
mut float voltage = panel.readVoltage()
mut float power = panel.readPower()
```

#### Wireless Communication Types
```javascript
# Bluetooth
mut Bluetooth bt = new Bluetooth(rxPin, txPin, 9600)
bt.begin()
if (bt.available()) { ... }
bt.print("Hello")

# WiFi
mut WiFi wifi = new WiFi()
wifi.connect("SSID", "password")
if (wifi.isConnected()) { ... }
mut String ip = wifi.localIP()

# LoRa
mut LoRa lora = new LoRa(ssPin, rstPin, dioPin)
lora.begin(915000000)
lora.print("Hello LoRa")

# NRF24 Radio
mut NRF24 radio = new NRF24(cePin, csPin)
radio.begin()
radio.write(data, len)
```

#### Storage Types
```javascript
# SD Card
mut SDCard sd = new SDCard(csPin)
sd.begin()
if (sd.exists("data.txt")) { ... }

# EEPROM
mut EEPROM eeprom = new EEPROM(512)
mut u8 value = eeprom.read(0)
eeprom.write(0, 42)

# Flash Memory
mut Flash flash = new Flash(4096)
flash.begin()
flash.write(0, 42)
```

#### Additional Sensor Types
```javascript
# Pressure Sensor
mut PressureSensor pressure = new PressureSensor(A0)
mut float value = pressure.read()

# Touch Sensor
mut TouchSensor touch = new TouchSensor(A0)
if (touch.isTouched()) { ... }

# Sound Sensor
mut SoundSensor sound = new SoundSensor(A0)
if (sound.isLoud()) { ... }

# Gas Sensor
mut GasSensor gas = new GasSensor(A0)
if (gas.detected()) { ... }

# Color Sensor
mut ColorSensor color = new ColorSensor(s0, s1, s2, s3, out)
mut int red = color.readRed()
mut int green = color.readGreen()

# Accelerometer
mut Accelerometer accel = new Accelerometer(xPin, yPin, zPin)
mut float x = accel.readX()

# Gyroscope
mut Gyroscope gyro = new Gyroscope(xPin, yPin, zPin)
mut float x = gyro.readX()

# GPS
mut GPS gps = new GPS(rxPin, txPin)
gps.begin(9600)
if (gps.update()) {
    mut float lat = gps.latitude()
    mut float lon = gps.longitude()
}
```

### Module-Specific Hardware Types

YS also provides hardware types that map directly to specific IC modules:

#### Module-Specific Sensor Types
```javascript
# LM35 Temperature Sensor (analog)
mut LM35 temp = new LM35(A0)
mut float celsius = temp.readCelsius()
mut float fahrenheit = temp.readFahrenheit()

# DS18B20 1-Wire Temperature Sensor
mut DS18B20 temp = new DS18B20(2)
temp.begin()
mut float celsius = temp.readCelsius()

# DHT11/DHT22 Digital Humidity Sensors
mut DHT11 humidity = new DHT11(2)
mut DHT22 humidity22 = new DHT22(3)
humidity.begin()
mut float temp = humidity.readTemperature()
mut float hum = humidity.readHumidity()

# HC-SR04 Ultrasonic Distance Sensor
mut HC_SR04 sonar = new HC_SR04(9, 10)
mut float dist = sonar.readCm()
mut bool inRange = sonar.inRange(5, 50)

# GP2Y0A21 IR Distance Sensor
mut GP2Y0A21 ir = new GP2Y0A21(A0)
mut float dist = ir.readCm()

# LDR Light Sensor (photoresistor)
mut LDR ldr = new LDR(A0)
mut int level = ldr.read()
if (ldr.isDark()) { ... }

# BH1750 I2C Lux Sensor
mut BH1750 light = new BH1750(0)
light.begin()
mut float lux = light.readLux()

# PIR Motion Sensor (HC-SR501)
mut PIR pir = new PIR(2)
if (pir.detected()) { ... }

# Pot Potentiometer
mut Pot pot = new Pot(A0)
mut int percent = pot.readPercent()
mut int mapped = pot.readMapped(0, 180)

# BMP280 Barometric Pressure Sensor
mut BMP280 pressure = new BMP280(0)
pressure.begin()
mut float p = pressure.readPressure()
mut float alt = pressure.readAltitude()

# TTP223 Capacitive Touch Sensor
mut TTP223 touch = new TTP223(2)
if (touch.isTouched()) { ... }

# MQ-2 Gas/Smoke Sensor
mut MQ2 gas = new MQ2(A0)
if (gas.detected()) { ... }
mut int smoke = gas.readSmoke()

# TCS34725 I2C Color Sensor
mut TCS34725 color = new TCS34725(0)
color.begin()
mut int r = color.readRed()
mut int g = color.readGreen()
mut int b = color.readBlue()

# MPU6050 Accelerometer + Gyroscope
mut MPU6050 accel = new MPU6050(0)
accel.begin()
mut float ax = accel.readAccelX()
mut float gx = accel.readGyroX()

# NEO-6M GPS Module
mut NEO6M gps = new NEO6M(10, 11)
gps.begin()
if (gps.update()) {
    mut float lat = gps.latitude()
    mut float lon = gps.longitude()
}
```

#### Module-Specific Display Types
```javascript
# HD44780 16x2 LCD
mut HD44780 lcd = new HD44780(12, 11, 5, 4, 3, 2, 16, 2)
lcd.begin()
lcd.setCursor(0, 0)
lcd.print("Hello World")

# SSD1306 128x64 I2C OLED
mut SSD1306 oled = new SSD1306(0, 128, 64)
oled.begin()
oled.clear()
oled.print("Hello")
oled.display()

# WS2812 RGB LED Strip (NeoPixel)
mut WS2812 strip = new WS2812(6, 30)
strip.begin()
strip.setPixel(0, 255, 0, 0)
strip.fill(0, 0, 255)
strip.show()

# TM1637 4-Digit 7-Segment Display
mut TM1637 seg = new TM1637(2, 3)
seg.begin()
seg.setBrightness(5)
seg.displayNumber(1234)
```

#### Module-Specific Wireless Types
```javascript
# HC-05 UART Bluetooth Module
mut HC05 bt = new HC05(10, 11, 9600)
bt.begin()
if (bt.available()) { ... }
bt.println("Hello Bluetooth")

# ESP8266 WiFi Module
mut ESP8266 wifi = new ESP8266()
wifi.connect("SSID", "password")
if (wifi.isConnected()) { ... }

# SX1278 LoRa Module
mut SX1278 lora = new SX1278(10, 9, 2)
lora.begin(915000000)
lora.print("Hello LoRa")

# NRF24L01 2.4GHz Transceiver
mut NRF24L01 radio = new NRF24L01(9, 10)
radio.begin()
radio.startListening()
```

#### Module-Specific Actuator Types
```javascript
# Relay5V Standard 5V Relay
mut Relay5V relay = new Relay5V(7)
relay.on()
relay.off()
relay.toggle()

# FanPWM PWM Controlled Fan
mut FanPWM fan = new FanPWM(9)
fan.setSpeed(200)
fan.on()
fan.off()

# DCPump DC Water Pump
mut DCPump pump = new DCPump(10)
pump.setSpeed(255)
pump.on()
pump.off()

# SolenoidValve 5V Solenoid Valve
mut SolenoidValve valve = new SolenoidValve(8)
valve.open()
valve.close()
```

#### Module-Specific Motor Driver Types
```javascript
# L298N Dual H-Bridge Motor Driver
mut L298N motor = new L298N(9, 8)
motor.forward(200)
motor.reverse(150)
motor.stop()

# TB6612FNG Dual Motor Driver
mut TB6612FNG driver = new TB6612FNG(3, 4, 5, 6)
driver.setMotorA(255)
driver.setMotorB(-128)
driver.stopAll()

# PCA9685 16-Channel Servo Driver
mut PCA9685 servos = new PCA9685(0, 50)
servos.begin()
servos.setAngle(0, 90)
```

#### Module-Specific Power & Timing Types
```javascript
# LiPo Battery Monitor
mut LiPo batt = new LiPo(A0, 4.2, 3.0)
mut int percent = batt.readPercent()
if (batt.isLow(20)) { ... }

# SolarPanel Voltage/Current Monitor
mut SolarPanel panel = new SolarPanel(A0, A1)
mut float voltage = panel.readVoltage()
mut float current = panel.readCurrent()
mut float power = panel.readPower()

# DS3231 Real-Time Clock
mut DS3231 rtc = new DS3231(0)
rtc.begin()
mut int h = rtc.hour()
mut int m = rtc.minute()
mut float temp = rtc.readTemperature()
```

#### Module-Specific Audio Types
```javascript
# MAX4466 Electret Microphone
mut MAX4466 mic = new MAX4466(A0)
mut int level = mic.read()
if (mic.isLoud()) { ... }

# DFPlayerMini UART MP3 Player
mut DFPlayerMini player = new DFPlayerMini(10, 11)
player.begin()
player.setVolume(15)
player.play(1)
player.next()
```

### 14. Unit System

Support for physical unit literals that are automatically converted at compile time:

#### Time Units
```javascript
const int delay1 = 500ms     // milliseconds → 500
const int delay2 = 2s        // seconds → 2000
const int delay3 = 100us     // microseconds → 0 (rounded down)
const int delay4 = 1min      // minutes → 60000
const int delay5 = 1h        // hours → 3600000
```

#### Frequency Units
```javascript
const int freq1 = 50Hz       // Hertz → 50
const int freq2 = 5kHz       // kiloHertz → 5000
const int freq3 = 1MHz       // MegaHertz → 1000000
```

#### Angle Units
```javascript
const int angle1 = 90deg     // degrees → 90
const int angle2 = 3.14rad   // radians → 180 (converted to degrees)
```

#### Distance Units
```javascript
const int dist1 = 10mm       // millimeters → 10
const int dist2 = 10cm       // centimeters → 100 (converted to mm)
const int dist3 = 1m         // meters → 1000 (converted to mm)
const int dist4 = 1km        // kilometers → 1000000 (converted to mm)
```

#### Speed Units
```javascript
const int speed = 1000rpm    // revolutions per minute → 1000
```

### 15. Range Constraints

Variables can have automatic range enforcement using the `in min...max` syntax:

```javascript
mut int sensorValue in 0...1023 = 512
mut int pwmValue in 0...255 = 128
mut int temperature in -40...125 = 20

# Values are automatically constrained using constrain()
sensorValue = 2000  // Automatically clamped to 1023
pwmValue = -10      // Automatically clamped to 0
```

Range constraints work with:
- Literal values: `in 0...100`
- Variable bounds: `in MIN...MAX`
- Any expression that evaluates to integers

### 16. Type Conversion

Explicit type conversion using `.as<type>()` syntax:

```javascript
# Numeric conversions
const int a = 5
mut float b = a.as<float>()     // int → float

const float voltage = 3.3
mut int mv = voltage.as<int>()  // float → int (truncates)

# Works with any types
mut Digital pin = new Digital(13)
mut int pinNum = pin.as<int>()  // Hardware type → int
```

Type conversion generates `static_cast<T>()` in C++ for type safety.

### 17. Collections

Built-in collection types implemented using C++ STL:

#### List Type
```javascript
mut List numbers = new List()

# Methods
numbers.push(10)              // Add element to end
numbers.push(20)
mut int val = numbers.get(0)   // Get element at index
numbers.set(0, 15)            // Set element at index
mut int size = numbers.length()  // Get number of elements
mut int last = numbers.pop()    // Remove and return last element
```

Internally uses `std::vector<T>` for efficient dynamic arrays.

#### Map Type
```javascript
mut Map data = new Map()

# Methods
data.set(key, value)          // Set key-value pair
mut int val = data.get(key)    // Get value by key
mut bool exists = data.has(key)  // Check if key exists
data.remove(key)              // Remove key-value pair
mut int count = data.size()    // Get number of entries
```

Internally uses `std::map<K, V>` for efficient key-value storage.

### 18. Error Handling

Basic error handling using `!catch` syntax:

```javascript
mut Analog sensor = new Analog(0)

# Inline error handling
mut int value = sensor.read() !catch {
  print("Sensor failed")
}

# Can be used with any expression
mut int result = calculation() !catch {
  print("Calculation error")
}
```

The error handling generates simple error checking code. For production use, this provides a foundation for more sophisticated error types.

### 19. Built-in Functions

#### Pin Control
- `pinMode(pin: int, mode: int)`
- `digitalWrite(pin: int, value: int)`
- `digitalRead(pin: int) -> int`

#### Analog I/O
- `analogRead(pin: int) -> int` (0-1023)
- `analogWrite(pin: int, value: int)` (0-255, PWM)

#### Timing
- `delay(milliseconds: int)`
- `millis() -> int`

#### Serial Communication
- `print(value)` - Prints to serial
- Automatically adds `Serial.begin(9600)` when print is used

#### Constants
- `HIGH` - Digital high (1)
- `LOW` - Digital low (0)
- `INPUT` - Pin input mode
- `OUTPUT` - Pin output mode
- `INPUT_PULLUP` - Pin input with pullup resistor

### 14. Operators

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
- `&&` Logical AND (also supports `and`)
- `||` Logical OR (also supports `or`)
- `!` Logical NOT (also supports `not`)

#### Assignment
- `=` Assign value

### 15. Syntax Rules

- **Braces Required**: All blocks use `{` and `}`
- **Semicolons Optional**: Not required, only when multiple statements on one line
- **Comments**: `#` for single-line comments
- **No Trailing Commas**: In enums, structs (except last item can have comma)

## Compilation Features

### Code Generation
- **Compiles to C++**: Standard C++ code compatible with Arduino
- **No Runtime Overhead**: Direct translation to C++
- **Type Safety**: Compile-time type checking
- **Memory Efficient**: No garbage collection, stack-based allocation

### CLI Usage
```bash
# Compile a YS file to C++
ysc input.ys

# Specify output file
ysc input.ys output.cpp

# Show help
ysc --help

# Show version
ysc --version
```

## Current Limitations

- **No Arrays**: Traditional array support not yet implemented (use List instead)
- **Limited String Operations**: Basic string support only
- **Module System**: Module loading works but limited to file-level imports
- **No Async/Await**: Async operations not supported
- **No Inheritance**: Class inheritance not implemented
- **No Interfaces/Traits**: Not yet supported
- **No Global Struct Initialization**: Struct initialization only works in function scope
- **Error Handling**: Basic `!catch` syntax implemented but not full error types yet

## Feature Summary by Category

### Type System: ✅ Complete
- Strong static typing
- Type inference
- User-defined types (enums, structs, classes)

### Object-Oriented: ✅ Core Features
- Classes with constructors and methods
- `self` keyword
- Properties (public only)

### Functional: ✅ Basic Support
- Function declarations with `fn`
- Typed parameters and return values
- Type inference for returns

### Control Flow: ✅ Complete
- if/else, while, for, repeat
- match expressions (pattern matching)
- switch statements

### Event-Driven: ✅ Complete
- Event blocks (on start, on loop)
- Signals and emit
- Task system (periodic and background)

### Concurrency: ✅ Basic Support
- Atomic blocks
- Reactive variables
- Interrupt safety

### Time Management: ✅ Complete
- Time literals (ms, s, us, min, h)
- Frequency units (Hz, kHz, MHz)
- Angle units (deg, rad)
- Distance units (mm, cm, m, km)
- Speed units (rpm)
- wait statements
- timeout statements

### Hardware Integration: ✅ Advanced
- Hardware types (Digital, Analog, PWM, and 100+ more)
- Multiplexer types (Mux4, Mux8, Mux16, Mux32)
- Generic sensor types (TempSensor, HumiditySensor, PressureSensor, LightSensor, DistanceSensor, MotionSensor, TouchSensor, SoundSensor, GasSensor, ColorSensor, Accelerometer, Gyroscope, Magnetometer, IMU, GPS, LoadCell, Potentiometer, Joystick, RotaryEncoder, IRRemote, RFID)
- Module-specific sensor types (LM35, DS18B20, DHT11, DHT22, HC_SR04, GP2Y0A21, LDR, BH1750, PIR, Pot, BMP280, TTP223, MQ2, TCS34725, MPU6050, NEO6M)
- Generic display types (LCD, OLED, NeoPixel, SevenSegment, Matrix, TFT)
- Module-specific display types (HD44780, SSD1306, WS2812, TM1637)
- Generic actuator types (Relay, Solenoid, Fan, Heater, Pump, Valve)
- Module-specific actuator types (Relay5V, FanPWM, DCPump, SolenoidValve)
- Generic motor driver types (HBridge, MotorDriver, ServoDriver)
- Module-specific motor driver types (L298N, TB6612FNG, PCA9685)
- Generic communication types (I2C, SPI, UART, Bluetooth, WiFi, LoRa, CAN, RS485, Ethernet, NRF24, ZigBee)
- Module-specific communication types (HC05, ESP8266, SX1278, NRF24L01)
- Storage types (SDCard, EEPROM, Flash)
- Generic power types (Battery, Solar)
- Module-specific power types (LiPo, SolarPanel)
- Generic timing types (Timer, RTC)
- Module-specific timing types (DS3231)
- Generic audio types (Speaker, Microphone, DFPlayer)
- Module-specific audio types (MAX4466, DFPlayerMini)
- Natural variable-like syntax for hardware types
- Auto pinMode detection
- Board-specific PWM implementation
- Pin control (digital and analog)
- Built-in Arduino functions
- Library loading
- Resource management

### Advanced Types: ✅ Complete
- Range constraints (in min...max)
- Type conversion (.as<type>())
- Collections (List, Map)
- Error handling (!catch)

### Metaprogramming: ✅ Basic Support
- Inline C++ blocks
- Configuration blocks
- Aliases

## Examples Available

The repository includes 49+ working examples demonstrating:
1. `blink.ys` - Basic LED blinking
2. `blink-modern.ys` - Modern syntax blink
3. `button.ys` - Button input and LED control
4. `button-example.ys` - Button hardware type example
5. `buzzer-example.ys` - Buzzer hardware type example
6. `complete-example.ys` - Complete feature showcase
7. `complete-showcase.ys` - All modern features
8. `complete-hardware-demo.ys` - All hardware features together
9. `constants.ys` - Arduino constants usage
10. `dcmotor-example.ys` - DC motor control example
11. `digital-hardware.ys` - Digital hardware type demo
12. `encoder-example.ys` - Rotary encoder example
13. `enum-match.ys` - Enums with pattern matching
14. `fade.ys` - PWM LED fading
15. `fade-esp32.ys` - PWM fading on ESP32
16. `hardware-showcase.ys` - Complete hardware types showcase
17. `i2c-example.ys` - I2C communication example
18. `interrupt-example.ys` - Interrupt handling example
19. `interrupt-advanced.ys` - Advanced interrupt features
20. `led-example.ys` - LED hardware type example
21. `led_class.ys` - Object-oriented LED control
22. `modern-syntax.ys` - All modern syntax features
23. `module-example.ys` - Module loading example
24. `module-specific-hardware.ys` - Module-specific types (TB6612FNG, DHT22, HC_SR04, etc.)
25. `motor.ys` - Motor control example
26. `pwm-motor.ys` - PWM hardware type demo
27. `range-constraints.ys` - Range constraints demo
28. `rgbled-example.ys` - RGB LED example
29. `rgb-led-mega.ys` - RGB LED on Arduino Mega
30. `sensor.ys` - Analog sensor reading
31. `sensor-lib.ys` - Sensor library module
32. `serial.ys` - Serial communication
33. `servo-example.ys` - Servo motor example
34. `smart-led.ys` - RGB LED controller with tasks
35. `spi-example.ys` - SPI communication example
36. `stepper-example.ys` - Stepper motor example
37. `syntax-demo.ys` - Syntax demonstration
38. `test-new-features.ys` - New features testing
39. `traffic-light.ys` - Traffic light controller
40. `type-conversion.ys` - Type conversion examples
41. `uart-example.ys` - UART communication example
42. `ultrasonic.ys` - Distance sensor example
43. `unit-system.ys` - Unit literals demonstration
44. `width-specific-types.ys` - Width-specific integer types

All examples compile successfully and demonstrate real-world usage patterns.
