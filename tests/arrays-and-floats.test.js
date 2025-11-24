/**
 * Tests for array literals and f32/f64 float types
 */

const { compile } = require('../src/compiler');
const { Lexer, TOKEN_TYPES } = require('../src/lexer');
const { Parser } = require('../src/parser');

describe('Float Types (f32, f64)', () => {
  test('should recognize f32 type', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f32 value = 3.14

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('float value = 3.14');
  });

  test('should recognize f64 type', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f64 precise = 3.141592653589793

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('double precise = 3.141592653589793');
  });

  test('should support both f32 and f64 in same file', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f32 single = 1.5
mut f64 double = 2.5

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('float single = 1.5');
    expect(result.code).toContain('double double = 2.5');
  });
});

describe('Array Literals', () => {
  test('should parse u8 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3, 4, 5]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t numbers[5] = {1, 2, 3, 4, 5}');
  });

  test('should parse i32 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

const i32 values = [10, 20, 30]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('const int32_t values[3] = {10, 20, 30}');
  });

  test('should parse f32 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f32 floats = [1.5, 2.5, 3.5, 4.5]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('float floats[4] = {1.5, 2.5, 3.5, 4.5}');
  });

  test('should parse f64 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

const f64 precise = [1.111, 2.222, 3.333]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('const double precise[3] = {1.111, 2.222, 3.333}');
  });

  test('should handle empty arrays', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut int empty = []

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('int empty[0] = {}');
  });

  test('should handle single element arrays', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 single = [42]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t single[1] = {42}');
  });
});

describe('Array Subscript Access', () => {
  test('should support array element read', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  mut u8 first = numbers[0]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t first = numbers[0]');
  });

  test('should support array element write', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  numbers[1] = 10
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('numbers[1] = 10');
  });

  test('should support array access with variable index', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  mut int index = 2
  mut u8 value = numbers[index]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t value = numbers[index]');
  });

  test('should support array access in expressions', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  mut u8 sum = numbers[0] + numbers[1] + numbers[2]
}
    `;
    
    const result = compile(source);
    // C++ compiler may add extra parentheses, check for the essential parts
    expect(result.code).toContain('uint8_t sum =');
    expect(result.code).toContain('numbers[0]');
    expect(result.code).toContain('numbers[1]');
    expect(result.code).toContain('numbers[2]');
  });

  test('should support nested array access', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut int indices = [0, 1, 2]
mut u8 numbers = [10, 20, 30]

on start {
  mut u8 value = numbers[indices[0]]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t value = numbers[indices[0]]');
  });
});

describe('Array and Float Integration', () => {
  test('should support mixed array types in one program', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 bytes = [1, 2, 3]
mut i32 ints = [100, 200, 300]
mut f32 floats = [1.1, 2.2, 3.3]
mut f64 doubles = [1.111, 2.222, 3.333]

on start {
  mut u8 b = bytes[0]
  mut i32 i = ints[1]
  mut f32 f = floats[2]
  mut f64 d = doubles[0]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t bytes[3] = {1, 2, 3}');
    expect(result.code).toContain('int32_t ints[3] = {100, 200, 300}');
    expect(result.code).toContain('float floats[3] = {1.1, 2.2, 3.3}');
    expect(result.code).toContain('double doubles[3] = {1.111, 2.222, 3.333}');
  });

  test('should support arrays of all integer types', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 u8arr = [1, 2]
mut u16 u16arr = [1000, 2000]
mut u32 u32arr = [100000, 200000]
mut i8 i8arr = [-10, 10]
mut i16 i16arr = [-1000, 1000]
mut i32 i32arr = [-100000, 100000]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t u8arr[2]');
    expect(result.code).toContain('uint16_t u16arr[2]');
    expect(result.code).toContain('uint32_t u32arr[2]');
    expect(result.code).toContain('int8_t i8arr[2]');
    expect(result.code).toContain('int16_t i16arr[2]');
    expect(result.code).toContain('int32_t i32arr[2]');
  });
});

describe('Array Error Cases', () => {
  test('should handle arrays passed to functions', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

fn processArray() {
  print(numbers[0])
}

on start {
  processArray()
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t numbers[3]');
    expect(result.code).toContain('Serial.println(numbers[0])');
  });
});

describe('Float Types (f32, f64)', () => {
  test('should recognize f32 type', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f32 value = 3.14

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('float value = 3.14');
  });

  test('should recognize f64 type', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f64 precise = 3.141592653589793

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('double precise = 3.141592653589793');
  });

  test('should support both f32 and f64 in same file', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f32 single = 1.5
mut f64 double = 2.5

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('float single = 1.5');
    expect(result.code).toContain('double double = 2.5');
  });
});

describe('Array Literals', () => {
  test('should parse u8 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3, 4, 5]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t numbers[5] = {1, 2, 3, 4, 5}');
  });

  test('should parse i32 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

const i32 values = [10, 20, 30]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('const int32_t values[3] = {10, 20, 30}');
  });

  test('should parse f32 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut f32 floats = [1.5, 2.5, 3.5, 4.5]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('float floats[4] = {1.5, 2.5, 3.5, 4.5}');
  });

  test('should parse f64 array literal', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

const f64 precise = [1.111, 2.222, 3.333]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('const double precise[3] = {1.111, 2.222, 3.333}');
  });

  test('should handle empty arrays', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut int empty = []

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('int empty[0] = {}');
  });

  test('should handle single element arrays', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 single = [42]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t single[1] = {42}');
  });
});

describe('Array Subscript Access', () => {
  test('should support array element read', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  mut u8 first = numbers[0]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t first = numbers[0]');
  });

  test('should support array element write', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  numbers[1] = 10
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('numbers[1] = 10');
  });

  test('should support array access with variable index', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  mut int index = 2
  mut u8 value = numbers[index]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t value = numbers[index]');
  });

  test('should support array access in expressions', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

on start {
  mut u8 sum = numbers[0] + numbers[1] + numbers[2]
}
    `;
    
    const result = compile(source);
    // C++ compiler may add extra parentheses, check for the essential parts
    expect(result.code).toContain('uint8_t sum =');
    expect(result.code).toContain('numbers[0]');
    expect(result.code).toContain('numbers[1]');
    expect(result.code).toContain('numbers[2]');
  });

  test('should support nested array access', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut int indices = [0, 1, 2]
mut u8 numbers = [10, 20, 30]

on start {
  mut u8 value = numbers[indices[0]]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t value = numbers[indices[0]]');
  });
});

describe('Array and Float Integration', () => {
  test('should support mixed array types in one program', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 bytes = [1, 2, 3]
mut i32 ints = [100, 200, 300]
mut f32 floats = [1.1, 2.2, 3.3]
mut f64 doubles = [1.111, 2.222, 3.333]

on start {
  mut u8 b = bytes[0]
  mut i32 i = ints[1]
  mut f32 f = floats[2]
  mut f64 d = doubles[0]
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t bytes[3] = {1, 2, 3}');
    expect(result.code).toContain('int32_t ints[3] = {100, 200, 300}');
    expect(result.code).toContain('float floats[3] = {1.1, 2.2, 3.3}');
    expect(result.code).toContain('double doubles[3] = {1.111, 2.222, 3.333}');
  });

  test('should support arrays of all integer types', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 u8arr = [1, 2]
mut u16 u16arr = [1000, 2000]
mut u32 u32arr = [100000, 200000]
mut i8 i8arr = [-10, 10]
mut i16 i16arr = [-1000, 1000]
mut i32 i32arr = [-100000, 100000]

on start {
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t u8arr[2]');
    expect(result.code).toContain('uint16_t u16arr[2]');
    expect(result.code).toContain('uint32_t u32arr[2]');
    expect(result.code).toContain('int8_t i8arr[2]');
    expect(result.code).toContain('int16_t i16arr[2]');
    expect(result.code).toContain('int32_t i32arr[2]');
  });
});

describe('Array Error Cases', () => {
  test('should handle arrays passed to functions', () => {
    const source = `
@main

config {
  board: arduino_uno,
  clock: 16MHz,
  uart: on,
  port: auto
}

mut u8 numbers = [1, 2, 3]

fn processArray() {
  print(numbers[0])
}

on start {
  processArray()
}
    `;
    
    const result = compile(source);
    expect(result.code).toContain('uint8_t numbers[3]');
    expect(result.code).toContain('Serial.println(numbers[0])');
  });
});
