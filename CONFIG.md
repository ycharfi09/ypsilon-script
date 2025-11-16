# YS Config System Documentation

## Overview

The YS config system allows you to specify board configuration, compilation settings, and runtime behavior directly in your `.ys` source files. This configuration is used by the YS compiler and CLI tools to generate optimized code and manage board interactions.

**Important:** Every file with `@main` must include a config block with required fields.

## Config Block Syntax

Add a `config {}` block at the top of your `.ys` file (after `@main`):

```javascript
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}
```

## Configuration Options

| Option | Description | Valid Values | Required | Default |
|--------|-------------|--------------|----------|---------|
| `board` | Board type | `arduino_uno`, `arduino_nano`, `arduino_mega`, `arduino_leonardo`, `esp32`, `esp8266` | **Yes** (for @main) | `arduino_uno` |
| `clock` | CPU clock frequency | e.g., `16MHz`, `8MHz`, `240MHz` | **Yes** (for @main) | `16MHz` |
| `uart` | Enable serial monitor | `on`, `off` | No | `off` |
| `port` | Serial port for upload | `auto`, `COM3`, `ttyUSB0`, etc. | No | `auto` |

## Board Mapping (Board Name to FQBN)

YS automatically maps board names to Arduino CLI Fully Qualified Board Names (FQBN):

| YS Board Name | Arduino FQBN | Description |
|---------------|--------------|-------------|
| `arduino_uno` | `arduino:avr:uno` | Arduino Uno (ATmega328P) |
| `arduino_nano` | `arduino:avr:nano` | Arduino Nano |
| `arduino_mega` | `arduino:avr:mega` | Arduino Mega 2560 |
| `arduino_leonardo` | `arduino:avr:leonardo` | Arduino Leonardo |
| `esp32` | `esp32:esp32:esp32` | ESP32 boards |
| `esp8266` | `esp8266:esp8266:generic` | ESP8266 boards |

**Legacy Support:** The old `mpu` field (e.g., `atmega328p`, `atmega2560`) is still supported for backward compatibility but deprecated.

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

### Upload with Code Retrieval (Experimental)

```bash
ysc upload blink.ys --r
# or
ysc upload blink.ys --retrieve
```

Enables experimental code retrieval feature. Shows warning on low-memory boards like Arduino Uno.

### Run (Compile + Upload + Monitor)

```bash
ysc run blink.ys
```

Compiles, uploads, and opens serial monitor (if `uart: on`). Requires Arduino CLI installed.

### Run with Code Retrieval (Experimental)

```bash
ysc run blink.ys --retrieve
```

Compiles, uploads with code retrieval enabled, and opens serial monitor.

### Show Config Diagnostics

```bash
ysc blink.ys --config
```

Displays the configuration without generating code.

## Complete Example

```javascript
@main

# Smart LED Controller
# Demonstrates config-based PWM with automatic backend selection

config {
  board: esp32,
  clock: 240MHz,
  uart: on,
  port: auto
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

If no `config {}` block is present in a file without `@main`, YS uses these defaults:

```javascript
config {
  board: arduino_uno,
  clock: 16MHz,
  uart: off,
  port: auto
}
```

**Important:** Files with `@main` must have an explicit config block with all required fields.

## Config Validation

The compiler validates config blocks in `@main` files:

### Required Fields
- `board`: Must be a valid board name
- `clock`: Must be specified with units (e.g., 16MHz)

### Error Messages

**Missing Config Block:**
```
❌ Error: @main file must include a config block.

Your main file needs to specify board configuration for upload.

Add a config block like this:

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}
```

**Invalid Board Name:**
```
⚠ Config Error: Unknown board 'invalid_name'.
Valid boards: arduino_uno, arduino_nano, arduino_mega, arduino_leonardo, esp32, esp8266
   Using default (arduino_uno).
   Please update your config block with a valid board name.
```

## Code Retrieval Feature

The `--r` or `--retrieve` flag enables experimental code retrieval:

```bash
ysc upload blink.ys --r
```

**Features:**
- Board listens for retrieval requests after reboot
- Sends project information back to host
- Requires firmware support in generated code

**Warnings:**
- ⚠️ Experimental feature - may not work on all boards
- ⚠️ Limited support on low-memory boards (Arduino Uno, Nano)
- Shows warning when used with low-memory boards

**Low-Memory Board Warning:**
```
⚠ Experimental Feature: Code retrieval on arduino_uno.
   Low-memory boards like Arduino Uno have limited resources.
   Use at your own risk. This feature may cause instability.
```

## Error Handling

- **Unknown board**: Falls back to `arduino_uno` with a warning
- **Invalid port**: Reports error during upload
- **Missing Arduino CLI**: Provides installation link
- **Missing config in @main**: Shows beginner-friendly error with example
- **Multiple @main files**: Lists all files with @main and asks to fix

## Installation Note

**Ypsilon Script is not available on npm.** You must clone the repository and install manually:

```bash
git clone https://github.com/ycharfi09/ypsilon-script.git
cd ypsilon-script
npm install
npm link
```

## Future Enhancements

Planned features (not yet implemented):
- `.ysconfig` file support for project-wide settings
- Custom build properties
- Multiple board profiles
- Serial monitor baud rate configuration
- Full code retrieval implementation with protocol
