/**
 * Ypsilon Script Semantic Analyzer
 * Performs semantic analysis including:
 * - Variable declaration tracking
 * - Undeclared variable detection
 * - Scope management
 * - Platform-specific restrictions (e.g., List/Map on AVR)
 */

const { Config } = require('./config');

class SemanticAnalyzer {
  constructor(ast, config = null) {
    this.ast = ast;
    this.config = config; // Config object for platform-specific checks
    this.errors = [];
    this.warnings = [];
    // Stack of scopes, each scope is a Set of variable names
    this.scopes = [new Set()]; // Start with global scope
    // Track all declared identifiers for suggestions
    this.allDeclaredNames = new Set();
    
    // Declare built-in functions and constants
    this.declareBuiltins();
  }

  // Declare all built-in functions and constants
  declareBuiltins() {
    const builtins = [
      // Arduino functions
      'pinMode', 'digitalWrite', 'digitalRead',
      'analogRead', 'analogWrite', 'analogReference',
      'delay', 'delayMicroseconds', 'millis', 'micros',
      'attachInterrupt', 'detachInterrupt',
      'tone', 'noTone',
      'shiftOut', 'shiftIn', 'pulseIn', 'pulseInLong',
      'map', 'constrain', 'abs', 'min', 'max', 'pow', 'sqrt',
      'sin', 'cos', 'tan',
      'randomSeed', 'random',
      'lowByte', 'highByte', 'bitRead', 'bitWrite', 'bitSet', 'bitClear', 'bit',
      
      // Serial/Print functions
      'print', 'println',
      
      // Arduino constants
      'HIGH', 'LOW',
      'INPUT', 'OUTPUT', 'INPUT_PULLUP',
      'LED_BUILTIN',
      'true', 'false',
      
      // Interrupt modes
      'RISING', 'FALLING', 'CHANGE', 'LOW',
      
      // Math constants
      'PI',
      
      // Common C++ math functions
      'round', 'ceil', 'floor',
      
      // Analog pins (A0-A15 for various boards)
      'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
      'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15',
      
      // Digital pins with special names
      'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 
      'D8', 'D9', 'D10', 'D11', 'D12', 'D13',
      
      // SPI pins
      'SS', 'MOSI', 'MISO', 'SCK',
      
      // I2C pins
      'SDA', 'SCL'
    ];
    
    for (const builtin of builtins) {
      this.declare(builtin);
    }
  }

  analyze() {
    this.analyzeProgram(this.ast);
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  // Scope management
  pushScope() {
    this.scopes.push(new Set());
  }

  popScope() {
    this.scopes.pop();
  }

  getCurrentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  // Check if a variable is declared in any scope
  isDeclared(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return true;
      }
    }
    return false;
  }

  // Declare a variable in the current scope
  declare(name) {
    this.getCurrentScope().add(name);
    this.allDeclaredNames.add(name);
  }

  // Add an error with context
  addError(message, line) {
    this.errors.push({
      message,
      line: line || 'unknown'
    });
  }

  // Calculate Levenshtein distance for suggestions
  levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  // Find similar variable names for suggestions
  findSimilarNames(name) {
    const suggestions = [];
    // Use edit distance with threshold based on name length
    // For short names (≤6 chars), allow up to 3 edits
    // For longer names, allow edits up to half the length
    // This balances between being helpful and avoiding false suggestions
    const maxDistance = Math.max(3, Math.ceil(name.length / 2));
    
    for (const declaredName of this.allDeclaredNames) {
      const distance = this.levenshteinDistance(name.toLowerCase(), declaredName.toLowerCase());
      if (distance <= maxDistance) {
        suggestions.push({ name: declaredName, distance });
      }
    }
    
    // Sort by distance and return top 3
    return suggestions
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(s => s.name);
  }

  // Main program analysis
  analyzeProgram(program) {
    if (!program || !program.body) return;

    for (const stmt of program.body) {
      this.analyzeStatement(stmt);
    }
  }

  analyzeStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case 'MainDirective':
      case 'ConfigBlock':
        // These don't need analysis
        break;

      case 'ClassDeclaration':
        this.analyzeClassDeclaration(stmt);
        break;

      case 'EnumDeclaration':
        // Declare enum name
        this.declare(stmt.name);
        // Declare enum values as constants
        if (stmt.values) {
          stmt.values.forEach(value => this.declare(value));
        }
        break;

      case 'StructDeclaration':
        // Declare struct name
        this.declare(stmt.name);
        break;

      case 'FunctionDeclaration':
        this.analyzeFunctionDeclaration(stmt);
        break;

      case 'VariableDeclaration':
        this.analyzeVariableDeclaration(stmt);
        break;

      case 'OnBlock':
        this.analyzeOnBlock(stmt);
        break;

      case 'InterruptBlock':
        this.analyzeInterruptBlock(stmt);
        break;

      case 'TaskDeclaration':
        this.analyzeTaskDeclaration(stmt);
        break;

      case 'SignalDeclaration':
        // Declare signal name
        if (stmt.name) {
          this.declare(stmt.name);
        }
        break;

      case 'ReactDeclaration':
        if (stmt.name) {
          this.declare(stmt.name);
        }
        if (stmt.init) {
          this.analyzeExpression(stmt.init);
        }
        break;

      case 'LoadStatement':
        // Handle .ys module loading - declare the module namespace
        if (stmt.isYsFile && stmt.moduleName) {
          this.declare(stmt.moduleName);
        }
        break;

      case 'UseStatement':
        // UseStatement doesn't declare variables
        break;

      case 'AliasStatement':
        // Alias declares a constant identifier
        if (stmt.name) {
          this.declare(stmt.name);
        }
        break;

      case 'IfStatement':
        this.analyzeIfStatement(stmt);
        break;

      case 'WhileStatement':
        this.analyzeWhileStatement(stmt);
        break;

      case 'ForStatement':
        this.analyzeForStatement(stmt);
        break;

      case 'RepeatStatement':
        this.analyzeRepeatStatement(stmt);
        break;

      case 'ReturnStatement':
        if (stmt.argument) {
          this.analyzeExpression(stmt.argument);
        }
        break;

      case 'ExpressionStatement':
        this.analyzeExpression(stmt.expression);
        break;

      case 'MatchStatement':
        this.analyzeMatchStatement(stmt);
        break;

      case 'SwitchStatement':
        this.analyzeSwitchStatement(stmt);
        break;

      case 'EmitStatement':
        if (stmt.signal) {
          this.analyzeExpression(stmt.signal);
        }
        break;

      case 'AtomicBlock':
        this.analyzeBlockStatements(stmt.body);
        break;

      case 'TimeoutStatement':
        if (stmt.duration) {
          this.analyzeExpression(stmt.duration);
        }
        this.analyzeBlockStatements(stmt.body);
        break;

      case 'CppBlock':
        // Inline C++ code - skip analysis
        break;

      default:
        // Unknown statement type
        break;
    }
  }

  analyzeClassDeclaration(stmt) {
    // Declare class name
    this.declare(stmt.name);

    // Push a new scope for class members
    this.pushScope();

    // Declare all properties
    if (stmt.properties) {
      stmt.properties.forEach(prop => {
        this.declare(prop.name);
        if (prop.init) {
          this.analyzeExpression(prop.init);
        }
      });
    }

    // Analyze constructor
    if (stmt.constructor) {
      this.pushScope();
      stmt.constructor.params.forEach(param => this.declare(param.name));
      this.analyzeBlockStatements(stmt.constructor.body);
      this.popScope();
    }

    // Analyze methods
    if (stmt.methods) {
      stmt.methods.forEach(method => {
        this.pushScope();
        method.params.forEach(param => this.declare(param.name));
        this.analyzeBlockStatements(method.body);
        this.popScope();
      });
    }

    this.popScope();
  }

  analyzeFunctionDeclaration(stmt) {
    // Declare function name
    this.declare(stmt.name);

    // Push a new scope for function parameters
    this.pushScope();

    // Declare parameters
    if (stmt.params) {
      stmt.params.forEach(param => this.declare(param.name));
    }

    // Analyze function body
    this.analyzeBlockStatements(stmt.body);

    this.popScope();
  }

  analyzeVariableDeclaration(stmt) {
    // Check for List/Map usage on AVR boards
    if (this.config && this.config.isAVRBoard()) {
      const restrictedTypes = ['List', 'Map'];
      if (stmt.varType && restrictedTypes.includes(stmt.varType)) {
        const board = this.config.options.board;
        this.addError(
          `Collection type '${stmt.varType}' is not supported on AVR targets (${board}) due to insufficient RAM.\n` +
          `  AVR boards have very limited memory and cannot support std::vector and std::map.\n` +
          `  Consider using arrays or simpler data structures, or target a board with more RAM (e.g., ESP32).`,
          stmt.line
        );
      }
    }

    // Important: Analyze the initialization expression BEFORE declaring the variable
    // This prevents cases like "mut int x = x + 1" from being valid
    // The right-hand side should only reference previously declared variables
    if (stmt.init) {
      this.analyzeExpression(stmt.init);
    }

    // Then declare the variable so it's available in subsequent statements
    this.declare(stmt.name);
  }

  analyzeOnBlock(stmt) {
    // On blocks create their own scope
    this.pushScope();
    this.analyzeBlockStatements(stmt.body);
    this.popScope();
  }

  analyzeInterruptBlock(stmt) {
    // Interrupt blocks create their own scope
    this.pushScope();
    
    // The pin and mode are expressions that need checking
    if (stmt.pin) {
      this.analyzeExpression(stmt.pin);
    }

    this.analyzeBlockStatements(stmt.body);
    this.popScope();
  }

  analyzeTaskDeclaration(stmt) {
    // Tasks create their own scope
    this.pushScope();

    if (stmt.interval) {
      this.analyzeExpression(stmt.interval);
    }

    this.analyzeBlockStatements(stmt.body);
    this.popScope();
  }

  analyzeIfStatement(stmt) {
    this.analyzeExpression(stmt.test);
    
    this.pushScope();
    this.analyzeBlockStatements(stmt.consequent);
    this.popScope();

    if (stmt.alternate) {
      this.pushScope();
      if (Array.isArray(stmt.alternate)) {
        this.analyzeBlockStatements(stmt.alternate);
      } else {
        this.analyzeStatement(stmt.alternate);
      }
      this.popScope();
    }
  }

  analyzeWhileStatement(stmt) {
    this.analyzeExpression(stmt.test);
    
    this.pushScope();
    this.analyzeBlockStatements(stmt.body);
    this.popScope();
  }

  analyzeForStatement(stmt) {
    this.pushScope();

    // Declare loop variable
    if (stmt.variable) {
      this.declare(stmt.variable);
    }

    if (stmt.init) {
      this.analyzeExpression(stmt.init);
    }

    if (stmt.test) {
      this.analyzeExpression(stmt.test);
    }

    if (stmt.update) {
      this.analyzeExpression(stmt.update);
    }

    this.analyzeBlockStatements(stmt.body);
    this.popScope();
  }

  analyzeRepeatStatement(stmt) {
    if (stmt.count) {
      this.analyzeExpression(stmt.count);
    }

    this.pushScope();
    this.analyzeBlockStatements(stmt.body);
    this.popScope();
  }

  analyzeMatchStatement(stmt) {
    this.analyzeExpression(stmt.discriminant);

    if (stmt.cases) {
      stmt.cases.forEach(matchCase => {
        if (matchCase.pattern) {
          this.analyzeExpression(matchCase.pattern);
        }
        this.pushScope();
        this.analyzeBlockStatements(matchCase.consequent);
        this.popScope();
      });
    }
  }

  analyzeSwitchStatement(stmt) {
    this.analyzeExpression(stmt.discriminant);

    if (stmt.cases) {
      stmt.cases.forEach(caseStmt => {
        if (caseStmt.test) {
          this.analyzeExpression(caseStmt.test);
        }
        this.pushScope();
        this.analyzeBlockStatements(caseStmt.consequent);
        this.popScope();
      });
    }
  }

  analyzeBlockStatements(statements) {
    if (!statements || !Array.isArray(statements)) return;

    for (const stmt of statements) {
      this.analyzeStatement(stmt);
    }
  }

  analyzeExpression(expr) {
    if (!expr) return;

    switch (expr.type) {
      case 'Identifier':
        // Check if identifier is declared
        if (!this.isDeclared(expr.name)) {
          const suggestions = this.findSimilarNames(expr.name);
          let errorMsg = `Undefined variable '${expr.name}'`;
          
          if (suggestions.length > 0) {
            errorMsg += `\n  Did you mean '${suggestions[0]}'?`;
            if (suggestions.length > 1) {
              errorMsg += ` Or perhaps: ${suggestions.slice(1).map(s => `'${s}'`).join(', ')}`;
            }
          }
          
          this.addError(errorMsg, expr.line);
        }
        break;

      case 'MemberExpression':
        // Only check the object, not the property
        this.analyzeExpression(expr.object);
        break;

      case 'CallExpression':
        // Analyze callee
        if (expr.callee) {
          this.analyzeExpression(expr.callee);
        }
        // Analyze arguments
        if (expr.arguments) {
          expr.arguments.forEach(arg => this.analyzeExpression(arg));
        }
        break;

      case 'BinaryExpression':
        this.analyzeExpression(expr.left);
        this.analyzeExpression(expr.right);
        break;

      case 'UnaryExpression':
        this.analyzeExpression(expr.argument);
        break;

      case 'AssignmentExpression':
        this.analyzeExpression(expr.left);
        this.analyzeExpression(expr.right);
        break;

      case 'NewExpression':
        // New expressions create new objects, arguments need checking
        if (expr.arguments) {
          expr.arguments.forEach(arg => this.analyzeExpression(arg));
        }
        break;

      case 'TypeConversion':
        this.analyzeExpression(expr.expression);
        break;

      case 'ErrorHandler':
        this.analyzeExpression(expr.expression);
        if (expr.handler && expr.handler.body) {
          this.pushScope();
          this.analyzeBlockStatements(expr.handler.body);
          this.popScope();
        }
        break;

      case 'Literal':
      case 'ThisExpression':
        // These don't need checking
        break;

      default:
        // Unknown expression type
        break;
    }
  }
}

module.exports = { SemanticAnalyzer };
