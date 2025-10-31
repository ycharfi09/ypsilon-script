/**
 * Tests for Ypsilon Script Compiler
 */

const { compile } = require('../src/compiler');
const { Lexer, TOKEN_TYPES } = require('../src/lexer');
const { Parser } = require('../src/parser');

describe('Lexer', () => {
  test('should tokenize simple variable declaration', () => {
    const source = 'var x = 10';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.VAR);
    expect(tokens[1].type).toBe(TOKEN_TYPES.IDENTIFIER);
    expect(tokens[1].value).toBe('x');
    expect(tokens[2].type).toBe(TOKEN_TYPES.ASSIGN);
    expect(tokens[3].type).toBe(TOKEN_TYPES.NUMBER);
    expect(tokens[3].value).toBe(10);
  });

  test('should tokenize function declaration', () => {
    const source = 'function test():';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.FUNCTION);
    expect(tokens[1].type).toBe(TOKEN_TYPES.IDENTIFIER);
    expect(tokens[2].type).toBe(TOKEN_TYPES.LPAREN);
    expect(tokens[3].type).toBe(TOKEN_TYPES.RPAREN);
    expect(tokens[4].type).toBe(TOKEN_TYPES.COLON);
  });

  test('should handle keywords', () => {
    const source = 'if while for return true false';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.IF);
    expect(tokens[1].type).toBe(TOKEN_TYPES.WHILE);
    expect(tokens[2].type).toBe(TOKEN_TYPES.FOR);
    expect(tokens[3].type).toBe(TOKEN_TYPES.RETURN);
    expect(tokens[4].type).toBe(TOKEN_TYPES.BOOLEAN);
    expect(tokens[5].type).toBe(TOKEN_TYPES.BOOLEAN);
  });

  test('should tokenize strings', () => {
    const source = '"hello world"';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.STRING);
    expect(tokens[0].value).toBe('hello world');
  });

  test('should skip comments', () => {
    const source = '# This is a comment\nvar x = 5';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.NEWLINE);
    expect(tokens[1].type).toBe(TOKEN_TYPES.VAR);
  });
});

describe('Parser', () => {
  test('should parse variable declaration', () => {
    const source = 'var x = 10';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.body[0].type).toBe('VariableDeclaration');
    expect(ast.body[0].name).toBe('x');
    expect(ast.body[0].kind).toBe('var');
  });

  test('should parse function declaration', () => {
    const source = `function test(a, b):
    return a + b`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.body[0].type).toBe('FunctionDeclaration');
    expect(ast.body[0].name).toBe('test');
    expect(ast.body[0].params).toEqual(['a', 'b']);
  });

  test('should parse if statement', () => {
    const source = `if x > 5:
    var y = 10`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.body[0].type).toBe('IfStatement');
    expect(ast.body[0].test.type).toBe('BinaryExpression');
  });
});

describe('Compiler', () => {
  test('should compile simple blink program', () => {
    const source = `const LED_PIN = 13

function setup():
    pinMode(LED_PIN, OUTPUT)

function loop():
    digitalWrite(LED_PIN, HIGH)
    delay(1000)`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('#include <Arduino.h>');
    expect(result.code).toContain('void setup()');
    expect(result.code).toContain('void loop()');
    expect(result.code).toContain('pinMode(LED_PIN, OUTPUT)');
  });

  test('should compile variable declarations', () => {
    const source = `var x = 10
const LED_PIN = 13`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('int x = 10;');
    expect(result.code).toContain('const int LED_PIN = 13;');
  });

  test('should compile if statements', () => {
    const source = `function loop():
    if x > 5:
        digitalWrite(13, HIGH)
    else:
        digitalWrite(13, LOW)`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('if (');
    expect(result.code).toContain('} else {');
  });

  test('should compile for loops', () => {
    const source = `function loop():
    for i in range(10):
        delay(100)`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('for (int i = 0; i < 10; i += 1)');
  });

  test('should compile while loops', () => {
    const source = `function loop():
    while x < 10:
        var y = 5`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('while (');
  });

  test('should handle logical operators', () => {
    const source = `function loop():
    if x > 5 and y < 10:
        var z = 1`;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('&&');
  });

  test('should report errors for invalid syntax', () => {
    const source = 'var x =';
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
