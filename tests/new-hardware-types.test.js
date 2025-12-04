/**
 * Tests for New Hardware Types (I2C, SPI, UART, Servo, Encoder, DCMotor, StepperMotor, Led, RgbLed, Button, Buzzer)
 */

const { compile } = require('../src/compiler');

describe('Hardware Types - I2C', () => {
  test('should compile I2C type with default constructor', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut I2C bus = new I2C()
      
      on start {
        bus.begin()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class I2C');
    expect(result.code).toContain('#include <Wire.h>');
    expect(result.code).toContain('bus.begin()');
  });

  test('should compile I2C type with bus parameter', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut I2C i2c1 = new I2C(1)
      
      on loop {
        i2c1.begin()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('I2C i2c1');
  });

  test('should compile I2C scan method', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut I2C bus = new I2C()
      
      on loop {
        mut List devices = bus.scan()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('bus.scan()');
  });
});

describe('Hardware Types - SPI', () => {
  test('should compile SPI type with default constructor', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut SPI spi = new SPI()
      
      on start {
        spi.begin()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class SPI');
    expect(result.code).toContain('#include <SPI.h>');
    expect(result.code).toContain('spi.begin()');
  });

  test('should compile SPI transfer methods', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut SPI spi = new SPI()
      
      on loop {
        mut u8 result = spi.transfer(0x42)
        spi.setClock(1000000)
        spi.setMode(0)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('spi.transfer');
    expect(result.code).toContain('spi.setClock');
    expect(result.code).toContain('spi.setMode');
  });
});

describe('Hardware Types - UART', () => {
  test('should compile UART type with baud rate', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut UART serial = new UART(115200)
      
      on start {
        serial.println("Hello")
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class UART');
    expect(result.code).toContain('UART serial');
    expect(result.code).toContain('serial.println');
  });

  test('should compile UART with port parameter', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut UART debug = new UART(115200, 1)
      
      on loop {
        if (debug.available() > 0) {
          mut i16 data = debug.read()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('debug.available()');
    expect(result.code).toContain('debug.read()');
  });
});

describe('Hardware Types - Servo', () => {
  test('should compile Servo type with pin', () => {
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
    expect(result.code).toContain('class YsServo');
    expect(result.code).toContain('#include <Servo.h>');
    expect(result.code).toContain('servo.writeAngle');
  });

  test('should compile Servo with min/max microseconds', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Servo servo2 = new Servo(10, 1000, 2000)
      
      on loop {
        servo2.writeMicroseconds(1500)
        mut u16 angle = servo2.readAngle()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('servo2.writeMicroseconds');
    expect(result.code).toContain('servo2.readAngle()');
  });
});

describe('Hardware Types - Encoder', () => {
  test('should compile Encoder type', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Encoder enc = new Encoder(2, 3, 400)
      
      on loop {
        mut i32 pos = enc.position()
        enc.reset()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Encoder');
    expect(result.code).toContain('enc.position()');
    expect(result.code).toContain('enc.reset()');
  });

  test('should compile Encoder rpm method', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Encoder enc = new Encoder(2, 3, 400)
      
      on loop {
        mut i32 speed = enc.rpm(1000)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('enc.rpm');
  });
});

describe('Hardware Types - DCMotor', () => {
  test('should compile DCMotor with 2 pins', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut DCMotor motor = new DCMotor(9, 8)
      
      on start {
        motor.forward(200)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DCMotor');
    expect(result.code).toContain('motor.forward');
  });

  test('should compile DCMotor with 3 pins', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut DCMotor motor2 = new DCMotor(9, 8, 7)
      
      on loop {
        motor2.setSpeed(150)
        motor2.reverse(100)
        motor2.stop()
        motor2.brake()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('motor2.setSpeed');
    expect(result.code).toContain('motor2.reverse');
    expect(result.code).toContain('motor2.stop()');
    expect(result.code).toContain('motor2.brake()');
  });
});

describe('Hardware Types - StepperMotor', () => {
  test('should compile StepperMotor type', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut StepperMotor stepper = new StepperMotor(2, 3, 200)
      
      on start {
        stepper.setSpeed(60)
        stepper.moveSteps(100)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class StepperMotor');
    expect(result.code).toContain('stepper.setSpeed');
    expect(result.code).toContain('stepper.moveSteps');
  });

  test('should compile StepperMotor position methods', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut StepperMotor stepper = new StepperMotor(2, 3, 200)
      
      on loop {
        mut i32 pos = stepper.position()
        stepper.resetPosition()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('stepper.position()');
    expect(result.code).toContain('stepper.resetPosition()');
  });
});

describe('Hardware Types - Led', () => {
  test('should compile Led type with pin', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Led led = new Led(13)
      
      on loop {
        led.on()
        led.off()
        led.toggle()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Led');
    expect(result.code).toContain('led.on()');
    expect(result.code).toContain('led.off()');
    expect(result.code).toContain('led.toggle()');
  });

  test('should compile Led with dimmable parameter', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Led dimmable = new Led(9, true)
      
      on loop {
        dimmable.setBrightness(128)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('dimmable.setBrightness');
  });
});

describe('Hardware Types - RgbLed', () => {
  test('should compile RgbLed type with RGB pins', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut RgbLed rgb = new RgbLed(9, 10, 11)
      
      on start {
        rgb.red()
        rgb.green()
        rgb.blue()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class RgbLed');
    expect(result.code).toContain('rgb.red()');
    expect(result.code).toContain('rgb.green()');
    expect(result.code).toContain('rgb.blue()');
  });

  test('should compile RgbLed with common anode parameter', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut RgbLed rgbAnode = new RgbLed(9, 10, 11, true)
      
      on loop {
        rgbAnode.set(255, 128, 64)
        rgbAnode.yellow()
        rgbAnode.cyan()
        rgbAnode.magenta()
        rgbAnode.white()
        rgbAnode.orange()
        rgbAnode.purple()
        rgbAnode.pink()
        rgbAnode.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('rgbAnode.set');
    expect(result.code).toContain('rgbAnode.yellow()');
    expect(result.code).toContain('rgbAnode.cyan()');
    expect(result.code).toContain('rgbAnode.magenta()');
    expect(result.code).toContain('rgbAnode.white()');
    expect(result.code).toContain('rgbAnode.orange()');
    expect(result.code).toContain('rgbAnode.purple()');
    expect(result.code).toContain('rgbAnode.pink()');
    expect(result.code).toContain('rgbAnode.off()');
  });
});

describe('Hardware Types - Button', () => {
  test('should compile Button type with pin', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Button btn = new Button(2)
      
      on loop {
        if (btn.pressed()) {
          print("Button pressed")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Button');
    expect(result.code).toContain('btn.pressed()');
  });

  test('should compile Button with pullup and activeLow parameters', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Button activeLow = new Button(3, false, true)
      
      on loop {
        if (activeLow.justPressed()) {
          print("Just pressed")
        }
        if (activeLow.justReleased()) {
          print("Just released")
        }
        if (activeLow.released()) {
          print("Released")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('activeLow.justPressed()');
    expect(result.code).toContain('activeLow.justReleased()');
    expect(result.code).toContain('activeLow.released()');
  });
});

describe('Hardware Types - Buzzer', () => {
  test('should compile Buzzer type with pin', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Buzzer buz = new Buzzer(8)
      
      on start {
        buz.on()
        buz.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Buzzer');
    expect(result.code).toContain('buz.on()');
    expect(result.code).toContain('buz.off()');
  });

  test('should compile Buzzer with tone capability', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Buzzer toneBuz = new Buzzer(9, true)
      
      on loop {
        toneBuz.beep(100)
        toneBuz.tone(440, 500)
        toneBuz.noTone()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('toneBuz.beep');
    expect(result.code).toContain('toneBuz.tone');
    expect(result.code).toContain('toneBuz.noTone()');
  });
});

describe('Hardware Types - Integration', () => {
  test('should compile multiple new hardware types together', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut Led statusLed = new Led(13)
      mut Button btn = new Button(2)
      mut Buzzer buz = new Buzzer(8)
      mut Servo servo = new Servo(9)
      mut DCMotor motor = new DCMotor(10, 11)
      
      on loop {
        if (btn.pressed()) {
          statusLed.on()
          buz.beep(100)
          servo.writeAngle(90)
          motor.forward(200)
        } else {
          statusLed.off()
          motor.stop()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Led');
    expect(result.code).toContain('class Button');
    expect(result.code).toContain('class Buzzer');
    expect(result.code).toContain('class YsServo');
    expect(result.code).toContain('class DCMotor');
    expect(result.code).toContain('#include <Servo.h>');
  });

  test('should compile communication hardware types', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      mut I2C bus = new I2C()
      mut SPI spi = new SPI()
      mut UART serial = new UART(115200)
      
      on start {
        bus.begin()
        spi.begin()
        serial.println("System started")
      }
      
      on loop {
        mut List devices = bus.scan()
        mut u8 data = spi.transfer(0x00)
        serial.print(data)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class I2C');
    expect(result.code).toContain('class SPI');
    expect(result.code).toContain('class UART');
    expect(result.code).toContain('#include <Wire.h>');
    expect(result.code).toContain('#include <SPI.h>');
  });
});
