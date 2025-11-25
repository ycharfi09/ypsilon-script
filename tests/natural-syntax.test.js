/**
 * Tests for Natural Syntax for Hardware Types
 * Allows creating hardware types like a normal variable: Led led = 13
 * Instead of: Led led = new Led(13)
 */

const { compile } = require('../src/compiler');

describe('Natural Syntax - Basic Types', () => {
  test('should compile Led with natural syntax (single pin)', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Led led = 13
      
      on loop {
        led.on()
        wait 500ms
        led.off()
        wait 500ms
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Led led = Led(13)');
    expect(result.code).toContain('led.on()');
    expect(result.code).toContain('led.off()');
  });

  test('should compile Digital with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Digital pin = 7
      
      on loop {
        pin.high()
        pin.toggle()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Digital pin = Digital(7)');
  });

  test('should compile Analog with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Analog sensor = 0
      
      on loop {
        mut int value = sensor.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Analog sensor = Analog(0)');
  });

  test('should compile PWM with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut PWM motor = 9
      
      on loop {
        motor.set(128)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('PWM motor = PWM(9)');
  });

  test('should compile Button with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Button btn = 2
      
      on loop {
        if (btn.pressed()) {
          print("Pressed")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Button btn = Button(2)');
  });

  test('should compile Buzzer with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Buzzer buz = 8
      
      on loop {
        buz.on()
        wait 100ms
        buz.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Buzzer buz = Buzzer(8)');
  });
});

describe('Natural Syntax - Sensor Types', () => {
  test('should compile TempSensor with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TempSensor temp = 0
      
      on loop {
        mut float t = temp.readCelsius()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('TempSensor temp = TempSensor(0)');
  });

  test('should compile LightSensor with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut LightSensor ldr = 1
      
      on loop {
        mut int light = ldr.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('LightSensor ldr = LightSensor(1)');
  });

  test('should compile MotionSensor with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut MotionSensor pir = 3
      
      on loop {
        if (pir.detected()) {
          print("Motion!")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('MotionSensor pir = MotionSensor(3)');
  });

  test('should compile Potentiometer with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Potentiometer pot = 2
      
      on loop {
        mut int val = pot.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Potentiometer pot = Potentiometer(2)');
  });
});

describe('Natural Syntax - Actuator Types', () => {
  test('should compile Relay with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Relay relay = 7
      
      on loop {
        relay.on()
        wait 1s
        relay.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Relay relay = Relay(7)');
  });

  test('should compile Fan with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Fan cooler = 9
      
      on loop {
        cooler.setSpeed(200)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Fan cooler = Fan(9)');
  });

  test('should compile Pump with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Pump pump = 10
      
      on loop {
        pump.on()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Pump pump = Pump(10)');
  });

  test('should compile Valve with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Valve valve = 8
      
      on loop {
        valve.open()
        valve.close()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Valve valve = Valve(8)');
  });

  test('should compile Solenoid with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Solenoid sol = 6
      
      on loop {
        sol.activate()
        sol.deactivate()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Solenoid sol = Solenoid(6)');
  });
});

describe('Natural Syntax - Audio Types', () => {
  test('should compile Speaker with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Speaker spk = 8
      
      on loop {
        spk.beep(1000, 200)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Speaker spk = Speaker(8)');
  });

  test('should compile Microphone with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Microphone mic = 0
      
      on loop {
        mut int level = mic.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Microphone mic = Microphone(0)');
  });
});

describe('Natural Syntax - Still works with new keyword', () => {
  test('should still compile Led with new keyword', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Led led = new Led(13)
      
      on loop {
        led.on()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Led led = Led(13)');
  });

  test('should still compile multi-arg types with new keyword', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DistanceSensor sonar = new DistanceSensor(9, 10)
      
      on loop {
        mut float d = sonar.readCm()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('DistanceSensor sonar = DistanceSensor(9, 10)');
  });
});

describe('Natural Syntax - Integration', () => {
  test('should compile multiple hardware types with natural syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Led led1 = 13
      mut Led led2 = 12
      mut Button btn = 2
      mut Buzzer buz = 8
      mut TempSensor temp = 0
      
      on loop {
        if (btn.pressed()) {
          led1.on()
          buz.on()
        } else {
          led1.off()
          buz.off()
        }
        
        mut float t = temp.readCelsius()
        if (t > 30) {
          led2.on()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Led led1 = Led(13)');
    expect(result.code).toContain('Led led2 = Led(12)');
    expect(result.code).toContain('Button btn = Button(2)');
    expect(result.code).toContain('Buzzer buz = Buzzer(8)');
    expect(result.code).toContain('TempSensor temp = TempSensor(0)');
  });

  test('should compile mixed natural and new syntax', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Led led = 13
      mut Digital pin = 7
      mut Servo servo = new Servo(9)
      mut DistanceSensor sonar = new DistanceSensor(10, 11)
      
      on loop {
        led.toggle()
        pin.high()
        servo.writeAngle(90)
        mut float dist = sonar.readCm()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Led led = Led(13)');
    expect(result.code).toContain('Digital pin = Digital(7)');
    expect(result.code).toContain('Servo servo = Servo(9)');
    expect(result.code).toContain('DistanceSensor sonar = DistanceSensor(10, 11)');
  });
});

describe('Natural Syntax - Timer type', () => {
  test('should compile Timer with natural syntax (no arguments)', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Timer myTimer = new Timer()
      
      on loop {
        myTimer.start(1000)
        if (myTimer.isExpired()) {
          print("Done")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Timer myTimer = Timer()');
  });
});
