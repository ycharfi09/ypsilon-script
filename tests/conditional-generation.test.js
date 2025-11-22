/**
 * Tests for Conditional Generation of Hardware and Collection Types
 * Ensures that only used types are included in the generated .ino file
 */

const { compile } = require('../src/compiler');

describe('Conditional Hardware Type Generation', () => {
  test('should not include any hardware types when none are used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const int LED = 13
      
      on start {
        pinMode(LED, OUTPUT)
      }
      
      on loop {
        digitalWrite(LED, HIGH)
        delay(1000)
        digitalWrite(LED, LOW)
        delay(1000)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should not contain any hardware type classes
    expect(result.code).not.toContain('class Digital');
    expect(result.code).not.toContain('class Analog');
    expect(result.code).not.toContain('class PWM');
    expect(result.code).not.toContain('class I2C');
    expect(result.code).not.toContain('class SPI');
    expect(result.code).not.toContain('class UART');
    expect(result.code).not.toContain('class Servo');
    expect(result.code).not.toContain('class Led');
    expect(result.code).not.toContain('class Button');
  });

  test('should include only Digital type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital led = new Digital(13)
      
      on start {
        led.high()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain Digital class
    expect(result.code).toContain('class Digital');
    
    // Should not contain other hardware types
    expect(result.code).not.toContain('class Analog');
    expect(result.code).not.toContain('class PWM');
    expect(result.code).not.toContain('class Servo');
    expect(result.code).not.toContain('class Led');
  });

  test('should include only Analog type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Analog sensor = new Analog(0)
      
      on loop {
        mut int value = sensor.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain Analog class
    expect(result.code).toContain('class Analog');
    
    // Should not contain other hardware types
    expect(result.code).not.toContain('class Digital');
    expect(result.code).not.toContain('class PWM');
  });

  test('should include only PWM type when used', () => {
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
    
    // Should contain PWM class
    expect(result.code).toContain('class PWM');
    
    // Should not contain other hardware types
    expect(result.code).not.toContain('class Digital');
    expect(result.code).not.toContain('class Analog');
  });

  test('should include multiple hardware types when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital led = new Digital(13)
      mut Analog sensor = new Analog(0)
      mut PWM motor = new PWM(9)
      
      on start {
        led.high()
        motor.set(100)
      }
      
      on loop {
        mut int value = sensor.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain used hardware types
    expect(result.code).toContain('class Digital');
    expect(result.code).toContain('class Analog');
    expect(result.code).toContain('class PWM');
    
    // Should not contain unused hardware types
    expect(result.code).not.toContain('class Servo');
    expect(result.code).not.toContain('class Led');
    expect(result.code).not.toContain('class Button');
  });

  test('should include Led type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Led statusLed = new Led(13)
      
      on start {
        statusLed.on()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain Led class
    expect(result.code).toContain('class Led');
    
    // Should not contain Digital (different type)
    expect(result.code).not.toContain('class Digital');
  });

  test('should include Button type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Button btn = new Button(2)
      
      on loop {
        if (btn.pressed()) {
          print("Pressed")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain Button class
    expect(result.code).toContain('class Button');
  });

  test('should include Servo type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Servo servo = new Servo(9)
      
      on start {
        servo.writeAngle(90)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain Servo class
    expect(result.code).toContain('class Servo');
    
    // Should include Servo.h header
    expect(result.code).toContain('#include <Servo.h>');
  });
});

describe('Conditional Collection Type Generation', () => {
  test('should not include collection types when none are used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const int VALUE = 42
      
      on start {
        pinMode(13, OUTPUT)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should not contain collection types
    expect(result.code).not.toContain('class List');
    expect(result.code).not.toContain('class Map');
    expect(result.code).not.toContain('#include <vector>');
    expect(result.code).not.toContain('#include <map>');
  });

  test('should include only List type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut List numbers = new List()
      
      on start {
        numbers.push(10)
        numbers.push(20)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain List class and vector include
    expect(result.code).toContain('class List');
    expect(result.code).toContain('#include <vector>');
    
    // Should not contain Map
    expect(result.code).not.toContain('class Map');
    expect(result.code).not.toContain('#include <map>');
  });

  test('should include only Map type when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Map data = new Map()
      
      on start {
        data.set(1, 100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain Map class and map include
    expect(result.code).toContain('class Map');
    expect(result.code).toContain('#include <map>');
    
    // Should not contain List
    expect(result.code).not.toContain('class List');
    expect(result.code).not.toContain('#include <vector>');
  });

  test('should include both List and Map when both are used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut List numbers = new List()
      mut Map data = new Map()
      
      on start {
        numbers.push(10)
        data.set(1, 100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain both collection types and their includes
    expect(result.code).toContain('class List');
    expect(result.code).toContain('class Map');
    expect(result.code).toContain('#include <vector>');
    expect(result.code).toContain('#include <map>');
  });
});

describe('Combined Hardware and Collection Type Generation', () => {
  test('should include both hardware and collection types when used', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Digital led = new Digital(13)
      mut List values = new List()
      
      on start {
        led.high()
        values.push(100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain hardware type
    expect(result.code).toContain('class Digital');
    
    // Should contain collection type
    expect(result.code).toContain('class List');
    expect(result.code).toContain('#include <vector>');
    
    // Should not contain unused types
    expect(result.code).not.toContain('class Analog');
    expect(result.code).not.toContain('class Map');
    expect(result.code).not.toContain('#include <map>');
  });

  test('should handle complex scenarios with multiple types', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Led led1 = new Led(13)
      mut Button btn = new Button(2)
      mut PWM motor = new PWM(9)
      mut List readings = new List()
      mut Map settings = new Map()
      
      on start {
        led1.on()
        motor.set(100)
        readings.push(0)
        settings.set(1, 50)
      }
      
      on loop {
        if (btn.pressed()) {
          led1.toggle()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain used hardware types
    expect(result.code).toContain('class Led');
    expect(result.code).toContain('class Button');
    expect(result.code).toContain('class PWM');
    
    // Should contain used collection types
    expect(result.code).toContain('class List');
    expect(result.code).toContain('class Map');
    expect(result.code).toContain('#include <vector>');
    expect(result.code).toContain('#include <map>');
    
    // Should not contain unused hardware types
    expect(result.code).not.toContain('class Digital');
    expect(result.code).not.toContain('class Analog');
    expect(result.code).not.toContain('class Servo');
  });
});
