/**
 * Semantic Analyzer Tests
 * Tests for undeclared variable detection and error messages
 */

const { compile } = require('../src/compiler');

describe('Semantic Analyzer - Undeclared Variables', () => {
  test('should detect undeclared variable in simple expression', () => {
    const source = `
      function void test() {
        int x = y + 1;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Undefined variable');
    expect(result.error).toContain('y');
  });

  test('should detect undeclared variable in member access', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Analog statusLed = new Analog(24)
      
      on loop {
        mut int value = status.read()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Undefined variable');
    expect(result.error).toContain('status');
  });

  test('should suggest similar variable names', () => {
    const source = `
      function void test() {
        int counter = 0;
        if (couter > 10) {
          print("test");
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Undefined variable');
    expect(result.error).toContain('couter');
    expect(result.error).toContain('counter');
  });

  test('should allow declared variables', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut int x = 10;
      
      on loop {
        x = x + 1;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should recognize built-in functions', () => {
    const source = `
      function void test() {
        pinMode(13, OUTPUT);
        digitalWrite(13, HIGH);
        delay(1000);
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should recognize built-in constants', () => {
    const source = `
      function void test() {
        int h = HIGH;
        int l = LOW;
        pinMode(13, OUTPUT);
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle alias declarations', () => {
    const source = `
      alias LED_PIN = 13;
      
      function void test() {
        pinMode(LED_PIN, OUTPUT);
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle enum values', () => {
    const source = `
      enum State { IDLE, RUNNING, STOPPED }
      
      function void test() {
        State current = IDLE;
        if (current == RUNNING) {
          print("running");
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle class members', () => {
    const source = `
      class Motor {
        mut int speed;
        
        constructor(int s) {
          self.speed = s;
        }
        
        fn getSpeed() -> int {
          return self.speed;
        }
      }
      
      function void test() {
        Motor m = new Motor(100);
        int s = m.getSpeed();
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle function parameters', () => {
    const source = `
      function int add(int a, int b) {
        return a + b;
      }
      
      function void test() {
        int result = add(5, 3);
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle local scope variables', () => {
    const source = `
      function void test() {
        int x = 10;
        if (x > 5) {
          int y = 20;
          x = x + y;
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle loop variables', () => {
    const source = `
      function void test() {
        for (int i = 0; i < 10; i = i + 1) {
          print(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should handle module namespaces', () => {
    const moduleSource = `
      class Motor {
        mut int speed;
        constructor(int s) {
          self.speed = s;
        }
      }
    `;
    
    const source = `
      load <motor.ys> as m
      
      function void test() {
        m.Motor motor = new m.Motor(100);
      }
    `;
    
    const result = compile(source, {
      basePath: '/test',
      fileReader: (filePath) => {
        if (filePath.endsWith('motor.ys')) {
          return moduleSource;
        }
        throw new Error('File not found');
      }
    });
    
    expect(result.success).toBe(true);
  });

  test('should provide multiple suggestions when available', () => {
    const source = `
      function void test() {
        int value1 = 10;
        int value2 = 20;
        int value3 = 30;
        int result = valu + 1;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Undefined variable');
    expect(result.error).toContain('valu');
  });

  test('should detect multiple undeclared variables', () => {
    const source = `
      function void test() {
        int result = x + y + z;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('x');
    expect(result.error).toContain('y');
    expect(result.error).toContain('z');
  });
});

describe('Semantic Analyzer - Hex Literals', () => {
  test('should support hexadecimal literals', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut SPI spi = new SPI()
      
      on loop {
        mut u8 result = spi.transfer(0x42)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('66'); // 0x42 = 66 in decimal
  });

  test('should support uppercase hex literals', () => {
    const source = `
      function void test() {
        int value = 0xFF;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('255'); // 0xFF = 255
  });

  test('should support mixed case hex literals', () => {
    const source = `
      function void test() {
        int value = 0xAb;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('171'); // 0xAb = 171
  });
});
