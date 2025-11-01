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
    expect(result.code).toContain('-(5)');
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
});
