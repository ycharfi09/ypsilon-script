/**
 * Ypsilon Script Parser - OOP, Strictly-Typed, Brace-Based
 * Builds an Abstract Syntax Tree (AST) from tokens
 */

const { TOKEN_TYPES } = require('./lexer');

// Helper to check if token is a type keyword
function isTypeToken(tokenType) {
  return [
    TOKEN_TYPES.TYPE_INT,
    TOKEN_TYPES.TYPE_FLOAT,
    TOKEN_TYPES.TYPE_BOOL,
    TOKEN_TYPES.TYPE_STRING,
    TOKEN_TYPES.TYPE_VOID,
    TOKEN_TYPES.TYPE_U8,
    TOKEN_TYPES.TYPE_U16,
    TOKEN_TYPES.TYPE_U32,
    TOKEN_TYPES.TYPE_U64,
    TOKEN_TYPES.TYPE_I8,
    TOKEN_TYPES.TYPE_I16,
    TOKEN_TYPES.TYPE_I32,
    TOKEN_TYPES.TYPE_I64,
    TOKEN_TYPES.TYPE_BYTE,
    TOKEN_TYPES.TYPE_SHORT,
    TOKEN_TYPES.TYPE_F32,
    TOKEN_TYPES.TYPE_F64,
    TOKEN_TYPES.TYPE_DIGITAL,
    TOKEN_TYPES.TYPE_ANALOG,
    TOKEN_TYPES.TYPE_PWM,
    TOKEN_TYPES.TYPE_I2C,
    TOKEN_TYPES.TYPE_SPI,
    TOKEN_TYPES.TYPE_UART,
    TOKEN_TYPES.TYPE_SERVO,
    TOKEN_TYPES.TYPE_ENCODER,
    TOKEN_TYPES.TYPE_DCMOTOR,
    TOKEN_TYPES.TYPE_STEPPERMOTOR,
    TOKEN_TYPES.TYPE_LED,
    TOKEN_TYPES.TYPE_RGBLED,
    TOKEN_TYPES.TYPE_BUTTON,
    TOKEN_TYPES.TYPE_BUZZER,
    // Multiplexers
    TOKEN_TYPES.TYPE_MUX4,
    TOKEN_TYPES.TYPE_MUX8,
    TOKEN_TYPES.TYPE_MUX16,
    TOKEN_TYPES.TYPE_MUX32,
    // Sensors
    TOKEN_TYPES.TYPE_TEMPSENSOR,
    TOKEN_TYPES.TYPE_HUMIDITYSENSOR,
    TOKEN_TYPES.TYPE_PRESSURESENSOR,
    TOKEN_TYPES.TYPE_LIGHTSENSOR,
    TOKEN_TYPES.TYPE_DISTANCESENSOR,
    TOKEN_TYPES.TYPE_MOTIONSENSOR,
    TOKEN_TYPES.TYPE_TOUCHSENSOR,
    TOKEN_TYPES.TYPE_SOUNDSENSOR,
    TOKEN_TYPES.TYPE_GASSENSOR,
    TOKEN_TYPES.TYPE_COLORSENSOR,
    TOKEN_TYPES.TYPE_ACCELEROMETER,
    TOKEN_TYPES.TYPE_GYROSCOPE,
    TOKEN_TYPES.TYPE_MAGNETOMETER,
    TOKEN_TYPES.TYPE_IMU,
    TOKEN_TYPES.TYPE_GPS,
    TOKEN_TYPES.TYPE_LOADCELL,
    TOKEN_TYPES.TYPE_POTENTIOMETER,
    TOKEN_TYPES.TYPE_JOYSTICK,
    TOKEN_TYPES.TYPE_ROTARYENCODER,
    TOKEN_TYPES.TYPE_IRREMOTE,
    TOKEN_TYPES.TYPE_RFID,
    // Displays
    TOKEN_TYPES.TYPE_LCD,
    TOKEN_TYPES.TYPE_OLED,
    TOKEN_TYPES.TYPE_SEVENSEGMENT,
    TOKEN_TYPES.TYPE_MATRIX,
    TOKEN_TYPES.TYPE_TFT,
    TOKEN_TYPES.TYPE_NEOPIXEL,
    // Actuators
    TOKEN_TYPES.TYPE_RELAY,
    TOKEN_TYPES.TYPE_SOLENOID,
    TOKEN_TYPES.TYPE_FAN,
    TOKEN_TYPES.TYPE_HEATER,
    TOKEN_TYPES.TYPE_PUMP,
    TOKEN_TYPES.TYPE_VALVE,
    // Communication
    TOKEN_TYPES.TYPE_BLUETOOTH,
    TOKEN_TYPES.TYPE_WIFI,
    TOKEN_TYPES.TYPE_LORA,
    TOKEN_TYPES.TYPE_CAN,
    TOKEN_TYPES.TYPE_RS485,
    TOKEN_TYPES.TYPE_ETHERNET,
    TOKEN_TYPES.TYPE_NRF24,
    TOKEN_TYPES.TYPE_ZIGBEE,
    // Storage
    TOKEN_TYPES.TYPE_SDCARD,
    TOKEN_TYPES.TYPE_EEPROM,
    TOKEN_TYPES.TYPE_FLASH,
    // Power
    TOKEN_TYPES.TYPE_BATTERY,
    TOKEN_TYPES.TYPE_SOLAR,
    // Motor Drivers
    TOKEN_TYPES.TYPE_HBRIDGE,
    TOKEN_TYPES.TYPE_MOTORDRIVER,
    TOKEN_TYPES.TYPE_SERVODRIVER,
    // Timing
    TOKEN_TYPES.TYPE_RTC,
    TOKEN_TYPES.TYPE_TIMER,
    // Audio
    TOKEN_TYPES.TYPE_SPEAKER,
    TOKEN_TYPES.TYPE_MICROPHONE,
    TOKEN_TYPES.TYPE_DFPLAYER,
    // Collections
    TOKEN_TYPES.TYPE_LIST,
    TOKEN_TYPES.TYPE_MAP
  ].includes(tokenType);
}

// Convert token type to string representation
function tokenTypeToString(tokenType) {
  const typeMap = {
    [TOKEN_TYPES.TYPE_INT]: 'int',
    [TOKEN_TYPES.TYPE_FLOAT]: 'float',
    [TOKEN_TYPES.TYPE_BOOL]: 'bool',
    [TOKEN_TYPES.TYPE_STRING]: 'string',
    [TOKEN_TYPES.TYPE_VOID]: 'void',
    [TOKEN_TYPES.TYPE_U8]: 'u8',
    [TOKEN_TYPES.TYPE_U16]: 'u16',
    [TOKEN_TYPES.TYPE_U32]: 'u32',
    [TOKEN_TYPES.TYPE_U64]: 'u64',
    [TOKEN_TYPES.TYPE_I8]: 'i8',
    [TOKEN_TYPES.TYPE_I16]: 'i16',
    [TOKEN_TYPES.TYPE_I32]: 'i32',
    [TOKEN_TYPES.TYPE_I64]: 'i64',
    [TOKEN_TYPES.TYPE_BYTE]: 'byte',
    [TOKEN_TYPES.TYPE_SHORT]: 'short',
    [TOKEN_TYPES.TYPE_F32]: 'f32',
    [TOKEN_TYPES.TYPE_F64]: 'f64',
    [TOKEN_TYPES.TYPE_DIGITAL]: 'Digital',
    [TOKEN_TYPES.TYPE_ANALOG]: 'Analog',
    [TOKEN_TYPES.TYPE_PWM]: 'PWM',
    [TOKEN_TYPES.TYPE_I2C]: 'I2C',
    [TOKEN_TYPES.TYPE_SPI]: 'SPI',
    [TOKEN_TYPES.TYPE_UART]: 'UART',
    [TOKEN_TYPES.TYPE_SERVO]: 'Servo',
    [TOKEN_TYPES.TYPE_ENCODER]: 'Encoder',
    [TOKEN_TYPES.TYPE_DCMOTOR]: 'DCMotor',
    [TOKEN_TYPES.TYPE_STEPPERMOTOR]: 'StepperMotor',
    [TOKEN_TYPES.TYPE_LED]: 'Led',
    [TOKEN_TYPES.TYPE_RGBLED]: 'RgbLed',
    [TOKEN_TYPES.TYPE_BUTTON]: 'Button',
    [TOKEN_TYPES.TYPE_BUZZER]: 'Buzzer',
    // Multiplexers
    [TOKEN_TYPES.TYPE_MUX4]: 'Mux4',
    [TOKEN_TYPES.TYPE_MUX8]: 'Mux8',
    [TOKEN_TYPES.TYPE_MUX16]: 'Mux16',
    [TOKEN_TYPES.TYPE_MUX32]: 'Mux32',
    // Sensors
    [TOKEN_TYPES.TYPE_TEMPSENSOR]: 'TempSensor',
    [TOKEN_TYPES.TYPE_HUMIDITYSENSOR]: 'HumiditySensor',
    [TOKEN_TYPES.TYPE_PRESSURESENSOR]: 'PressureSensor',
    [TOKEN_TYPES.TYPE_LIGHTSENSOR]: 'LightSensor',
    [TOKEN_TYPES.TYPE_DISTANCESENSOR]: 'DistanceSensor',
    [TOKEN_TYPES.TYPE_MOTIONSENSOR]: 'MotionSensor',
    [TOKEN_TYPES.TYPE_TOUCHSENSOR]: 'TouchSensor',
    [TOKEN_TYPES.TYPE_SOUNDSENSOR]: 'SoundSensor',
    [TOKEN_TYPES.TYPE_GASSENSOR]: 'GasSensor',
    [TOKEN_TYPES.TYPE_COLORSENSOR]: 'ColorSensor',
    [TOKEN_TYPES.TYPE_ACCELEROMETER]: 'Accelerometer',
    [TOKEN_TYPES.TYPE_GYROSCOPE]: 'Gyroscope',
    [TOKEN_TYPES.TYPE_MAGNETOMETER]: 'Magnetometer',
    [TOKEN_TYPES.TYPE_IMU]: 'IMU',
    [TOKEN_TYPES.TYPE_GPS]: 'GPS',
    [TOKEN_TYPES.TYPE_LOADCELL]: 'LoadCell',
    [TOKEN_TYPES.TYPE_POTENTIOMETER]: 'Potentiometer',
    [TOKEN_TYPES.TYPE_JOYSTICK]: 'Joystick',
    [TOKEN_TYPES.TYPE_ROTARYENCODER]: 'RotaryEncoder',
    [TOKEN_TYPES.TYPE_IRREMOTE]: 'IRRemote',
    [TOKEN_TYPES.TYPE_RFID]: 'RFID',
    // Displays
    [TOKEN_TYPES.TYPE_LCD]: 'LCD',
    [TOKEN_TYPES.TYPE_OLED]: 'OLED',
    [TOKEN_TYPES.TYPE_SEVENSEGMENT]: 'SevenSegment',
    [TOKEN_TYPES.TYPE_MATRIX]: 'Matrix',
    [TOKEN_TYPES.TYPE_TFT]: 'TFT',
    [TOKEN_TYPES.TYPE_NEOPIXEL]: 'NeoPixel',
    // Actuators
    [TOKEN_TYPES.TYPE_RELAY]: 'Relay',
    [TOKEN_TYPES.TYPE_SOLENOID]: 'Solenoid',
    [TOKEN_TYPES.TYPE_FAN]: 'Fan',
    [TOKEN_TYPES.TYPE_HEATER]: 'Heater',
    [TOKEN_TYPES.TYPE_PUMP]: 'Pump',
    [TOKEN_TYPES.TYPE_VALVE]: 'Valve',
    // Communication
    [TOKEN_TYPES.TYPE_BLUETOOTH]: 'Bluetooth',
    [TOKEN_TYPES.TYPE_WIFI]: 'WiFi',
    [TOKEN_TYPES.TYPE_LORA]: 'LoRa',
    [TOKEN_TYPES.TYPE_CAN]: 'CAN',
    [TOKEN_TYPES.TYPE_RS485]: 'RS485',
    [TOKEN_TYPES.TYPE_ETHERNET]: 'Ethernet',
    [TOKEN_TYPES.TYPE_NRF24]: 'NRF24',
    [TOKEN_TYPES.TYPE_ZIGBEE]: 'ZigBee',
    // Storage
    [TOKEN_TYPES.TYPE_SDCARD]: 'SDCard',
    [TOKEN_TYPES.TYPE_EEPROM]: 'EEPROM',
    [TOKEN_TYPES.TYPE_FLASH]: 'Flash',
    // Power
    [TOKEN_TYPES.TYPE_BATTERY]: 'Battery',
    [TOKEN_TYPES.TYPE_SOLAR]: 'Solar',
    // Motor Drivers
    [TOKEN_TYPES.TYPE_HBRIDGE]: 'HBridge',
    [TOKEN_TYPES.TYPE_MOTORDRIVER]: 'MotorDriver',
    [TOKEN_TYPES.TYPE_SERVODRIVER]: 'ServoDriver',
    // Timing
    [TOKEN_TYPES.TYPE_RTC]: 'RTC',
    [TOKEN_TYPES.TYPE_TIMER]: 'Timer',
    // Audio
    [TOKEN_TYPES.TYPE_SPEAKER]: 'Speaker',
    [TOKEN_TYPES.TYPE_MICROPHONE]: 'Microphone',
    [TOKEN_TYPES.TYPE_DFPLAYER]: 'DFPlayer',
    // Collections
    [TOKEN_TYPES.TYPE_LIST]: 'List',
    [TOKEN_TYPES.TYPE_MAP]: 'Map'
  };
  return typeMap[tokenType] || 'int';
}

// Hardware types that support natural variable-like syntax (Type name = value instead of Type name = new Type(value))
const NATURAL_SYNTAX_HARDWARE_TYPES = [
  'Digital', 'Analog', 'PWM', 'Led', 'Button', 'Buzzer', 'Relay', 'Solenoid',
  'Fan', 'Heater', 'Pump', 'Valve', 'TempSensor', 'HumiditySensor', 'PressureSensor',
  'LightSensor', 'MotionSensor', 'TouchSensor', 'SoundSensor', 'GasSensor',
  'Potentiometer', 'Speaker', 'Microphone', 'Timer'
];

// Check if a type supports natural syntax for initialization
function supportsNaturalSyntax(typeName) {
  return NATURAL_SYNTAX_HARDWARE_TYPES.includes(typeName);
}

// Transform initializer expression to NewExpression for hardware types with natural syntax
function transformToNaturalSyntax(varType, init) {
  // If the type supports natural syntax and the initializer is not already a NewExpression,
  // wrap the value(s) in a NewExpression
  if (supportsNaturalSyntax(varType) && init && init.type !== 'NewExpression') {
    // Collect arguments - if it's a single value, wrap it in an array
    // If it's an array literal, use its elements as arguments
    let args;
    if (init.type === 'ArrayLiteral') {
      args = init.elements;
    } else {
      args = [init];
    }
    
    return {
      type: 'NewExpression',
      className: varType,
      arguments: args
    };
  }
  return init;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    const pos = this.pos + offset;
    if (pos < this.tokens.length) {
      return this.tokens[pos];
    }
    // Return EOF token if out of bounds to prevent errors when parser looks ahead
    return this.tokens.length > 0 ? this.tokens[this.tokens.length - 1] : { type: TOKEN_TYPES.EOF };
  }

  advance() {
    return this.tokens[this.pos++];
  }

  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      // Provide friendly error messages
      let errorMsg = `Syntax Error at line ${token.line}: `;
      let tip = '';
      
      // Map token types to user-friendly names
      const tokenName = {
        [TOKEN_TYPES.LBRACE]: "'{'",
        [TOKEN_TYPES.RBRACE]: "'}'",
        [TOKEN_TYPES.LPAREN]: "'('",
        [TOKEN_TYPES.RPAREN]: "')'",
        [TOKEN_TYPES.SEMICOLON]: "';'",
        [TOKEN_TYPES.COLON]: "':'",
        [TOKEN_TYPES.COMMA]: "','",
        [TOKEN_TYPES.IDENTIFIER]: "identifier",
        [TOKEN_TYPES.TYPE_INT]: "type",
        [TOKEN_TYPES.TYPE_FLOAT]: "type",
        [TOKEN_TYPES.TYPE_BOOL]: "type",
        [TOKEN_TYPES.TYPE_STRING]: "type",
        [TOKEN_TYPES.TYPE_VOID]: "type"
      };
      
      const expectedName = tokenName[type] || type;
      const gotName = tokenName[token.type] || token.type;
      
      errorMsg += `Expected ${expectedName} but got ${gotName}`;
      
      // Add contextual tips
      if (type === TOKEN_TYPES.RBRACE && token.type === TOKEN_TYPES.EOF) {
        tip = "\nTip: Did you forget a closing brace '}'?";
      } else if (type === TOKEN_TYPES.RPAREN && token.type === TOKEN_TYPES.LBRACE) {
        tip = "\nTip: Did you forget a closing parenthesis ')'?";
      } else if (type === TOKEN_TYPES.IDENTIFIER && isTypeToken(token.type)) {
        tip = "\nTip: Expected a variable or function name after the type.";
      } else if (isTypeToken(type) && token.type === TOKEN_TYPES.IDENTIFIER) {
        tip = "\nTip: Variables must start with a type. Use: int, float, bool, or string.";
      }
      
      throw new Error(errorMsg + tip);
    }
    return this.advance();
  }

  // Optional expect - doesn't throw error if not found, just consumes if present
  optionalExpect(type) {
    if (this.peek().type === type) {
      return this.advance();
    }
    return null;
  }

  parse() {
    const ast = {
      type: 'Program',
      body: [],
      hasMain: false
    };

    while (this.peek().type !== TOKEN_TYPES.EOF) {
      const stmt = this.parseTopLevelStatement();
      if (stmt) {
        ast.body.push(stmt);
      }
    }

    return ast;
  }

  parseTopLevelStatement() {
    const token = this.peek();

    switch (token.type) {
      case TOKEN_TYPES.MAIN:
        return this.parseMainDirective();
      case TOKEN_TYPES.CLASS:
        return this.parseClassDeclaration();
      case TOKEN_TYPES.FUNCTION:
      case TOKEN_TYPES.FN:
        return this.parseFunctionDeclaration();
      case TOKEN_TYPES.CONST:
      case TOKEN_TYPES.MUT:
        return this.parseVariableDeclaration();
      case TOKEN_TYPES.ENUM:
        return this.parseEnumDeclaration();
      case TOKEN_TYPES.STRUCT:
        return this.parseStructDeclaration();
      case TOKEN_TYPES.ON:
        return this.parseOnBlock();
      case TOKEN_TYPES.INTERRUPT:
        return this.parseInterruptBlock();
      case TOKEN_TYPES.SIGNAL:
        return this.parseSignalDeclaration();
      case TOKEN_TYPES.TASK:
        return this.parseTaskDeclaration();
      case TOKEN_TYPES.USE:
        return this.parseUseStatement();
      case TOKEN_TYPES.LOAD:
        return this.parseLoadStatement();
      case TOKEN_TYPES.ALIAS:
        return this.parseAliasStatement();
      case TOKEN_TYPES.CONFIG:
        return this.parseConfigBlock();
      case TOKEN_TYPES.REACT:
        return this.parseReactDeclaration();
      default:
        // Check if it's a typed variable declaration (e.g., "int x;")
        if (isTypeToken(token.type)) {
          return this.parseTypedVariableDeclaration();
        }
        // Check for class type (identifier that could be a class name)
        if (token.type === TOKEN_TYPES.IDENTIFIER) {
          return this.parseClassInstanceDeclaration();
        }
        throw new Error(`Unexpected top-level token ${token.type} at line ${token.line}`);
    }
  }

  // Helper to parse namespace-qualified type names (e.g., m.Motor -> m::Motor)
  parseNamespacedType(baseTypeName) {
    let typeName = baseTypeName;
    
    // Check for namespace prefix (e.g., m.Motor)
    if (this.peek().type === TOKEN_TYPES.DOT) {
      this.advance(); // consume dot
      const typeIdentifier = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      typeName = typeName + '::' + typeIdentifier; // Use C++ namespace syntax
    }
    
    return typeName;
  }

  parseMainDirective() {
    this.expect(TOKEN_TYPES.MAIN);
    return {
      type: 'MainDirective'
    };
  }

  parseClassInstanceDeclaration() {
    const baseClassName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    const className = this.parseNamespacedType(baseClassName);
    
    const varName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'VariableDeclaration',
      kind: 'var',
      varType: className, // class type
      name: varName,
      init
    };
  }

  parseClassDeclaration() {
    this.expect(TOKEN_TYPES.CLASS);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.LBRACE);

    const properties = [];
    const methods = [];
    let constructor = null;

    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const token = this.peek();
      
      if (token.type === TOKEN_TYPES.CONSTRUCTOR) {
        if (constructor) {
          throw new Error(`Class ${name} cannot have multiple constructors at line ${token.line}`);
        }
        constructor = this.parseConstructor();
      } else if (token.type === TOKEN_TYPES.MUT || token.type === TOKEN_TYPES.CONST) {
        // Property with mut/const prefix
        const isMut = token.type === TOKEN_TYPES.MUT;
        this.advance();
        const propType = this.parseType();
        const propName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        
        let init = null;
        if (this.peek().type === TOKEN_TYPES.ASSIGN) {
          this.advance();
          init = this.parseExpression();
        }
        this.optionalExpect(TOKEN_TYPES.SEMICOLON);
        
        properties.push({
          type: 'PropertyDeclaration',
          propertyType: propType,
          name: propName,
          isMut,
          init
        });
      } else if (token.type === TOKEN_TYPES.FN) {
        // Method with fn keyword
        this.advance();
        const methodName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        this.expect(TOKEN_TYPES.LPAREN);
        
        const params = [];
        while (this.peek().type !== TOKEN_TYPES.RPAREN) {
          const paramType = this.parseType();
          const paramName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
          params.push({ type: paramType, name: paramName });
          
          if (this.peek().type === TOKEN_TYPES.COMMA) {
            this.advance();
          }
        }
        this.expect(TOKEN_TYPES.RPAREN);
        
        // Optional return type indicator
        let returnType = 'void';
        if (this.peek().type === TOKEN_TYPES.ARROW) {
          this.advance();
          returnType = this.parseType();
        }
        
        const body = this.parseBlock();
        
        // If no explicit return type, infer it
        if (returnType === 'void') {
          returnType = this.inferReturnType(body);
        }
        
        methods.push({
          type: 'MethodDeclaration',
          returnType,
          name: methodName,
          params,
          body
        });
      } else if (isTypeToken(token.type)) {
        // Could be a property or method
        const typeToken = this.advance();
        const memberName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        
        if (this.peek().type === TOKEN_TYPES.LPAREN) {
          // It's a method
          methods.push(this.parseMethodDeclaration(typeToken, memberName));
        } else {
          // It's a property
          properties.push(this.parsePropertyDeclaration(typeToken, memberName));
        }
      } else {
        throw new Error(`Unexpected token ${token.type} in class body at line ${token.line}`);
      }
    }

    this.expect(TOKEN_TYPES.RBRACE);

    return {
      type: 'ClassDeclaration',
      name,
      properties,
      methods,
      constructor
    };
  }

  parseConstructor() {
    this.expect(TOKEN_TYPES.CONSTRUCTOR);
    this.expect(TOKEN_TYPES.LPAREN);
    
    const params = [];
    while (this.peek().type !== TOKEN_TYPES.RPAREN) {
      const paramType = this.parseType();
      const paramName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      params.push({ type: paramType, name: paramName });
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    this.expect(TOKEN_TYPES.RPAREN);
    
    const body = this.parseBlock();

    return {
      type: 'Constructor',
      params,
      body
    };
  }

  parsePropertyDeclaration(typeToken, name) {
    const propType = tokenTypeToString(typeToken.type);
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'PropertyDeclaration',
      propertyType: propType,
      name,
      init
    };
  }

  parseMethodDeclaration(typeToken, name) {
    const returnType = tokenTypeToString(typeToken.type);
    this.expect(TOKEN_TYPES.LPAREN);
    
    const params = [];
    while (this.peek().type !== TOKEN_TYPES.RPAREN) {
      const paramType = this.parseType();
      const paramName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      params.push({ type: paramType, name: paramName });
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    this.expect(TOKEN_TYPES.RPAREN);
    
    const body = this.parseBlock();

    return {
      type: 'MethodDeclaration',
      returnType,
      name,
      params,
      body
    };
  }

  parseFunctionDeclaration() {
    // Accept either 'function' or 'fn'
    if (this.peek().type === TOKEN_TYPES.FUNCTION) {
      this.expect(TOKEN_TYPES.FUNCTION);
    } else {
      this.expect(TOKEN_TYPES.FN);
    }
    
    // Parse return type - now optional
    let returnType = null;
    if (isTypeToken(this.peek().type)) {
      returnType = this.parseType();
    }
    
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.LPAREN);
    
    const params = [];
    while (this.peek().type !== TOKEN_TYPES.RPAREN) {
      const paramType = this.parseType();
      const paramName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      params.push({ type: paramType, name: paramName });
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    this.expect(TOKEN_TYPES.RPAREN);
    
    // Check for -> return type
    if (this.peek().type === TOKEN_TYPES.ARROW) {
      this.advance();
      returnType = this.parseType();
    }
    
    const body = this.parseBlock();

    // If return type wasn't specified, infer it from return statements
    if (!returnType) {
      returnType = this.inferReturnType(body);
    }

    return {
      type: 'FunctionDeclaration',
      returnType,
      name,
      params,
      body
    };
  }

  // Infer return type from function body
  inferReturnType(body) {
    for (const stmt of body) {
      if (stmt.type === 'ReturnStatement') {
        if (stmt.argument) {
          // Infer type from the return value
          return this.inferExpressionType(stmt.argument);
        } else {
          return 'void';
        }
      }
      // Check nested blocks (if, while, for)
      if (stmt.consequent) {
        const type = this.inferReturnType(stmt.consequent);
        if (type !== 'void') return type;
      }
      if (stmt.alternate) {
        const type = this.inferReturnType(stmt.alternate);
        if (type !== 'void') return type;
      }
      if (stmt.body && Array.isArray(stmt.body)) {
        const type = this.inferReturnType(stmt.body);
        if (type !== 'void') return type;
      }
    }
    return 'void';
  }

  // Infer type from expression
  inferExpressionType(expr) {
    if (!expr) return 'void';
    
    switch (expr.type) {
      case 'Literal':
        if (expr.valueType === 'number') {
          return Number.isInteger(expr.value) ? 'int' : 'float';
        } else if (expr.valueType === 'boolean') {
          return 'bool';
        } else if (expr.valueType === 'string') {
          return 'string';
        }
        // Default for unknown literal types
        return 'int';
      case 'BinaryExpression':
        // Try to infer from operands - if either is float, result is float
        const leftType = this.inferExpressionType(expr.left);
        const rightType = this.inferExpressionType(expr.right);
        if (leftType === 'float' || rightType === 'float') {
          return 'float';
        }
        // Boolean operations
        if (['==', '!=', '<', '>', '<=', '>='].includes(expr.operator)) {
          return 'bool';
        }
        // Default to int for arithmetic operations
        return 'int';
      case 'CallExpression':
        // Can't easily infer without function signature tracking
        // Default to int as the most common return type
        return 'int';
      default:
        // For unknown expression types, default to int
        return 'int';
    }
  }

  parseType() {
    const token = this.peek();
    if (isTypeToken(token.type)) {
      this.advance();
      return tokenTypeToString(token.type);
    }
    // Allow identifiers as types (for structs, enums, and classes)
    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      const baseTypeName = this.advance().value;
      return this.parseNamespacedType(baseTypeName);
    }
    throw new Error(`Expected type but got ${token.type} at line ${token.line}`);
  }

  parseBlock() {
    this.expect(TOKEN_TYPES.LBRACE);
    const statements = [];
    
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    return statements;
  }

  parseStatement() {
    const token = this.peek();

    switch (token.type) {
      case TOKEN_TYPES.IF:
        return this.parseIfStatement();
      case TOKEN_TYPES.WHILE:
        return this.parseWhileStatement();
      case TOKEN_TYPES.FOR:
        return this.parseForStatement();
      case TOKEN_TYPES.REPEAT:
        return this.parseRepeatStatement();
      case TOKEN_TYPES.RETURN:
        return this.parseReturnStatement();
      case TOKEN_TYPES.CONST:
      case TOKEN_TYPES.MUT:
        return this.parseVariableDeclaration();
      case TOKEN_TYPES.MATCH:
        return this.parseMatchStatement();
      case TOKEN_TYPES.SWITCH:
        return this.parseSwitchStatement();
      case TOKEN_TYPES.EMIT:
        return this.parseEmitStatement();
      case TOKEN_TYPES.WAIT:
        return this.parseWaitStatement();
      case TOKEN_TYPES.TIMEOUT:
        return this.parseTimeoutStatement();
      case TOKEN_TYPES.ATOMIC:
        return this.parseAtomicBlock();
      case TOKEN_TYPES.AT:
        return this.parseCppBlock();
      default:
        // Check if it's a typed variable declaration
        if (isTypeToken(token.type)) {
          return this.parseTypedVariableDeclaration();
        }
        // Check if it's a class instance declaration (e.g., Motor motor = ...)
        // Look ahead to see if we have: IDENTIFIER IDENTIFIER or IDENTIFIER DOT IDENTIFIER IDENTIFIER
        if (token.type === TOKEN_TYPES.IDENTIFIER) {
          const next = this.peek(1);
          if (next.type === TOKEN_TYPES.DOT) {
            // Could be namespace.Type varName
            const afterDot = this.peek(2);
            const afterType = this.peek(3);
            if (afterDot.type === TOKEN_TYPES.IDENTIFIER && afterType.type === TOKEN_TYPES.IDENTIFIER) {
              return this.parseTypedVariableDeclaration();
            }
          } else if (next.type === TOKEN_TYPES.IDENTIFIER) {
            // Could be Type varName
            return this.parseTypedVariableDeclaration();
          }
        }
        return this.parseExpressionStatement();
    }
  }

  parseIfStatement() {
    this.expect(TOKEN_TYPES.IF);
    this.expect(TOKEN_TYPES.LPAREN);
    const test = this.parseExpression();
    this.expect(TOKEN_TYPES.RPAREN);
    
    const consequent = this.parseBlock();
    
    let alternate = null;
    if (this.peek().type === TOKEN_TYPES.ELSE) {
      this.advance();
      if (this.peek().type === TOKEN_TYPES.IF) {
        // else if
        alternate = [this.parseIfStatement()];
      } else {
        alternate = this.parseBlock();
      }
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    };
  }

  parseWhileStatement() {
    this.expect(TOKEN_TYPES.WHILE);
    this.expect(TOKEN_TYPES.LPAREN);
    const test = this.parseExpression();
    this.expect(TOKEN_TYPES.RPAREN);
    
    const body = this.parseBlock();

    return {
      type: 'WhileStatement',
      test,
      body
    };
  }

  parseForStatement() {
    this.expect(TOKEN_TYPES.FOR);
    this.expect(TOKEN_TYPES.LPAREN);
    
    // Simple for loop: for (int i = 0; i < 10; i = i + 1)
    const varType = this.parseType();
    const variable = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.ASSIGN);
    const init = this.parseExpression();
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    const test = this.parseExpression();
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    const update = this.parseExpression();
    this.expect(TOKEN_TYPES.RPAREN);
    
    const body = this.parseBlock();

    return {
      type: 'ForStatement',
      varType,
      variable,
      init,
      test,
      update,
      body
    };
  }

  parseRepeatStatement() {
    this.expect(TOKEN_TYPES.REPEAT);
    this.expect(TOKEN_TYPES.LPAREN);
    const count = this.parseExpression();
    this.expect(TOKEN_TYPES.RPAREN);
    
    const body = this.parseBlock();

    return {
      type: 'RepeatStatement',
      count,
      body
    };
  }

  parseReturnStatement() {
    this.expect(TOKEN_TYPES.RETURN);
    let argument = null;
    
    if (this.peek().type !== TOKEN_TYPES.SEMICOLON && this.peek().type !== TOKEN_TYPES.EOF) {
      argument = this.parseExpression();
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'ReturnStatement',
      argument
    };
  }

  parseVariableDeclaration() {
    // Accept either 'const' or 'mut'
    let kind = 'const';
    if (this.peek().type === TOKEN_TYPES.CONST) {
      this.expect(TOKEN_TYPES.CONST);
      kind = 'const';
    } else {
      this.expect(TOKEN_TYPES.MUT);
      kind = 'var'; // mut maps to var in C++
    }
    
    const varType = this.parseType();
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    // Check for range specification (in min...max)
    let range = null;
    if (this.peek().type === TOKEN_TYPES.IN) {
      this.advance(); // consume 'in'
      const min = this.parseExpression();
      this.expect(TOKEN_TYPES.RANGE); // expect '...'
      const max = this.parseExpression();
      range = { min, max };
    }
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
      init = transformToNaturalSyntax(varType, init);
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'VariableDeclaration',
      kind,
      varType,
      name,
      init,
      range
    };
  }

  parseTypedVariableDeclaration() {
    const varType = this.parseType();
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
      init = transformToNaturalSyntax(varType, init);
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'VariableDeclaration',
      kind: 'var',
      varType,
      name,
      init
    };
  }

  parseExpressionStatement() {
    const expression = this.parseExpression();
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let left = this.parseLogicalOr();

    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      const right = this.parseAssignment();
      return {
        type: 'AssignmentExpression',
        left,
        right
      };
    }

    return left;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();

    while (this.peek().type === TOKEN_TYPES.OR) {
      const operator = 'or';
      this.advance();
      const right = this.parseLogicalAnd();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();

    while (this.peek().type === TOKEN_TYPES.AND) {
      const operator = 'and';
      this.advance();
      const right = this.parseEquality();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parseEquality() {
    let left = this.parseComparison();

    while ([TOKEN_TYPES.EQUAL, TOKEN_TYPES.NOT_EQUAL].includes(this.peek().type)) {
      const operator = this.advance().value;
      const right = this.parseComparison();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parseComparison() {
    let left = this.parseAdditive();

    while ([TOKEN_TYPES.LESS_THAN, TOKEN_TYPES.GREATER_THAN, 
            TOKEN_TYPES.LESS_EQUAL, TOKEN_TYPES.GREATER_EQUAL].includes(this.peek().type)) {
      const operator = this.advance().value;
      const right = this.parseAdditive();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();

    while ([TOKEN_TYPES.PLUS, TOKEN_TYPES.MINUS].includes(this.peek().type)) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();

    while ([TOKEN_TYPES.MULTIPLY, TOKEN_TYPES.DIVIDE, TOKEN_TYPES.MODULO].includes(this.peek().type)) {
      const operator = this.advance().value;
      const right = this.parseUnary();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  parseUnary() {
    if (this.peek().type === TOKEN_TYPES.NOT) {
      const operator = 'not';
      this.advance();
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator,
        argument
      };
    }
    
    if (this.peek().type === TOKEN_TYPES.MINUS) {
      const operator = '-';
      this.advance();
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator,
        argument
      };
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek().type === TOKEN_TYPES.LPAREN) {
        // Function call
        this.advance();
        const args = [];
        
        while (this.peek().type !== TOKEN_TYPES.RPAREN) {
          args.push(this.parseExpression());
          if (this.peek().type === TOKEN_TYPES.COMMA) {
            this.advance();
          }
        }
        
        this.expect(TOKEN_TYPES.RPAREN);
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args
        };
      } else if (this.peek().type === TOKEN_TYPES.LBRACKET) {
        // Array subscript access
        this.advance();
        const index = this.parseExpression();
        this.expect(TOKEN_TYPES.RBRACKET);
        expr = {
          type: 'SubscriptExpression',
          array: expr,
          index
        };
      } else if (this.peek().type === TOKEN_TYPES.DOT) {
        // Member access or type conversion
        this.advance();
        
        // Check for .as<type>() type conversion syntax
        if (this.peek().type === TOKEN_TYPES.AS) {
          this.advance(); // consume 'as'
          this.expect(TOKEN_TYPES.LESS_THAN); // expect '<'
          const targetType = this.parseType();
          this.expect(TOKEN_TYPES.GREATER_THAN); // expect '>'
          this.expect(TOKEN_TYPES.LPAREN); // expect '('
          this.expect(TOKEN_TYPES.RPAREN); // expect ')'
          
          expr = {
            type: 'TypeConversion',
            expression: expr,
            targetType
          };
        } else {
          // Regular member access
          const token = this.peek();
          let property;
          
          // Allow keywords to be used as method/property names in member access
          if (token.type === TOKEN_TYPES.IDENTIFIER) {
            property = token.value;
            this.advance();
          } else if (token.type === TOKEN_TYPES.ON || token.type === TOKEN_TYPES.OFF) {
            // Allow 'on' and 'off' as method names for LED-like classes
            property = token.value || token.type.toLowerCase();
            this.advance();
          } else {
            this.error(`Expected property name but got ${token.type}`);
          }
          
          expr = {
            type: 'MemberExpression',
            object: expr,
            property
          };
        }
      } else if (this.peek().type === TOKEN_TYPES.EXCLAMATION) {
        // Error handling with !catch
        this.advance(); // consume '!'
        if (this.peek().type === TOKEN_TYPES.CATCH) {
          this.advance(); // consume 'catch'
          const handler = this.parseBlock();
          
          expr = {
            type: 'ErrorHandler',
            expression: expr,
            handler
          };
        } else {
          throw new Error(`Expected 'catch' after '!' at line ${this.peek().line}`);
        }
      } else {
        break;
      }
    }

    return expr;
  }

  parsePrimary() {
    const token = this.peek();

    switch (token.type) {
      case TOKEN_TYPES.NUMBER:
        this.advance();
        const numLiteral = { type: 'Literal', value: token.value, valueType: 'number' };
        if (token.unit) {
          numLiteral.unit = token.unit;
        }
        return numLiteral;
      
      case TOKEN_TYPES.STRING:
        this.advance();
        return { type: 'Literal', value: token.value, valueType: 'string' };
      
      case TOKEN_TYPES.BOOLEAN:
        this.advance();
        return { type: 'Literal', value: token.value, valueType: 'boolean' };
      
      case TOKEN_TYPES.THIS:
      case TOKEN_TYPES.SELF:
        this.advance();
        return { type: 'ThisExpression' };
      
      case TOKEN_TYPES.NEW:
        return this.parseNewExpression();
      
      case TOKEN_TYPES.IDENTIFIER:
        this.advance();
        return { type: 'Identifier', name: token.value, line: token.line };
      
      case TOKEN_TYPES.LPAREN:
        this.advance();
        const expr = this.parseExpression();
        this.expect(TOKEN_TYPES.RPAREN);
        return expr;
      
      case TOKEN_TYPES.LBRACKET:
        return this.parseArrayLiteral();
      
      default:
        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }
  }

  parseNewExpression() {
    this.expect(TOKEN_TYPES.NEW);
    
    // Class name can be an identifier or a type token (for hardware types)
    let className;
    const token = this.peek();
    if (isTypeToken(token.type)) {
      className = tokenTypeToString(token.type);
      this.advance();
    } else {
      const baseClassName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      className = this.parseNamespacedType(baseClassName);
    }
    
    this.expect(TOKEN_TYPES.LPAREN);
    
    const args = [];
    while (this.peek().type !== TOKEN_TYPES.RPAREN) {
      args.push(this.parseExpression());
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    this.expect(TOKEN_TYPES.RPAREN);

    return {
      type: 'NewExpression',
      className,
      arguments: args
    };
  }

  parseArrayLiteral() {
    this.expect(TOKEN_TYPES.LBRACKET);
    
    const elements = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACKET && this.peek().type !== TOKEN_TYPES.EOF) {
      elements.push(this.parseExpression());
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      } else if (this.peek().type !== TOKEN_TYPES.RBRACKET) {
        throw new Error(`Expected ',' or ']' in array literal at line ${this.peek().line}`);
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACKET);
    
    return {
      type: 'ArrayLiteral',
      elements
    };
  }

  // Enum declaration: enum Mode { AUTO, MANUAL }
  parseEnumDeclaration() {
    this.expect(TOKEN_TYPES.ENUM);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.LBRACE);
    
    const values = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const value = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      values.push(value);
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'EnumDeclaration',
      name,
      values
    };
  }

  // Helper to detect if we're using new syntax (type name) vs old syntax (name: type)
  isNewSyntax(firstToken, secondToken) {
    // If first token is a type keyword, it's new syntax
    if (isTypeToken(firstToken.type)) {
      return true;
    }
    // If first token is identifier and second is colon, it's old syntax
    if (firstToken.type === TOKEN_TYPES.IDENTIFIER && secondToken.type === TOKEN_TYPES.COLON) {
      return false;
    }
    // If first token is identifier and second is identifier, it's new syntax (custom type + name)
    if (firstToken.type === TOKEN_TYPES.IDENTIFIER && secondToken.type === TOKEN_TYPES.IDENTIFIER) {
      return true;
    }
    // Default to new syntax
    return true;
  }

  // Struct declaration: struct Point { x: int, y: int }
  parseStructDeclaration() {
    this.expect(TOKEN_TYPES.STRUCT);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.LBRACE);
    
    const fields = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      // New syntax: type name (e.g., int x)
      // Old syntax: name: type (e.g., x: int) - for backward compatibility
      
      const firstToken = this.peek();
      const secondToken = this.peek(1);
      
      if (this.isNewSyntax(firstToken, secondToken)) {
        // New syntax: type name
        const fieldType = this.parseType();
        const fieldName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        fields.push({ name: fieldName, type: fieldType });
      } else {
        // Old syntax: name: type
        const fieldName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        this.expect(TOKEN_TYPES.COLON);
        const fieldType = this.parseType();
        fields.push({ name: fieldName, type: fieldType });
      }
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'StructDeclaration',
      name,
      fields
    };
  }

  // Match expression: match x { 1 => ..., 2 => ..., _ => ... }
  parseMatchStatement() {
    this.expect(TOKEN_TYPES.MATCH);
    const discriminant = this.parseExpression();
    this.expect(TOKEN_TYPES.LBRACE);
    
    const cases = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      // Parse pattern (can be identifier, number, or _)
      let pattern;
      const token = this.peek();
      if (token.type === TOKEN_TYPES.IDENTIFIER && token.value === '_') {
        this.advance();
        pattern = { type: 'Wildcard' };
      } else {
        pattern = this.parseExpression();
      }
      
      this.expect(TOKEN_TYPES.ARROW);
      
      // Parse consequent (can be a block or expression)
      let consequent;
      if (this.peek().type === TOKEN_TYPES.LBRACE) {
        consequent = this.parseBlock();
      } else {
        consequent = [{ type: 'ExpressionStatement', expression: this.parseExpression() }];
      }
      
      cases.push({ pattern, consequent });
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'MatchStatement',
      discriminant,
      cases
    };
  }

  // Switch statement: switch x { case 1 { ... } case 2 { ... } default { ... } }
  parseSwitchStatement() {
    this.expect(TOKEN_TYPES.SWITCH);
    const discriminant = this.parseExpression();
    this.expect(TOKEN_TYPES.LBRACE);
    
    const cases = [];
    let defaultCase = null;
    
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      if (this.peek().type === TOKEN_TYPES.CASE) {
        this.advance();
        const test = this.parseExpression();
        const consequent = this.parseBlock();
        cases.push({ test, consequent });
      } else if (this.peek().type === TOKEN_TYPES.DEFAULT) {
        this.advance();
        defaultCase = this.parseBlock();
      } else {
        throw new Error(`Unexpected token in switch statement: ${this.peek().type} at line ${this.peek().line}`);
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'SwitchStatement',
      discriminant,
      cases,
      defaultCase
    };
  }

  // On block: on start { }, on loop { }, on pin D2.rising { }
  parseOnBlock() {
    this.expect(TOKEN_TYPES.ON);
    const eventToken = this.expect(TOKEN_TYPES.IDENTIFIER);
    const event = eventToken.value;
    
    // Check for event properties like D2.rising
    let eventProperty = null;
    if (this.peek().type === TOKEN_TYPES.DOT) {
      this.advance();
      eventProperty = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    }
    
    const body = this.parseBlock();
    
    return {
      type: 'OnBlock',
      event,
      eventProperty,
      body
    };
  }

  // Interrupt block: interrupt <name?> on PIN# (rising|falling|change|low|high) { ... }
  parseInterruptBlock() {
    this.expect(TOKEN_TYPES.INTERRUPT);
    
    // Optional name for the interrupt
    let name = null;
    if (this.peek().type === TOKEN_TYPES.IDENTIFIER && this.peek(1).type === TOKEN_TYPES.ON) {
      name = this.advance().value;
    }
    
    // Expect 'on' keyword
    this.expect(TOKEN_TYPES.ON);
    
    // Parse pin (can be an identifier like D2 or a number)
    const pinToken = this.peek();
    let pin;
    if (pinToken.type === TOKEN_TYPES.IDENTIFIER) {
      pin = this.advance().value;
    } else if (pinToken.type === TOKEN_TYPES.NUMBER) {
      pin = this.advance().value;
    } else {
      throw new Error(`Expected pin number or identifier at line ${pinToken.line}`);
    }
    
    // Parse interrupt mode (rising, falling, change, low, high)
    const modeToken = this.peek();
    let mode;
    if ([TOKEN_TYPES.RISING, TOKEN_TYPES.FALLING, TOKEN_TYPES.CHANGE].includes(modeToken.type)) {
      mode = this.advance().value;
    } else if (modeToken.type === TOKEN_TYPES.IDENTIFIER && ['low', 'high'].includes(modeToken.value)) {
      // Handle 'low' and 'high' as identifiers now
      mode = this.advance().value;
    } else {
      throw new Error(`Expected interrupt mode (rising, falling, change, low, high) at line ${modeToken.line}`);
    }
    
    // Parse the block
    const body = this.parseBlock();
    
    return {
      type: 'InterruptBlock',
      name,
      pin,
      mode,
      body
    };
  }

  // Signal declaration: signal btnPress
  parseSignalDeclaration() {
    this.expect(TOKEN_TYPES.SIGNAL);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'SignalDeclaration',
      name
    };
  }

  // Emit statement: emit btnPress
  parseEmitStatement() {
    this.expect(TOKEN_TYPES.EMIT);
    const signal = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'EmitStatement',
      signal
    };
  }

  // Task declaration: task blink every 500ms { }, task background { }
  parseTaskDeclaration() {
    this.expect(TOKEN_TYPES.TASK);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    // Check for 'every' or 'background'
    let interval = null;
    let isBackground = false;
    
    if (this.peek().type === TOKEN_TYPES.EVERY) {
      this.advance();
      interval = this.parseExpression(); // Will be a number with time unit
    } else if (this.peek().type === TOKEN_TYPES.BACKGROUND) {
      this.advance();
      isBackground = true;
    }
    
    const body = this.parseBlock();
    
    return {
      type: 'TaskDeclaration',
      name,
      interval,
      isBackground,
      body
    };
  }

  // Wait statement: wait 200ms
  parseWaitStatement() {
    this.expect(TOKEN_TYPES.WAIT);
    const duration = this.parseExpression();
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'WaitStatement',
      duration
    };
  }

  // Timeout statement: timeout 2s { connect() }
  parseTimeoutStatement() {
    this.expect(TOKEN_TYPES.TIMEOUT);
    const duration = this.parseExpression();
    const body = this.parseBlock();
    
    return {
      type: 'TimeoutStatement',
      duration,
      body
    };
  }

  // Atomic block: atomic { pwm.write(200) }
  parseAtomicBlock() {
    this.expect(TOKEN_TYPES.ATOMIC);
    const body = this.parseBlock();
    
    return {
      type: 'AtomicBlock',
      body
    };
  }

  // C++ inline block: @cpp { Serial.println("debug"); }
  parseCppBlock() {
    this.expect(TOKEN_TYPES.AT);
    
    // Expect 'cpp' identifier
    const cppToken = this.expect(TOKEN_TYPES.IDENTIFIER);
    if (cppToken.value !== 'cpp') {
      throw new Error(`Expected 'cpp' after @ but got '${cppToken.value}' at line ${cppToken.line}`);
    }
    
    const body = this.parseBlock();
    
    return {
      type: 'CppBlock',
      body
    };
  }

  // Use statement: use I2C1
  parseUseStatement() {
    this.expect(TOKEN_TYPES.USE);
    const token = this.peek();
    let resource;
    
    // Allow both identifiers and type tokens (for things like use I2C, use SPI)
    if (token.type === TOKEN_TYPES.IDENTIFIER || isTypeToken(token.type)) {
      resource = token.value;
      this.advance();
    } else {
      this.error(`Expected identifier but got ${token.type}`);
    }
    
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'UseStatement',
      resource
    };
  }

  // Load statement: load <servo> or load <foo.ys> as bar
  parseLoadStatement() {
    this.expect(TOKEN_TYPES.LOAD);
    this.expect(TOKEN_TYPES.LESS_THAN);
    
    // Collect all tokens until '>' to build the filename
    // This handles filenames like sensor-lib.ys or my_module.ys
    let fileName = '';
    while (this.peek().type !== TOKEN_TYPES.GREATER_THAN && this.peek().type !== TOKEN_TYPES.EOF) {
      const token = this.peek();
      if (token.type === TOKEN_TYPES.IDENTIFIER || isTypeToken(token.type)) {
        fileName += token.value;
        this.advance();
      } else if (token.type === TOKEN_TYPES.DOT) {
        fileName += '.';
        this.advance();
      } else if (token.type === TOKEN_TYPES.MINUS) {
        fileName += '-';
        this.advance();
      } else if (token.type === TOKEN_TYPES.NUMBER) {
        fileName += token.value;
        this.advance();
      } else {
        throw new Error(`Unexpected token ${token.type} in load statement at line ${token.line}`);
      }
    }
    
    this.expect(TOKEN_TYPES.GREATER_THAN);
    
    // Check if this is a .ys file
    const isYsFile = fileName.endsWith('.ys');
    
    // Extract base name (without extension) for default module name
    let baseName = fileName;
    if (isYsFile) {
      baseName = fileName.substring(0, fileName.length - 3); // remove .ys
    }
    
    // Check for optional 'as' keyword for .ys files
    let moduleName = baseName;
    if (this.peek().type === TOKEN_TYPES.AS) {
      this.advance(); // consume 'as'
      moduleName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    }
    
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'LoadStatement',
      library: fileName,
      isYsFile,
      moduleName: isYsFile ? moduleName : null
    };
  }

  // Alias statement: alias led = D13 or alias led = 13
  parseAliasStatement() {
    this.expect(TOKEN_TYPES.ALIAS);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.ASSIGN);
    
    // Value can be identifier or number
    let value;
    if (this.peek().type === TOKEN_TYPES.IDENTIFIER) {
      value = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    } else if (this.peek().type === TOKEN_TYPES.NUMBER) {
      value = String(this.expect(TOKEN_TYPES.NUMBER).value);
    } else {
      throw new Error(`Expected identifier or number for alias value at line ${this.peek().line}`);
    }
    
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'AliasStatement',
      name,
      value
    };
  }

  // Config block: config { cpu: atmega328p, clock: 16MHz }
  parseConfigBlock() {
    this.expect(TOKEN_TYPES.CONFIG);
    this.expect(TOKEN_TYPES.LBRACE);
    
    const options = {};
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const key = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      this.expect(TOKEN_TYPES.COLON);
      
      // Value can be identifier, number, or keyword (like 'on', 'off')
      let value = '';
      const token = this.peek();
      if (token.type === TOKEN_TYPES.NUMBER) {
        const numToken = this.advance();
        // If number has a unit, combine them
        if (numToken.unit) {
          value = String(numToken.value) + numToken.unit;
        } else {
          value = String(numToken.value);
          // Check if followed by an identifier (like MHz) - for backward compatibility
          if (this.peek().type === TOKEN_TYPES.IDENTIFIER) {
            value += this.advance().value;
          }
        }
      } else if (token.type === TOKEN_TYPES.IDENTIFIER) {
        value = this.advance().value;
      } else if (token.type === TOKEN_TYPES.ON) {
        this.advance();
        value = 'on';
      } else {
        // Try to get token value directly for keywords
        value = token.value || token.type;
        this.advance();
      }
      
      options[key] = value;
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'ConfigBlock',
      options
    };
  }

  // React declaration: react mut rpm: int
  parseReactDeclaration() {
    this.expect(TOKEN_TYPES.REACT);
    
    // Check for mut or const
    let isMutable = false;
    if (this.peek().type === TOKEN_TYPES.MUT || this.peek().type === TOKEN_TYPES.CONST) {
      isMutable = this.peek().type === TOKEN_TYPES.MUT;
      this.advance();
    }
    
    // Support both old syntax (name: type) and new syntax (type name)
    const firstToken = this.peek();
    const secondToken = this.peek(1);
    let name, varType;
    
    if (this.isNewSyntax(firstToken, secondToken)) {
      // New syntax: type name
      varType = this.parseType();
      name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    } else {
      // Old syntax: name: type
      name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      this.expect(TOKEN_TYPES.COLON);
      varType = this.parseType();
    }
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'ReactDeclaration',
      isMut: isMutable,
      name,
      varType,
      init
    };
  }
}

module.exports = { Parser };
