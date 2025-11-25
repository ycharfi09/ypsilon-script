/**
 * Tests for Multiplexer Hardware Types (Mux4, Mux8, Mux16, Mux32)
 */

const { compile } = require('../src/compiler');

describe('Hardware Types - Mux4', () => {
  test('should compile Mux4 type with 4 channels', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Mux4 mux = new Mux4(A0, 2, 3)
      
      on loop {
        mut int value = mux.read(0)
        mux.selectChannel(1)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Mux4');
    expect(result.code).toContain('mux.read(0)');
    expect(result.code).toContain('mux.selectChannel(1)');
  });

  test('should compile Mux4 type with enable pin', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Mux4 mux = new Mux4(A0, 2, 3, 4)
      
      on start {
        mux.enable()
        mux.disable()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('mux.enable()');
    expect(result.code).toContain('mux.disable()');
  });
});

describe('Hardware Types - Mux8', () => {
  test('should compile Mux8 type with 8 channels', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Mux8 mux = new Mux8(A0, 2, 3, 4)
      
      on loop {
        mut int value = mux.read(7)
        mux.selectChannel(5)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Mux8');
    expect(result.code).toContain('mux.read(7)');
    expect(result.code).toContain('mux.selectChannel(5)');
  });
});

describe('Hardware Types - Mux16', () => {
  test('should compile Mux16 type with 16 channels', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Mux16 mux = new Mux16(A0, 2, 3, 4, 5)
      
      on loop {
        mut int value = mux.read(15)
        mux.selectChannel(10)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Mux16');
    expect(result.code).toContain('mux.read(15)');
    expect(result.code).toContain('mux.selectChannel(10)');
  });
});

describe('Hardware Types - Mux32', () => {
  test('should compile Mux32 type with 32 channels', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Mux32 mux = new Mux32(A0, 2, 3, 4, 5, 6)
      
      on loop {
        mut int value = mux.read(31)
        mux.selectChannel(20)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Mux32');
    expect(result.code).toContain('mux.read(31)');
    expect(result.code).toContain('mux.selectChannel(20)');
  });
});

describe('Multiplexer Integration', () => {
  test('should compile multiple multiplexers with sensors', () => {
    const source = `
      @main
      config {
        board: arduino_mega,
        clock: 16MHz
      }
      
      mut Mux16 analogMux = new Mux16(A0, 22, 23, 24, 25)
      mut Digital led = new Digital(13)
      
      on loop {
        mut int temp = analogMux.read(0)
        mut int humidity = analogMux.read(1)
        mut int pressure = analogMux.read(2)
        
        if (temp > 500) {
          led.high()
        } else {
          led.low()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Mux16');
    expect(result.code).toContain('class Digital');
  });
});
