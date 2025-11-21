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
  LOW: 'LOW',
  HIGH: 'HIGH',
  
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
  
  // Hardware Types
  TYPE_DIGITAL: 'TYPE_DIGITAL',
  TYPE_ANALOG: 'TYPE_ANALOG',
  TYPE_PWM: 'TYPE_PWM',
  
  // Collection Types
  TYPE_LIST: 'TYPE_LIST',
  TYPE_MAP: 'TYPE_MAP',
  
  // Range Keywords
  IN: 'IN',
  RANGE: 'RANGE',
  
  // Error Keywords
  CATCH: 'CATCH',
  ERROR: 'ERROR',
  
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
  EXCLAMATION: 'EXCLAMATION',
  ELLIPSIS: 'ELLIPSIS',
  
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
  'low': TOKEN_TYPES.LOW,
  'high': TOKEN_TYPES.HIGH,
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
  'Digital': TOKEN_TYPES.TYPE_DIGITAL,
  'Analog': TOKEN_TYPES.TYPE_ANALOG,
  'PWM': TOKEN_TYPES.TYPE_PWM,
  'List': TOKEN_TYPES.TYPE_LIST,
  'Map': TOKEN_TYPES.TYPE_MAP,
  'in': TOKEN_TYPES.IN,
  'catch': TOKEN_TYPES.CATCH,
  'Error': TOKEN_TYPES.ERROR,
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
    
    while (this.peek() && /[0-9.]/.test(this.peek())) {
      const char = this.peek();
      if (char === '.') {
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
        'ms', 's', 'us', 'min', 'h',      // time
        'Hz', 'kHz', 'MHz',                // frequency
        'deg', 'rad',                      // angle
        'cm', 'm', 'mm', 'km',             // distance
        'rpm'                               // speed
      ];
      if (validUnits.includes(suffix)) {
        unit = suffix;
      } else {
        // Not a valid time unit, rewind
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
      
      // Three-character operators
      if (char === '.' && this.peek(1) === '.' && this.peek(2) === '.') {
        this.advance();
        this.advance();
        this.advance();
        tokens.push({ type: TOKEN_TYPES.ELLIPSIS, value: '...', line: this.line, column: this.column - 3 });
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
