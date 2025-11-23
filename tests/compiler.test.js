/**
 * Tests for Ypsilon Script Compiler - OOP, Strictly-Typed, Brace-Based
 */

const { compile } = require('../src/compiler');
const { Lexer, TOKEN_TYPES } = require('../src/lexer');
const { Parser } = require('../src/parser');

describe('Lexer', () => {
  test('should tokenize typed variable declaration', () => {
    const source = 'int x = 10;';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.TYPE_INT);
    expect(tokens[1].type).toBe(TOKEN_TYPES.IDENTIFIER);
    expect(tokens[1].value).toBe('x');
    expect(tokens[2].type).toBe(TOKEN_TYPES.ASSIGN);
    expect(tokens[3].type).toBe(TOKEN_TYPES.NUMBER);
    expect(tokens[3].value).toBe(10);
    expect(tokens[4].type).toBe(TOKEN_TYPES.SEMICOLON);
  });

  test('should tokenize function declaration with types', () => {
    const source = 'function void test()';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.FUNCTION);
    expect(tokens[1].type).toBe(TOKEN_TYPES.TYPE_VOID);
    expect(tokens[2].type).toBe(TOKEN_TYPES.IDENTIFIER);
    expect(tokens[3].type).toBe(TOKEN_TYPES.LPAREN);
    expect(tokens[4].type).toBe(TOKEN_TYPES.RPAREN);
  });

  test('should handle keywords including new OOP keywords', () => {
    const source = 'if while for return class new this constructor';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.IF);
    expect(tokens[1].type).toBe(TOKEN_TYPES.WHILE);
    expect(tokens[2].type).toBe(TOKEN_TYPES.FOR);
    expect(tokens[3].type).toBe(TOKEN_TYPES.RETURN);
    expect(tokens[4].type).toBe(TOKEN_TYPES.CLASS);
    expect(tokens[5].type).toBe(TOKEN_TYPES.NEW);
    expect(tokens[6].type).toBe(TOKEN_TYPES.THIS);
    expect(tokens[7].type).toBe(TOKEN_TYPES.CONSTRUCTOR);
  });

  test('should handle type keywords', () => {
    const source = 'int float bool string void';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.TYPE_INT);
    expect(tokens[1].type).toBe(TOKEN_TYPES.TYPE_FLOAT);
    expect(tokens[2].type).toBe(TOKEN_TYPES.TYPE_BOOL);
    expect(tokens[3].type).toBe(TOKEN_TYPES.TYPE_STRING);
    expect(tokens[4].type).toBe(TOKEN_TYPES.TYPE_VOID);
  });

  test('should tokenize braces', () => {
    const source = '{ }';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.LBRACE);
    expect(tokens[1].type).toBe(TOKEN_TYPES.RBRACE);
  });

  test('should tokenize strings', () => {
    const source = '"hello world"';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.STRING);
    expect(tokens[0].value).toBe('hello world');
  });

  test('should skip comments and not create newline tokens', () => {
    const source = '# This is a comment\nint x = 5;';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    // Should start directly with TYPE_INT, no NEWLINE tokens
    expect(tokens[0].type).toBe(TOKEN_TYPES.TYPE_INT);
  });
});

describe('Parser', () => {
  test('should parse typed variable declaration at top level (class instance)', () => {
    const source = 'LED myLED;';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.body[0].type).toBe('VariableDeclaration');
    expect(ast.body[0].name).toBe('myLED');
    expect(ast.body[0].varType).toBe('LED');
  });

  test('should parse const variable declaration', () => {
    const source = 'const int x = 10;';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.body[0].type).toBe('VariableDeclaration');
    expect(ast.body[0].name).toBe('x');
    expect(ast.body[0].kind).toBe('const');
    expect(ast.body[0].varType).toBe('int');
  });

  test('should parse function declaration with types', () => {
    const source = `function int test(int a, int b) {
      return a + b;
    }`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.body[0].type).toBe('FunctionDeclaration');
    expect(ast.body[0].name).toBe('test');
    expect(ast.body[0].returnType).toBe('int');
    expect(ast.body[0].params).toEqual([
      { type: 'int', name: 'a' },
      { type: 'int', name: 'b' }
    ]);
  });

  test('should parse if statement with braces', () => {
    const source = `function void test() {
      if (x > 5) {
        int y = 10;
      }
    }`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const funcBody = ast.body[0].body;
    expect(funcBody[0].type).toBe('IfStatement');
    expect(funcBody[0].test.type).toBe('BinaryExpression');
  });

  test('should parse class declaration', () => {
    const source = `class LED {
      int pin;
      
      constructor(int p) {
        this.pin = p;
      }
      
      void turnOn() {
        digitalWrite(this.pin, HIGH);
      }
    }`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.body[0].type).toBe('ClassDeclaration');
    expect(ast.body[0].name).toBe('LED');
    expect(ast.body[0].properties.length).toBe(1);
    expect(ast.body[0].constructor).toBeDefined();
    expect(ast.body[0].methods.length).toBe(1);
  });
});

describe('Compiler', () => {
  test('should compile simple blink program with new syntax', () => {
    const source = `const int LED_PIN = 13;

function void setup() {
    pinMode(LED_PIN, OUTPUT);
}

function void loop() {
    digitalWrite(LED_PIN, HIGH);
    delay(1000);
}`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('#include <Arduino.h>');
    expect(result.code).toContain('void setup()');
    expect(result.code).toContain('void loop()');
    expect(result.code).toContain('pinMode(LED_PIN, OUTPUT)');
  });

  test('should compile typed variable declarations', () => {
    const source = `const int LED_PIN = 13;
const float THRESHOLD = 3.5;`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('const int LED_PIN = 13;');
    expect(result.code).toContain('const float THRESHOLD = 3.5;');
  });

  test('should compile if statements with braces', () => {
    const source = `function void loop() {
      int x = 10;
      if (x > 5) {
        digitalWrite(13, HIGH);
      } else {
        digitalWrite(13, LOW);
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('if (');
    expect(result.code).toContain('} else {');
  });

  test('should compile for loops with new syntax', () => {
    const source = `function void loop() {
      for (int i = 0; i < 10; i = i + 1) {
        delay(100);
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('for (int i = 0;');
  });

  test('should compile while loops', () => {
    const source = `function void loop() {
      int x = 0;
      while (x < 10) {
        int y = 5;
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('while (');
  });

  test('should handle logical operators', () => {
    const source = `function void loop() {
      int x = 10;
      int y = 5;
      if (x > 5 and y < 10) {
        int z = 1;
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('&&');
  });

  test('should compile classes', () => {
    const source = `class LED {
      int pin;
      
      constructor(int p) {
        this.pin = p;
      }
      
      void turnOn() {
        digitalWrite(this.pin, HIGH);
      }
    }
    
    LED myLED;
    
    function void setup() {
      myLED = new LED(13);
    }
    
    function void loop() {
      myLED.turnOn();
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('class LED');
    expect(result.code).toContain('LED(int p)');
    expect(result.code).toContain('void turnOn()');
    expect(result.code).toContain('LED myLED;');
  });

  test('should report errors for invalid syntax', () => {
    const source = 'int x =';
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should auto-add Serial.begin when print is used', () => {
    const source = `function void setup() {
      print("Hello");
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('Serial.begin(9600)');
    expect(result.code).toContain('Serial.println');
  });

  test('should handle negative numbers in expressions', () => {
    const source = `function void loop() {
      int x = -5;
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('-5');
  });

  test('should compile functions with typed parameters', () => {
    const source = `function int add(int a, int b) {
      return a + b;
    }
    
    function void setup() {
      int result = add(5, 3);
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('int add(int a, int b)');
  });

  test('should work without semicolons', () => {
    const source = `const int LED = 13
    
    function start() {
      pinMode(LED, OUTPUT)
    }
    
    function loop() {
      digitalWrite(LED, HIGH)
      delay(1000)
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('const int LED = 13;');
    expect(result.code).toContain('pinMode(LED, OUTPUT);');
  });

  test('should support start() function as alias for setup()', () => {
    const source = `function start() {
      pinMode(13, OUTPUT)
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('void setup()');
    expect(result.code).toContain('pinMode(13, OUTPUT);');
  });

  test('should infer return type from return statement', () => {
    const source = `function add(int a, int b) {
      return a + b
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('int add(int a, int b)');
  });

  test('should compile repeat loops', () => {
    const source = `function loop() {
      repeat(5) {
        digitalWrite(13, HIGH)
        delay(100)
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('for (int _repeat_i = 0; _repeat_i < 5; _repeat_i++)');
    expect(result.code).toContain('digitalWrite(13, HIGH);');
  });

  test('should handle mixed semicolons and no semicolons', () => {
    const source = `const int LED = 13;
    
    function loop() {
      digitalWrite(LED, HIGH);
      delay(1000)
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('digitalWrite(LED, HIGH);');
    expect(result.code).toContain('delay(1000);');
  });

  test('should infer float return type from float literal', () => {
    const source = `function getPi() {
      return 3.14
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('float getPi()');
  });

  test('should infer bool return type from comparison', () => {
    const source = `function isGreater(int a, int b) {
      return a > b
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('bool isGreater(int a, int b)');
  });
});

describe('New YS Syntax Features', () => {
  test('should compile mut keyword for mutable variables', () => {
    const source = `mut int counter = 0
    
    on loop {
      counter = counter + 1
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('int counter = 0;');
  });

  test('should compile fn keyword for functions', () => {
    const source = `fn add(int a, int b) -> int {
      return a + b
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('int add(int a, int b)');
  });

  test('should compile self keyword in classes', () => {
    const source = `class Motor {
      mut int speed
      
      constructor(int s) {
        self.speed = s
      }
      
      fn run() {
        print(self.speed)
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('class Motor');
    expect(result.code).toContain('this->speed');
  });

  test('should compile enum declarations', () => {
    const source = `enum Mode { AUTO, MANUAL, IDLE }
    
    mut Mode currentMode = AUTO`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('enum Mode');
    expect(result.code).toContain('AUTO');
    expect(result.code).toContain('MANUAL');
    expect(result.code).toContain('IDLE');
  });

  test('should compile struct declarations', () => {
    const source = `struct Point { x: int, y: int }
    
    mut Point pos`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('struct Point');
    expect(result.code).toContain('int x;');
    expect(result.code).toContain('int y;');
  });

  test('should compile match expressions', () => {
    const source = `fn test() {
      mut int x = 1
      match x {
        1 => print("one"),
        2 => print("two"),
        _ => print("other")
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('if');
    expect(result.code).toContain('else');
  });

  test('should compile switch statements', () => {
    const source = `fn test() {
      mut int x = 1
      switch x {
        case 1 { print("one") }
        case 2 { print("two") }
        default { print("other") }
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('switch');
    expect(result.code).toContain('case 1:');
    expect(result.code).toContain('default:');
  });

  test('should compile on start blocks', () => {
    const source = `on start {
      pinMode(13, OUTPUT)
    }
    
    on loop {
      digitalWrite(13, HIGH)
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('void setup()');
    expect(result.code).toContain('void loop()');
    expect(result.code).toContain('pinMode(13, OUTPUT)');
    expect(result.code).toContain('digitalWrite(13, HIGH)');
  });

  test('should compile signal declarations and emit', () => {
    const source = `signal buttonPress
    
    on start {
      emit buttonPress
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('volatile bool _signal_buttonPress');
    expect(result.code).toContain('_signal_buttonPress = true');
  });

  test('should compile task with interval', () => {
    const source = `task blink every 500ms {
      digitalWrite(13, HIGH)
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('_task_blink_last');
    expect(result.code).toContain('millis()');
    expect(result.code).toContain('500');
  });

  test('should compile background task', () => {
    const source = `task monitor background {
      print("monitoring")
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('// Background task: monitor');
  });

  test('should compile wait statement with time units', () => {
    const source = `fn test() {
      wait 100ms
      wait 2s
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('delay(100)');
    expect(result.code).toContain('delay(2000)');
  });

  test('should compile timeout statement', () => {
    const source = `fn test() {
      timeout 5s {
        print("waiting")
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('while');
    expect(result.code).toContain('millis()');
    expect(result.code).toContain('5000');
  });

  test('should compile atomic blocks', () => {
    const source = `fn test() {
      atomic {
        digitalWrite(13, HIGH)
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('noInterrupts()');
    expect(result.code).toContain('interrupts()');
  });

  test('should compile use statements', () => {
    const source = `use I2C1
    use SPI`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    // Use statements are tracked but may not generate direct code
  });

  test('should compile load statements', () => {
    const source = `load <servo>
    load <wifi>`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('#include <servo.h>');
    expect(result.code).toContain('#include <wifi.h>');
  });

  test('should parse .ys module with as keyword', () => {
    const source = `load <motor.ys> as m`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.ast.body[0].type).toBe('LoadStatement');
    expect(result.ast.body[0].isYsFile).toBe(true);
    expect(result.ast.body[0].library).toBe('motor.ys');
    expect(result.ast.body[0].moduleName).toBe('m');
  });

  test('should parse .ys module without as keyword', () => {
    const source = `load <motor.ys>`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.ast.body[0].type).toBe('LoadStatement');
    expect(result.ast.body[0].isYsFile).toBe(true);
    expect(result.ast.body[0].library).toBe('motor.ys');
    expect(result.ast.body[0].moduleName).toBe('motor');
  });

  test('should compile .ys module into namespace', () => {
    // Create a simple module
    const moduleSource = `class Motor {
      mut int speed
      constructor(int s) {
        self.speed = s
      }
      fn getSpeed() -> int {
        return self.speed
      }
    }
    
    fn helper() {
      print("helper")
    }`;
    
    const source = `load <motor.ys> as m
    
    fn start() {
      m.Motor motor = new m.Motor(100)
      m.helper()
    }`;
    
    const result = compile(source, {
      basePath: '/test',
      fileReader: (filePath) => {
        if (filePath.endsWith('motor.ys')) {
          return moduleSource;
        }
        throw new Error('File not found');
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('namespace m {');
    expect(result.code).toContain('class Motor');
    expect(result.code).toContain('void helper()');
    expect(result.code).toContain('}'); // namespace closing
  });

  test('should not generate #include for .ys files', () => {
    const source = `load <Servo>
    load <motor.ys>`;
    
    const result = compile(source, {
      fileReader: () => 'fn test() {}'
    });
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('#include <Servo.h>');
    expect(result.code).not.toContain('#include <motor.ys.h>');
    expect(result.code).not.toContain('#include <motor.h>');
  });

  test('should compile alias statements', () => {
    const source = `alias LED = D13
    alias BUTTON = D2`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('#define LED D13');
    expect(result.code).toContain('#define BUTTON D2');
  });

  test('should compile config block', () => {
    const source = `config {
      cpu: atmega328p,
      clock: 16MHz
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    // Config is tracked but doesn't generate code directly
  });

  test('should compile react declarations', () => {
    const source = `react mut rpm: int = 0`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('volatile int rpm = 0');
  });

  test('should compile inline C++ blocks', () => {
    const source = `fn test() {
      @cpp {
        print("debug")
      }
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('// Inline C++');
  });

  test('should compile complete modern YS program', () => {
    const source = `enum Mode { AUTO, MANUAL }
    struct Point { x: int, y: int }
    
    mut Mode mode = AUTO
    mut int counter = 0
    
    class Motor {
      mut int speed
      
      constructor(int s) {
        self.speed = s
      }
      
      fn run() {
        print(self.speed)
      }
    }
    
    mut Motor motor = new Motor(100)
    
    on start {
      pinMode(13, OUTPUT)
    }
    
    on loop {
      match mode {
        AUTO => digitalWrite(13, HIGH),
        MANUAL => digitalWrite(13, LOW)
      }
      
      wait 1s
    }`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('enum Mode');
    expect(result.code).toContain('struct Point');
    expect(result.code).toContain('class Motor');
    expect(result.code).toContain('void setup()');
    expect(result.code).toContain('void loop()');
  });
});
