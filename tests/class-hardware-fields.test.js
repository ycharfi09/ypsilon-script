/**
 * Tests for Hardware Types used in class fields and constructors
 * These tests verify the bug fix for hardware type emission when used inside classes
 */

const { compile } = require('../src/compiler');

describe('Hardware Types in Class Fields', () => {
  test('should emit Digital class when used as class field', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Robot {
        mut Digital led
        
        constructor(int pin) {
          self.led = new Digital(pin)
        }
        
        fn turnOn() {
          self.led.high()
        }
      }
      
      mut Robot robot = new Robot(13)
      
      on start {
        robot.turnOn()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Digital');
    expect(result.code).toContain('class Robot');
  });

  test('should emit Led class when used as class field', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class LedController {
        mut Led indicator
        
        constructor(int pin) {
          self.indicator = new Led(pin)
        }
        
        fn blink() {
          self.indicator.on()
          wait 500ms
          self.indicator.off()
        }
      }
      
      mut LedController controller = new LedController(13)
      
      on loop {
        controller.blink()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Led');
    expect(result.code).toContain('class LedController');
  });

  test('should emit Analog class when used as class field', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Sensor {
        mut Analog analog
        
        constructor(int pin) {
          self.analog = new Analog(pin)
        }
        
        fn read() -> int {
          return self.analog.read()
        }
      }
      
      mut Sensor sensor = new Sensor(0)
      
      on loop {
        mut int value = sensor.read()
        print(value)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Analog');
    expect(result.code).toContain('class Sensor');
  });

  test('should emit multiple hardware types when used in same class', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Device {
        mut Digital output
        mut Analog input
        mut Led indicator
        
        constructor(int outPin, int inPin, int ledPin) {
          self.output = new Digital(outPin)
          self.input = new Analog(inPin)
          self.indicator = new Led(ledPin)
        }
        
        fn process() {
          mut int value = self.input.read()
          if (value > 512) {
            self.output.high()
            self.indicator.on()
          } else {
            self.output.low()
            self.indicator.off()
          }
        }
      }
      
      mut Device device = new Device(7, 0, 13)
      
      on loop {
        device.process()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Digital');
    expect(result.code).toContain('class Analog');
    expect(result.code).toContain('class Led');
    expect(result.code).toContain('class Device');
  });

  test('should emit hardware types when instantiated in method bodies', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Factory {
        fn createLed(int pin) -> Led {
          mut Led led = new Led(pin)
          return led
        }
      }
      
      mut Factory factory = new Factory()
      
      on start {
        mut Led myLed = factory.createLed(13)
        myLed.on()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Led');
  });

  test('should emit PWM class when used in class', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      class Motor {
        mut PWM pwm
        
        constructor(int pin) {
          self.pwm = new PWM(pin)
        }
        
        fn setSpeed(int speed) {
          self.pwm.set(speed)
        }
      }
      
      mut Motor motor = new Motor(9)
      
      on start {
        motor.setSpeed(128)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class PWM');
    expect(result.code).toContain('class Motor');
  });
});
