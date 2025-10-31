/**
 * Ypsilon Script Parser
 * Builds an Abstract Syntax Tree (AST) from tokens
 */

const { TOKEN_TYPES } = require('./lexer');

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    const pos = this.pos + offset;
    return pos < this.tokens.length ? this.tokens[pos] : this.tokens[this.tokens.length - 1];
  }

  advance() {
    return this.tokens[this.pos++];
  }

  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at line ${token.line}`);
    }
    return this.advance();
  }

  skipNewlines() {
    while (this.peek().type === TOKEN_TYPES.NEWLINE) {
      this.advance();
    }
  }

  parse() {
    const ast = {
      type: 'Program',
      body: []
    };

    this.skipNewlines();

    while (this.peek().type !== TOKEN_TYPES.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        ast.body.push(stmt);
      }
      this.skipNewlines();
    }

    return ast;
  }

  parseStatement() {
    this.skipNewlines();
    const token = this.peek();

    switch (token.type) {
      case TOKEN_TYPES.FUNCTION:
        return this.parseFunctionDeclaration();
      case TOKEN_TYPES.IF:
        return this.parseIfStatement();
      case TOKEN_TYPES.WHILE:
        return this.parseWhileStatement();
      case TOKEN_TYPES.FOR:
        return this.parseForStatement();
      case TOKEN_TYPES.RETURN:
        return this.parseReturnStatement();
      case TOKEN_TYPES.VAR:
      case TOKEN_TYPES.CONST:
        return this.parseVariableDeclaration();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseFunctionDeclaration() {
    this.expect(TOKEN_TYPES.FUNCTION);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER);
    this.expect(TOKEN_TYPES.LPAREN);
    
    const params = [];
    while (this.peek().type !== TOKEN_TYPES.RPAREN) {
      params.push(this.expect(TOKEN_TYPES.IDENTIFIER).value);
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    this.expect(TOKEN_TYPES.RPAREN);
    this.expect(TOKEN_TYPES.COLON);
    this.expect(TOKEN_TYPES.NEWLINE);
    this.expect(TOKEN_TYPES.INDENT);

    const body = [];
    while (this.peek().type !== TOKEN_TYPES.DEDENT && this.peek().type !== TOKEN_TYPES.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
      this.skipNewlines();
    }

    if (this.peek().type === TOKEN_TYPES.DEDENT) {
      this.advance();
    }

    return {
      type: 'FunctionDeclaration',
      name: name.value,
      params,
      body
    };
  }

  parseIfStatement() {
    this.expect(TOKEN_TYPES.IF);
    const test = this.parseExpression();
    this.expect(TOKEN_TYPES.COLON);
    this.expect(TOKEN_TYPES.NEWLINE);
    this.expect(TOKEN_TYPES.INDENT);

    const consequent = [];
    while (this.peek().type !== TOKEN_TYPES.DEDENT && this.peek().type !== TOKEN_TYPES.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        consequent.push(stmt);
      }
      this.skipNewlines();
    }

    if (this.peek().type === TOKEN_TYPES.DEDENT) {
      this.advance();
    }

    let alternate = null;
    this.skipNewlines();
    if (this.peek().type === TOKEN_TYPES.ELSE) {
      this.advance();
      this.expect(TOKEN_TYPES.COLON);
      this.expect(TOKEN_TYPES.NEWLINE);
      this.expect(TOKEN_TYPES.INDENT);

      alternate = [];
      while (this.peek().type !== TOKEN_TYPES.DEDENT && this.peek().type !== TOKEN_TYPES.EOF) {
        const stmt = this.parseStatement();
        if (stmt) {
          alternate.push(stmt);
        }
        this.skipNewlines();
      }

      if (this.peek().type === TOKEN_TYPES.DEDENT) {
        this.advance();
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
    const test = this.parseExpression();
    this.expect(TOKEN_TYPES.COLON);
    this.expect(TOKEN_TYPES.NEWLINE);
    this.expect(TOKEN_TYPES.INDENT);

    const body = [];
    while (this.peek().type !== TOKEN_TYPES.DEDENT && this.peek().type !== TOKEN_TYPES.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
      this.skipNewlines();
    }

    if (this.peek().type === TOKEN_TYPES.DEDENT) {
      this.advance();
    }

    return {
      type: 'WhileStatement',
      test,
      body
    };
  }

  parseForStatement() {
    this.expect(TOKEN_TYPES.FOR);
    const variable = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    // For now, support simple range-based for loops
    // for i in range(10):
    if (this.peek().type === TOKEN_TYPES.IDENTIFIER && this.peek().value === 'in') {
      this.advance(); // consume 'in'
      const iterator = this.parseExpression();
      this.expect(TOKEN_TYPES.COLON);
      this.expect(TOKEN_TYPES.NEWLINE);
      this.expect(TOKEN_TYPES.INDENT);

      const body = [];
      while (this.peek().type !== TOKEN_TYPES.DEDENT && this.peek().type !== TOKEN_TYPES.EOF) {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
        this.skipNewlines();
      }

      if (this.peek().type === TOKEN_TYPES.DEDENT) {
        this.advance();
      }

      return {
        type: 'ForStatement',
        variable,
        iterator,
        body
      };
    }

    throw new Error('Invalid for loop syntax');
  }

  parseReturnStatement() {
    this.expect(TOKEN_TYPES.RETURN);
    let argument = null;
    
    if (this.peek().type !== TOKEN_TYPES.NEWLINE && this.peek().type !== TOKEN_TYPES.EOF) {
      argument = this.parseExpression();
    }

    return {
      type: 'ReturnStatement',
      argument
    };
  }

  parseVariableDeclaration() {
    const kind = this.advance().type === TOKEN_TYPES.CONST ? 'const' : 'var';
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }

    return {
      type: 'VariableDeclaration',
      kind,
      name,
      init
    };
  }

  parseExpressionStatement() {
    const expression = this.parseExpression();
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
      const operator = this.advance().value || 'or';
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
      const operator = this.advance().value || 'and';
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
    if (this.peek().type === TOKEN_TYPES.NOT || this.peek().type === TOKEN_TYPES.MINUS) {
      const operator = this.advance().value || 'not';
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
      } else if (this.peek().type === TOKEN_TYPES.DOT) {
        this.advance();
        const property = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        expr = {
          type: 'MemberExpression',
          object: expr,
          property
        };
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
        return { type: 'Literal', value: token.value, valueType: 'number' };
      
      case TOKEN_TYPES.STRING:
        this.advance();
        return { type: 'Literal', value: token.value, valueType: 'string' };
      
      case TOKEN_TYPES.BOOLEAN:
        this.advance();
        return { type: 'Literal', value: token.value, valueType: 'boolean' };
      
      case TOKEN_TYPES.IDENTIFIER:
        this.advance();
        return { type: 'Identifier', name: token.value };
      
      case TOKEN_TYPES.LPAREN:
        this.advance();
        const expr = this.parseExpression();
        this.expect(TOKEN_TYPES.RPAREN);
        return expr;
      
      default:
        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }
  }
}

module.exports = { Parser };
