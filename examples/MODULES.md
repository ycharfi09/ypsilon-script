# Module Loading Examples

This directory contains examples demonstrating the .ys module loading feature.

## Module Files

### motor.ys
A simple motor control library with:
- `Motor` class with speed control
- `helper()` function
- `MAX_SPEED` constant

### sensor-lib.ys
A comprehensive sensor library featuring:
- `SensorStatus` enum (OK, ERROR, CALIBRATING)
- `SensorReading` struct
- `Sensor` class with calibration
- `processSensorData()` function
- Min/max value constants

## Usage Examples

### module-example.ys
Shows basic module loading:
```ys
load <motor.ys> as m

mut m.Motor motor = new m.Motor(MOTOR_PIN)
motor.setSpeed(m.MAX_SPEED)
m.helper()
```

### complex-modules.ys
Demonstrates loading multiple modules:
```ys
load <sensor-lib.ys> as sensors
load <motor.ys> as motors

mut sensors.Sensor tempSensor = new sensors.Sensor(PIN)
mut sensors.SensorReading reading = tempSensor.getReading()
sensors.processSensorData(reading)

mut motors.Motor fan = new motors.Motor(PIN)
fan.setSpeed(motors.MAX_SPEED)
```

## Compiling

```bash
ysc module-example.ys
ysc complex-modules.ys
```

The compiler will:
1. Load the referenced .ys modules
2. Parse their content
3. Wrap each module in a C++ namespace
4. Generate clean, modular Arduino code

## Generated C++ Structure

```cpp
namespace m {
  class Motor { /* ... */ };
  void helper() { /* ... */ }
  const int MAX_SPEED = 255;
}

// Usage
m::Motor motor(9);
motor.setSpeed(m::MAX_SPEED);
m::helper();
```
