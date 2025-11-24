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
        'Led', 'RgbLed', 'Button', 'Buzzer'
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
