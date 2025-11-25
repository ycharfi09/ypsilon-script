/**
 * Tests for Module-Specific Hardware Types
 * Tests the new hardware types that map to specific IC modules
 */

const { compile } = require('../src/compiler');

describe('Module-Specific Sensor Types', () => {
  test('should compile LM35 temperature sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut LM35 temp = new LM35(A0)
      
      on loop {
        mut float celsius = temp.readCelsius()
        mut float fahrenheit = temp.readFahrenheit()
        mut int raw = temp.readRaw()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class LM35');
    expect(result.code).toContain('temp.readCelsius()');
  });

  test('should compile DS18B20 1-wire temperature sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DS18B20 temp = new DS18B20(2)
      
      on start {
        temp.begin()
      }
      
      on loop {
        mut float celsius = temp.readCelsius()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DS18B20');
    expect(result.code).toContain('temp.begin()');
  });

  test('should compile DHT11 humidity sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DHT11 humidity = new DHT11(2)
      
      on start {
        humidity.begin()
      }
      
      on loop {
        if (humidity.read()) {
          mut float temp = humidity.readTemperature()
          mut float hum = humidity.readHumidity()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DHT11');
    expect(result.code).toContain('humidity.readTemperature()');
    expect(result.code).toContain('humidity.readHumidity()');
  });

  test('should compile DHT22 humidity sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DHT22 humidity = new DHT22(2)
      
      on loop {
        mut float temp = humidity.readTemperature()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DHT22');
  });

  test('should compile HC_SR04 ultrasonic distance sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut HC_SR04 sonar = new HC_SR04(9, 10)
      
      on loop {
        mut float dist = sonar.readCm()
        mut float mm = sonar.readMm()
        if (sonar.inRange(5, 50)) {
          print("Object in range")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class HC_SR04');
    expect(result.code).toContain('sonar.readCm()');
  });

  test('should compile GP2Y0A21 IR distance sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut GP2Y0A21 ir = new GP2Y0A21(A0)
      
      on loop {
        mut float dist = ir.readCm()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class GP2Y0A21');
  });

  test('should compile LDR light sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut LDR ldr = new LDR(A0)
      
      on loop {
        mut int value = ldr.read()
        if (ldr.isDark()) {
          print("Dark")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class LDR');
  });

  test('should compile BH1750 I2C lux sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut BH1750 light = new BH1750(0)
      
      on start {
        light.begin()
      }
      
      on loop {
        mut float lux = light.readLux()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class BH1750');
  });

  test('should compile PIR motion sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut PIR pir = new PIR(2)
      
      on loop {
        if (pir.detected()) {
          print("Motion!")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class PIR');
    expect(result.code).toContain('pir.detected()');
  });

  test('should compile Pot potentiometer', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Pot pot = new Pot(A0)
      
      on loop {
        mut int value = pot.read()
        mut int percent = pot.readPercent()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Pot');
  });

  test('should compile BMP280 barometric sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut BMP280 pressure = new BMP280(0)
      
      on start {
        pressure.begin()
      }
      
      on loop {
        mut float p = pressure.readPressure()
        mut float t = pressure.readTemperature()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class BMP280');
  });

  test('should compile TTP223 capacitive touch sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TTP223 touch = new TTP223(2)
      
      on loop {
        if (touch.isTouched()) {
          print("Touched!")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class TTP223');
  });

  test('should compile MQ2 gas sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut MQ2 gas = new MQ2(A0)
      
      on loop {
        if (gas.detected()) {
          print("Gas detected!")
        }
        mut int smoke = gas.readSmoke()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class MQ2');
  });

  test('should compile TCS34725 color sensor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TCS34725 color = new TCS34725(0)
      
      on start {
        color.begin()
      }
      
      on loop {
        mut int r = color.readRed()
        mut int g = color.readGreen()
        mut int b = color.readBlue()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class TCS34725');
  });

  test('should compile MPU6050 accelerometer/gyro', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut MPU6050 accel = new MPU6050(0)
      
      on start {
        accel.begin()
      }
      
      on loop {
        mut float ax = accel.readAccelX()
        mut float gx = accel.readGyroX()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class MPU6050');
  });

  test('should compile NEO6M GPS', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut NEO6M gps = new NEO6M(10, 11)
      
      on start {
        gps.begin()
      }
      
      on loop {
        if (gps.update()) {
          mut float lat = gps.latitude()
          mut float lon = gps.longitude()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class NEO6M');
  });
});

describe('Module-Specific Display Types', () => {
  test('should compile HD44780 LCD', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut HD44780 lcd = new HD44780(12, 11, 5, 4, 3, 2, 16, 2)
      
      on start {
        lcd.begin()
        lcd.print("Hello World")
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class HD44780');
  });

  test('should compile SSD1306 OLED', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut SSD1306 oled = new SSD1306(0, 128, 64)
      
      on start {
        oled.begin()
        oled.clear()
        oled.print("Hello")
        oled.display()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class SSD1306');
  });

  test('should compile WS2812 RGB LED strip', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut WS2812 strip = new WS2812(6, 30)
      
      on start {
        strip.begin()
      }
      
      on loop {
        strip.setPixel(0, 255, 0, 0)
        strip.fill(0, 0, 255)
        strip.show()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class WS2812');
  });

  test('should compile TM1637 7-segment display', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TM1637 seg = new TM1637(2, 3)
      
      on start {
        seg.begin()
        seg.setBrightness(5)
      }
      
      on loop {
        seg.displayNumber(1234)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class TM1637');
  });
});

describe('Module-Specific Wireless Types', () => {
  test('should compile HC05 Bluetooth', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut HC05 bt = new HC05(10, 11, 9600)
      
      on start {
        bt.begin()
      }
      
      on loop {
        if (bt.available()) {
          mut string data = bt.read()
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class HC05');
  });

  test('should compile ESP8266 WiFi', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut ESP8266 wifi = new ESP8266()
      
      on start {
        wifi.connect("SSID", "password")
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class ESP8266');
  });

  test('should compile SX1278 LoRa', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut SX1278 lora = new SX1278(10, 9, 2)
      
      on start {
        lora.begin()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class SX1278');
  });

  test('should compile NRF24L01 transceiver', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut NRF24L01 radio = new NRF24L01(9, 10)
      
      on start {
        radio.begin()
        radio.startListening()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class NRF24L01');
  });
});

describe('Module-Specific Actuator Types', () => {
  test('should compile Relay5V', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut Relay5V relay = new Relay5V(7)
      
      on loop {
        relay.on()
        wait 1s
        relay.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Relay5V');
  });

  test('should compile FanPWM', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut FanPWM fan = new FanPWM(9)
      
      on loop {
        fan.setSpeed(128)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class FanPWM');
  });

  test('should compile DCPump', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DCPump pump = new DCPump(10)
      
      on loop {
        pump.on()
        wait 5s
        pump.off()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DCPump');
  });

  test('should compile SolenoidValve', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut SolenoidValve valve = new SolenoidValve(8)
      
      on loop {
        valve.open()
        wait 2s
        valve.close()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class SolenoidValve');
  });
});

describe('Module-Specific Motor Driver Types', () => {
  test('should compile L298N', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut L298N motor = new L298N(9, 8)
      
      on loop {
        motor.forward(200)
        wait 2s
        motor.reverse(150)
        wait 2s
        motor.stop()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class L298N');
  });

  test('should compile TB6612FNG', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut TB6612FNG driver = new TB6612FNG(3, 4, 5, 6)
      
      on loop {
        driver.setMotorA(255)
        driver.setMotorB(128)
        wait 2s
        driver.stopAll()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class TB6612FNG');
  });

  test('should compile PCA9685', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut PCA9685 servos = new PCA9685(0, 50)
      
      on start {
        servos.begin()
      }
      
      on loop {
        servos.setAngle(0, 90)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class PCA9685');
  });
});

describe('Module-Specific Power Types', () => {
  test('should compile LiPo battery monitor', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut LiPo batt = new LiPo(A0, 4.2, 3.0)
      
      on loop {
        mut int percent = batt.readPercent()
        if (batt.isLow(20)) {
          print("Low battery!")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class LiPo');
  });

  test('should compile SolarPanel', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut SolarPanel panel = new SolarPanel(A0, A1)
      
      on loop {
        mut float voltage = panel.readVoltage()
        mut float current = panel.readCurrent()
        mut float power = panel.readPower()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class SolarPanel');
  });
});

describe('Module-Specific Timing Types', () => {
  test('should compile DS3231 RTC', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DS3231 rtc = new DS3231(0)
      
      on start {
        rtc.begin()
      }
      
      on loop {
        mut int h = rtc.hour()
        mut int m = rtc.minute()
        mut float t = rtc.readTemperature()
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DS3231');
  });
});

describe('Module-Specific Audio Types', () => {
  test('should compile MAX4466 microphone', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut MAX4466 mic = new MAX4466(A0)
      
      on loop {
        mut int level = mic.read()
        if (mic.isLoud()) {
          print("Loud noise!")
        }
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class MAX4466');
  });

  test('should compile DFPlayerMini', () => {
    const source = `
      @main
      config { board: arduino_uno, clock: 16MHz }
      
      mut DFPlayerMini player = new DFPlayerMini(10, 11)
      
      on start {
        player.begin()
        player.setVolume(15)
      }
      
      on loop {
        player.play(1)
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('class DFPlayerMini');
  });
});
