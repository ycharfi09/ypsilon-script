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
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  FOR: 'FOR',
  RETURN: 'RETURN',
  VAR: 'VAR',
  CONST: 'CONST',
  
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
  
  // Punctuation
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COMMA: 'COMMA',
  DOT: 'DOT',
  COLON: 'COLON',
  SEMICOLON: 'SEMICOLON',
  
  // Special
  NEWLINE: 'NEWLINE',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  EOF: 'EOF',
  COMMENT: 'COMMENT'
};

const KEYWORDS = {
  'function': TOKEN_TYPES.FUNCTION,
  'if': TOKEN_TYPES.IF,
  'else': TOKEN_TYPES.ELSE,
  'while': TOKEN_TYPES.WHILE,
  'for': TOKEN_TYPES.FOR,
  'return': TOKEN_TYPES.RETURN,
  'var': TOKEN_TYPES.VAR,
  'const': TOKEN_TYPES.CONST,
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
    this.indentStack = [0];
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
    
    return {
      type: TOKEN_TYPES.NUMBER,
      value: parseFloat(num),
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

      // Newlines and indentation
      if (char === '\n') {
        this.advance();
        
        // Skip empty lines
        while (this.peek() === '\n') {
          this.advance();
        }
        
        // Calculate indentation
        let indent = 0;
        while (this.peek() === ' ') {
          this.advance();
          indent++;
        }
        
        // Skip lines with only comments
        if (this.peek() === '#') {
          this.skipComment();
          continue;
        }
        
        // Skip if next line is empty
        if (this.peek() === '\n' || !this.peek()) {
          continue;
        }
        
        tokens.push({ type: TOKEN_TYPES.NEWLINE, line: this.line, column: this.column });
        
        const currentIndent = this.indentStack[this.indentStack.length - 1];
        
        if (indent > currentIndent) {
          this.indentStack.push(indent);
          tokens.push({ type: TOKEN_TYPES.INDENT, line: this.line, column: this.column });
        } else if (indent < currentIndent) {
          while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indent) {
            this.indentStack.pop();
            tokens.push({ type: TOKEN_TYPES.DEDENT, line: this.line, column: this.column });
          }
        }
        continue;
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

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Two-character operators
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
        ';': TOKEN_TYPES.SEMICOLON
      };

      if (singleChar[char]) {
        this.advance();
        tokens.push({ type: singleChar[char], value: char, line: this.line, column: this.column - 1 });
        continue;
      }

      throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }

    // Add remaining dedents
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      tokens.push({ type: TOKEN_TYPES.DEDENT, line: this.line, column: this.column });
    }

    tokens.push({ type: TOKEN_TYPES.EOF, line: this.line, column: this.column });
    return tokens;
  }
}

module.exports = { Lexer, TOKEN_TYPES };
