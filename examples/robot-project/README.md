# Robot Project Example

This example demonstrates a multi-file project structure in Ypsilon Script.

## Project Structure

```
robot-project/
  ├── robot.ys          # Main entry point (has @main)
  ├── motor-control.ys  # Motor control module (no @main)
  └── sensors.ys        # Sensor module (no @main)
```

## File Descriptions

### robot.ys
The main entry point with `@main` directive. Contains:
- Robot state machine
- Main control logic
- Integration of motors and sensors
- Event handlers (`on start`, `on loop`)

### motor-control.ys
A module providing motor control functionality. Contains:
- Motor class definition
- Motor control functions (forward, backward, turn, stop)
- Motor initialization

### sensors.ys
A module providing sensor reading functionality. Contains:
- Ultrasonic distance sensor functions
- IR sensor functions
- Sensor initialization

## How to Use

### Compile the Project

```bash
# From the parent directory
ysc robot-project/

# Or specify the main file directly
ysc robot-project/robot.ys
```

The compiler will:
1. Find `robot.ys` (the file with `@main`)
2. Compile it and all referenced modules
3. Generate `robot.ino` ready for upload

### Upload to Board

```bash
ysc upload robot-project/
```

### Run and Monitor

```bash
ysc run robot-project/
```

## Key Concepts Demonstrated

1. **@main Directive**: Only `robot.ys` has `@main`, marking it as the entry point
2. **Module Files**: `motor-control.ys` and `sensors.ys` are modules without `@main`
3. **Module Loading**: Main file loads modules with `load <file.ys> as name`
4. **State Machine**: Using enums and match for robot behavior
5. **Object-Oriented**: Motor class for encapsulation
6. **Configuration**: Board config in the main file
7. **Organization**: Logical separation of concerns into modules

## Important Notes

- Only `robot.ys` should have `@main`
- Module files don't need `@main`
- The main file cannot be named `main.ys`
- All files must be in the same folder for this simple example
- For nested module structures, see the `load` documentation

## Customization

Feel free to modify:
- Pin numbers in motor-control.ys and sensors.ys
- Robot behavior in the state machine
- Add new states and behaviors
- Add more sensor types
- Add new motor control functions
