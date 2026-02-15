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

  test('should compile mps (meters per second) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int speed = 2mps
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2000'); // 2 m/s = 2000 mm/s
  });

  test('should compile kph (kilometers per hour) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int speed = 36kph
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('10000'); // 36 km/h ≈ 10000 mm/s
  });

  test('should compile mph (miles per hour) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int speed = 10mph
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('4470'); // 10 mph ≈ 4470 mm/s
  });
});

describe('Unit System - Voltage Units', () => {
  test('should compile V (volts) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int voltage = 5V
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('5000'); // 5V = 5000mV
  });

  test('should compile mV (millivolts) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int voltage = 3300mV
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('3300');
  });

  test('should compile uV (microvolts) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int voltage = 5000uV
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('5'); // 5000uV = 5mV
  });
});

describe('Unit System - Current Units', () => {
  test('should compile A (amps) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int current = 2A
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2000000'); // 2A = 2,000,000 uA
  });

  test('should compile mA (milliamps) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int current = 500mA
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('500000'); // 500mA = 500,000 uA
  });

  test('should compile uA (microamps) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int current = 100uA
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('100');
  });
});

describe('Unit System - Resistance Units', () => {
  test('should compile ohm unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int resistance = 470ohm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('470');
  });

  test('should compile kohm (kilo-ohms) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int resistance = 10kohm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('10000');
  });

  test('should compile Mohm (mega-ohms) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int resistance = 1Mohm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('1000000');
  });
});

describe('Unit System - Capacitance Units', () => {
  test('should compile uF (microfarads) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int capacitance = 10uF
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('10000000'); // 10uF = 10,000,000 pF
  });

  test('should compile nF (nanofarads) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int capacitance = 100nF
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('100000'); // 100nF = 100,000 pF
  });

  test('should compile pF (picofarads) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int capacitance = 22pF
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('22');
  });
});

describe('Unit System - Power Units', () => {
  test('should compile W (watts) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int power = 5W
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('5000'); // 5W = 5000mW
  });

  test('should compile mW (milliwatts) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int power = 250mW
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('250');
  });

  test('should compile kW (kilowatts) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int power = 1kW
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('1000000'); // 1kW = 1,000,000 mW
  });
});

describe('Unit System - Temperature Units', () => {
  test('should compile C (Celsius) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int temperature = 25C
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2500'); // 25°C = 2500 centidegrees
  });

  test('should compile K (Kelvin) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int temperature = 300K
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2685'); // 300K = 26.85°C = 2685 centidegrees
  });

  test('should compile degC (Celsius alias) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int temperature = 25degC
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2500'); // 25°C = 2500 centidegrees
  });

  test('should compile degF (Fahrenheit) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int temperature = 77degF
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2500'); // 77°F = 25°C = 2500 centidegrees
  });

  test('should compile degF (Fahrenheit) with freezing point', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int freezing = 32degF
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('0'); // 32°F = 0°C = 0 centidegrees
  });
});

describe('Unit System - Weight/Force Units', () => {
  test('should compile g (grams) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int weight = 100g
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('100000'); // 100g = 100,000 mg
  });

  test('should compile kg (kilograms) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int weight = 1kg
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('1000000'); // 1kg = 1,000,000 mg
  });

  test('should compile mg (milligrams) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int weight = 500mg
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('500');
  });
});

describe('Unit System - Data Storage Units', () => {
  test('should compile B (bytes) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int size = 256B
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('256');
  });

  test('should compile KB (kilobytes) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int size = 4KB
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('4096'); // 4KB = 4 * 1024 = 4096 bytes
  });

  test('should compile MB (megabytes) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int size = 1MB
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('1048576'); // 1MB = 1024 * 1024 = 1,048,576 bytes
  });
});

describe('Unit System - Percentage Units', () => {
  test('should compile pct (percent) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int dutyCycle = 50pct
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('5000'); // 50% = 5000 basis points
  });

  test('should compile percent unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int dutyCycle = 75percent
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('7500'); // 75% = 7500 basis points
  });
});

describe('Unit System - Pressure Units', () => {
  test('should compile Pa (Pascals) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int pressure = 101325Pa
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('101325');
  });

  test('should compile kPa (kilopascals) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int pressure = 100kPa
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('100000'); // 100kPa = 100,000 Pa
  });

  test('should compile hPa (hectopascals) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int pressure = 1013hPa
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('101300'); // 1013 hPa = 101,300 Pa
  });

  test('should compile bar unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int pressure = 1bar
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('100000'); // 1 bar = 100,000 Pa
  });
});

describe('Unit System - Light Units', () => {
  test('should compile lux unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int lightLevel = 500lux
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('500');
  });

  test('should compile lm (lumens) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int brightness = 800lm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('800');
  });
});

describe('Unit System - Sound/Signal Units', () => {
  test('should compile dB (decibels) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int soundLevel = 60dB
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('60');
  });

  test('should compile dBm unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int signalStrength = 20dBm
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('20');
  });
});

describe('Unit System - GHz Frequency', () => {
  test('should compile GHz unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int freq = 2GHz
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('2000000000'); // 2GHz = 2,000,000,000 Hz
  });
});

describe('Unit System - Distance Units (Extended)', () => {
  test('should compile in (inches) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int distance = 10in
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('254'); // 10 in = 254 mm
  });

  test('should compile ft (feet) unit', () => {
    const source = `
      @main
      config {
        board: arduino_uno,
        clock: 16MHz
      }
      
      on start {
        const int distance = 3ft
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('914'); // 3 ft ≈ 914 mm
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
        board: esp32,
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
        board: esp32,
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
        board: esp32,
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
        board: esp32,
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
