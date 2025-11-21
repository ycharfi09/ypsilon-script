/**
 * Tests for Unit System, Ranges, Type Conversion, and Collections
 */

const { compile } = require('../src/compiler');

describe('Unit System - Time Units', () => {
  test('should compile milliseconds unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on loop {
        wait 500ms
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('500');
  });

  test('should compile seconds unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on loop {
        wait 2s
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2000');
  });

  test('should compile microseconds unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int delay = 500us
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });
});

describe('Unit System - Frequency Units', () => {
  test('should compile Hz unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int freq = 50Hz
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('50');
  });

  test('should compile kHz unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int freq = 5kHz
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('5000');
  });
});

describe('Unit System - Angle Units', () => {
  test('should compile degrees unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int angle = 90deg
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('90');
  });
});

describe('Unit System - Distance Units', () => {
  test('should compile centimeters unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int distance = 10cm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('100');
  });

  test('should compile meters unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int distance = 1m
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('1000');
  });
});

describe('Unit System - Speed Units', () => {
  test('should compile rpm unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int speed = 200rpm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('200');
  });
});

describe('Ranges', () => {
  test('should compile variable with range constraint', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut int sensorValue in 0...1023 = 512
      
      on loop {
        sensorValue = analogRead(0)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('constrain');
    expect(result.code).toContain('0');
    expect(result.code).toContain('1023');
  });

  test('should compile variable with range using variables', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const int MIN = 0
      const int MAX = 255
      mut int value in MIN...MAX = 128
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('constrain');
  });
});

describe('Type Conversion', () => {
  test('should compile int to float conversion', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int a = 5
        mut float b = a.as<float>()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('static_cast<float>');
  });

  test('should compile float to int conversion', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const float a = 3.14
        mut int b = a.as<int>()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('static_cast<int>');
  });
});

describe('Collections - List', () => {
  test('should compile List type declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut List numbers = new List()
      
      on start {
        numbers.push(1)
        numbers.push(2)
        numbers.push(3)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('template<typename T>');
    expect(result.code).toContain('class List');
    expect(result.code).toContain('numbers.push(1)');
  });

  test('should compile List with get and set methods', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut List data = new List()
      
      on loop {
        mut int value = data.get(0)
        data.set(0, 100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('data.get(0)');
    expect(result.code).toContain('data.set(0, 100)');
  });
});

describe('Collections - Map', () => {
  test('should compile Map type declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Map settings = new Map()
      
      on start {
        settings.set(1, 100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Map');
    expect(result.code).toContain('settings.set(1, 100)');
  });

  test('should compile Map with get and has methods', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Map data = new Map()
      
      on loop {
        if (data.has(1)) {
          mut int val = data.get(1)
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('data.has(1)');
    expect(result.code).toContain('data.get(1)');
  });
});

describe('Error Handling', () => {
  test('should compile error handling with !catch syntax', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Analog sensor = new Analog(0)
      
      on loop {
        mut int val = sensor.read() !catch {
          print("Sensor failed")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    // Basic error handling structure should be present
  });
});
