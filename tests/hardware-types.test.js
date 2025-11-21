/**
 * Tests for Hardware Types (Digital, Analog, PWM)
 */

const { compile } = require('../src/compiler');

describe('Hardware Types - Digital', () => {
  test('should compile Digital type with high/low methods', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital led = new Digital(13)
      
      on start {
        led.high()
        led.low()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Digital');
    expect(result.code).toContain('led.high()');
    expect(result.code).toContain('led.low()');
  });

  test('should compile Digital type with toggle method', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital pin = new Digital(7)
      
      on start {
        pin.toggle()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('pin.toggle()');
  });

  test('should compile Digital type with isHigh/isLow methods', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital button = new Digital(2)
      
      on loop {
        if (button.isHigh()) {
          print("Button pressed")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('button.isHigh()');
  });
});

describe('Hardware Types - Analog', () => {
  test('should compile Analog type with read method', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Analog sensor = new Analog(0)
      
      on loop {
        mut int value = sensor.read()
        print(value)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Analog');
    expect(result.code).toContain('sensor.read()');
  });
});

describe('Hardware Types - PWM', () => {
  test('should compile PWM type for AVR boards', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut PWM motor = new PWM(9)
      
      on start {
        motor.set(128)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class PWM');
    expect(result.code).toContain('motor.set(128)');
    expect(result.code).toContain('analogWrite');
  });

  test('should compile PWM type for ESP boards', () => {
    const source = `
      @main
      config {
        board: esp32,
        clock: 240MHz
      }
      
      mut PWM motor = new PWM(9)
      
      on start {
        motor.set(255)
      }
      
      on loop {
        mut int speed = motor.get()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class PWM');
    expect(result.code).toContain('ledcSetup');
    expect(result.code).toContain('motor.get()');
  });
});

describe('Hardware Types - Integration', () => {
  test('should compile multiple hardware types together', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital led = new Digital(13)
      mut Analog sensor = new Analog(0)
      mut PWM motor = new PWM(9)
      
      on loop {
        mut int value = sensor.read()
        if (value > 512) {
          led.high()
          motor.set(255)
        } else {
          led.low()
          motor.set(0)
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Digital');
    expect(result.code).toContain('class Analog');
    expect(result.code).toContain('class PWM');
  });
});
