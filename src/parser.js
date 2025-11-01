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
    TOKEN_TYPES.TYPE_VOID
  ].includes(tokenType);
}

// Convert token type to string representation
function tokenTypeToString(tokenType) {
  const typeMap = {
    [TOKEN_TYPES.TYPE_INT]: 'int',
    [TOKEN_TYPES.TYPE_FLOAT]: 'float',
    [TOKEN_TYPES.TYPE_BOOL]: 'bool',
    [TOKEN_TYPES.TYPE_STRING]: 'string',
    [TOKEN_TYPES.TYPE_VOID]: 'void'
  };
  return typeMap[tokenType] || 'int';
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
    return this.tokens.length > 0 ? this.tokens[this.tokens.length - 1] : { type: TOKEN_TYPES.EOF };
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

  parse() {
    const ast = {
      type: 'Program',
      body: []
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
      case TOKEN_TYPES.CLASS:
        return this.parseClassDeclaration();
      case TOKEN_TYPES.FUNCTION:
        return this.parseFunctionDeclaration();
      case TOKEN_TYPES.CONST:
        return this.parseVariableDeclaration();
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

  parseClassInstanceDeclaration() {
    const className = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    const varName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.expect(TOKEN_TYPES.SEMICOLON);

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
    
    this.expect(TOKEN_TYPES.SEMICOLON);

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
    this.expect(TOKEN_TYPES.FUNCTION);
    
    // Parse return type
    const returnType = this.parseType();
    
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
    
    const body = this.parseBlock();

    return {
      type: 'FunctionDeclaration',
      returnType,
      name,
      params,
      body
    };
  }

  parseType() {
    const token = this.peek();
    if (isTypeToken(token.type)) {
      this.advance();
      return tokenTypeToString(token.type);
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
      case TOKEN_TYPES.RETURN:
        return this.parseReturnStatement();
      case TOKEN_TYPES.CONST:
        return this.parseVariableDeclaration();
      default:
        // Check if it's a typed variable declaration
        if (isTypeToken(token.type)) {
          return this.parseTypedVariableDeclaration();
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
    this.expect(TOKEN_TYPES.SEMICOLON);
    
    const test = this.parseExpression();
    this.expect(TOKEN_TYPES.SEMICOLON);
    
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

  parseReturnStatement() {
    this.expect(TOKEN_TYPES.RETURN);
    let argument = null;
    
    if (this.peek().type !== TOKEN_TYPES.SEMICOLON && this.peek().type !== TOKEN_TYPES.EOF) {
      argument = this.parseExpression();
    }
    this.expect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'ReturnStatement',
      argument
    };
  }

  parseVariableDeclaration() {
    this.expect(TOKEN_TYPES.CONST);
    const varType = this.parseType();
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.expect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'VariableDeclaration',
      kind: 'const',
      varType,
      name,
      init
    };
  }

  parseTypedVariableDeclaration() {
    const varType = this.parseType();
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.expect(TOKEN_TYPES.SEMICOLON);

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
    this.expect(TOKEN_TYPES.SEMICOLON);
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
      } else if (this.peek().type === TOKEN_TYPES.DOT) {
        // Member access
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
      
      case TOKEN_TYPES.THIS:
        this.advance();
        return { type: 'ThisExpression' };
      
      case TOKEN_TYPES.NEW:
        return this.parseNewExpression();
      
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

  parseNewExpression() {
    this.expect(TOKEN_TYPES.NEW);
    const className = this.expect(TOKEN_TYPES.IDENTIFIER).value;
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
}

module.exports = { Parser };
