/**
 * Tests for Extended Hardware Types (Sensors, Displays, Actuators, Communication, etc.)
 */

const { compile } = require('../src/compiler');

describe('Sensor Types', () => {
  test('should compile TempSensor type', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TempSensor sensor = new TempSensor(A0)
      
      on loop {
        mut float temp = sensor.readCelsius()
        mut float tempF = sensor.readFahrenheit()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class TempSensor');
    expect(result.code).toContain('sensor.readCelsius()');
    expect(result.code).toContain('sensor.readFahrenheit()');
  });

  test('should compile DistanceSensor (ultrasonic)', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DistanceSensor sonar = new DistanceSensor(9, 10)
      
      on loop {
        mut float dist = sonar.readCm()
        if (sonar.inRange(5, 50)) {
          print("Object detected")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DistanceSensor');
    expect(result.code).toContain('sonar.readCm()');
    expect(result.code).toContain('sonar.inRange(5, 50)');
  });

  test('should compile LightSensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut LightSensor ldr = new LightSensor(A0)
      
      on loop {
        if (ldr.isDark()) {
          print("Lights needed")
        }
        mut int level = ldr.readPercent()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class LightSensor');
    expect(result.code).toContain('ldr.isDark()');
    expect(result.code).toContain('ldr.readPercent()');
  });

  test('should compile MotionSensor (PIR)', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut MotionSensor pir = new MotionSensor(2)
      
      on loop {
        if (pir.detected()) {
          print("Motion!")
        }
        if (pir.isIdle(5000)) {
          print("No motion for 5 seconds")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class MotionSensor');
    expect(result.code).toContain('pir.detected()');
    expect(result.code).toContain('pir.isIdle(5000)');
  });

  test('should compile Joystick', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Joystick joy = new Joystick(A0, A1, 2)
      
      on loop {
        mut int x = joy.readX()
        mut int y = joy.readY()
        if (joy.isPressed()) {
          print("Button pressed")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Joystick');
    expect(result.code).toContain('joy.readX()');
    expect(result.code).toContain('joy.isPressed()');
  });

  test('should compile Potentiometer', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Potentiometer pot = new Potentiometer(A0)
      
      on loop {
        mut int value = pot.read()
        mut int percent = pot.readPercent()
        mut int mapped = pot.readMapped(0, 180)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Potentiometer');
    expect(result.code).toContain('pot.readPercent()');
    expect(result.code).toContain('pot.readMapped(0, 180)');
  });

  test('should compile RotaryEncoder', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut RotaryEncoder enc = new RotaryEncoder(2, 3, 4)
      
      on loop {
        enc.update()
        mut i32 pos = enc.position()
        if (enc.isPressed()) {
          enc.reset()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class RotaryEncoder');
    expect(result.code).toContain('enc.update()');
    expect(result.code).toContain('enc.position()');
  });
});

describe('Display Types', () => {
  test('should compile OLED display', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut OLED display = new OLED(128, 64)
      
      on start {
        display.begin()
        display.clear()
        display.setCursor(0, 0)
        display.print("Hello World")
        display.display()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class OLED');
    expect(result.code).toContain('display.begin()');
    expect(result.code).toContain('display.print');
  });

  test('should compile NeoPixel strip', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut NeoPixel strip = new NeoPixel(6, 30)
      
      on start {
        strip.begin()
      }
      
      on loop {
        strip.setPixel(0, 255, 0, 0)
        strip.fill(0, 0, 255)
        strip.show()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class NeoPixel');
    expect(result.code).toContain('strip.setPixel');
    expect(result.code).toContain('strip.fill');
  });

  test('should compile SevenSegment display', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut SevenSegment seg = new SevenSegment(2, 3, 4, 5, 6, 7, 8)
      
      on loop {
        seg.display(5)
        wait 1s
        seg.clear()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class SevenSegment');
    expect(result.code).toContain('seg.display(5)');
    expect(result.code).toContain('seg.clear()');
  });
});

describe('Actuator Types', () => {
  test('should compile Relay', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Relay relay = new Relay(7)
      
      on loop {
        relay.on()
        wait 1s
        relay.off()
        wait 1s
        relay.toggle()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Relay');
    expect(result.code).toContain('relay.on()');
    expect(result.code).toContain('relay.toggle()');
  });

  test('should compile Fan and Pump', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Fan cooler = new Fan(9)
      mut Pump waterPump = new Pump(10)
      
      on loop {
        cooler.setSpeed(200)
        waterPump.on()
        wait 5s
        cooler.off()
        waterPump.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Fan');
    expect(result.code).toContain('class Pump');
    expect(result.code).toContain('cooler.setSpeed(200)');
  });

  test('should compile Valve and Solenoid', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Valve valve = new Valve(8)
      mut Solenoid sol = new Solenoid(9)
      
      on loop {
        valve.open()
        sol.activate()
        wait 2s
        valve.close()
        sol.deactivate()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Valve');
    expect(result.code).toContain('class Solenoid');
    expect(result.code).toContain('valve.open()');
    expect(result.code).toContain('sol.activate()');
  });
});

describe('Motor Driver Types', () => {
  test('should compile HBridge', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut HBridge motor = new HBridge(9, 10, 11)
      
      on loop {
        motor.forward(200)
        wait 2s
        motor.reverse(150)
        wait 2s
        motor.stop()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class HBridge');
    expect(result.code).toContain('motor.forward(200)');
    expect(result.code).toContain('motor.reverse(150)');
  });

  test('should compile MotorDriver (dual)', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut MotorDriver driver = new MotorDriver(3, 4, 5, 6)
      
      on loop {
        driver.setMotorA(255)
        driver.setMotorB(128)
        wait 2s
        driver.stopAll()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class MotorDriver');
    expect(result.code).toContain('driver.setMotorA');
    expect(result.code).toContain('driver.stopAll()');
  });
});

describe('Timing Types', () => {
  test('should compile Timer', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Timer timer = new Timer()
      
      on start {
        timer.start(5000)
      }
      
      on loop {
        if (timer.isExpired()) {
          print("Timer done!")
          timer.reset()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Timer');
    expect(result.code).toContain('timer.start(5000)');
    expect(result.code).toContain('timer.isExpired()');
  });

  test('should compile RTC', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut RTC clock = new RTC()
      
      on start {
        clock.begin()
      }
      
      on loop {
        mut int h = clock.hour()
        mut int m = clock.minute()
        mut int s = clock.second()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class RTC');
    expect(result.code).toContain('clock.hour()');
  });
});

describe('Audio Types', () => {
  test('should compile Speaker', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Speaker spk = new Speaker(8)
      
      on loop {
        spk.tone(440, 500)
        wait 1s
        spk.beep(1000, 200)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Speaker');
    expect(result.code).toContain('spk.tone');
    expect(result.code).toContain('spk.beep');
  });

  test('should compile Microphone', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Microphone mic = new Microphone(A0)
      
      on loop {
        mut int level = mic.read()
        if (mic.isLoud()) {
          print("Loud noise detected")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Microphone');
    expect(result.code).toContain('mic.read()');
    expect(result.code).toContain('mic.isLoud()');
  });
});

describe('Power Types', () => {
  test('should compile Battery monitor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Battery batt = new Battery(A0, 4.2, 3.0)
      
      on loop {
        mut int percent = batt.readPercent()
        if (batt.isLow(20)) {
          print("Low battery!")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Battery');
    expect(result.code).toContain('batt.readPercent()');
    expect(result.code).toContain('batt.isLow(20)');
  });
});

describe('Extended Hardware Integration', () => {
  test('should compile complex sensor-actuator system', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TempSensor temp = new TempSensor(A0)
      mut Fan cooler = new Fan(9)
      mut Relay heater = new Relay(7)
      mut OLED display = new OLED()
      
      on start {
        display.begin()
      }
      
      on loop {
        mut float t = temp.readCelsius()
        
        if (t > 30) {
          cooler.on()
          heater.off()
        } else if (t < 18) {
          cooler.off()
          heater.on()
        } else {
          cooler.off()
          heater.off()
        }
        
        display.clear()
        display.print(t)
        display.display()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class TempSensor');
    expect(result.code).toContain('class Fan');
    expect(result.code).toContain('class Relay');
    expect(result.code).toContain('class OLED');
  });
});
