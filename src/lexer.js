/**
 * Ypsilon Script Lexer
 * Tokenizes YS source code into a stream of tokens
 */

const TOKEN_TYPES = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  
  // Identifiers and Keywords
  IDENTIFIER: 'IDENTIFIER',
  FUNCTION: 'FUNCTION',
  FN: 'FN',
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  FOR: 'FOR',
  REPEAT: 'REPEAT',
  RETURN: 'RETURN',
  VAR: 'VAR',
  MUT: 'MUT',
  CONST: 'CONST',
  CLASS: 'CLASS',
  NEW: 'NEW',
  THIS: 'THIS',
  SELF: 'SELF',
  CONSTRUCTOR: 'CONSTRUCTOR',
  ENUM: 'ENUM',
  STRUCT: 'STRUCT',
  MATCH: 'MATCH',
  SWITCH: 'SWITCH',
  CASE: 'CASE',
  DEFAULT: 'DEFAULT',
  
  // Event Keywords
  ON: 'ON',
  START: 'START',
  LOOP: 'LOOP',
  
  // Interrupt Keywords
  INTERRUPT: 'INTERRUPT',
  RISING: 'RISING',
  FALLING: 'FALLING',
  CHANGE: 'CHANGE',
  
  // Reactive Keywords
  REACT: 'REACT',
  EMIT: 'EMIT',
  SIGNAL: 'SIGNAL',
  
  // Task Keywords
  TASK: 'TASK',
  EVERY: 'EVERY',
  BACKGROUND: 'BACKGROUND',
  WAIT: 'WAIT',
  TIMEOUT: 'TIMEOUT',
  
  // Safety Keywords
  ATOMIC: 'ATOMIC',
  USE: 'USE',
  
  // Config/Import Keywords
  LOAD: 'LOAD',
  AS: 'AS',
  ALIAS: 'ALIAS',
  CONFIG: 'CONFIG',
  
  // C++ Inline
  CPP: 'CPP',
  
  // Entry Point
  MAIN: 'MAIN',
  
  // Type Keywords
  TYPE_INT: 'TYPE_INT',
  TYPE_FLOAT: 'TYPE_FLOAT',
  TYPE_BOOL: 'TYPE_BOOL',
  TYPE_STRING: 'TYPE_STRING',
  TYPE_VOID: 'TYPE_VOID',
  
  // Width-specific integer types
  TYPE_U8: 'TYPE_U8',
  TYPE_U16: 'TYPE_U16',
  TYPE_U32: 'TYPE_U32',
  TYPE_U64: 'TYPE_U64',
  TYPE_I8: 'TYPE_I8',
  TYPE_I16: 'TYPE_I16',
  TYPE_I32: 'TYPE_I32',
  TYPE_I64: 'TYPE_I64',
  TYPE_BYTE: 'TYPE_BYTE',
  TYPE_SHORT: 'TYPE_SHORT',
  
  // Width-specific float types
  TYPE_F32: 'TYPE_F32',
  TYPE_F64: 'TYPE_F64',
  
  // Hardware Type Keywords
  TYPE_DIGITAL: 'TYPE_DIGITAL',
  TYPE_ANALOG: 'TYPE_ANALOG',
  TYPE_PWM: 'TYPE_PWM',
  TYPE_I2C: 'TYPE_I2C',
  TYPE_SPI: 'TYPE_SPI',
  TYPE_UART: 'TYPE_UART',
  TYPE_SERVO: 'TYPE_SERVO',
  TYPE_ENCODER: 'TYPE_ENCODER',
  TYPE_DCMOTOR: 'TYPE_DCMOTOR',
  TYPE_STEPPERMOTOR: 'TYPE_STEPPERMOTOR',
  TYPE_LED: 'TYPE_LED',
  TYPE_RGBLED: 'TYPE_RGBLED',
  TYPE_BUTTON: 'TYPE_BUTTON',
  TYPE_BUZZER: 'TYPE_BUZZER',
  
  // Multiplexer Types
  TYPE_MUX4: 'TYPE_MUX4',
  TYPE_MUX8: 'TYPE_MUX8',
  TYPE_MUX16: 'TYPE_MUX16',
  TYPE_MUX32: 'TYPE_MUX32',
  
  // Sensor Types
  TYPE_TEMPSENSOR: 'TYPE_TEMPSENSOR',
  TYPE_HUMIDITYSENSOR: 'TYPE_HUMIDITYSENSOR',
  TYPE_PRESSURESENSOR: 'TYPE_PRESSURESENSOR',
  TYPE_LIGHTSENSOR: 'TYPE_LIGHTSENSOR',
  TYPE_DISTANCESENSOR: 'TYPE_DISTANCESENSOR',
  TYPE_MOTIONSENSOR: 'TYPE_MOTIONSENSOR',
  TYPE_TOUCHSENSOR: 'TYPE_TOUCHSENSOR',
  TYPE_SOUNDSENSOR: 'TYPE_SOUNDSENSOR',
  TYPE_GASSENSOR: 'TYPE_GASSENSOR',
  TYPE_COLORSENSOR: 'TYPE_COLORSENSOR',
  TYPE_ACCELEROMETER: 'TYPE_ACCELEROMETER',
  TYPE_GYROSCOPE: 'TYPE_GYROSCOPE',
  TYPE_MAGNETOMETER: 'TYPE_MAGNETOMETER',
  TYPE_IMU: 'TYPE_IMU',
  TYPE_GPS: 'TYPE_GPS',
  TYPE_LOADCELL: 'TYPE_LOADCELL',
  TYPE_POTENTIOMETER: 'TYPE_POTENTIOMETER',
  TYPE_JOYSTICK: 'TYPE_JOYSTICK',
  TYPE_ROTARYENCODER: 'TYPE_ROTARYENCODER',
  TYPE_IRREMOTE: 'TYPE_IRREMOTE',
  TYPE_RFID: 'TYPE_RFID',
  
  // New Module-Specific Sensor Types
  TYPE_LM35: 'TYPE_LM35',
  TYPE_DS18B20: 'TYPE_DS18B20',
  TYPE_DHT11: 'TYPE_DHT11',
  TYPE_DHT22: 'TYPE_DHT22',
  TYPE_HC_SR04: 'TYPE_HC_SR04',
  TYPE_GP2Y0A21: 'TYPE_GP2Y0A21',
  TYPE_LDR: 'TYPE_LDR',
  TYPE_BH1750: 'TYPE_BH1750',
  TYPE_PIR: 'TYPE_PIR',
  TYPE_POT: 'TYPE_POT',
  TYPE_BMP280: 'TYPE_BMP280',
  TYPE_TTP223: 'TYPE_TTP223',
  TYPE_MQ2: 'TYPE_MQ2',
  TYPE_TCS34725: 'TYPE_TCS34725',
  TYPE_MPU6050: 'TYPE_MPU6050',
  TYPE_NEO6M: 'TYPE_NEO6M',
  
  // Display Types
  TYPE_LCD: 'TYPE_LCD',
  TYPE_OLED: 'TYPE_OLED',
  TYPE_SEVENSEGMENT: 'TYPE_SEVENSEGMENT',
  TYPE_MATRIX: 'TYPE_MATRIX',
  TYPE_TFT: 'TYPE_TFT',
  TYPE_NEOPIXEL: 'TYPE_NEOPIXEL',
  
  // New Module-Specific Display Types
  TYPE_HD44780: 'TYPE_HD44780',
  TYPE_SSD1306: 'TYPE_SSD1306',
  TYPE_WS2812: 'TYPE_WS2812',
  TYPE_TM1637: 'TYPE_TM1637',
  
  // Actuator Types
  TYPE_RELAY: 'TYPE_RELAY',
  TYPE_SOLENOID: 'TYPE_SOLENOID',
  TYPE_FAN: 'TYPE_FAN',
  TYPE_HEATER: 'TYPE_HEATER',
  TYPE_PUMP: 'TYPE_PUMP',
  TYPE_VALVE: 'TYPE_VALVE',
  
  // New Module-Specific Actuator Types
  TYPE_RELAY5V: 'TYPE_RELAY5V',
  TYPE_FANPWM: 'TYPE_FANPWM',
  TYPE_DCPUMP: 'TYPE_DCPUMP',
  TYPE_SOLENOIDVALVE: 'TYPE_SOLENOIDVALVE',
  
  // Communication Types
  TYPE_BLUETOOTH: 'TYPE_BLUETOOTH',
  TYPE_WIFI: 'TYPE_WIFI',
  TYPE_LORA: 'TYPE_LORA',
  TYPE_CAN: 'TYPE_CAN',
  TYPE_RS485: 'TYPE_RS485',
  TYPE_ETHERNET: 'TYPE_ETHERNET',
  TYPE_NRF24: 'TYPE_NRF24',
  TYPE_ZIGBEE: 'TYPE_ZIGBEE',
  
  // New Module-Specific Communication Types
  TYPE_HC05: 'TYPE_HC05',
  TYPE_ESP8266: 'TYPE_ESP8266',
  TYPE_SX1278: 'TYPE_SX1278',
  TYPE_NRF24L01: 'TYPE_NRF24L01',
  
  // Storage Types
  TYPE_SDCARD: 'TYPE_SDCARD',
  TYPE_EEPROM: 'TYPE_EEPROM',
  TYPE_FLASH: 'TYPE_FLASH',
  
  // Power Types
  TYPE_BATTERY: 'TYPE_BATTERY',
  TYPE_SOLAR: 'TYPE_SOLAR',
  
  // New Module-Specific Power Types
  TYPE_LIPO: 'TYPE_LIPO',
  TYPE_SOLARPANEL: 'TYPE_SOLARPANEL',
  
  // Motor Driver Types
  TYPE_HBRIDGE: 'TYPE_HBRIDGE',
  TYPE_MOTORDRIVER: 'TYPE_MOTORDRIVER',
  TYPE_SERVODRIVER: 'TYPE_SERVODRIVER',
  
  // New Module-Specific Motor Driver Types
  TYPE_L298N: 'TYPE_L298N',
  TYPE_TB6612FNG: 'TYPE_TB6612FNG',
  TYPE_PCA9685: 'TYPE_PCA9685',
  
  // Timing Types
  TYPE_RTC: 'TYPE_RTC',
  TYPE_TIMER: 'TYPE_TIMER',
  
  // New Module-Specific Timing Types
  TYPE_DS3231: 'TYPE_DS3231',
  
  // Audio Types
  TYPE_SPEAKER: 'TYPE_SPEAKER',
  TYPE_MICROPHONE: 'TYPE_MICROPHONE',
  TYPE_DFPLAYER: 'TYPE_DFPLAYER',
  
  // New Module-Specific Audio Types
  TYPE_MAX4466: 'TYPE_MAX4466',
  TYPE_DFPLAYERMINI: 'TYPE_DFPLAYERMINI',
  
  // Collection Type Keywords
  TYPE_LIST: 'TYPE_LIST',
  TYPE_MAP: 'TYPE_MAP',
  
  // Error Keywords
  ERROR: 'ERROR',
  CATCH: 'CATCH',
  EXCLAMATION: 'EXCLAMATION',
  
  // Range Operator
  RANGE: 'RANGE',
  IN: 'IN',
  
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  MODULO: 'MODULO',
  ASSIGN: 'ASSIGN',
  EQUAL: 'EQUAL',
  NOT_EQUAL: 'NOT_EQUAL',
  LESS_THAN: 'LESS_THAN',
  GREATER_THAN: 'GREATER_THAN',
  LESS_EQUAL: 'LESS_EQUAL',
  GREATER_EQUAL: 'GREATER_EQUAL',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  ARROW: 'ARROW',
  QUESTION: 'QUESTION',
  AT: 'AT',
  
  // Punctuation
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  LANGLE: 'LANGLE',
  RANGLE: 'RANGLE',
  COMMA: 'COMMA',
  DOT: 'DOT',
  COLON: 'COLON',
  SEMICOLON: 'SEMICOLON',
  
  // Special
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
  COMMENT: 'COMMENT'
};

const KEYWORDS = {
  'function': TOKEN_TYPES.FUNCTION,
  'fn': TOKEN_TYPES.FN,
  'if': TOKEN_TYPES.IF,
  'else': TOKEN_TYPES.ELSE,
  'while': TOKEN_TYPES.WHILE,
  'for': TOKEN_TYPES.FOR,
  'repeat': TOKEN_TYPES.REPEAT,
  'return': TOKEN_TYPES.RETURN,
  'var': TOKEN_TYPES.VAR,
  'mut': TOKEN_TYPES.MUT,
  'const': TOKEN_TYPES.CONST,
  'class': TOKEN_TYPES.CLASS,
  'new': TOKEN_TYPES.NEW,
  'this': TOKEN_TYPES.THIS,
  'self': TOKEN_TYPES.SELF,
  'constructor': TOKEN_TYPES.CONSTRUCTOR,
  'enum': TOKEN_TYPES.ENUM,
  'struct': TOKEN_TYPES.STRUCT,
  'match': TOKEN_TYPES.MATCH,
  'switch': TOKEN_TYPES.SWITCH,
  'case': TOKEN_TYPES.CASE,
  'default': TOKEN_TYPES.DEFAULT,
  'on': TOKEN_TYPES.ON,
  'interrupt': TOKEN_TYPES.INTERRUPT,
  'rising': TOKEN_TYPES.RISING,
  'falling': TOKEN_TYPES.FALLING,
  'change': TOKEN_TYPES.CHANGE,
  'react': TOKEN_TYPES.REACT,
  'emit': TOKEN_TYPES.EMIT,
  'signal': TOKEN_TYPES.SIGNAL,
  'task': TOKEN_TYPES.TASK,
  'every': TOKEN_TYPES.EVERY,
  'background': TOKEN_TYPES.BACKGROUND,
  'wait': TOKEN_TYPES.WAIT,
  'timeout': TOKEN_TYPES.TIMEOUT,
  'atomic': TOKEN_TYPES.ATOMIC,
  'use': TOKEN_TYPES.USE,
  'load': TOKEN_TYPES.LOAD,
  'as': TOKEN_TYPES.AS,
  'alias': TOKEN_TYPES.ALIAS,
  'config': TOKEN_TYPES.CONFIG,
  'int': TOKEN_TYPES.TYPE_INT,
  'float': TOKEN_TYPES.TYPE_FLOAT,
  'bool': TOKEN_TYPES.TYPE_BOOL,
  'string': TOKEN_TYPES.TYPE_STRING,
  'void': TOKEN_TYPES.TYPE_VOID,
  'u8': TOKEN_TYPES.TYPE_U8,
  'u16': TOKEN_TYPES.TYPE_U16,
  'u32': TOKEN_TYPES.TYPE_U32,
  'u64': TOKEN_TYPES.TYPE_U64,
  'i8': TOKEN_TYPES.TYPE_I8,
  'i16': TOKEN_TYPES.TYPE_I16,
  'i32': TOKEN_TYPES.TYPE_I32,
  'i64': TOKEN_TYPES.TYPE_I64,
  'byte': TOKEN_TYPES.TYPE_BYTE,
  'short': TOKEN_TYPES.TYPE_SHORT,
  'f32': TOKEN_TYPES.TYPE_F32,
  'f64': TOKEN_TYPES.TYPE_F64,
  'Digital': TOKEN_TYPES.TYPE_DIGITAL,
  'Analog': TOKEN_TYPES.TYPE_ANALOG,
  'PWM': TOKEN_TYPES.TYPE_PWM,
  'I2C': TOKEN_TYPES.TYPE_I2C,
  'SPI': TOKEN_TYPES.TYPE_SPI,
  'UART': TOKEN_TYPES.TYPE_UART,
  'Servo': TOKEN_TYPES.TYPE_SERVO,
  'Encoder': TOKEN_TYPES.TYPE_ENCODER,
  'DCMotor': TOKEN_TYPES.TYPE_DCMOTOR,
  'StepperMotor': TOKEN_TYPES.TYPE_STEPPERMOTOR,
  'Led': TOKEN_TYPES.TYPE_LED,
  'RgbLed': TOKEN_TYPES.TYPE_RGBLED,
  'Button': TOKEN_TYPES.TYPE_BUTTON,
  'Buzzer': TOKEN_TYPES.TYPE_BUZZER,
  // Multiplexers
  'Mux4': TOKEN_TYPES.TYPE_MUX4,
  'Mux8': TOKEN_TYPES.TYPE_MUX8,
  'Mux16': TOKEN_TYPES.TYPE_MUX16,
  'Mux32': TOKEN_TYPES.TYPE_MUX32,
  // Sensors
  'TempSensor': TOKEN_TYPES.TYPE_TEMPSENSOR,
  'HumiditySensor': TOKEN_TYPES.TYPE_HUMIDITYSENSOR,
  'PressureSensor': TOKEN_TYPES.TYPE_PRESSURESENSOR,
  'LightSensor': TOKEN_TYPES.TYPE_LIGHTSENSOR,
  'DistanceSensor': TOKEN_TYPES.TYPE_DISTANCESENSOR,
  'MotionSensor': TOKEN_TYPES.TYPE_MOTIONSENSOR,
  'TouchSensor': TOKEN_TYPES.TYPE_TOUCHSENSOR,
  'SoundSensor': TOKEN_TYPES.TYPE_SOUNDSENSOR,
  'GasSensor': TOKEN_TYPES.TYPE_GASSENSOR,
  'ColorSensor': TOKEN_TYPES.TYPE_COLORSENSOR,
  'Accelerometer': TOKEN_TYPES.TYPE_ACCELEROMETER,
  'Gyroscope': TOKEN_TYPES.TYPE_GYROSCOPE,
  'Magnetometer': TOKEN_TYPES.TYPE_MAGNETOMETER,
  'IMU': TOKEN_TYPES.TYPE_IMU,
  'GPS': TOKEN_TYPES.TYPE_GPS,
  'LoadCell': TOKEN_TYPES.TYPE_LOADCELL,
  'Potentiometer': TOKEN_TYPES.TYPE_POTENTIOMETER,
  'Joystick': TOKEN_TYPES.TYPE_JOYSTICK,
  'RotaryEncoder': TOKEN_TYPES.TYPE_ROTARYENCODER,
  'IRRemote': TOKEN_TYPES.TYPE_IRREMOTE,
  'RFID': TOKEN_TYPES.TYPE_RFID,
  // New Module-Specific Sensors
  'LM35': TOKEN_TYPES.TYPE_LM35,
  'DS18B20': TOKEN_TYPES.TYPE_DS18B20,
  'DHT11': TOKEN_TYPES.TYPE_DHT11,
  'DHT22': TOKEN_TYPES.TYPE_DHT22,
  'HC_SR04': TOKEN_TYPES.TYPE_HC_SR04,
  'GP2Y0A21': TOKEN_TYPES.TYPE_GP2Y0A21,
  'LDR': TOKEN_TYPES.TYPE_LDR,
  'BH1750': TOKEN_TYPES.TYPE_BH1750,
  'PIR': TOKEN_TYPES.TYPE_PIR,
  'Pot': TOKEN_TYPES.TYPE_POT,
  'BMP280': TOKEN_TYPES.TYPE_BMP280,
  'TTP223': TOKEN_TYPES.TYPE_TTP223,
  'MQ2': TOKEN_TYPES.TYPE_MQ2,
  'TCS34725': TOKEN_TYPES.TYPE_TCS34725,
  'MPU6050': TOKEN_TYPES.TYPE_MPU6050,
  'NEO6M': TOKEN_TYPES.TYPE_NEO6M,
  // Displays
  'LCD': TOKEN_TYPES.TYPE_LCD,
  'OLED': TOKEN_TYPES.TYPE_OLED,
  'SevenSegment': TOKEN_TYPES.TYPE_SEVENSEGMENT,
  'Matrix': TOKEN_TYPES.TYPE_MATRIX,
  'TFT': TOKEN_TYPES.TYPE_TFT,
  'NeoPixel': TOKEN_TYPES.TYPE_NEOPIXEL,
  // New Module-Specific Displays
  'HD44780': TOKEN_TYPES.TYPE_HD44780,
  'SSD1306': TOKEN_TYPES.TYPE_SSD1306,
  'WS2812': TOKEN_TYPES.TYPE_WS2812,
  'TM1637': TOKEN_TYPES.TYPE_TM1637,
  // Actuators
  'Relay': TOKEN_TYPES.TYPE_RELAY,
  'Solenoid': TOKEN_TYPES.TYPE_SOLENOID,
  'Fan': TOKEN_TYPES.TYPE_FAN,
  'Heater': TOKEN_TYPES.TYPE_HEATER,
  'Pump': TOKEN_TYPES.TYPE_PUMP,
  'Valve': TOKEN_TYPES.TYPE_VALVE,
  // New Module-Specific Actuators
  'Relay5V': TOKEN_TYPES.TYPE_RELAY5V,
  'FanPWM': TOKEN_TYPES.TYPE_FANPWM,
  'DCPump': TOKEN_TYPES.TYPE_DCPUMP,
  'SolenoidValve': TOKEN_TYPES.TYPE_SOLENOIDVALVE,
  // Communication
  'Bluetooth': TOKEN_TYPES.TYPE_BLUETOOTH,
  'WiFi': TOKEN_TYPES.TYPE_WIFI,
  'LoRa': TOKEN_TYPES.TYPE_LORA,
  'CAN': TOKEN_TYPES.TYPE_CAN,
  'RS485': TOKEN_TYPES.TYPE_RS485,
  'Ethernet': TOKEN_TYPES.TYPE_ETHERNET,
  'NRF24': TOKEN_TYPES.TYPE_NRF24,
  'ZigBee': TOKEN_TYPES.TYPE_ZIGBEE,
  // New Module-Specific Communication
  'HC05': TOKEN_TYPES.TYPE_HC05,
  'ESP8266': TOKEN_TYPES.TYPE_ESP8266,
  'SX1278': TOKEN_TYPES.TYPE_SX1278,
  'NRF24L01': TOKEN_TYPES.TYPE_NRF24L01,
  // Storage
  'SDCard': TOKEN_TYPES.TYPE_SDCARD,
  'EEPROM': TOKEN_TYPES.TYPE_EEPROM,
  'Flash': TOKEN_TYPES.TYPE_FLASH,
  // Power
  'Battery': TOKEN_TYPES.TYPE_BATTERY,
  'Solar': TOKEN_TYPES.TYPE_SOLAR,
  // New Module-Specific Power
  'LiPo': TOKEN_TYPES.TYPE_LIPO,
  'SolarPanel': TOKEN_TYPES.TYPE_SOLARPANEL,
  // Motor Drivers
  'HBridge': TOKEN_TYPES.TYPE_HBRIDGE,
  'MotorDriver': TOKEN_TYPES.TYPE_MOTORDRIVER,
  'ServoDriver': TOKEN_TYPES.TYPE_SERVODRIVER,
  // New Module-Specific Motor Drivers
  'L298N': TOKEN_TYPES.TYPE_L298N,
  'TB6612FNG': TOKEN_TYPES.TYPE_TB6612FNG,
  'PCA9685': TOKEN_TYPES.TYPE_PCA9685,
  // Timing
  'RTC': TOKEN_TYPES.TYPE_RTC,
  'Timer': TOKEN_TYPES.TYPE_TIMER,
  // New Module-Specific Timing
  'DS3231': TOKEN_TYPES.TYPE_DS3231,
  // Audio
  'Speaker': TOKEN_TYPES.TYPE_SPEAKER,
  'Microphone': TOKEN_TYPES.TYPE_MICROPHONE,
  'DFPlayer': TOKEN_TYPES.TYPE_DFPLAYER,
  // New Module-Specific Audio
  'MAX4466': TOKEN_TYPES.TYPE_MAX4466,
  'DFPlayerMini': TOKEN_TYPES.TYPE_DFPLAYERMINI,
  'List': TOKEN_TYPES.TYPE_LIST,
  'Map': TOKEN_TYPES.TYPE_MAP,
  'Error': TOKEN_TYPES.ERROR,
  'catch': TOKEN_TYPES.CATCH,
  'in': TOKEN_TYPES.IN,
  'true': TOKEN_TYPES.BOOLEAN,
  'false': TOKEN_TYPES.BOOLEAN,
  'and': TOKEN_TYPES.AND,
  'or': TOKEN_TYPES.OR,
  'not': TOKEN_TYPES.NOT
};

class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  peek(offset = 0) {
    const pos = this.pos + offset;
    return pos < this.source.length ? this.source[pos] : null;
  }

  advance() {
    const char = this.source[this.pos++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  skipWhitespace() {
    while (this.peek() && /[ \t\r]/.test(this.peek())) {
      this.advance();
    }
  }

  skipComment() {
    if (this.peek() === '#') {
      while (this.peek() && this.peek() !== '\n') {
        this.advance();
      }
      return true;
    }
    return false;
  }

  readNumber() {
    let num = '';
    let hasDecimal = false;
    
    // Check for hex literals (0x or 0X)
    if (this.peek() === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      num += this.advance(); // '0'
      num += this.advance(); // 'x' or 'X'
      
      // Read hex digits
      while (this.peek() && /[0-9a-fA-F]/.test(this.peek())) {
        num += this.advance();
      }
      
      return {
        type: TOKEN_TYPES.NUMBER,
        value: parseInt(num, 16), // Parse as hexadecimal
        unit: null,
        line: this.line,
        column: this.column - num.length
      };
    }
    
    while (this.peek() && /[0-9.]/.test(this.peek())) {
      const char = this.peek();
      if (char === '.') {
        // Check if this is part of a range operator (...)
        if (this.peek(1) === '.' && this.peek(2) === '.') {
          // This is a range operator, stop reading the number
          break;
        }
        if (hasDecimal) {
          // Already has a decimal point, stop here
          break;
        }
        hasDecimal = true;
      }
      num += this.advance();
    }
    
    // Check for unit suffix (time, frequency, angle, distance, speed)
    let unit = null;
    if (this.peek() && /[a-zA-Z]/.test(this.peek())) {
      const start = this.pos;
      let suffix = '';
      while (this.peek() && /[a-zA-Z]/.test(this.peek())) {
        suffix += this.peek();
        this.advance();
      }
      
      // Check if it's a valid unit
      const validUnits = [
        'ms', 's', 'us', 'min', 'h',              // time
        'Hz', 'kHz', 'MHz', 'GHz',                // frequency
        'deg', 'rad',                              // angle
        'cm', 'm', 'mm', 'km', 'in', 'ft',        // distance
        'rpm', 'mps', 'kph', 'mph',               // speed
        'V', 'mV', 'uV',                          // voltage
        'A', 'mA', 'uA',                          // current
        'ohm', 'kohm', 'Mohm',                    // resistance
        'F', 'uF', 'nF', 'pF',                    // capacitance
        'W', 'mW', 'kW',                          // power
        'C', 'K',                                  // temperature (Celsius, Kelvin)
        'g', 'kg', 'mg', 'N',                     // weight/force
        'B', 'KB', 'MB', 'GB',                    // data storage
        'pct', 'percent',                          // percentage
        'Pa', 'kPa', 'hPa', 'bar', 'atm', 'psi', // pressure
        'lux', 'lm',                               // light
        'dB', 'dBm'                                // sound/signal
      ];
      if (validUnits.includes(suffix)) {
        unit = suffix;
      } else {
        // Not a valid unit, rewind
        this.pos = start;
      }
    }
    
    return {
      type: TOKEN_TYPES.NUMBER,
      value: parseFloat(num),
      unit: unit,
      line: this.line,
      column: this.column - num.length
    };
  }

  readString(quote) {
    this.advance(); // consume opening quote
    let str = '';
    while (this.peek() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case 'r': str += '\r'; break;
          case '\\': str += '\\'; break;
          case quote: str += quote; break;
          default: str += escaped;
        }
      } else {
        str += this.advance();
      }
    }
    this.advance(); // consume closing quote
    return {
      type: TOKEN_TYPES.STRING,
      value: str,
      line: this.line,
      column: this.column - str.length - 2
    };
  }

  readIdentifier() {
    let id = '';
    while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek())) {
      id += this.advance();
    }
    
    const type = KEYWORDS[id] || TOKEN_TYPES.IDENTIFIER;
    return {
      type,
      value: type === TOKEN_TYPES.BOOLEAN ? (id === 'true') : id,
      line: this.line,
      column: this.column - id.length
    };
  }

  tokenize() {
    const tokens = [];
    
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      
      if (this.skipComment()) {
        continue;
      }

      const char = this.peek();
      
      if (!char) break;

      // Newlines - now just simple tokens, no indentation tracking
      if (char === '\n') {
        this.advance();
        // Skip multiple consecutive newlines
        while (this.peek() === '\n') {
          this.advance();
        }
        continue; // Don't add newline tokens - they're just whitespace now
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        tokens.push(this.readString(char));
        continue;
      }

      // Special handling for @main
      if (char === '@' && this.peek(1) === 'm' && this.peek(2) === 'a' && 
          this.peek(3) === 'i' && this.peek(4) === 'n') {
        this.advance(); // @
        this.advance(); // m
        this.advance(); // a
        this.advance(); // i
        this.advance(); // n
        tokens.push({ type: TOKEN_TYPES.MAIN, value: '@main', line: this.line, column: this.column - 5 });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Two-character operators
      if (char === '.' && this.peek(1) === '.' && this.peek(2) === '.') {
        this.advance();
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.RANGE, value: '...', line: this.line, column: this.column - 3 });
        continue;
      }
      
      if (char === '=' && this.peek(1) === '>') {
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.ARROW, value: '=>', line: this.line, column: this.column - 2 });
        continue;
      }
      
      if (char === '-' && this.peek(1) === '>') {
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.ARROW, value: '->', line: this.line, column: this.column - 2 });
        continue;
      }
      
      if (char === '=' && this.peek(1) === '=') {
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.EQUAL, value: '==', line: this.line, column: this.column - 2 });
        continue;
      }
      
      if (char === '!' && this.peek(1) === '=') {
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.NOT_EQUAL, value: '!=', line: this.line, column: this.column - 2 });
        continue;
      }
      
      if (char === '<' && this.peek(1) === '=') {
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.LESS_EQUAL, value: '<=', line: this.line, column: this.column - 2 });
        continue;
      }
      
      if (char === '>' && this.peek(1) === '=') {
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.GREATER_EQUAL, value: '>=', line: this.line, column: this.column - 2 });
        continue;
      }

      // Single-character tokens
      const singleChar = {
        '+': TOKEN_TYPES.PLUS,
        '-': TOKEN_TYPES.MINUS,
        '*': TOKEN_TYPES.MULTIPLY,
        '/': TOKEN_TYPES.DIVIDE,
        '%': TOKEN_TYPES.MODULO,
        '=': TOKEN_TYPES.ASSIGN,
        '<': TOKEN_TYPES.LESS_THAN,
        '>': TOKEN_TYPES.GREATER_THAN,
        '(': TOKEN_TYPES.LPAREN,
        ')': TOKEN_TYPES.RPAREN,
        '{': TOKEN_TYPES.LBRACE,
        '}': TOKEN_TYPES.RBRACE,
        '[': TOKEN_TYPES.LBRACKET,
        ']': TOKEN_TYPES.RBRACKET,
        ',': TOKEN_TYPES.COMMA,
        '.': TOKEN_TYPES.DOT,
        ':': TOKEN_TYPES.COLON,
        ';': TOKEN_TYPES.SEMICOLON,
        '?': TOKEN_TYPES.QUESTION,
        '@': TOKEN_TYPES.AT,
        '!': TOKEN_TYPES.EXCLAMATION
      };

      if (singleChar[char]) {
        this.advance();
        tokens.push({ type: singleChar[char], value: char, line: this.line, column: this.column - 1 });
        continue;
      }

      throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }

    tokens.push({ type: TOKEN_TYPES.EOF, line: this.line, column: this.column });
    return tokens;
  }
}

module.exports = { Lexer, TOKEN_TYPES };
