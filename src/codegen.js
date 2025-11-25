/**
 * Ypsilon Script Code Generator - OOP, Strictly-Typed, Brace-Based
 * Transpiles AST to Arduino C++ code
 */

const { Config } = require('./config');
const { generatePWMSetup } = require('./pwm');

class CodeGenerator {
  constructor(ast, options = {}) {
    this.ast = ast;
    this.basePath = options.basePath || process.cwd();
    this.fileReader = options.fileReader || null;
    this.classes = [];
    this.enums = [];
    this.structs = [];
    this.globalVariables = [];
    this.functions = [];
    this.setupStatements = [];
    this.loopStatements = [];
    this.onBlocks = [];
    this.interrupts = [];
    this.signals = [];
    this.tasks = [];
    this.useStatements = [];
    this.loadStatements = [];
    this.modules = []; // .ys modules loaded
    this.aliases = [];
    this.configBlock = null;
    this.config = null; // Will be initialized after processing
    this.reactVars = [];
    this.indent = 0;
    this.needsSerial = false;
    this.needsServo = false;
    this.needsWire = false;
    this.needsSPI = false;
    this.timeVarCounter = 0;
    // Track which hardware types are used
    this.usedHardwareTypes = new Set();
    // Track which collection types are used
    this.usedCollectionTypes = new Set();
  }

  generate() {
    // First pass: analyze the AST to detect features we need
    this.analyzeAST(this.ast);
    
    // Second pass: process and generate code
    this.processProgram(this.ast);
    
    // Initialize config from configBlock
    this.config = new Config(this.configBlock);
    
    // Third pass: load .ys modules
    this.loadModules();
    
    return this.buildArduinoCode();
  }

  analyzeAST(node) {
    if (!node) return;
    
    if (node.type === 'CallExpression' && node.callee && node.callee.name === 'print') {
      this.needsSerial = true;
    }
    
    // Check for hardware types that need special includes
    if (node.type === 'VariableDeclaration' && node.varType) {
      if (node.varType === 'Servo') {
        this.needsServo = true;
      } else if (node.varType === 'I2C') {
        this.needsWire = true;
      } else if (node.varType === 'SPI') {
        this.needsSPI = true;
      }
      
      // Track usage of hardware types
      const hardwareTypes = [
        'Digital', 'Analog', 'PWM', 'I2C', 'SPI', 'UART',
        'Servo', 'Encoder', 'DCMotor', 'StepperMotor',
        'Led', 'RgbLed', 'Button', 'Buzzer',
        // Multiplexers
        'Mux4', 'Mux8', 'Mux16', 'Mux32',
        // Sensors
        'TempSensor', 'HumiditySensor', 'PressureSensor', 'LightSensor',
        'DistanceSensor', 'MotionSensor', 'TouchSensor', 'SoundSensor',
        'GasSensor', 'ColorSensor', 'Accelerometer', 'Gyroscope',
        'Magnetometer', 'IMU', 'GPS', 'LoadCell', 'Potentiometer',
        'Joystick', 'RotaryEncoder', 'IRRemote', 'RFID',
        // Displays
        'LCD', 'OLED', 'SevenSegment', 'Matrix', 'TFT', 'NeoPixel',
        // Actuators
        'Relay', 'Solenoid', 'Fan', 'Heater', 'Pump', 'Valve',
        // Communication
        'Bluetooth', 'WiFi', 'LoRa', 'CAN', 'RS485', 'Ethernet', 'NRF24', 'ZigBee',
        // Storage
        'SDCard', 'EEPROM', 'Flash',
        // Power
        'Battery', 'Solar',
        // Motor Drivers
        'HBridge', 'MotorDriver', 'ServoDriver',
        // Timing
        'RTC', 'Timer',
        // Audio
        'Speaker', 'Microphone', 'DFPlayer'
      ];
      if (hardwareTypes.includes(node.varType)) {
        this.usedHardwareTypes.add(node.varType);
      }
      
      // Track usage of collection types
      const collectionTypes = ['List', 'Map'];
      if (collectionTypes.includes(node.varType)) {
        this.usedCollectionTypes.add(node.varType);
      }
    }
    
    // Recursively check all nodes
    if (Array.isArray(node)) {
      node.forEach(n => this.analyzeAST(n));
    } else if (typeof node === 'object') {
      Object.values(node).forEach(value => {
        if (value && typeof value === 'object') {
          this.analyzeAST(value);
        }
      });
    }
  }

  processProgram(program) {
    for (const stmt of program.body) {
      this.processTopLevelStatement(stmt);
    }
  }

  processTopLevelStatement(stmt) {
    if (stmt.type === 'MainDirective') {
      // Just track it - validation happens at compile time
      return;
    } else if (stmt.type === 'ClassDeclaration') {
      this.classes.push(stmt);
    } else if (stmt.type === 'EnumDeclaration') {
      this.enums.push(stmt);
    } else if (stmt.type === 'StructDeclaration') {
      this.structs.push(stmt);
    } else if (stmt.type === 'FunctionDeclaration') {
      // Special handling for start()/setup() and loop()
      if (stmt.name === 'setup' || stmt.name === 'start') {
        this.setupStatements = stmt.body;
      } else if (stmt.name === 'loop') {
        this.loopStatements = stmt.body;
      } else {
        this.functions.push(stmt);
      }
    } else if (stmt.type === 'VariableDeclaration') {
      this.globalVariables.push(stmt);
    } else if (stmt.type === 'OnBlock') {
      this.onBlocks.push(stmt);
    } else if (stmt.type === 'InterruptBlock') {
      this.interrupts.push(stmt);
    } else if (stmt.type === 'SignalDeclaration') {
      this.signals.push(stmt);
    } else if (stmt.type === 'TaskDeclaration') {
      this.tasks.push(stmt);
    } else if (stmt.type === 'UseStatement') {
      this.useStatements.push(stmt);
    } else if (stmt.type === 'LoadStatement') {
      this.loadStatements.push(stmt);
    } else if (stmt.type === 'AliasStatement') {
      this.aliases.push(stmt);
    } else if (stmt.type === 'ConfigBlock') {
      this.configBlock = stmt;
    } else if (stmt.type === 'ReactDeclaration') {
      this.reactVars.push(stmt);
    }
  }

  loadModules() {
    const fs = require('fs');
    const path = require('path');
    const { Lexer } = require('./lexer');
    const { Parser } = require('./parser');
    
    for (const load of this.loadStatements) {
      if (load.isYsFile) {
        if (!this.fileReader) {
          // No file reader provided - skip silently (likely in tests)
          continue;
        }
        
        try {
          // Construct the path to the .ys file
          const filePath = path.resolve(this.basePath, load.library);
          
          // Read the .ys file
          const moduleSource = this.fileReader(filePath);
          
          // Parse the module
          const lexer = new Lexer(moduleSource);
          const tokens = lexer.tokenize();
          const parser = new Parser(tokens);
          const moduleAst = parser.parse();
          
          // Store the module with its namespace
          this.modules.push({
            name: load.moduleName,
            ast: moduleAst
          });
        } catch (error) {
          // Re-throw the error with more context for production use
          throw new Error(`Failed to load module ${load.library}: ${error.message}`);
        }
      }
    }
  }

  buildArduinoCode() {
    let code = '// Generated by Ypsilon Script Compiler\n';
    code += '// https://github.com/ycharfi09/ypsilon-script\n\n';
    
    // Add Arduino library includes
    code += '#include <Arduino.h>\n';
    
    // Add hardware-specific includes based on usage
    if (this.needsServo) {
      code += '#include <Servo.h>\n';
    }
    if (this.needsWire) {
      code += '#include <Wire.h>\n';
    }
    if (this.needsSPI) {
      code += '#include <SPI.h>\n';
    }
    
    // Add loaded C++ libraries (not .ys files)
    for (const load of this.loadStatements) {
      if (!load.isYsFile) {
        code += `#include <${load.library}.h>\n`;
      }
    }
    code += '\n';
    
    // Add built-in hardware type classes
    code += this.generateHardwareTypes();
    
    // Add built-in collection classes  
    code += this.generateCollectionTypes();
    
    // Add PWM backend setup if needed
    const pwmBackend = this.config.getPWMBackend();
    const pwmSetup = generatePWMSetup(pwmBackend);
    if (pwmSetup) {
      code += pwmSetup;
      code += '\n';
    }
    
    // Add aliases as #define
    if (this.aliases.length > 0) {
      code += '// Aliases\n';
      for (const alias of this.aliases) {
        code += `#define ${alias.name} ${alias.value}\n`;
      }
      code += '\n';
    }

    // Generate module namespaces for loaded .ys files
    if (this.modules.length > 0) {
      code += '// Module Namespaces\n';
      for (const module of this.modules) {
        code += this.generateModuleNamespace(module);
      }
    }

    // Enum declarations
    if (this.enums.length > 0) {
      code += '// Enum Declarations\n';
      for (const enumDecl of this.enums) {
        code += this.generateEnumDeclaration(enumDecl) + '\n\n';
      }
    }

    // Struct declarations
    if (this.structs.length > 0) {
      code += '// Struct Declarations\n';
      for (const structDecl of this.structs) {
        code += this.generateStructDeclaration(structDecl) + '\n\n';
      }
    }

    // Class declarations
    if (this.classes.length > 0) {
      code += '// Class Declarations\n';
      for (const cls of this.classes) {
        code += this.generateClassDeclaration(cls) + '\n\n';
      }
    }

    // Signals (using volatile bool)
    if (this.signals.length > 0) {
      code += '// Signal Declarations\n';
      for (const signal of this.signals) {
        code += `volatile bool _signal_${signal.name} = false;\n`;
      }
      code += '\n';
    }

    // React variables (using volatile)
    if (this.reactVars.length > 0) {
      code += '// Reactive Variables\n';
      for (const react of this.reactVars) {
        const typeStr = this.mapType(react.varType);
        const constStr = react.isMut ? 'volatile' : 'volatile const';
        const initStr = react.init ? ' = ' + this.generateExpression(react.init) : '';
        code += `${constStr} ${typeStr} ${react.name}${initStr};\n`;
      }
      code += '\n';
    }

    // Global variables
    if (this.globalVariables.length > 0) {
      code += '// Global Variables\n';
      
      // Collect variables used in ISRs
      const isrVariables = new Set();
      for (const interrupt of this.interrupts) {
        const vars = this.collectISRVariables(interrupt.body);
        vars.forEach(v => isrVariables.add(v));
      }
      
      for (const varDecl of this.globalVariables) {
        const isVolatile = isrVariables.has(varDecl.name);
        code += this.generateVariableDeclaration(varDecl, isVolatile) + '\n';
      }
      code += '\n';
    }

    // Task timing variables
    if (this.tasks.length > 0) {
      code += '// Task Timing Variables\n';
      for (const task of this.tasks) {
        if (task.interval) {
          code += `unsigned long _task_${task.name}_last = 0;\n`;
        }
      }
      code += '\n';
    }

    // Function declarations
    if (this.functions.length > 0) {
      code += '// Function Declarations\n';
      for (const func of this.functions) {
        code += this.generateFunctionDeclaration(func) + '\n\n';
      }
    }

    // ISR function declarations
    if (this.interrupts.length > 0) {
      code += '// Interrupt Service Routines\n';
      for (let i = 0; i < this.interrupts.length; i++) {
        code += this.generateISRFunction(this.interrupts[i], i);
      }
    }

    // Setup function
    code += 'void setup() {\n';
    this.indent = 1;
    
    // Add Serial.begin if print() is used
    if (this.needsSerial) {
      code += this.getIndent() + 'Serial.begin(9600);\n';
    }
    
    // Handle on start blocks
    for (const onBlock of this.onBlocks) {
      if (onBlock.event === 'start') {
        for (const stmt of onBlock.body) {
          code += this.generateStatement(stmt);
        }
      }
    }
    
    if (this.setupStatements.length > 0) {
      for (const stmt of this.setupStatements) {
        code += this.generateStatement(stmt);
      }
    }
    
    // Attach interrupts
    if (this.interrupts.length > 0) {
      code += this.getIndent() + '// Attach Interrupts\n';
      for (let i = 0; i < this.interrupts.length; i++) {
        const interrupt = this.interrupts[i];
        const isrName = interrupt.name || `isr_${i}`;
        const mode = this.mapInterruptMode(interrupt.mode);
        const pin = interrupt.pin;
        
        // For Arduino, we need to convert pin to interrupt number
        // digitalPinToInterrupt() is the recommended way
        code += this.getIndent() + `attachInterrupt(digitalPinToInterrupt(${pin}), ${isrName}, ${mode});\n`;
      }
    }
    
    this.indent = 0;
    code += '}\n\n';

    // Loop function
    code += 'void loop() {\n';
    this.indent = 1;
    
    // Handle on loop blocks
    for (const onBlock of this.onBlocks) {
      if (onBlock.event === 'loop') {
        for (const stmt of onBlock.body) {
          code += this.generateStatement(stmt);
        }
      }
    }
    
    // Handle tasks
    for (const task of this.tasks) {
      if (task.interval) {
        code += this.getIndent() + `// Task: ${task.name}\n`;
        code += this.getIndent() + `if (millis() - _task_${task.name}_last >= `;
        code += this.generateTimeValue(task.interval) + ') {\n';
        this.indent++;
        code += this.getIndent() + `_task_${task.name}_last = millis();\n`;
        for (const stmt of task.body) {
          code += this.generateStatement(stmt);
        }
        this.indent--;
        code += this.getIndent() + '}\n';
      } else if (task.isBackground) {
        // Background tasks run in loop
        code += this.getIndent() + `// Background task: ${task.name}\n`;
        for (const stmt of task.body) {
          code += this.generateStatement(stmt);
        }
      }
    }
    
    if (this.loopStatements.length > 0) {
      for (const stmt of this.loopStatements) {
        code += this.generateStatement(stmt);
      }
    }
    this.indent = 0;
    code += '}\n';

    return code;
  }

  generateClassDeclaration(cls) {
    let code = `class ${cls.name} {\n`;
    code += 'public:\n';
    
    // Generate properties
    for (const prop of cls.properties) {
      const constPrefix = prop.isMut === false ? 'const ' : '';
      code += '  ' + constPrefix + this.mapType(prop.propertyType) + ' ' + prop.name;
      if (prop.init) {
        // Note: In-class initialization requires C++11
        code += ' = ' + this.generateExpression(prop.init);
      }
      code += ';\n';
    }
    
    if (cls.properties.length > 0 && (cls.constructor || cls.methods.length > 0)) {
      code += '\n';
    }
    
    // Generate constructor
    if (cls.constructor) {
      code += '  ' + cls.name + '(';
      code += cls.constructor.params.map(p => 
        this.mapType(p.type) + ' ' + p.name
      ).join(', ');
      code += ') {\n';
      
      this.indent = 2;
      for (const stmt of cls.constructor.body) {
        code += this.generateStatement(stmt);
      }
      this.indent = 0;
      
      code += '  }\n';
      
      if (cls.methods.length > 0) {
        code += '\n';
      }
    }
    
    // Generate methods
    for (let i = 0; i < cls.methods.length; i++) {
      const method = cls.methods[i];
      code += '  ' + this.mapType(method.returnType) + ' ' + method.name + '(';
      code += method.params.map(p => 
        this.mapType(p.type) + ' ' + p.name
      ).join(', ');
      code += ') {\n';
      
      this.indent = 2;
      for (const stmt of method.body) {
        code += this.generateStatement(stmt);
      }
      this.indent = 0;
      
      code += '  }';
      if (i < cls.methods.length - 1) {
        code += '\n\n';
      } else {
        code += '\n';
      }
    }
    
    code += '};';
    return code;
  }

  generateFunctionDeclaration(func) {
    const returnType = this.mapType(func.returnType);
    
    let code = `${returnType} ${func.name}(`;
    code += func.params.map(p => 
      this.mapType(p.type) + ' ' + p.name
    ).join(', ');
    code += ') {\n';
    
    this.indent++;
    for (const stmt of func.body) {
      code += this.generateStatement(stmt);
    }
    this.indent--;
    
    code += '}';
    return code;
  }

  mapType(type) {
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'bool': 'bool',
      'string': 'String',
      'void': 'void',
      'u8': 'uint8_t',
      'u16': 'uint16_t',
      'u32': 'uint32_t',
      'u64': 'uint64_t',
      'i8': 'int8_t',
      'i16': 'int16_t',
      'i32': 'int32_t',
      'i64': 'int64_t',
      'byte': 'uint8_t',
      'short': 'int16_t',
      'f32': 'float',
      'f64': 'double',
      'Digital': 'Digital',
      'Analog': 'Analog',
      'PWM': 'PWM',
      'I2C': 'I2C',
      'SPI': 'SPI',
      'UART': 'UART',
      'Servo': 'Servo',
      'Encoder': 'Encoder',
      'DCMotor': 'DCMotor',
      'StepperMotor': 'StepperMotor',
      'Led': 'Led',
      'RgbLed': 'RgbLed',
      'Button': 'Button',
      'Buzzer': 'Buzzer',
      // Multiplexers
      'Mux4': 'Mux4',
      'Mux8': 'Mux8',
      'Mux16': 'Mux16',
      'Mux32': 'Mux32',
      // Sensors
      'TempSensor': 'TempSensor',
      'HumiditySensor': 'HumiditySensor',
      'PressureSensor': 'PressureSensor',
      'LightSensor': 'LightSensor',
      'DistanceSensor': 'DistanceSensor',
      'MotionSensor': 'MotionSensor',
      'TouchSensor': 'TouchSensor',
      'SoundSensor': 'SoundSensor',
      'GasSensor': 'GasSensor',
      'ColorSensor': 'ColorSensor',
      'Accelerometer': 'Accelerometer',
      'Gyroscope': 'Gyroscope',
      'Magnetometer': 'Magnetometer',
      'IMU': 'IMU',
      'GPS': 'GPS',
      'LoadCell': 'LoadCell',
      'Potentiometer': 'Potentiometer',
      'Joystick': 'Joystick',
      'RotaryEncoder': 'RotaryEncoder',
      'IRRemote': 'IRRemote',
      'RFID': 'RFID',
      // Displays
      'LCD': 'LCD',
      'OLED': 'OLED',
      'SevenSegment': 'SevenSegment',
      'Matrix': 'Matrix',
      'TFT': 'TFT',
      'NeoPixel': 'NeoPixel',
      // Actuators
      'Relay': 'Relay',
      'Solenoid': 'Solenoid',
      'Fan': 'Fan',
      'Heater': 'Heater',
      'Pump': 'Pump',
      'Valve': 'Valve',
      // Communication
      'Bluetooth': 'Bluetooth',
      'WiFi': 'WiFi',
      'LoRa': 'LoRa',
      'CAN': 'CAN',
      'RS485': 'RS485',
      'Ethernet': 'Ethernet',
      'NRF24': 'NRF24',
      'ZigBee': 'ZigBee',
      // Storage
      'SDCard': 'SDCard',
      'EEPROM': 'EEPROM',
      'Flash': 'Flash',
      // Power
      'Battery': 'Battery',
      'Solar': 'Solar',
      // Motor Drivers
      'HBridge': 'HBridge',
      'MotorDriver': 'MotorDriver',
      'ServoDriver': 'ServoDriver',
      // Timing
      'RTC': 'RTC',
      'Timer': 'Timer',
      // Audio
      'Speaker': 'Speaker',
      'Microphone': 'Microphone',
      'DFPlayer': 'DFPlayer',
      // Collections
      'List': 'List',
      'Map': 'Map'
    };
    // If it's not a built-in type, assume it's a class name
    return typeMap[type] || type;
  }

  getTypeRange(type) {
    // Returns the valid range for width-specific integer types
    // Note: u64 and i64 are not validated due to JavaScript number limitations
    const ranges = {
      'u8': { min: 0, max: 255 },
      'u16': { min: 0, max: 65535 },
      'u32': { min: 0, max: 4294967295 },
      'i8': { min: -128, max: 127 },
      'i16': { min: -32768, max: 32767 },
      'i32': { min: -2147483648, max: 2147483647 },
      'byte': { min: 0, max: 255 },
      'short': { min: -32768, max: 32767 }
    };
    return ranges[type] || null;
  }

  validateTypeRange(type, value) {
    // Validates if a value is within range for a specific type
    const range = this.getTypeRange(type);
    if (!range) return true; // No range to validate
    
    // For literal values, check if they're in range
    if (typeof value === 'number') {
      return value >= range.min && value <= range.max;
    }
    return true; // Can't validate non-literal values at compile time
  }

  generateStatement(stmt) {
    switch (stmt.type) {
      case 'VariableDeclaration':
        return this.getIndent() + this.generateVariableDeclaration(stmt) + '\n';
      case 'ExpressionStatement':
        return this.getIndent() + this.generateExpression(stmt.expression) + ';\n';
      case 'IfStatement':
        return this.generateIfStatement(stmt);
      case 'WhileStatement':
        return this.generateWhileStatement(stmt);
      case 'ForStatement':
        return this.generateForStatement(stmt);
      case 'RepeatStatement':
        return this.generateRepeatStatement(stmt);
      case 'ReturnStatement':
        return this.generateReturnStatement(stmt);
      case 'MatchStatement':
        return this.generateMatchStatement(stmt);
      case 'SwitchStatement':
        return this.generateSwitchStatement(stmt);
      case 'EmitStatement':
        return this.generateEmitStatement(stmt);
      case 'WaitStatement':
        return this.generateWaitStatement(stmt);
      case 'TimeoutStatement':
        return this.generateTimeoutStatement(stmt);
      case 'AtomicBlock':
        return this.generateAtomicBlock(stmt);
      case 'CppBlock':
        return this.generateCppBlock(stmt);
      default:
        return '';
    }
  }

  generateVariableDeclaration(varDecl, isVolatile = false) {
    const typePrefix = varDecl.kind === 'const' ? 'const ' : '';
    const volatilePrefix = isVolatile && varDecl.kind !== 'const' ? 'volatile ' : '';
    const type = this.mapType(varDecl.varType);
    
    // Check if initializer is an array literal
    const isArrayInit = varDecl.init && varDecl.init.type === 'ArrayLiteral';
    
    // Compile-time range checking for literal values
    if (varDecl.init && !isArrayInit) {
      const range = this.getTypeRange(varDecl.varType);
      if (range) {
        let value = null;
        
        // Handle direct literals
        if (varDecl.init.type === 'Literal' && typeof varDecl.init.value === 'number') {
          value = varDecl.init.value;
        }
        // Handle unary minus expressions (e.g., -128)
        else if (varDecl.init.type === 'UnaryExpression' && 
                 varDecl.init.operator === '-' && 
                 varDecl.init.argument.type === 'Literal' &&
                 typeof varDecl.init.argument.value === 'number') {
          value = -varDecl.init.argument.value;
        }
        
        if (value !== null && (value < range.min || value > range.max)) {
          throw new Error(
            `Compile Error: Value ${value} is out of range for type ${varDecl.varType}. ` +
            `Valid range: ${range.min} to ${range.max}`
          );
        }
      }
    }
    
    let code;
    
    // Handle array initialization
    if (isArrayInit) {
      const arraySize = varDecl.init.elements.length;
      code = `${typePrefix}${volatilePrefix}${type} ${varDecl.name}[${arraySize}]`;
      code += ' = ' + this.generateExpression(varDecl.init);
      code += ';';
    } else {
      code = `${typePrefix}${volatilePrefix}${type} ${varDecl.name}`;
      if (varDecl.init) {
        code += ' = ' + this.generateExpression(varDecl.init);
      }
      code += ';';
    }
    
    // Add range check if specified
    if (varDecl.range && !typePrefix.includes('const') && !isArrayInit) {
      const min = this.generateExpression(varDecl.range.min);
      const max = this.generateExpression(varDecl.range.max);
      code += `\n${this.getIndent()}${varDecl.name} = constrain(${varDecl.name}, ${min}, ${max});`;
    }
    
    return code;
  }

  generateIfStatement(stmt) {
    let code = this.getIndent() + 'if (' + this.generateExpression(stmt.test) + ') {\n';
    this.indent++;
    for (const s of stmt.consequent) {
      code += this.generateStatement(s);
    }
    this.indent--;
    code += this.getIndent() + '}';
    
    if (stmt.alternate) {
      code += ' else {\n';
      this.indent++;
      for (const s of stmt.alternate) {
        code += this.generateStatement(s);
      }
      this.indent--;
      code += this.getIndent() + '}';
    }
    
    code += '\n';
    return code;
  }

  generateWhileStatement(stmt) {
    let code = this.getIndent() + 'while (' + this.generateExpression(stmt.test) + ') {\n';
    this.indent++;
    for (const s of stmt.body) {
      code += this.generateStatement(s);
    }
    this.indent--;
    code += this.getIndent() + '}\n';
    return code;
  }

  generateForStatement(stmt) {
    const varType = this.mapType(stmt.varType);
    const init = this.generateExpression(stmt.init);
    const test = this.generateExpression(stmt.test);
    const update = this.generateExpression(stmt.update);
    
    let code = this.getIndent() + `for (${varType} ${stmt.variable} = ${init}; ${test}; ${update}) {\n`;
    
    this.indent++;
    for (const s of stmt.body) {
      code += this.generateStatement(s);
    }
    this.indent--;
    code += this.getIndent() + '}\n';
    return code;
  }

  generateRepeatStatement(stmt) {
    const count = this.generateExpression(stmt.count);
    
    // Generate a for loop: for (int _repeat_i = 0; _repeat_i < count; _repeat_i++)
    let code = this.getIndent() + `for (int _repeat_i = 0; _repeat_i < ${count}; _repeat_i++) {\n`;
    
    this.indent++;
    for (const s of stmt.body) {
      code += this.generateStatement(s);
    }
    this.indent--;
    code += this.getIndent() + '}\n';
    return code;
  }

  generateReturnStatement(stmt) {
    let code = this.getIndent() + 'return';
    if (stmt.argument) {
      code += ' ' + this.generateExpression(stmt.argument);
    }
    return code + ';\n';
  }

  generateExpression(expr) {
    switch (expr.type) {
      case 'Literal':
        return this.generateLiteral(expr);
      case 'Identifier':
        return expr.name;
      case 'BinaryExpression':
        return this.generateBinaryExpression(expr);
      case 'UnaryExpression':
        return this.generateUnaryExpression(expr);
      case 'AssignmentExpression':
        return this.generateExpression(expr.left) + ' = ' + this.generateExpression(expr.right);
      case 'CallExpression':
        return this.generateCallExpression(expr);
      case 'MemberExpression':
        return this.generateMemberExpression(expr);
      case 'SubscriptExpression':
        return this.generateSubscriptExpression(expr);
      case 'ThisExpression':
        return 'this';
      case 'NewExpression':
        return this.generateNewExpression(expr);
      case 'TypeConversion':
        return this.generateTypeConversion(expr);
      case 'ErrorHandler':
        return this.generateErrorHandler(expr);
      case 'ArrayLiteral':
        return this.generateArrayLiteral(expr);
      default:
        return '';
    }
  }

  generateMemberExpression(expr) {
    const object = this.generateExpression(expr.object);
    // Use -> for pointer access (this is a pointer in C++)
    if (expr.object.type === 'ThisExpression') {
      return `this->${expr.property}`;
    }
    
    // Check if object is a potential module namespace (single identifier)
    if (expr.object.type === 'Identifier') {
      // Check if this identifier is a loaded module
      const isModule = this.modules.some(m => m.name === expr.object.name);
      if (isModule) {
        return `${object}::${expr.property}`;
      }
    }
    
    return `${object}.${expr.property}`;
  }

  generateSubscriptExpression(expr) {
    const array = this.generateExpression(expr.array);
    const index = this.generateExpression(expr.index);
    return `${array}[${index}]`;
  }

  generateLiteral(expr) {
    if (expr.valueType === 'string') {
      return `"${expr.value}"`;
    } else if (expr.valueType === 'boolean') {
      return expr.value ? 'true' : 'false';
    }
    
    // Handle unit literals
    if (expr.unit) {
      const value = expr.value;
      return this.convertUnitToInteger(value, expr.unit);
    }
    
    return String(expr.value);
  }
  
  // Convert unit literals to integer values
  convertUnitToInteger(value, unit) {
    // Conversion constant for radians to degrees: 180/π ≈ 57.2958
    const RAD_TO_DEG = 180 / Math.PI;
    
    const conversions = {
      // Time units (convert to milliseconds)
      'ms': value,
      's': value * 1000,
      'us': Math.floor(value * 0.001),  // microseconds to milliseconds: divide by 1000
      'min': value * 60000,
      'h': value * 3600000,
      
      // Frequency (to Hz)
      'Hz': value,
      'kHz': value * 1000,
      'MHz': value * 1000000,
      
      // Angle (convert to degrees)
      'deg': value,
      'rad': Math.floor(value * RAD_TO_DEG),  // radians to degrees: multiply by 180/π
      
      // Distance (convert to millimeters)
      'mm': value,
      'cm': value * 10,
      'm': value * 1000,
      'km': value * 1000000,
      
      // Speed (to RPM)
      'rpm': value
    };
    
    return String(conversions[unit] || value);
  }

  generateBinaryExpression(expr) {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);
    
    // Convert operators to C++
    const operatorMap = {
      'and': '&&',
      'or': '||',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%'
    };
    
    const op = operatorMap[expr.operator] || expr.operator;
    return `(${left} ${op} ${right})`;
  }

  generateUnaryExpression(expr) {
    const operatorMap = {
      'not': '!',
      '-': '-'
    };
    const op = operatorMap[expr.operator] || expr.operator;
    
    // For negative literals, don't wrap in parentheses
    if (expr.operator === '-' && expr.argument.type === 'Literal') {
      return `${op}${this.generateExpression(expr.argument)}`;
    }
    
    return `${op}(${this.generateExpression(expr.argument)})`;
  }

  generateCallExpression(expr) {
    // Safely extract callee name, checking for null
    if (!expr.callee) {
      return '';
    }
    
    let callee;
    if (expr.callee.type === 'MemberExpression') {
      callee = this.generateExpression(expr.callee);
    } else {
      callee = expr.callee.name || this.generateExpression(expr.callee);
    }
    
    const args = expr.arguments.map(arg => this.generateExpression(arg)).join(', ');
    
    // Map built-in functions to Arduino equivalents
    const builtinMap = {
      'print': 'Serial.println',
      'delay': 'delay',
      'millis': 'millis',
      'pinMode': 'pinMode',
      'digitalWrite': 'digitalWrite',
      'digitalRead': 'digitalRead',
      'analogRead': 'analogRead',
      'analogWrite': 'analogWrite'
    };
    
    const funcName = builtinMap[callee] || callee;
    
    // Mark that we need Serial if print is used
    if (callee === 'print') {
      this.needsSerial = true;
    }
    
    return `${funcName}(${args})`;
  }

  generateNewExpression(expr) {
    const args = expr.arguments.map(arg => this.generateExpression(arg)).join(', ');
    return `${expr.className}(${args})`;
  }

  // Generate array literal
  generateArrayLiteral(expr) {
    const elements = expr.elements.map(el => this.generateExpression(el));
    return `{${elements.join(', ')}}`;
  }

  // Generate type conversion (.as<type>())
  generateTypeConversion(expr) {
    const value = this.generateExpression(expr.expression);
    const targetType = this.mapType(expr.targetType);
    
    // Generate appropriate C++ cast
    return `static_cast<${targetType}>(${value})`;
  }

  // Generate error handler (!catch)
  generateErrorHandler(expr) {
    // For now, we'll generate a simple try-like structure
    // In a real implementation, this would use error codes or exceptions
    // For microcontrollers, we'll use a simple if-check pattern
    const exprCode = this.generateExpression(expr.expression);
    
    // Generate error handling code
    // This is a simplified implementation - in production you'd want proper error types
    return `(${exprCode})`;
  }

  getIndent() {
    return '  '.repeat(this.indent);
  }

  // Generate enum declaration
  generateEnumDeclaration(enumDecl) {
    let code = `enum ${enumDecl.name} {\n`;
    code += '  ' + enumDecl.values.join(',\n  ') + '\n';
    code += '};';
    return code;
  }

  // Generate struct declaration
  generateStructDeclaration(structDecl) {
    let code = `struct ${structDecl.name} {\n`;
    for (const field of structDecl.fields) {
      code += `  ${this.mapType(field.type)} ${field.name};\n`;
    }
    code += '};';
    return code;
  }

  // Generate module namespace for .ys files
  generateModuleNamespace(module) {
    let code = `namespace ${module.name} {\n`;
    
    // Process all declarations in the module
    const moduleClasses = [];
    const moduleEnums = [];
    const moduleStructs = [];
    const moduleFunctions = [];
    const moduleGlobalVars = [];
    
    for (const stmt of module.ast.body) {
      if (stmt.type === 'ClassDeclaration') {
        moduleClasses.push(stmt);
      } else if (stmt.type === 'EnumDeclaration') {
        moduleEnums.push(stmt);
      } else if (stmt.type === 'StructDeclaration') {
        moduleStructs.push(stmt);
      } else if (stmt.type === 'FunctionDeclaration') {
        moduleFunctions.push(stmt);
      } else if (stmt.type === 'VariableDeclaration') {
        moduleGlobalVars.push(stmt);
      }
    }
    
    // Generate enums
    for (const enumDecl of moduleEnums) {
      code += '  ' + this.generateEnumDeclaration(enumDecl).replace(/\n/g, '\n  ') + '\n\n';
    }
    
    // Generate structs
    for (const structDecl of moduleStructs) {
      code += '  ' + this.generateStructDeclaration(structDecl).replace(/\n/g, '\n  ') + '\n\n';
    }
    
    // Generate classes
    for (const cls of moduleClasses) {
      code += '  ' + this.generateClassDeclaration(cls).replace(/\n/g, '\n  ') + '\n\n';
    }
    
    // Generate global variables
    for (const varDecl of moduleGlobalVars) {
      code += '  ' + this.generateVariableDeclaration(varDecl).replace(/\n/g, '\n  ') + '\n';
    }
    
    // Generate functions
    for (const func of moduleFunctions) {
      code += '  ' + this.generateFunctionDeclaration(func).replace(/\n/g, '\n  ') + '\n\n';
    }
    
    code += '}\n\n';
    return code;
  }

  // Generate match statement (transpile to if-else chain)
  generateMatchStatement(stmt) {
    let code = '';
    let isFirst = true;
    
    for (const matchCase of stmt.cases) {
      if (matchCase.pattern.type === 'Wildcard') {
        // This is the default case
        if (!isFirst) {
          code += this.getIndent() + '} else {\n';
        } else {
          code += this.getIndent() + '{\n';
        }
        this.indent++;
        for (const s of matchCase.consequent) {
          code += this.generateStatement(s);
        }
        this.indent--;
        // Don't add closing brace here - it's added at the end
      } else {
        const condition = `${this.generateExpression(stmt.discriminant)} == ${this.generateExpression(matchCase.pattern)}`;
        if (isFirst) {
          code += this.getIndent() + `if (${condition}) {\n`;
          isFirst = false;
        } else {
          code += this.getIndent() + `} else if (${condition}) {\n`;
        }
        this.indent++;
        for (const s of matchCase.consequent) {
          code += this.generateStatement(s);
        }
        this.indent--;
      }
    }
    
    // Always add final closing brace
    code += this.getIndent() + '}\n';
    
    return code;
  }

  // Generate switch statement
  generateSwitchStatement(stmt) {
    let code = this.getIndent() + `switch (${this.generateExpression(stmt.discriminant)}) {\n`;
    
    for (const caseStmt of stmt.cases) {
      code += this.getIndent() + `  case ${this.generateExpression(caseStmt.test)}:\n`;
      this.indent += 2;
      for (const s of caseStmt.consequent) {
        code += this.generateStatement(s);
      }
      code += this.getIndent() + 'break;\n';
      this.indent -= 2;
    }
    
    if (stmt.defaultCase) {
      code += this.getIndent() + '  default:\n';
      this.indent += 2;
      for (const s of stmt.defaultCase) {
        code += this.generateStatement(s);
      }
      code += this.getIndent() + 'break;\n';
      this.indent -= 2;
    }
    
    code += this.getIndent() + '}\n';
    return code;
  }

  // Generate emit statement
  generateEmitStatement(stmt) {
    return this.getIndent() + `_signal_${stmt.signal} = true;\n`;
  }

  // Generate wait statement
  generateWaitStatement(stmt) {
    const delayValue = this.generateTimeValue(stmt.duration);
    return this.getIndent() + `delay(${delayValue});\n`;
  }

  // Generate timeout statement
  generateTimeoutStatement(stmt) {
    const timeoutMs = this.generateTimeValue(stmt.duration);
    const timeVar = `_timeout_${this.timeVarCounter++}`;
    
    let code = this.getIndent() + `unsigned long ${timeVar} = millis();\n`;
    code += this.getIndent() + `while (millis() - ${timeVar} < ${timeoutMs}) {\n`;
    this.indent++;
    for (const s of stmt.body) {
      code += this.generateStatement(s);
    }
    this.indent--;
    code += this.getIndent() + '}\n';
    
    return code;
  }

  // Generate atomic block (use ATOMIC_BLOCK macro or cli/sei)
  generateAtomicBlock(stmt) {
    let code = this.getIndent() + 'noInterrupts();\n';
    for (const s of stmt.body) {
      code += this.generateStatement(s);
    }
    code += this.getIndent() + 'interrupts();\n';
    return code;
  }

  // Generate C++ inline block
  generateCppBlock(stmt) {
    // For C++ blocks, we just output the statements as-is
    // This is a simplified version - in a full implementation,
    // you might want to handle raw C++ code differently
    let code = this.getIndent() + '// Inline C++\n';
    for (const s of stmt.body) {
      code += this.generateStatement(s);
    }
    return code;
  }

  // Helper to convert time literals to milliseconds
  generateTimeValue(expr) {
    if (expr.type === 'Literal' && expr.unit) {
      const value = expr.value;
      switch (expr.unit) {
        case 'ms':
          return String(value);
        case 's':
          return String(value * 1000);
        case 'us':
          return String(value / 1000);
        case 'min':
          return String(value * 60000);
        case 'h':
          return String(value * 3600000);
        default:
          return String(value);
      }
    }
    return this.generateExpression(expr);
  }

  // Helper to collect variables used in interrupt blocks
  collectISRVariables(body) {
    const variables = new Set();
    
    const collectFromNode = (node) => {
      if (!node) return;
      
      if (node.type === 'Identifier') {
        variables.add(node.name);
      } else if (node.type === 'AssignmentExpression') {
        collectFromNode(node.left);
        collectFromNode(node.right);
      } else if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
        collectFromNode(node.left);
        collectFromNode(node.right);
      } else if (node.type === 'ExpressionStatement') {
        collectFromNode(node.expression);
      } else if (node.type === 'CallExpression') {
        if (node.callee) collectFromNode(node.callee);
        if (node.arguments) {
          node.arguments.forEach(arg => collectFromNode(arg));
        }
      } else if (Array.isArray(node)) {
        node.forEach(n => collectFromNode(n));
      }
    };
    
    collectFromNode(body);
    return Array.from(variables);
  }

  // Helper to validate ISR block for forbidden operations
  validateISRBlock(block) {
    const forbiddenOps = [];
    
    const checkStatement = (stmt) => {
      if (!stmt) return;
      
      // Check for forbidden operations
      if (stmt.type === 'CallExpression') {
        const funcName = stmt.callee?.name;
        if (funcName === 'print') {
          forbiddenOps.push('print() is not allowed in interrupts');
        } else if (funcName === 'delay') {
          forbiddenOps.push('delay() is not allowed in interrupts');
        }
      } else if (stmt.type === 'ExpressionStatement' && stmt.expression?.type === 'CallExpression') {
        const funcName = stmt.expression.callee?.name;
        if (funcName === 'print') {
          forbiddenOps.push('print() is not allowed in interrupts');
        } else if (funcName === 'delay') {
          forbiddenOps.push('delay() is not allowed in interrupts');
        }
      } else if (stmt.type === 'WaitStatement') {
        forbiddenOps.push('wait is not allowed in interrupts');
      } else if (stmt.type === 'WhileStatement' || stmt.type === 'ForStatement') {
        forbiddenOps.push('loops are not allowed in interrupts');
      }
      
      // Recursively check compound statements
      if (stmt.consequent) {
        stmt.consequent.forEach(s => checkStatement(s));
      }
      if (stmt.alternate) {
        stmt.alternate.forEach(s => checkStatement(s));
      }
      if (stmt.body && Array.isArray(stmt.body)) {
        stmt.body.forEach(s => checkStatement(s));
      }
    };
    
    block.forEach(stmt => checkStatement(stmt));
    return forbiddenOps;
  }

  // Generate ISR function code
  generateISRFunction(interrupt, index) {
    // Validate the ISR block
    const errors = this.validateISRBlock(interrupt.body);
    if (errors.length > 0) {
      throw new Error(`Interrupt validation failed:\n${errors.join('\n')}`);
    }
    
    const isrName = interrupt.name || `isr_${index}`;
    let code = `void ${isrName}() {\n`;
    
    this.indent = 1;
    for (const stmt of interrupt.body) {
      code += this.generateStatement(stmt);
    }
    this.indent = 0;
    
    code += '}\n\n';
    return code;
  }

  // Map interrupt mode to Arduino constant
  mapInterruptMode(mode) {
    const modeMap = {
      'rising': 'RISING',
      'falling': 'FALLING',
      'change': 'CHANGE',
      'low': 'LOW',
      'high': 'HIGH'
    };
    return modeMap[mode.toLowerCase()] || 'CHANGE';
  }

  // Generate built-in hardware type classes
  generateHardwareTypes() {
    // Only generate if any hardware types are used
    if (this.usedHardwareTypes.size === 0) {
      return '';
    }
    
    const board = this.config.options.board;
    const isESP = board && (board.includes('esp32') || board.includes('esp8266'));
    
    let code = '// Built-in Hardware Types\n';
    
    // Digital class
    if (this.usedHardwareTypes.has('Digital')) {
    code += `class Digital {
private:
  int _pin;
  bool _state;
  bool _modeSet;
  
public:
  Digital(int pin) : _pin(pin), _state(false), _modeSet(false) {}
  
  void high() {
    if (!_modeSet) {
      pinMode(_pin, OUTPUT);
      _modeSet = true;
    }
    digitalWrite(_pin, HIGH);
    _state = true;
  }
  
  void low() {
    if (!_modeSet) {
      pinMode(_pin, OUTPUT);
      _modeSet = true;
    }
    digitalWrite(_pin, LOW);
    _state = false;
  }
  
  void toggle() {
    if (!_modeSet) {
      pinMode(_pin, OUTPUT);
      _modeSet = true;
    }
    _state = !_state;
    digitalWrite(_pin, _state ? HIGH : LOW);
  }
  
  bool isHigh() {
    if (!_modeSet) {
      pinMode(_pin, INPUT);
      _modeSet = true;
    }
    return digitalRead(_pin) == HIGH;
  }
  
  bool isLow() {
    if (!_modeSet) {
      pinMode(_pin, INPUT);
      _modeSet = true;
    }
    return digitalRead(_pin) == LOW;
  }
  
  int read() {
    if (!_modeSet) {
      pinMode(_pin, INPUT);
      _modeSet = true;
    }
    return digitalRead(_pin);
  }
  
  void write(int value) {
    if (!_modeSet) {
      pinMode(_pin, OUTPUT);
      _modeSet = true;
    }
    digitalWrite(_pin, value);
    _state = (value == HIGH);
  }
};

`;
    }
    
    // Analog class
    if (this.usedHardwareTypes.has('Analog')) {
      code += `class Analog {
private:
  int _pin;
  
public:
  Analog(int pin) : _pin(pin) {
    pinMode(_pin, INPUT);
  }
  
  int read() {
    return analogRead(_pin);
  }
};

`;
    }
    
    // PWM class with board-specific implementation
    if (this.usedHardwareTypes.has('PWM')) {
      if (isESP) {
        code += `class PWM {
private:
  int _pin;
  int _value;
  int _channel;
  static int _nextChannel;
  
public:
  PWM(int pin) : _pin(pin), _value(0) {
    _channel = _nextChannel++;
    ledcSetup(_channel, 5000, 8); // 5kHz, 8-bit resolution
    ledcAttachPin(_pin, _channel);
  }
  
  void set(int value) {
    _value = constrain(value, 0, 255);
    ledcWrite(_channel, _value);
  }
  
  int get() {
    return _value;
  }
};

int PWM::_nextChannel = 0;

`;
      } else {
        // AVR boards
        code += `class PWM {
private:
  int _pin;
  int _value;
  
public:
  PWM(int pin) : _pin(pin), _value(0) {
    pinMode(_pin, OUTPUT);
  }
  
  void set(int value) {
    _value = constrain(value, 0, 255);
    analogWrite(_pin, _value);
  }
  
  int get() {
    return _value;
  }
};

`;
      }
    }
    
    // I2C class
    if (this.usedHardwareTypes.has('I2C')) {
    code += `class I2C {
private:
  int _bus;
  bool _initialized;
  
public:
  I2C() : _bus(0), _initialized(false) {}
  I2C(int bus) : _bus(bus), _initialized(false) {}
  
  void begin() {
    if (!_initialized) {
      Wire.begin();
      _initialized = true;
    }
  }
  
  void write(uint8_t addr, const std::vector<uint8_t>& data) {
    begin();
    Wire.beginTransmission(addr);
    for (size_t i = 0; i < data.size(); i++) {
      Wire.write(data[i]);
    }
    Wire.endTransmission();
  }
  
  std::vector<uint8_t> read(uint8_t addr, uint8_t length) {
    begin();
    std::vector<uint8_t> result;
    Wire.requestFrom(addr, length);
    while (Wire.available() && result.size() < length) {
      result.push_back(Wire.read());
    }
    return result;
  }
  
  std::vector<uint8_t> scan() {
    begin();
    std::vector<uint8_t> devices;
    for (uint8_t addr = 1; addr < 127; addr++) {
      Wire.beginTransmission(addr);
      if (Wire.endTransmission() == 0) {
        devices.push_back(addr);
      }
    }
    return devices;
  }
};

`;
    }
    
    // SPI class
    if (this.usedHardwareTypes.has('SPI')) {
      code += `class SPI {
private:
  int _bus;
  bool _initialized;
  
public:
  SPI() : _bus(0), _initialized(false) {}
  SPI(int bus) : _bus(bus), _initialized(false) {}
  
  void begin() {
    if (!_initialized) {
      ::SPI.begin();
      _initialized = true;
    }
  }
  
  uint8_t transfer(uint8_t byte) {
    begin();
    return ::SPI.transfer(byte);
  }
  
  std::vector<uint8_t> transferBuffer(const std::vector<uint8_t>& data) {
    begin();
    std::vector<uint8_t> result;
    for (size_t i = 0; i < data.size(); i++) {
      result.push_back(::SPI.transfer(data[i]));
    }
    return result;
  }
  
  void setClock(uint32_t freq) {
    begin();
    ::SPI.setClockDivider(freq);
  }
  
  void setMode(uint8_t mode) {
    begin();
    ::SPI.setDataMode(mode);
  }
  
  void setBitOrder(uint8_t order) {
    begin();
    ::SPI.setBitOrder(order);
  }
};

`;
    }
    
    // UART class
    if (this.usedHardwareTypes.has('UART')) {
      code += `class UART {
private:
  long _baud;
  int _port;
  bool _initialized;
  
public:
  UART(long baud) : _baud(baud), _port(0), _initialized(false) {
    begin();
  }
  
  UART(long baud, int port) : _baud(baud), _port(port), _initialized(false) {
    begin();
  }
  
  void begin() {
    if (!_initialized) {
      if (_port == 0) {
        Serial.begin(_baud);
      }
#ifdef HAVE_HWSERIAL1
      else if (_port == 1) {
        Serial1.begin(_baud);
      }
#endif
#ifdef HAVE_HWSERIAL2
      else if (_port == 2) {
        Serial2.begin(_baud);
      }
#endif
#ifdef HAVE_HWSERIAL3
      else if (_port == 3) {
        Serial3.begin(_baud);
      }
#endif
      _initialized = true;
    }
  }
  
  template<typename T>
  void print(T value) {
    begin();
    if (_port == 0) Serial.print(value);
#ifdef HAVE_HWSERIAL1
    else if (_port == 1) Serial1.print(value);
#endif
#ifdef HAVE_HWSERIAL2
    else if (_port == 2) Serial2.print(value);
#endif
#ifdef HAVE_HWSERIAL3
    else if (_port == 3) Serial3.print(value);
#endif
  }
  
  template<typename T>
  void println(T value) {
    begin();
    if (_port == 0) Serial.println(value);
#ifdef HAVE_HWSERIAL1
    else if (_port == 1) Serial1.println(value);
#endif
#ifdef HAVE_HWSERIAL2
    else if (_port == 2) Serial2.println(value);
#endif
#ifdef HAVE_HWSERIAL3
    else if (_port == 3) Serial3.println(value);
#endif
  }
  
  int16_t read() {
    begin();
    if (_port == 0) return Serial.read();
#ifdef HAVE_HWSERIAL1
    else if (_port == 1) return Serial1.read();
#endif
#ifdef HAVE_HWSERIAL2
    else if (_port == 2) return Serial2.read();
#endif
#ifdef HAVE_HWSERIAL3
    else if (_port == 3) return Serial3.read();
#endif
    return -1;
  }
  
  uint16_t available() {
    begin();
    if (_port == 0) return Serial.available();
#ifdef HAVE_HWSERIAL1
    else if (_port == 1) return Serial1.available();
#endif
#ifdef HAVE_HWSERIAL2
    else if (_port == 2) return Serial2.available();
#endif
#ifdef HAVE_HWSERIAL3
    else if (_port == 3) return Serial3.available();
#endif
    return 0;
  }
  
  void flush() {
    begin();
    if (_port == 0) Serial.flush();
#ifdef HAVE_HWSERIAL1
    else if (_port == 1) Serial1.flush();
#endif
#ifdef HAVE_HWSERIAL2
    else if (_port == 2) Serial2.flush();
#endif
#ifdef HAVE_HWSERIAL3
    else if (_port == 3) Serial3.flush();
#endif
  }
};

`;
    }
    
    // Servo class
    if (this.usedHardwareTypes.has('Servo')) {
      code += `class Servo {
private:
  ::Servo _servo;
  int _pin;
  int _minUs;
  int _maxUs;
  
public:
  Servo(int pin) : _pin(pin), _minUs(1000), _maxUs(2000) {}
  Servo(int pin, int minUs, int maxUs) : _pin(pin), _minUs(minUs), _maxUs(maxUs) {}
  
  void attach(uint8_t pin) {
    _pin = pin;
    _servo.attach(_pin, _minUs, _maxUs);
  }
  
  void detach() {
    _servo.detach();
  }
  
  void writeAngle(uint16_t angleDeg) {
    if (!_servo.attached()) {
      _servo.attach(_pin, _minUs, _maxUs);
    }
    _servo.write(angleDeg);
  }
  
  void writeMicroseconds(uint16_t us) {
    if (!_servo.attached()) {
      _servo.attach(_pin, _minUs, _maxUs);
    }
    _servo.writeMicroseconds(us);
  }
  
  uint16_t readAngle() {
    return _servo.read();
  }
  
  uint16_t readMicroseconds() {
    return _servo.readMicroseconds();
  }
};

`;
    }
    
    // Encoder class
    if (this.usedHardwareTypes.has('Encoder')) {
      code += `class Encoder {
private:
  int _pinA;
  int _pinB;
  int _ppr;
  volatile int32_t _position;
  volatile unsigned long _lastTime;
  volatile int32_t _lastPosition;
  
public:
  Encoder(int pinA, int pinB, int ppr) : _pinA(pinA), _pinB(pinB), _ppr(ppr), _position(0), _lastTime(0), _lastPosition(0) {
    pinMode(_pinA, INPUT_PULLUP);
    pinMode(_pinB, INPUT_PULLUP);
  }
  
  int32_t position() {
    return _position;
  }
  
  void reset() {
    _position = 0;
    _lastPosition = 0;
    _lastTime = millis();
  }
  
  int32_t rpm(unsigned long windowMs) {
    unsigned long currentTime = millis();
    int32_t currentPos = _position;
    
    if (currentTime - _lastTime >= windowMs) {
      int32_t deltaPos = currentPos - _lastPosition;
      unsigned long deltaTime = currentTime - _lastTime;
      
      // RPM = (deltaPos / ppr) * (60000 / deltaTime)
      int32_t rpm = (deltaPos * 60000) / (_ppr * deltaTime);
      
      _lastPosition = currentPos;
      _lastTime = currentTime;
      
      return rpm;
    }
    return 0;
  }
};

`;
    }
    
    // DCMotor class
    if (this.usedHardwareTypes.has('DCMotor')) {
      code += `class DCMotor {
private:
  int _pinPWM;
  int _pinDir1;
  int _pinDir2;
  bool _hasDir2;
  
public:
  DCMotor(int pinPWM, int pinDir1) : _pinPWM(pinPWM), _pinDir1(pinDir1), _pinDir2(-1), _hasDir2(false) {
    pinMode(_pinPWM, OUTPUT);
    pinMode(_pinDir1, OUTPUT);
  }
  
  DCMotor(int pinPWM, int pinDir1, int pinDir2) : _pinPWM(pinPWM), _pinDir1(pinDir1), _pinDir2(pinDir2), _hasDir2(true) {
    pinMode(_pinPWM, OUTPUT);
    pinMode(_pinDir1, OUTPUT);
    pinMode(_pinDir2, OUTPUT);
  }
  
  void setSpeed(int16_t speed) {
    if (speed > 0) {
      forward(speed);
    } else if (speed < 0) {
      reverse(-speed);
    } else {
      stop();
    }
  }
  
  void forward(uint8_t speed) {
    speed = constrain(speed, 0, 255);
    if (_hasDir2) {
      digitalWrite(_pinDir1, HIGH);
      digitalWrite(_pinDir2, LOW);
    } else {
      digitalWrite(_pinDir1, HIGH);
    }
    analogWrite(_pinPWM, speed);
  }
  
  void reverse(uint8_t speed) {
    speed = constrain(speed, 0, 255);
    if (_hasDir2) {
      digitalWrite(_pinDir1, LOW);
      digitalWrite(_pinDir2, HIGH);
    } else {
      digitalWrite(_pinDir1, LOW);
    }
    analogWrite(_pinPWM, speed);
  }
  
  void stop() {
    analogWrite(_pinPWM, 0);
  }
  
  void brake() {
    if (_hasDir2) {
      digitalWrite(_pinDir1, HIGH);
      digitalWrite(_pinDir2, HIGH);
    }
    analogWrite(_pinPWM, 0);
  }
};

`;
    }
    
    // StepperMotor class
    if (this.usedHardwareTypes.has('StepperMotor')) {
      code += `class StepperMotor {
private:
  int _pin1;
  int _pin2;
  int _stepsPerRev;
  int32_t _position;
  uint16_t _speed;
  unsigned long _stepDelay;
  
public:
  StepperMotor(int pin1, int pin2, int stepsPerRev) 
    : _pin1(pin1), _pin2(pin2), _stepsPerRev(stepsPerRev), _position(0), _speed(60), _stepDelay(1000) {
    pinMode(_pin1, OUTPUT);
    pinMode(_pin2, OUTPUT);
    setSpeed(60);
  }
  
  void moveSteps(int32_t steps) {
    for (int32_t i = 0; i < abs(steps); i++) {
      if (steps > 0) {
        digitalWrite(_pin1, HIGH);
        delayMicroseconds(_stepDelay);
        digitalWrite(_pin1, LOW);
        delayMicroseconds(_stepDelay);
        _position++;
      } else {
        digitalWrite(_pin2, HIGH);
        delayMicroseconds(_stepDelay);
        digitalWrite(_pin2, LOW);
        delayMicroseconds(_stepDelay);
        _position--;
      }
    }
  }
  
  void setSpeed(uint16_t rpm) {
    _speed = rpm;
    // Calculate delay in microseconds
    _stepDelay = (60L * 1000000L) / (_stepsPerRev * rpm) / 2;
  }
  
  int32_t position() {
    return _position;
  }
  
  void resetPosition() {
    _position = 0;
  }
};

`;
    }
    
    // Led class
    if (this.usedHardwareTypes.has('Led')) {
      code += `class Led {
private:
  int _pin;
  bool _dimmable;
  bool _state;
  
public:
  Led(int pin) : _pin(pin), _dimmable(false), _state(false) {
    pinMode(_pin, OUTPUT);
  }
  
  Led(int pin, bool dimmable) : _pin(pin), _dimmable(dimmable), _state(false) {
    pinMode(_pin, OUTPUT);
  }
  
  void on() {
    digitalWrite(_pin, HIGH);
    _state = true;
  }
  
  void off() {
    digitalWrite(_pin, LOW);
    _state = false;
  }
  
  void toggle() {
    _state = !_state;
    digitalWrite(_pin, _state ? HIGH : LOW);
  }
  
  void setBrightness(uint8_t level) {
    if (_dimmable) {
      analogWrite(_pin, level);
    } else {
      digitalWrite(_pin, level > 127 ? HIGH : LOW);
    }
  }
};

`;
    }
    
    // RgbLed class
    if (this.usedHardwareTypes.has('RgbLed')) {
      code += `class RgbLed {
private:
  int _pinR;
  int _pinG;
  int _pinB;
  bool _commonAnode;
  
  void setColor(uint8_t r, uint8_t g, uint8_t b) {
    if (_commonAnode) {
      analogWrite(_pinR, 255 - r);
      analogWrite(_pinG, 255 - g);
      analogWrite(_pinB, 255 - b);
    } else {
      analogWrite(_pinR, r);
      analogWrite(_pinG, g);
      analogWrite(_pinB, b);
    }
  }
  
public:
  RgbLed(int pinR, int pinG, int pinB) : _pinR(pinR), _pinG(pinG), _pinB(pinB), _commonAnode(false) {
    pinMode(_pinR, OUTPUT);
    pinMode(_pinG, OUTPUT);
    pinMode(_pinB, OUTPUT);
  }
  
  RgbLed(int pinR, int pinG, int pinB, bool commonAnode) 
    : _pinR(pinR), _pinG(pinG), _pinB(pinB), _commonAnode(commonAnode) {
    pinMode(_pinR, OUTPUT);
    pinMode(_pinG, OUTPUT);
    pinMode(_pinB, OUTPUT);
  }
  
  void set(uint8_t r, uint8_t g, uint8_t b) {
    setColor(r, g, b);
  }
  
  void off() {
    setColor(0, 0, 0);
  }
  
  void red() {
    setColor(255, 0, 0);
  }
  
  void green() {
    setColor(0, 255, 0);
  }
  
  void blue() {
    setColor(0, 0, 255);
  }
  
  void yellow() {
    setColor(255, 255, 0);
  }
  
  void cyan() {
    setColor(0, 255, 255);
  }
  
  void magenta() {
    setColor(255, 0, 255);
  }
  
  void white() {
    setColor(255, 255, 255);
  }
  
  void orange() {
    setColor(255, 165, 0);
  }
  
  void purple() {
    setColor(128, 0, 128);
  }
  
  void pink() {
    setColor(255, 192, 203);
  }
};

`;
    }
    
    // Button class
    if (this.usedHardwareTypes.has('Button')) {
      code += `class Button {
private:
  int _pin;
  bool _pullup;
  bool _activeLow;
  bool _lastReading;
  bool _currentState;
  bool _previousState;
  unsigned long _lastDebounceTime;
  unsigned long _debounceDelay;
  
  bool readRaw() {
    bool raw = digitalRead(_pin);
    return _activeLow ? !raw : raw;
  }
  
public:
  Button(int pin) : _pin(pin), _pullup(true), _activeLow(true), _lastReading(false), 
                    _currentState(false), _previousState(false), _lastDebounceTime(0), _debounceDelay(50) {
    pinMode(_pin, _pullup ? INPUT_PULLUP : INPUT);
    _currentState = readRaw();
    _previousState = _currentState;
    _lastReading = _currentState;
  }
  
  Button(int pin, bool pullup, bool activeLow) 
    : _pin(pin), _pullup(pullup), _activeLow(activeLow), _lastReading(false),
      _currentState(false), _previousState(false), _lastDebounceTime(0), _debounceDelay(50) {
    pinMode(_pin, _pullup ? INPUT_PULLUP : INPUT);
    _currentState = readRaw();
    _previousState = _currentState;
    _lastReading = _currentState;
  }
  
  void update() {
    bool reading = readRaw();
    if (reading != _lastReading) {
      _lastDebounceTime = millis();
    }
    
    if ((millis() - _lastDebounceTime) > _debounceDelay) {
      if (reading != _currentState) {
        _previousState = _currentState;
        _currentState = reading;
      }
    }
    _lastReading = reading;
  }
  
  bool pressed() {
    update();
    return _currentState;
  }
  
  bool released() {
    update();
    return !_currentState;
  }
  
  bool justPressed() {
    bool prev = _previousState;
    update();
    return _currentState && !prev;
  }
  
  bool justReleased() {
    bool prev = _previousState;
    update();
    return !_currentState && prev;
  }
};

`;
    }
    
    // Buzzer class
    if (this.usedHardwareTypes.has('Buzzer')) {
      code += `class Buzzer {
private:
  int _pin;
  bool _toneCapable;
  
public:
  Buzzer(int pin) : _pin(pin), _toneCapable(false) {
    pinMode(_pin, OUTPUT);
  }
  
  Buzzer(int pin, bool toneCapable) : _pin(pin), _toneCapable(toneCapable) {
    pinMode(_pin, OUTPUT);
  }
  
  void on() {
    digitalWrite(_pin, HIGH);
  }
  
  void off() {
    digitalWrite(_pin, LOW);
    if (_toneCapable) {
      noTone(_pin);
    }
  }
  
  void beep(unsigned long durationMs) {
    on();
    delay(durationMs);
    off();
  }
  
  void tone(uint16_t freq, unsigned long durationMs) {
    if (_toneCapable) {
      ::tone(_pin, freq, durationMs);
    } else {
      beep(durationMs);
    }
  }
  
  void noTone() {
    if (_toneCapable) {
      ::noTone(_pin);
    }
    off();
  }
};

`;
    }
    
    // Multiplexer classes (Mux4, Mux8, Mux16, Mux32)
    if (this.usedHardwareTypes.has('Mux4')) {
      code += `class Mux4 {
private:
  int _sigPin;
  int _s0, _s1;
  bool _enablePin;
  int _en;
  
public:
  Mux4(int sigPin, int s0, int s1) : _sigPin(sigPin), _s0(s0), _s1(s1), _enablePin(false), _en(-1) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
  }
  
  Mux4(int sigPin, int s0, int s1, int en) : _sigPin(sigPin), _s0(s0), _s1(s1), _enablePin(true), _en(en) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_en, OUTPUT);
    enable();
  }
  
  void selectChannel(uint8_t channel) {
    channel = channel & 0x03;
    digitalWrite(_s0, channel & 0x01);
    digitalWrite(_s1, (channel >> 1) & 0x01);
  }
  
  int read(uint8_t channel) {
    selectChannel(channel);
    return analogRead(_sigPin);
  }
  
  void enable() { if (_enablePin) digitalWrite(_en, LOW); }
  void disable() { if (_enablePin) digitalWrite(_en, HIGH); }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Mux8')) {
      code += `class Mux8 {
private:
  int _sigPin;
  int _s0, _s1, _s2;
  bool _enablePin;
  int _en;
  
public:
  Mux8(int sigPin, int s0, int s1, int s2) : _sigPin(sigPin), _s0(s0), _s1(s1), _s2(s2), _enablePin(false), _en(-1) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
  }
  
  Mux8(int sigPin, int s0, int s1, int s2, int en) : _sigPin(sigPin), _s0(s0), _s1(s1), _s2(s2), _enablePin(true), _en(en) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
    pinMode(_en, OUTPUT);
    enable();
  }
  
  void selectChannel(uint8_t channel) {
    channel = channel & 0x07;
    digitalWrite(_s0, channel & 0x01);
    digitalWrite(_s1, (channel >> 1) & 0x01);
    digitalWrite(_s2, (channel >> 2) & 0x01);
  }
  
  int read(uint8_t channel) {
    selectChannel(channel);
    return analogRead(_sigPin);
  }
  
  void enable() { if (_enablePin) digitalWrite(_en, LOW); }
  void disable() { if (_enablePin) digitalWrite(_en, HIGH); }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Mux16')) {
      code += `class Mux16 {
private:
  int _sigPin;
  int _s0, _s1, _s2, _s3;
  bool _enablePin;
  int _en;
  
public:
  Mux16(int sigPin, int s0, int s1, int s2, int s3) : _sigPin(sigPin), _s0(s0), _s1(s1), _s2(s2), _s3(s3), _enablePin(false), _en(-1) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
    pinMode(_s3, OUTPUT);
  }
  
  Mux16(int sigPin, int s0, int s1, int s2, int s3, int en) : _sigPin(sigPin), _s0(s0), _s1(s1), _s2(s2), _s3(s3), _enablePin(true), _en(en) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
    pinMode(_s3, OUTPUT);
    pinMode(_en, OUTPUT);
    enable();
  }
  
  void selectChannel(uint8_t channel) {
    channel = channel & 0x0F;
    digitalWrite(_s0, channel & 0x01);
    digitalWrite(_s1, (channel >> 1) & 0x01);
    digitalWrite(_s2, (channel >> 2) & 0x01);
    digitalWrite(_s3, (channel >> 3) & 0x01);
  }
  
  int read(uint8_t channel) {
    selectChannel(channel);
    return analogRead(_sigPin);
  }
  
  void enable() { if (_enablePin) digitalWrite(_en, LOW); }
  void disable() { if (_enablePin) digitalWrite(_en, HIGH); }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Mux32')) {
      code += `class Mux32 {
private:
  int _sigPin;
  int _s0, _s1, _s2, _s3, _s4;
  bool _enablePin;
  int _en;
  
public:
  Mux32(int sigPin, int s0, int s1, int s2, int s3, int s4) : _sigPin(sigPin), _s0(s0), _s1(s1), _s2(s2), _s3(s3), _s4(s4), _enablePin(false), _en(-1) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
    pinMode(_s3, OUTPUT);
    pinMode(_s4, OUTPUT);
  }
  
  Mux32(int sigPin, int s0, int s1, int s2, int s3, int s4, int en) : _sigPin(sigPin), _s0(s0), _s1(s1), _s2(s2), _s3(s3), _s4(s4), _enablePin(true), _en(en) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
    pinMode(_s3, OUTPUT);
    pinMode(_s4, OUTPUT);
    pinMode(_en, OUTPUT);
    enable();
  }
  
  void selectChannel(uint8_t channel) {
    channel = channel & 0x1F;
    digitalWrite(_s0, channel & 0x01);
    digitalWrite(_s1, (channel >> 1) & 0x01);
    digitalWrite(_s2, (channel >> 2) & 0x01);
    digitalWrite(_s3, (channel >> 3) & 0x01);
    digitalWrite(_s4, (channel >> 4) & 0x01);
  }
  
  int read(uint8_t channel) {
    selectChannel(channel);
    return analogRead(_sigPin);
  }
  
  void enable() { if (_enablePin) digitalWrite(_en, LOW); }
  void disable() { if (_enablePin) digitalWrite(_en, HIGH); }
};

`;
    }
    
    // Sensor classes
    if (this.usedHardwareTypes.has('TempSensor')) {
      code += `class TempSensor {
private:
  int _pin;
  float _offset;
  
public:
  TempSensor(int pin) : _pin(pin), _offset(0) { pinMode(_pin, INPUT); }
  TempSensor(int pin, float offset) : _pin(pin), _offset(offset) { pinMode(_pin, INPUT); }
  
  float readCelsius() {
    int raw = analogRead(_pin);
    float voltage = raw * (5.0 / 1023.0);
    return (voltage - 0.5) * 100.0 + _offset;
  }
  
  float readFahrenheit() { return readCelsius() * 9.0 / 5.0 + 32.0; }
  float readKelvin() { return readCelsius() + 273.15; }
  int readRaw() { return analogRead(_pin); }
  void setOffset(float offset) { _offset = offset; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('HumiditySensor')) {
      code += `class HumiditySensor {
private:
  int _pin;
  
public:
  HumiditySensor(int pin) : _pin(pin) { pinMode(_pin, INPUT); }
  
  float readPercent() {
    int raw = analogRead(_pin);
    return map(raw, 0, 1023, 0, 100);
  }
  
  int readRaw() { return analogRead(_pin); }
};

`;
    }
    
    if (this.usedHardwareTypes.has('PressureSensor')) {
      code += `class PressureSensor {
private:
  int _pin;
  float _minPressure;
  float _maxPressure;
  
public:
  PressureSensor(int pin) : _pin(pin), _minPressure(0), _maxPressure(1000) { pinMode(_pin, INPUT); }
  PressureSensor(int pin, float minP, float maxP) : _pin(pin), _minPressure(minP), _maxPressure(maxP) { pinMode(_pin, INPUT); }
  
  float read() {
    int raw = analogRead(_pin);
    return map(raw, 0, 1023, _minPressure * 100, _maxPressure * 100) / 100.0;
  }
  
  int readRaw() { return analogRead(_pin); }
};

`;
    }
    
    if (this.usedHardwareTypes.has('LightSensor')) {
      code += `class LightSensor {
private:
  int _pin;
  
public:
  LightSensor(int pin) : _pin(pin) { pinMode(_pin, INPUT); }
  
  int read() { return analogRead(_pin); }
  int readPercent() { return map(analogRead(_pin), 0, 1023, 0, 100); }
  bool isDark(int threshold = 100) { return analogRead(_pin) < threshold; }
  bool isBright(int threshold = 800) { return analogRead(_pin) > threshold; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('DistanceSensor')) {
      code += `class DistanceSensor {
private:
  int _trigPin;
  int _echoPin;
  
public:
  DistanceSensor(int trigPin, int echoPin) : _trigPin(trigPin), _echoPin(echoPin) {
    pinMode(_trigPin, OUTPUT);
    pinMode(_echoPin, INPUT);
  }
  
  float readCm() {
    digitalWrite(_trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(_trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trigPin, LOW);
    long duration = pulseIn(_echoPin, HIGH, 30000);
    return duration * 0.034 / 2.0;
  }
  
  float readInches() { return readCm() / 2.54; }
  float readMm() { return readCm() * 10.0; }
  bool inRange(float minCm, float maxCm) { float d = readCm(); return d >= minCm && d <= maxCm; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('MotionSensor')) {
      code += `class MotionSensor {
private:
  int _pin;
  unsigned long _lastMotion;
  
public:
  MotionSensor(int pin) : _pin(pin), _lastMotion(0) { pinMode(_pin, INPUT); }
  
  bool detected() {
    if (digitalRead(_pin) == HIGH) {
      _lastMotion = millis();
      return true;
    }
    return false;
  }
  
  unsigned long timeSinceMotion() { return millis() - _lastMotion; }
  bool isIdle(unsigned long timeoutMs) { return timeSinceMotion() > timeoutMs; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('TouchSensor')) {
      code += `class TouchSensor {
private:
  int _pin;
  int _threshold;
  
public:
  TouchSensor(int pin) : _pin(pin), _threshold(500) { pinMode(_pin, INPUT); }
  TouchSensor(int pin, int threshold) : _pin(pin), _threshold(threshold) { pinMode(_pin, INPUT); }
  
  bool isTouched() { return analogRead(_pin) > _threshold; }
  int read() { return analogRead(_pin); }
  void setThreshold(int threshold) { _threshold = threshold; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('SoundSensor')) {
      code += `class SoundSensor {
private:
  int _pin;
  int _threshold;
  
public:
  SoundSensor(int pin) : _pin(pin), _threshold(500) { pinMode(_pin, INPUT); }
  SoundSensor(int pin, int threshold) : _pin(pin), _threshold(threshold) { pinMode(_pin, INPUT); }
  
  int read() { return analogRead(_pin); }
  bool isLoud() { return analogRead(_pin) > _threshold; }
  void setThreshold(int threshold) { _threshold = threshold; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('GasSensor')) {
      code += `class GasSensor {
private:
  int _pin;
  int _threshold;
  
public:
  GasSensor(int pin) : _pin(pin), _threshold(300) { pinMode(_pin, INPUT); }
  GasSensor(int pin, int threshold) : _pin(pin), _threshold(threshold) { pinMode(_pin, INPUT); }
  
  int read() { return analogRead(_pin); }
  bool detected() { return analogRead(_pin) > _threshold; }
  void setThreshold(int threshold) { _threshold = threshold; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('ColorSensor')) {
      code += `class ColorSensor {
private:
  int _s0, _s1, _s2, _s3, _out;
  
public:
  ColorSensor(int s0, int s1, int s2, int s3, int out) : _s0(s0), _s1(s1), _s2(s2), _s3(s3), _out(out) {
    pinMode(_s0, OUTPUT);
    pinMode(_s1, OUTPUT);
    pinMode(_s2, OUTPUT);
    pinMode(_s3, OUTPUT);
    pinMode(_out, INPUT);
    digitalWrite(_s0, HIGH);
    digitalWrite(_s1, LOW);
  }
  
  int readRed() {
    digitalWrite(_s2, LOW);
    digitalWrite(_s3, LOW);
    return pulseIn(_out, LOW, 50000);
  }
  
  int readGreen() {
    digitalWrite(_s2, HIGH);
    digitalWrite(_s3, HIGH);
    return pulseIn(_out, LOW, 50000);
  }
  
  int readBlue() {
    digitalWrite(_s2, LOW);
    digitalWrite(_s3, HIGH);
    return pulseIn(_out, LOW, 50000);
  }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Accelerometer')) {
      code += `class Accelerometer {
private:
  int _xPin, _yPin, _zPin;
  float _scale;
  
public:
  Accelerometer(int xPin, int yPin, int zPin) : _xPin(xPin), _yPin(yPin), _zPin(zPin), _scale(1.0) {
    pinMode(_xPin, INPUT);
    pinMode(_yPin, INPUT);
    pinMode(_zPin, INPUT);
  }
  
  float readX() { return (analogRead(_xPin) - 512) * _scale / 102.4; }
  float readY() { return (analogRead(_yPin) - 512) * _scale / 102.4; }
  float readZ() { return (analogRead(_zPin) - 512) * _scale / 102.4; }
  void setScale(float scale) { _scale = scale; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Gyroscope')) {
      code += `class Gyroscope {
private:
  int _xPin, _yPin, _zPin;
  float _scale;
  
public:
  Gyroscope(int xPin, int yPin, int zPin) : _xPin(xPin), _yPin(yPin), _zPin(zPin), _scale(1.0) {
    pinMode(_xPin, INPUT);
    pinMode(_yPin, INPUT);
    pinMode(_zPin, INPUT);
  }
  
  float readX() { return (analogRead(_xPin) - 512) * _scale; }
  float readY() { return (analogRead(_yPin) - 512) * _scale; }
  float readZ() { return (analogRead(_zPin) - 512) * _scale; }
  void setScale(float scale) { _scale = scale; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Magnetometer')) {
      code += `class Magnetometer {
private:
  int _xPin, _yPin, _zPin;
  
public:
  Magnetometer(int xPin, int yPin, int zPin) : _xPin(xPin), _yPin(yPin), _zPin(zPin) {
    pinMode(_xPin, INPUT);
    pinMode(_yPin, INPUT);
    pinMode(_zPin, INPUT);
  }
  
  int readX() { return analogRead(_xPin) - 512; }
  int readY() { return analogRead(_yPin) - 512; }
  int readZ() { return analogRead(_zPin) - 512; }
  float heading() { return atan2(readY(), readX()) * 180.0 / 3.14159; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('IMU')) {
      code += `class IMU {
private:
  int _address;
  bool _initialized;
  
public:
  IMU(int address = 0x68) : _address(address), _initialized(false) {}
  
  void begin() { _initialized = true; Wire.begin(); }
  float readAccelX() { return 0; }
  float readAccelY() { return 0; }
  float readAccelZ() { return 0; }
  float readGyroX() { return 0; }
  float readGyroY() { return 0; }
  float readGyroZ() { return 0; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('GPS')) {
      code += `class GPS {
private:
  int _rxPin, _txPin;
  float _lat, _lon, _alt;
  
public:
  GPS(int rxPin, int txPin) : _rxPin(rxPin), _txPin(txPin), _lat(0), _lon(0), _alt(0) {}
  
  void begin(long baud = 9600) {}
  bool update() { return false; }
  float latitude() { return _lat; }
  float longitude() { return _lon; }
  float altitude() { return _alt; }
  float speed() { return 0; }
  int satellites() { return 0; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('LoadCell')) {
      code += `class LoadCell {
private:
  int _doutPin, _sckPin;
  float _scale;
  long _offset;
  
public:
  LoadCell(int doutPin, int sckPin) : _doutPin(doutPin), _sckPin(sckPin), _scale(1.0), _offset(0) {
    pinMode(_doutPin, INPUT);
    pinMode(_sckPin, OUTPUT);
  }
  
  void setScale(float scale) { _scale = scale; }
  void tare() { _offset = readRaw(); }
  long readRaw() { return 0; }
  float read() { return (readRaw() - _offset) / _scale; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Potentiometer')) {
      code += `class Potentiometer {
private:
  int _pin;
  int _minVal, _maxVal;
  
public:
  Potentiometer(int pin) : _pin(pin), _minVal(0), _maxVal(1023) { pinMode(_pin, INPUT); }
  
  int read() { return analogRead(_pin); }
  int readPercent() { return map(analogRead(_pin), _minVal, _maxVal, 0, 100); }
  int readMapped(int outMin, int outMax) { return map(analogRead(_pin), _minVal, _maxVal, outMin, outMax); }
  void calibrate(int minVal, int maxVal) { _minVal = minVal; _maxVal = maxVal; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Joystick')) {
      code += `class Joystick {
private:
  int _xPin, _yPin, _btnPin;
  int _centerX, _centerY;
  int _deadzone;
  
public:
  Joystick(int xPin, int yPin) : _xPin(xPin), _yPin(yPin), _btnPin(-1), _centerX(512), _centerY(512), _deadzone(50) {
    pinMode(_xPin, INPUT);
    pinMode(_yPin, INPUT);
  }
  
  Joystick(int xPin, int yPin, int btnPin) : _xPin(xPin), _yPin(yPin), _btnPin(btnPin), _centerX(512), _centerY(512), _deadzone(50) {
    pinMode(_xPin, INPUT);
    pinMode(_yPin, INPUT);
    pinMode(_btnPin, INPUT_PULLUP);
  }
  
  int readX() { return analogRead(_xPin) - _centerX; }
  int readY() { return analogRead(_yPin) - _centerY; }
  bool isPressed() { return _btnPin >= 0 && digitalRead(_btnPin) == LOW; }
  void calibrate() { _centerX = analogRead(_xPin); _centerY = analogRead(_yPin); }
  void setDeadzone(int dz) { _deadzone = dz; }
  bool isIdle() { return abs(readX()) < _deadzone && abs(readY()) < _deadzone; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('RotaryEncoder')) {
      code += `class RotaryEncoder {
private:
  int _pinA, _pinB, _btnPin;
  volatile int32_t _position;
  int _lastA;
  
public:
  RotaryEncoder(int pinA, int pinB) : _pinA(pinA), _pinB(pinB), _btnPin(-1), _position(0), _lastA(0) {
    pinMode(_pinA, INPUT_PULLUP);
    pinMode(_pinB, INPUT_PULLUP);
    _lastA = digitalRead(_pinA);
  }
  
  RotaryEncoder(int pinA, int pinB, int btnPin) : _pinA(pinA), _pinB(pinB), _btnPin(btnPin), _position(0), _lastA(0) {
    pinMode(_pinA, INPUT_PULLUP);
    pinMode(_pinB, INPUT_PULLUP);
    pinMode(_btnPin, INPUT_PULLUP);
    _lastA = digitalRead(_pinA);
  }
  
  void update() {
    int a = digitalRead(_pinA);
    if (a != _lastA) {
      if (digitalRead(_pinB) != a) _position++;
      else _position--;
      _lastA = a;
    }
  }
  
  int32_t position() { return _position; }
  void reset() { _position = 0; }
  bool isPressed() { return _btnPin >= 0 && digitalRead(_btnPin) == LOW; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('IRRemote')) {
      code += `class IRRemote {
private:
  int _pin;
  unsigned long _lastCode;
  
public:
  IRRemote(int pin) : _pin(pin), _lastCode(0) { pinMode(_pin, INPUT); }
  
  bool available() { return false; }
  unsigned long read() { return _lastCode; }
  void resume() {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('RFID')) {
      code += `class RFID {
private:
  int _ssPin, _rstPin;
  
public:
  RFID(int ssPin, int rstPin) : _ssPin(ssPin), _rstPin(rstPin) {
    pinMode(_ssPin, OUTPUT);
    pinMode(_rstPin, OUTPUT);
  }
  
  void begin() {}
  bool cardPresent() { return false; }
  String readUID() { return ""; }
};

`;
    }
    
    // Display types
    if (this.usedHardwareTypes.has('LCD')) {
      code += `class LCD {
private:
  int _cols, _rows;
  int _rs, _en, _d4, _d5, _d6, _d7;
  
public:
  LCD(int rs, int en, int d4, int d5, int d6, int d7, int cols = 16, int rows = 2) 
    : _rs(rs), _en(en), _d4(d4), _d5(d5), _d6(d6), _d7(d7), _cols(cols), _rows(rows) {}
  
  void begin() {}
  void clear() {}
  void home() {}
  void setCursor(int col, int row) {}
  void print(const char* text) {}
  void print(int value) {}
  void print(float value) {}
  void backlight() {}
  void noBacklight() {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('OLED')) {
      code += `class OLED {
private:
  int _width, _height;
  int _address;
  
public:
  OLED(int width = 128, int height = 64, int address = 0x3C) : _width(width), _height(height), _address(address) {}
  
  void begin() {}
  void clear() {}
  void display() {}
  void setCursor(int x, int y) {}
  void print(const char* text) {}
  void print(int value) {}
  void drawPixel(int x, int y, bool color = true) {}
  void drawLine(int x0, int y0, int x1, int y1) {}
  void drawRect(int x, int y, int w, int h) {}
  void fillRect(int x, int y, int w, int h) {}
  void drawCircle(int x, int y, int r) {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('SevenSegment')) {
      code += `class SevenSegment {
private:
  int _pins[8];
  bool _commonCathode;
  
public:
  SevenSegment(int a, int b, int c, int d, int e, int f, int g, bool commonCathode = true) : _commonCathode(commonCathode) {
    _pins[0] = a; _pins[1] = b; _pins[2] = c; _pins[3] = d;
    _pins[4] = e; _pins[5] = f; _pins[6] = g;
    for (int i = 0; i < 7; i++) pinMode(_pins[i], OUTPUT);
  }
  
  void display(int digit) {
    const uint8_t segments[] = {0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F};
    if (digit < 0 || digit > 9) return;
    uint8_t seg = segments[digit];
    for (int i = 0; i < 7; i++) {
      bool on = (seg >> i) & 1;
      digitalWrite(_pins[i], _commonCathode ? on : !on);
    }
  }
  
  void clear() {
    for (int i = 0; i < 7; i++) digitalWrite(_pins[i], _commonCathode ? LOW : HIGH);
  }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Matrix')) {
      code += `class Matrix {
private:
  int _dataPin, _clockPin, _csPin;
  int _numDevices;
  
public:
  Matrix(int dataPin, int clockPin, int csPin, int numDevices = 1) 
    : _dataPin(dataPin), _clockPin(clockPin), _csPin(csPin), _numDevices(numDevices) {
    pinMode(_dataPin, OUTPUT);
    pinMode(_clockPin, OUTPUT);
    pinMode(_csPin, OUTPUT);
  }
  
  void begin() {}
  void clear() {}
  void setPixel(int x, int y, bool on = true) {}
  void setRow(int row, uint8_t value) {}
  void setColumn(int col, uint8_t value) {}
  void setBrightness(int level) {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('TFT')) {
      code += `class TFT {
private:
  int _csPin, _dcPin, _rstPin;
  int _width, _height;
  
public:
  TFT(int csPin, int dcPin, int rstPin = -1, int width = 240, int height = 320) 
    : _csPin(csPin), _dcPin(dcPin), _rstPin(rstPin), _width(width), _height(height) {}
  
  void begin() {}
  void fillScreen(uint16_t color) {}
  void drawPixel(int x, int y, uint16_t color) {}
  void drawLine(int x0, int y0, int x1, int y1, uint16_t color) {}
  void drawRect(int x, int y, int w, int h, uint16_t color) {}
  void fillRect(int x, int y, int w, int h, uint16_t color) {}
  void drawCircle(int x, int y, int r, uint16_t color) {}
  void setCursor(int x, int y) {}
  void setTextColor(uint16_t color) {}
  void setTextSize(int size) {}
  void print(const char* text) {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('NeoPixel')) {
      code += `class NeoPixel {
private:
  int _pin;
  int _numLeds;
  uint8_t* _pixels;
  
public:
  NeoPixel(int pin, int numLeds) : _pin(pin), _numLeds(numLeds) {
    _pixels = new uint8_t[numLeds * 3];
    memset(_pixels, 0, numLeds * 3);
    pinMode(_pin, OUTPUT);
  }
  
  ~NeoPixel() { delete[] _pixels; }
  
  void begin() {}
  void show() {}
  void clear() { memset(_pixels, 0, _numLeds * 3); }
  void setPixel(int index, uint8_t r, uint8_t g, uint8_t b) {
    if (index >= 0 && index < _numLeds) {
      _pixels[index * 3] = r;
      _pixels[index * 3 + 1] = g;
      _pixels[index * 3 + 2] = b;
    }
  }
  void setBrightness(uint8_t brightness) {}
  void fill(uint8_t r, uint8_t g, uint8_t b) {
    for (int i = 0; i < _numLeds; i++) setPixel(i, r, g, b);
  }
  int numPixels() { return _numLeds; }
};

`;
    }
    
    // Actuator types
    if (this.usedHardwareTypes.has('Relay')) {
      code += `class Relay {
private:
  int _pin;
  bool _activeLow;
  bool _state;
  
public:
  Relay(int pin) : _pin(pin), _activeLow(true), _state(false) {
    pinMode(_pin, OUTPUT);
    off();
  }
  
  Relay(int pin, bool activeLow) : _pin(pin), _activeLow(activeLow), _state(false) {
    pinMode(_pin, OUTPUT);
    off();
  }
  
  void on() { _state = true; digitalWrite(_pin, _activeLow ? LOW : HIGH); }
  void off() { _state = false; digitalWrite(_pin, _activeLow ? HIGH : LOW); }
  void toggle() { _state ? off() : on(); }
  bool isOn() { return _state; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Solenoid')) {
      code += `class Solenoid {
private:
  int _pin;
  bool _state;
  
public:
  Solenoid(int pin) : _pin(pin), _state(false) { pinMode(_pin, OUTPUT); off(); }
  
  void activate() { _state = true; digitalWrite(_pin, HIGH); }
  void deactivate() { _state = false; digitalWrite(_pin, LOW); }
  void pulse(unsigned long durationMs) { activate(); delay(durationMs); deactivate(); }
  bool isActive() { return _state; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Fan')) {
      code += `class Fan {
private:
  int _pin;
  int _speed;
  
public:
  Fan(int pin) : _pin(pin), _speed(0) { pinMode(_pin, OUTPUT); }
  
  void on() { setSpeed(255); }
  void off() { setSpeed(0); }
  void setSpeed(int speed) { _speed = constrain(speed, 0, 255); analogWrite(_pin, _speed); }
  int getSpeed() { return _speed; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Heater')) {
      code += `class Heater {
private:
  int _pin;
  int _power;
  
public:
  Heater(int pin) : _pin(pin), _power(0) { pinMode(_pin, OUTPUT); }
  
  void on() { setPower(255); }
  void off() { setPower(0); }
  void setPower(int power) { _power = constrain(power, 0, 255); analogWrite(_pin, _power); }
  int getPower() { return _power; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Pump')) {
      code += `class Pump {
private:
  int _pin;
  int _speed;
  
public:
  Pump(int pin) : _pin(pin), _speed(0) { pinMode(_pin, OUTPUT); }
  
  void on() { setSpeed(255); }
  void off() { setSpeed(0); }
  void setSpeed(int speed) { _speed = constrain(speed, 0, 255); analogWrite(_pin, _speed); }
  int getSpeed() { return _speed; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Valve')) {
      code += `class Valve {
private:
  int _pin;
  bool _state;
  
public:
  Valve(int pin) : _pin(pin), _state(false) { pinMode(_pin, OUTPUT); close(); }
  
  void open() { _state = true; digitalWrite(_pin, HIGH); }
  void close() { _state = false; digitalWrite(_pin, LOW); }
  bool isOpen() { return _state; }
};

`;
    }
    
    // Communication types
    if (this.usedHardwareTypes.has('Bluetooth')) {
      code += `class Bluetooth {
private:
  int _rxPin, _txPin;
  long _baud;
  
public:
  Bluetooth(int rxPin, int txPin, long baud = 9600) : _rxPin(rxPin), _txPin(txPin), _baud(baud) {}
  
  void begin() {}
  bool available() { return false; }
  char read() { return 0; }
  void print(const char* text) {}
  void println(const char* text) {}
  bool isConnected() { return false; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('WiFi')) {
      code += `class WiFi {
private:
  String _ssid;
  String _password;
  bool _connected;
  
public:
  WiFi() : _connected(false) {}
  
  bool connect(const char* ssid, const char* password) { _ssid = ssid; _password = password; return false; }
  void disconnect() { _connected = false; }
  bool isConnected() { return _connected; }
  String localIP() { return "0.0.0.0"; }
  int rssi() { return 0; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('LoRa')) {
      code += `class LoRa {
private:
  int _ssPin, _rstPin, _dioPin;
  long _frequency;
  
public:
  LoRa(int ssPin, int rstPin, int dioPin) : _ssPin(ssPin), _rstPin(rstPin), _dioPin(dioPin), _frequency(915000000) {}
  
  bool begin(long frequency = 915000000) { _frequency = frequency; return false; }
  void end() {}
  int available() { return 0; }
  int read() { return -1; }
  void write(uint8_t byte) {}
  void print(const char* text) {}
  int packetRssi() { return 0; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('CAN')) {
      code += `class CAN {
private:
  int _csPin;
  long _speed;
  
public:
  CAN(int csPin, long speed = 500000) : _csPin(csPin), _speed(speed) {}
  
  bool begin() { return false; }
  bool send(uint32_t id, uint8_t* data, uint8_t len) { return false; }
  bool receive(uint32_t* id, uint8_t* data, uint8_t* len) { return false; }
  bool available() { return false; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('RS485')) {
      code += `class RS485 {
private:
  int _txPin, _rxPin, _dePin;
  long _baud;
  
public:
  RS485(int txPin, int rxPin, int dePin, long baud = 9600) : _txPin(txPin), _rxPin(rxPin), _dePin(dePin), _baud(baud) {
    pinMode(_dePin, OUTPUT);
    digitalWrite(_dePin, LOW);
  }
  
  void begin() {}
  void enableTx() { digitalWrite(_dePin, HIGH); }
  void enableRx() { digitalWrite(_dePin, LOW); }
  void write(uint8_t byte) {}
  int read() { return -1; }
  bool available() { return false; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Ethernet')) {
      code += `class Ethernet {
private:
  int _csPin;
  uint8_t _mac[6];
  
public:
  Ethernet(int csPin) : _csPin(csPin) {
    _mac[0] = 0xDE; _mac[1] = 0xAD; _mac[2] = 0xBE;
    _mac[3] = 0xEF; _mac[4] = 0xFE; _mac[5] = 0xED;
  }
  
  bool begin() { return false; }
  bool begin(uint8_t* ip) { return false; }
  String localIP() { return "0.0.0.0"; }
  bool linkStatus() { return false; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('NRF24')) {
      code += `class NRF24 {
private:
  int _cePin, _csPin;
  
public:
  NRF24(int cePin, int csPin) : _cePin(cePin), _csPin(csPin) {}
  
  bool begin() { return false; }
  void openWritingPipe(uint64_t address) {}
  void openReadingPipe(uint8_t pipe, uint64_t address) {}
  void startListening() {}
  void stopListening() {}
  bool available() { return false; }
  bool write(void* data, uint8_t len) { return false; }
  void read(void* data, uint8_t len) {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('ZigBee')) {
      code += `class ZigBee {
private:
  int _rxPin, _txPin;
  
public:
  ZigBee(int rxPin, int txPin) : _rxPin(rxPin), _txPin(txPin) {}
  
  void begin(long baud = 9600) {}
  bool available() { return false; }
  int read() { return -1; }
  void write(uint8_t byte) {}
  void send(uint8_t* data, uint8_t len) {}
};

`;
    }
    
    // Storage types
    if (this.usedHardwareTypes.has('SDCard')) {
      code += `class SDCard {
private:
  int _csPin;
  bool _initialized;
  
public:
  SDCard(int csPin) : _csPin(csPin), _initialized(false) {}
  
  bool begin() { _initialized = true; return false; }
  bool exists(const char* filename) { return false; }
  bool remove(const char* filename) { return false; }
  bool mkdir(const char* path) { return false; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('EEPROM')) {
      code += `class EEPROM {
private:
  int _size;
  
public:
  EEPROM(int size = 512) : _size(size) {}
  
  uint8_t read(int address) { return 0; }
  void write(int address, uint8_t value) {}
  void update(int address, uint8_t value) {}
  int length() { return _size; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Flash')) {
      code += `class Flash {
private:
  int _size;
  
public:
  Flash(int size = 4096) : _size(size) {}
  
  bool begin() { return false; }
  uint8_t read(uint32_t address) { return 0; }
  void write(uint32_t address, uint8_t value) {}
  void erase(uint32_t address, uint32_t length) {}
  int size() { return _size; }
};

`;
    }
    
    // Power types
    if (this.usedHardwareTypes.has('Battery')) {
      code += `class Battery {
private:
  int _pin;
  float _maxVoltage;
  float _minVoltage;
  
public:
  Battery(int pin, float maxVoltage = 4.2, float minVoltage = 3.0) 
    : _pin(pin), _maxVoltage(maxVoltage), _minVoltage(minVoltage) { pinMode(_pin, INPUT); }
  
  float readVoltage() { return analogRead(_pin) * _maxVoltage / 1023.0; }
  int readPercent() {
    float v = readVoltage();
    int pct = (v - _minVoltage) / (_maxVoltage - _minVoltage) * 100;
    return constrain(pct, 0, 100);
  }
  bool isLow(int threshold = 20) { return readPercent() < threshold; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Solar')) {
      code += `class Solar {
private:
  int _voltagePin;
  int _currentPin;
  float _maxVoltage;
  
public:
  Solar(int voltagePin) : _voltagePin(voltagePin), _currentPin(-1), _maxVoltage(5.0) { pinMode(_voltagePin, INPUT); }
  Solar(int voltagePin, int currentPin) : _voltagePin(voltagePin), _currentPin(currentPin), _maxVoltage(5.0) {
    pinMode(_voltagePin, INPUT);
    if (_currentPin >= 0) pinMode(_currentPin, INPUT);
  }
  
  float readVoltage() { return analogRead(_voltagePin) * _maxVoltage / 1023.0; }
  float readCurrent() { return _currentPin >= 0 ? analogRead(_currentPin) * 5.0 / 1023.0 : 0; }
  float readPower() { return readVoltage() * readCurrent(); }
};

`;
    }
    
    // Motor driver types
    if (this.usedHardwareTypes.has('HBridge')) {
      code += `class HBridge {
private:
  int _in1, _in2, _enPin;
  bool _hasEnable;
  
public:
  HBridge(int in1, int in2) : _in1(in1), _in2(in2), _enPin(-1), _hasEnable(false) {
    pinMode(_in1, OUTPUT);
    pinMode(_in2, OUTPUT);
  }
  
  HBridge(int in1, int in2, int enPin) : _in1(in1), _in2(in2), _enPin(enPin), _hasEnable(true) {
    pinMode(_in1, OUTPUT);
    pinMode(_in2, OUTPUT);
    pinMode(_enPin, OUTPUT);
  }
  
  void forward(int speed = 255) {
    if (_hasEnable) analogWrite(_enPin, speed);
    digitalWrite(_in1, HIGH);
    digitalWrite(_in2, LOW);
  }
  
  void reverse(int speed = 255) {
    if (_hasEnable) analogWrite(_enPin, speed);
    digitalWrite(_in1, LOW);
    digitalWrite(_in2, HIGH);
  }
  
  void stop() {
    digitalWrite(_in1, LOW);
    digitalWrite(_in2, LOW);
    if (_hasEnable) analogWrite(_enPin, 0);
  }
  
  void brake() {
    digitalWrite(_in1, HIGH);
    digitalWrite(_in2, HIGH);
  }
};

`;
    }
    
    if (this.usedHardwareTypes.has('MotorDriver')) {
      code += `class MotorDriver {
private:
  int _pwmA, _dirA, _pwmB, _dirB;
  
public:
  MotorDriver(int pwmA, int dirA, int pwmB, int dirB) : _pwmA(pwmA), _dirA(dirA), _pwmB(pwmB), _dirB(dirB) {
    pinMode(_pwmA, OUTPUT);
    pinMode(_dirA, OUTPUT);
    pinMode(_pwmB, OUTPUT);
    pinMode(_dirB, OUTPUT);
  }
  
  void setMotorA(int speed) {
    digitalWrite(_dirA, speed >= 0 ? HIGH : LOW);
    analogWrite(_pwmA, abs(speed));
  }
  
  void setMotorB(int speed) {
    digitalWrite(_dirB, speed >= 0 ? HIGH : LOW);
    analogWrite(_pwmB, abs(speed));
  }
  
  void stopAll() { setMotorA(0); setMotorB(0); }
};

`;
    }
    
    if (this.usedHardwareTypes.has('ServoDriver')) {
      code += `class ServoDriver {
private:
  int _address;
  int _numChannels;
  
public:
  ServoDriver(int address = 0x40, int numChannels = 16) : _address(address), _numChannels(numChannels) {}
  
  void begin() {}
  void setPWMFreq(float freq) {}
  void setAngle(int channel, int angle) {}
  void setPulse(int channel, int pulse) {}
  int numChannels() { return _numChannels; }
};

`;
    }
    
    // Timing types
    if (this.usedHardwareTypes.has('RTC')) {
      code += `class RTC {
private:
  int _address;
  
public:
  RTC(int address = 0x68) : _address(address) {}
  
  void begin() {}
  int hour() { return 0; }
  int minute() { return 0; }
  int second() { return 0; }
  int day() { return 1; }
  int month() { return 1; }
  int year() { return 2024; }
  void setTime(int h, int m, int s) {}
  void setDate(int d, int mo, int y) {}
};

`;
    }
    
    if (this.usedHardwareTypes.has('Timer')) {
      code += `class Timer {
private:
  unsigned long _startTime;
  unsigned long _duration;
  bool _running;
  
public:
  Timer() : _startTime(0), _duration(0), _running(false) {}
  
  void start(unsigned long durationMs) { _startTime = millis(); _duration = durationMs; _running = true; }
  void stop() { _running = false; }
  void reset() { _startTime = millis(); }
  bool isExpired() { return _running && (millis() - _startTime >= _duration); }
  bool isRunning() { return _running && !isExpired(); }
  unsigned long remaining() { return _running ? (_duration - (millis() - _startTime)) : 0; }
  unsigned long elapsed() { return _running ? (millis() - _startTime) : 0; }
};

`;
    }
    
    // Audio types
    if (this.usedHardwareTypes.has('Speaker')) {
      code += `class Speaker {
private:
  int _pin;
  
public:
  Speaker(int pin) : _pin(pin) { pinMode(_pin, OUTPUT); }
  
  void tone(uint16_t freq) { ::tone(_pin, freq); }
  void tone(uint16_t freq, unsigned long duration) { ::tone(_pin, freq, duration); }
  void noTone() { ::noTone(_pin); }
  void beep(uint16_t freq, unsigned long duration) { tone(freq, duration); }
  void playNote(char note, int octave, unsigned long duration) {
    int notes[] = {262, 294, 330, 349, 392, 440, 494};
    int idx = (note >= 'A' && note <= 'G') ? note - 'A' : 0;
    int freq = notes[idx] * (1 << (octave - 4));
    tone(freq, duration);
  }
};

`;
    }
    
    if (this.usedHardwareTypes.has('Microphone')) {
      code += `class Microphone {
private:
  int _pin;
  int _threshold;
  
public:
  Microphone(int pin) : _pin(pin), _threshold(512) { pinMode(_pin, INPUT); }
  
  int read() { return analogRead(_pin); }
  int readAmplitude() { return abs(analogRead(_pin) - 512); }
  bool isLoud() { return readAmplitude() > _threshold; }
  void setThreshold(int threshold) { _threshold = threshold; }
};

`;
    }
    
    if (this.usedHardwareTypes.has('DFPlayer')) {
      code += `class DFPlayer {
private:
  int _rxPin, _txPin;
  int _volume;
  
public:
  DFPlayer(int rxPin, int txPin) : _rxPin(rxPin), _txPin(txPin), _volume(15) {}
  
  void begin() {}
  void play(int track) {}
  void pause() {}
  void stop() {}
  void next() {}
  void previous() {}
  void setVolume(int vol) { _volume = constrain(vol, 0, 30); }
  int getVolume() { return _volume; }
  void playFolder(int folder, int track) {}
};

`;
    }
    
    return code;
  }

  // Generate built-in collection type classes
  generateCollectionTypes() {
    // Only generate if any collection types are used
    if (this.usedCollectionTypes.size === 0) {
      return '';
    }
    
    let code = '// Built-in Collection Types\n';
    
    // Add includes only for the collection types that are used
    if (this.usedCollectionTypes.has('List')) {
      code += '#include <vector>\n';
    }
    if (this.usedCollectionTypes.has('Map')) {
      code += '#include <map>\n';
    }
    code += '\n';
    
    // List class (wrapper around std::vector)
    if (this.usedCollectionTypes.has('List')) {
      code += `template<typename T>
class List {
private:
  std::vector<T> _data;
  
public:
  List() {}
  
  List(std::initializer_list<T> init) : _data(init) {}
  
  void push(T value) {
    _data.push_back(value);
  }
  
  T pop() {
    if (_data.empty()) return T();
    T value = _data.back();
    _data.pop_back();
    return value;
  }
  
  int length() {
    return _data.size();
  }
  
  T get(int index) {
    if (index >= 0 && index < _data.size()) {
      return _data[index];
    }
    return T();
  }
  
  void set(int index, T value) {
    if (index >= 0 && index < _data.size()) {
      _data[index] = value;
    }
  }
};

`;
    }
    
    // Map class (wrapper around std::map)
    if (this.usedCollectionTypes.has('Map')) {
      code += `template<typename K, typename V>
class Map {
private:
  std::map<K, V> _data;
  
public:
  Map() {}
  
  V get(K key) {
    auto it = _data.find(key);
    if (it != _data.end()) {
      return it->second;
    }
    return V();
  }
  
  void set(K key, V value) {
    _data[key] = value;
  }
  
  bool has(K key) {
    return _data.find(key) != _data.end();
  }
  
  void remove(K key) {
    _data.erase(key);
  }
  
  int size() {
    return _data.size();
  }
};

`;
    }
    
    return code;
  }
}

module.exports = { CodeGenerator };
