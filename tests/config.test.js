/**
 * Tests for Config System
 */

const { Config, MPU_TO_FQBN, parseClockSpeed, validateMPU } = require('../src/config');
const { compile } = require('../src/compiler');

describe('Config Module', () => {
  test('should create config with defaults when no config block provided', () => {
    const config = new Config();
    
    expect(config.getOptions().mpu).toBe('arduino_uno'); // New default uses board names
    expect(config.getOptions().board).toBe('arduino_uno');
    expect(config.getOptions().clock).toBe('16MHz');
    expect(config.getOptions().uart).toBe('off');
    expect(config.getOptions().port).toBe('auto');
    expect(config.getOptions().pwm).toBe('auto');
  });

  test('should merge config block options with defaults', () => {
    const configBlock = {
      options: {
        mpu: 'esp32',
        uart: 'on'
      }
    };
    
    const config = new Config(configBlock);
    
    expect(config.getOptions().mpu).toBe('esp32');
    expect(config.getOptions().uart).toBe('on');
    expect(config.getOptions().clock).toBe('16MHz'); // default
  });

  test('should get correct FQBN for atmega328p', () => {
    const config = new Config({ options: { mpu: 'atmega328p' } });
    expect(config.getFQBN()).toBe('arduino:avr:uno');
  });

  test('should get correct FQBN for esp32', () => {
    const config = new Config({ options: { mpu: 'esp32' } });
    expect(config.getFQBN()).toBe('esp32:esp32:esp32');
  });

  test('should get correct FQBN for atmega2560', () => {
    const config = new Config({ options: { mpu: 'atmega2560' } });
    expect(config.getFQBN()).toBe('arduino:avr:mega');
  });

  test('should get correct FQBN for esp8266', () => {
    const config = new Config({ options: { mpu: 'esp8266' } });
    expect(config.getFQBN()).toBe('esp8266:esp8266:generic');
  });

  test('should parse clock speed correctly', () => {
    expect(parseClockSpeed('16MHz')).toBe('16000000L');
    expect(parseClockSpeed('8MHz')).toBe('8000000L');
    expect(parseClockSpeed('240MHz')).toBe('240000000L');
  });

  test('should handle numeric clock speeds', () => {
    expect(parseClockSpeed('16000000L')).toBe('16000000L');
    expect(parseClockSpeed('16000000')).toBe('16000000L');
  });

  test('should get build properties with F_CPU', () => {
    const config = new Config({ options: { clock: '16MHz' } });
    const props = config.getBuildProperties();
    
    expect(props).toContain('F_CPU=16000000L');
  });

  test('should select analogWrite PWM backend for AVR boards', () => {
    const config = new Config({ options: { mpu: 'atmega328p' } });
    expect(config.getPWMBackend()).toBe('analogWrite');
  });

  test('should select ledc PWM backend for ESP32', () => {
    const config = new Config({ options: { mpu: 'esp32' } });
    expect(config.getPWMBackend()).toBe('ledc');
  });

  test('should select ledc PWM backend for ESP8266', () => {
    const config = new Config({ options: { mpu: 'esp8266' } });
    expect(config.getPWMBackend()).toBe('ledc');
  });

  test('should allow manual PWM backend override', () => {
    const config = new Config({ options: { mpu: 'atmega328p', pwm: 'custom' } });
    expect(config.getPWMBackend()).toBe('custom');
  });

  test('should detect UART enabled', () => {
    const config = new Config({ options: { uart: 'on' } });
    expect(config.isUARTEnabled()).toBe(true);
  });

  test('should detect UART disabled', () => {
    const config = new Config({ options: { uart: 'off' } });
    expect(config.isUARTEnabled()).toBe(false);
  });

  test('should validate known MPU names', () => {
    expect(() => validateMPU('atmega328p')).not.toThrow();
    expect(() => validateMPU('esp32')).not.toThrow();
    expect(() => validateMPU('atmega2560')).not.toThrow();
  });

  test('should throw error for unknown MPU', () => {
    expect(() => validateMPU('unknown_mpu')).toThrow();
  });

  test('should fall back to default for invalid MPU in constructor', () => {
    // Should not throw, just warn and use default
    const config = new Config({ options: { mpu: 'invalid_board' } });
    expect(config.getOptions().mpu).toBe('arduino_uno'); // New default
    expect(config.getOptions().board).toBe('arduino_uno');
  });
});

describe('Config Integration with Compiler', () => {
  test('should compile with config block and return config object', () => {
    const source = `
      config {
        mpu: atmega328p,
        clock: 16MHz,
        uart: on
      }
      
      on start {
        pinMode(13, OUTPUT)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.config).toBeDefined();
    expect(result.config.getOptions().mpu).toBe('atmega328p');
    expect(result.config.getOptions().uart).toBe('on');
  });

  test('should compile without config block and use defaults', () => {
    const source = `
      on start {
        pinMode(13, OUTPUT)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.config).toBeDefined();
    expect(result.config.getOptions().board).toBe('arduino_uno'); // New default
  });

  test('should generate LEDC PWM code for ESP32', () => {
    const source = `
      config {
        mpu: esp32
      }
      
      on start {
        pinMode(13, OUTPUT)
      }
      
      on loop {
        analogWrite(13, 128)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('LEDC');
    expect(result.code).toContain('ledcWrite');
    expect(result.code).toContain('allocateLEDCChannel');
  });

  test('should not generate LEDC PWM code for AVR', () => {
    const source = `
      config {
        mpu: atmega328p
      }
      
      on start {
        pinMode(13, OUTPUT)
      }
      
      on loop {
        analogWrite(13, 128)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).not.toContain('LEDC');
    expect(result.code).not.toContain('ledcWrite');
    expect(result.code).toContain('analogWrite(13, 128)');
  });

  test('should handle config with all options', () => {
    const source = `
      config {
        mpu: esp8266,
        clock: 80MHz,
        uart: on,
        port: COM3,
        pwm: auto
      }
      
      on start {
        pinMode(13, OUTPUT)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.config.getOptions().mpu).toBe('esp8266');
    expect(result.config.getOptions().clock).toBe('80MHz');
    expect(result.config.getOptions().port).toBe('COM3');
    expect(result.config.getPWMBackend()).toBe('ledc');
  });
});

describe('PWM Backend Selection', () => {
  const { generatePWMSetup, isPWMCall } = require('../src/pwm');

  test('should generate LEDC setup for ESP', () => {
    const setup = generatePWMSetup('ledc');
    
    expect(setup).toContain('LEDC');
    expect(setup).toContain('allocateLEDCChannel');
    expect(setup).toContain('ledcWrite');
  });

  test('should not generate setup for AVR', () => {
    const setup = generatePWMSetup('analogWrite');
    
    expect(setup).toBe('');
  });

  test('should detect PWM call', () => {
    const pwmCall = {
      type: 'CallExpression',
      callee: { name: 'analogWrite' }
    };
    
    expect(isPWMCall(pwmCall)).toBe(true);
  });

  test('should not detect non-PWM call', () => {
    const normalCall = {
      type: 'CallExpression',
      callee: { name: 'digitalWrite' }
    };
    
    expect(isPWMCall(normalCall)).toBe(false);
  });
});
