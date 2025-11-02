# YS Config System Documentation

## Overview

The YS config system allows you to specify board configuration, compilation settings, and runtime behavior directly in your `.ys` source files. This configuration is used by the YS compiler and CLI tools to generate optimized code and manage board interactions.

## Config Block Syntax

Add a `config {}` block at the top of your `.ys` file:

```javascript
config {
  mpu: atmega328p,
  clock: 16MHz,
  uart: on,
  port: auto,
  pwm: auto
}
```

## Configuration Options

| Option | Description | Valid Values | Default |
|--------|-------------|--------------|---------|
| `mpu` | Microcontroller/board type | `atmega328p`, `atmega2560`, `esp32`, `esp8266` | `atmega328p` |
| `clock` | CPU clock frequency | e.g., `16MHz`, `8MHz`, `240MHz` | `16MHz` |
| `uart` | Enable serial monitor | `on`, `off` | `off` |
| `port` | Serial port for upload | `auto`, `COM3`, `ttyUSB0`, etc. | `auto` |
| `pwm` | PWM backend | `auto`, `analogWrite`, `ledc` | `auto` |

## Board Mapping (MPU to FQBN)

YS automatically maps MPU values to Arduino CLI Fully Qualified Board Names (FQBN):

| YS MPU | Arduino FQBN | Description |
|--------|--------------|-------------|
| `atmega328p` | `arduino:avr:uno` | Arduino Uno, Nano (ATmega328P) |
| `atmega2560` | `arduino:avr:mega` | Arduino Mega 2560 |
| `esp8266` | `esp8266:esp8266:generic` | ESP8266 boards |
| `esp32` | `esp32:esp32:esp32` | ESP32 boards |

## PWM Backend Selection

YS automatically selects the correct PWM implementation based on your board:

### AVR Boards (Uno, Nano, Mega)
- Uses native `analogWrite()` function
- No special setup required
- Supports pins with PWM capability

### ESP32/ESP8266 Boards
- Automatically generates LEDC (LED Control) wrapper
- Handles channel allocation automatically
- Provides `analogWrite()` compatible interface

**Example:** The same `analogWrite()` code works on both AVR and ESP32:

```javascript
config {
  mpu: esp32  # or atmega328p
}

on loop {
  analogWrite(13, 128)  # Works on both!
}
```

For ESP32, YS generates:
- LEDC channel allocation
- Automatic pin-to-channel mapping
- `analogWrite()` wrapper that calls `ledcWrite()`

## CLI Commands

### Compile Only

```bash
ysc compile blink.ys
# or legacy syntax:
ysc blink.ys
```

Compiles your `.ys` file to `.ino` Arduino C++ code.

### Upload to Board

```bash
ysc upload blink.ys
```

Compiles and uploads to the board specified in config. Requires Arduino CLI installed.

### Run (Compile + Upload + Monitor)

```bash
ysc run blink.ys
```

Compiles, uploads, and opens serial monitor (if `uart: on`). Requires Arduino CLI installed.

### Show Config Diagnostics

```bash
ysc blink.ys --config
```

Displays the configuration without generating code.

## Complete Example

```javascript
# Smart LED Controller
# Demonstrates config-based PWM with automatic backend selection

config {
  mpu: esp32,
  clock: 240MHz,
  uart: on,
  port: auto,
  pwm: auto
}

const int LED_PIN = 13
mut int brightness = 0
mut int fadeAmount = 5

on start {
    pinMode(LED_PIN, OUTPUT)
}

on loop {
    analogWrite(LED_PIN, brightness)
    
    brightness = brightness + fadeAmount
    
    if (brightness <= 0) {
        fadeAmount = 5
    }
    
    if (brightness >= 255) {
        fadeAmount = -5
    }
    
    wait 30ms
}
```

## Build Properties

The config system automatically generates Arduino CLI build properties:

- `clock: 16MHz` → `--build-property F_CPU=16000000L`
- More build properties can be added as needed

## Port Auto-Detection

When `port: auto`:

- **Windows**: Detects `COM*` ports
- **Linux**: Detects `/dev/ttyUSB*` or `/dev/ttyACM*`
- **macOS**: Detects `/dev/cu.usbserial*`

If detection fails, you can specify the port explicitly:

```javascript
config {
  port: COM3  # Windows
  # or
  port: auto  # Linux/macOS - auto-detect recommended
}
```

**Note**: When specifying ports manually in the config, Arduino CLI expects the port identifier as used by the system. Use `arduino-cli board list` to see available ports.

## Requirements

For `upload` and `run` commands:
- Arduino CLI must be installed
- Board packages must be installed via Arduino CLI
  - For ESP32: `arduino-cli core install esp32:esp32`
  - For ESP8266: `arduino-cli core install esp8266:esp8266`

## Default Behavior

If no `config {}` block is present, YS uses these defaults:

```javascript
config {
  mpu: atmega328p,
  clock: 16MHz,
  uart: off,
  port: auto,
  pwm: auto
}
```

## Error Handling

- **Unknown MPU**: Falls back to `atmega328p` with a warning
- **Invalid port**: Reports error during upload
- **Missing Arduino CLI**: Provides installation link

## Future Enhancements

Planned features (not yet implemented):
- `.ysconfig` file support for project-wide settings
- Custom build properties
- Multiple board profiles
- Serial monitor baud rate configuration
