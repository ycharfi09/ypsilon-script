/**
 * Tests for Width-Specific Integer Types
 * u8, u16, u32, u64, i8, i16, i32, i64, byte, short
 */

const { compile } = require('../src/compiler');
const { Lexer, TOKEN_TYPES } = require('../src/lexer');
const { Parser } = require('../src/parser');

describe('Width-Specific Integer Types - Lexer', () => {
  test('should tokenize unsigned integer types', () => {
    const source = 'u8 u16 u32 u64';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.TYPE_U8);
    expect(tokens[1].type).toBe(TOKEN_TYPES.TYPE_U16);
    expect(tokens[2].type).toBe(TOKEN_TYPES.TYPE_U32);
    expect(tokens[3].type).toBe(TOKEN_TYPES.TYPE_U64);
  });

  test('should tokenize signed integer types', () => {
    const source = 'i8 i16 i32 i64';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.TYPE_I8);
    expect(tokens[1].type).toBe(TOKEN_TYPES.TYPE_I16);
    expect(tokens[2].type).toBe(TOKEN_TYPES.TYPE_I32);
    expect(tokens[3].type).toBe(TOKEN_TYPES.TYPE_I64);
  });

  test('should tokenize type aliases', () => {
    const source = 'byte short';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.TYPE_BYTE);
    expect(tokens[1].type).toBe(TOKEN_TYPES.TYPE_SHORT);
  });
});

describe('Width-Specific Integer Types - Variable Declarations', () => {
  test('should compile u8 variable declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u8 value = 255
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t value = 255');
  });

  test('should compile u16 variable declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u16 value = 65535
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint16_t value = 65535');
  });

  test('should compile u32 variable declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u32 value = 1000000
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint32_t value = 1000000');
  });

  test('should compile i8 variable declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i8 value = -128
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('int8_t value = -128');
  });

  test('should compile i16 variable declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i16 value = -32768
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('int16_t value = -32768');
  });

  test('should compile i32 variable declaration', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i32 value = -2147483648
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('int32_t value = -2147483648');
  });

  test('should compile byte (alias for u8)', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const byte value = 128
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t value = 128');
  });

  test('should compile short (alias for i16)', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const short value = 1000
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('int16_t value = 1000');
  });

  test('should compile mutable width-specific integer', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut u8 counter = 0
      
      on loop {
        counter = counter + 1
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t counter = 0');
  });
});

describe('Width-Specific Integer Types - Range Validation', () => {
  test('should reject u8 value out of range (too large)', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u8 value = 256
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('u8');
  });

  test('should reject u8 negative value', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u8 value = -1
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
  });

  test('should reject i8 value too large', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i8 value = 128
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('i8');
  });

  test('should reject i8 value too small', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i8 value = -129
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
  });

  test('should reject u16 value out of range', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u16 value = 65536
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('u16');
  });

  test('should reject i16 value out of range', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i16 value = 32768
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('i16');
  });

  test('should accept u8 max value', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u8 value = 255
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should accept i8 min and max values', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const i8 minVal = -128
      const i8 maxVal = 127
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test('should reject byte (u8 alias) value out of range', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const byte value = 256
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('byte');
  });

  test('should reject short (i16 alias) value out of range', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const short value = -32769
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('short');
  });
});

describe('Width-Specific Integer Types - Function Parameters', () => {
  test('should compile function with u8 parameter', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      fn setLevel(u8 level) -> void {
        print(level)
      }
      
      on start {
        setLevel(128)
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('void setLevel(uint8_t level)');
  });

  test('should compile function with multiple width-specific parameters', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      fn process(u8 a, i16 b, u32 c) -> void {
        print(a)
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('void process(uint8_t a, int16_t b, uint32_t c)');
  });

  test('should compile function returning width-specific type', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      fn getCounter() -> u8 {
        return 42
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t getCounter()');
  });
});

describe('Width-Specific Integer Types - Class Fields', () => {
  test('should compile class with u8 fields', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Sensor {
        mut u8 value
        const u8 threshold
        
        constructor(u8 t) {
          self.threshold = t
          self.value = 0
        }
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t value');
    expect(result.code).toContain('const uint8_t threshold');
  });

  test('should compile class with mixed width-specific types', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Motor {
        mut u8 speed
        mut i16 position
        mut u32 totalSteps
        
        constructor() {
          self.speed = 0
          self.position = 0
          self.totalSteps = 0
        }
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t speed');
    expect(result.code).toContain('int16_t position');
    expect(result.code).toContain('uint32_t totalSteps');
  });

  test('should compile class method with width-specific parameter', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class LED {
        mut u8 brightness
        
        constructor() {
          self.brightness = 0
        }
        
        fn setBrightness(u8 value) {
          self.brightness = value
        }
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('void setBrightness(uint8_t value)');
  });
});

describe('Width-Specific Integer Types - Struct Fields', () => {
  test('should compile struct with width-specific fields', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      struct SensorData {
        u8 temperature
        u16 pressure
        i8 offset
      }
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t temperature');
    expect(result.code).toContain('uint16_t pressure');
    expect(result.code).toContain('int8_t offset');
  });
});

describe('Width-Specific Integer Types - Complex Scenarios', () => {
  test('should compile complete program using width-specific types', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      struct Config {
        u8 mode
        u16 interval
      }
      
      class Device {
        mut u8 state
        mut byte id
        
        constructor(byte deviceId) {
          self.id = deviceId
          self.state = 0
        }
        
        fn setState(u8 newState) {
          self.state = newState
        }
      }
      
      const byte MAX_DEVICES = 10
      mut Device device = new Device(1)
      
      fn processValue(u16 val) -> u8 {
        return 42
      }
      
      on start {
        device.setState(1)
      }
      
      on loop {
        mut u8 result = processValue(1000)
        delay(100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('uint8_t mode');
    expect(result.code).toContain('uint16_t interval');
    expect(result.code).toContain('uint8_t state');
    expect(result.code).toContain('uint8_t id');
    expect(result.code).toContain('const uint8_t MAX_DEVICES = 10');
    expect(result.code).toContain('uint8_t processValue(uint16_t val)');
  });

  test('should validate ranges in complex expressions', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      const u8 a = 100
      const u8 b = 200
      const u8 c = 300
      
      on loop {}
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.error).toContain('out of range');
    expect(result.error).toContain('300');
  });
});
