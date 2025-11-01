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
    // Return EOF token if out of bounds to prevent errors when parser looks ahead
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

  // Optional expect - doesn't throw error if not found, just consumes if present
  optionalExpect(type) {
    if (this.peek().type === type) {
      return this.advance();
    }
    return null;
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
      case TOKEN_TYPES.FN:
        return this.parseFunctionDeclaration();
      case TOKEN_TYPES.CONST:
      case TOKEN_TYPES.MUT:
        return this.parseVariableDeclaration();
      case TOKEN_TYPES.ENUM:
        return this.parseEnumDeclaration();
      case TOKEN_TYPES.STRUCT:
        return this.parseStructDeclaration();
      case TOKEN_TYPES.ON:
        return this.parseOnBlock();
      case TOKEN_TYPES.SIGNAL:
        return this.parseSignalDeclaration();
      case TOKEN_TYPES.TASK:
        return this.parseTaskDeclaration();
      case TOKEN_TYPES.USE:
        return this.parseUseStatement();
      case TOKEN_TYPES.LOAD:
        return this.parseLoadStatement();
      case TOKEN_TYPES.ALIAS:
        return this.parseAliasStatement();
      case TOKEN_TYPES.CONFIG:
        return this.parseConfigBlock();
      case TOKEN_TYPES.REACT:
        return this.parseReactDeclaration();
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
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

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
      } else if (token.type === TOKEN_TYPES.MUT || token.type === TOKEN_TYPES.CONST) {
        // Property with mut/const prefix
        const isMut = token.type === TOKEN_TYPES.MUT;
        this.advance();
        const propType = this.parseType();
        const propName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        
        let init = null;
        if (this.peek().type === TOKEN_TYPES.ASSIGN) {
          this.advance();
          init = this.parseExpression();
        }
        this.optionalExpect(TOKEN_TYPES.SEMICOLON);
        
        properties.push({
          type: 'PropertyDeclaration',
          propertyType: propType,
          name: propName,
          isMut,
          init
        });
      } else if (token.type === TOKEN_TYPES.FN) {
        // Method with fn keyword
        this.advance();
        const methodName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
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
        
        // Optional return type indicator
        let returnType = 'void';
        if (this.peek().type === TOKEN_TYPES.ARROW) {
          this.advance();
          returnType = this.parseType();
        }
        
        const body = this.parseBlock();
        
        // If no explicit return type, infer it
        if (returnType === 'void') {
          returnType = this.inferReturnType(body);
        }
        
        methods.push({
          type: 'MethodDeclaration',
          returnType,
          name: methodName,
          params,
          body
        });
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
    
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

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
    // Accept either 'function' or 'fn'
    if (this.peek().type === TOKEN_TYPES.FUNCTION) {
      this.expect(TOKEN_TYPES.FUNCTION);
    } else {
      this.expect(TOKEN_TYPES.FN);
    }
    
    // Parse return type - now optional
    let returnType = null;
    if (isTypeToken(this.peek().type)) {
      returnType = this.parseType();
    }
    
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
    
    // Check for -> return type
    if (this.peek().type === TOKEN_TYPES.ARROW) {
      this.advance();
      returnType = this.parseType();
    }
    
    const body = this.parseBlock();

    // If return type wasn't specified, infer it from return statements
    if (!returnType) {
      returnType = this.inferReturnType(body);
    }

    return {
      type: 'FunctionDeclaration',
      returnType,
      name,
      params,
      body
    };
  }

  // Infer return type from function body
  inferReturnType(body) {
    for (const stmt of body) {
      if (stmt.type === 'ReturnStatement') {
        if (stmt.argument) {
          // Infer type from the return value
          return this.inferExpressionType(stmt.argument);
        } else {
          return 'void';
        }
      }
      // Check nested blocks (if, while, for)
      if (stmt.consequent) {
        const type = this.inferReturnType(stmt.consequent);
        if (type !== 'void') return type;
      }
      if (stmt.alternate) {
        const type = this.inferReturnType(stmt.alternate);
        if (type !== 'void') return type;
      }
      if (stmt.body && Array.isArray(stmt.body)) {
        const type = this.inferReturnType(stmt.body);
        if (type !== 'void') return type;
      }
    }
    return 'void';
  }

  // Infer type from expression
  inferExpressionType(expr) {
    if (!expr) return 'void';
    
    switch (expr.type) {
      case 'Literal':
        if (expr.valueType === 'number') {
          return Number.isInteger(expr.value) ? 'int' : 'float';
        } else if (expr.valueType === 'boolean') {
          return 'bool';
        } else if (expr.valueType === 'string') {
          return 'string';
        }
        // Default for unknown literal types
        return 'int';
      case 'BinaryExpression':
        // Try to infer from operands - if either is float, result is float
        const leftType = this.inferExpressionType(expr.left);
        const rightType = this.inferExpressionType(expr.right);
        if (leftType === 'float' || rightType === 'float') {
          return 'float';
        }
        // Boolean operations
        if (['==', '!=', '<', '>', '<=', '>='].includes(expr.operator)) {
          return 'bool';
        }
        // Default to int for arithmetic operations
        return 'int';
      case 'CallExpression':
        // Can't easily infer without function signature tracking
        // Default to int as the most common return type
        return 'int';
      default:
        // For unknown expression types, default to int
        return 'int';
    }
  }

  parseType() {
    const token = this.peek();
    if (isTypeToken(token.type)) {
      this.advance();
      return tokenTypeToString(token.type);
    }
    // Allow identifiers as types (for structs, enums, and classes)
    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      this.advance();
      return token.value;
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
      case TOKEN_TYPES.REPEAT:
        return this.parseRepeatStatement();
      case TOKEN_TYPES.RETURN:
        return this.parseReturnStatement();
      case TOKEN_TYPES.CONST:
      case TOKEN_TYPES.MUT:
        return this.parseVariableDeclaration();
      case TOKEN_TYPES.MATCH:
        return this.parseMatchStatement();
      case TOKEN_TYPES.SWITCH:
        return this.parseSwitchStatement();
      case TOKEN_TYPES.EMIT:
        return this.parseEmitStatement();
      case TOKEN_TYPES.WAIT:
        return this.parseWaitStatement();
      case TOKEN_TYPES.TIMEOUT:
        return this.parseTimeoutStatement();
      case TOKEN_TYPES.ATOMIC:
        return this.parseAtomicBlock();
      case TOKEN_TYPES.AT:
        return this.parseCppBlock();
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
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    const test = this.parseExpression();
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
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

  parseRepeatStatement() {
    this.expect(TOKEN_TYPES.REPEAT);
    this.expect(TOKEN_TYPES.LPAREN);
    const count = this.parseExpression();
    this.expect(TOKEN_TYPES.RPAREN);
    
    const body = this.parseBlock();

    return {
      type: 'RepeatStatement',
      count,
      body
    };
  }

  parseReturnStatement() {
    this.expect(TOKEN_TYPES.RETURN);
    let argument = null;
    
    if (this.peek().type !== TOKEN_TYPES.SEMICOLON && this.peek().type !== TOKEN_TYPES.EOF) {
      argument = this.parseExpression();
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'ReturnStatement',
      argument
    };
  }

  parseVariableDeclaration() {
    // Accept either 'const' or 'mut'
    let kind = 'const';
    if (this.peek().type === TOKEN_TYPES.CONST) {
      this.expect(TOKEN_TYPES.CONST);
      kind = 'const';
    } else {
      this.expect(TOKEN_TYPES.MUT);
      kind = 'var'; // mut maps to var in C++
    }
    
    const varType = this.parseType();
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

    return {
      type: 'VariableDeclaration',
      kind,
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
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);

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
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
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
        return { type: 'Literal', value: token.value, valueType: 'number', unit: token.unit };
      
      case TOKEN_TYPES.STRING:
        this.advance();
        return { type: 'Literal', value: token.value, valueType: 'string' };
      
      case TOKEN_TYPES.BOOLEAN:
        this.advance();
        return { type: 'Literal', value: token.value, valueType: 'boolean' };
      
      case TOKEN_TYPES.THIS:
      case TOKEN_TYPES.SELF:
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

  // Enum declaration: enum Mode { AUTO, MANUAL }
  parseEnumDeclaration() {
    this.expect(TOKEN_TYPES.ENUM);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.LBRACE);
    
    const values = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const value = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      values.push(value);
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'EnumDeclaration',
      name,
      values
    };
  }

  // Struct declaration: struct Point { x: int, y: int }
  parseStructDeclaration() {
    this.expect(TOKEN_TYPES.STRUCT);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.LBRACE);
    
    const fields = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const fieldName = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      this.expect(TOKEN_TYPES.COLON);
      const fieldType = this.parseType();
      fields.push({ name: fieldName, type: fieldType });
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'StructDeclaration',
      name,
      fields
    };
  }

  // Match expression: match x { 1 => ..., 2 => ..., _ => ... }
  parseMatchStatement() {
    this.expect(TOKEN_TYPES.MATCH);
    const discriminant = this.parseExpression();
    this.expect(TOKEN_TYPES.LBRACE);
    
    const cases = [];
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      // Parse pattern (can be identifier, number, or _)
      let pattern;
      const token = this.peek();
      if (token.type === TOKEN_TYPES.IDENTIFIER && token.value === '_') {
        this.advance();
        pattern = { type: 'Wildcard' };
      } else {
        pattern = this.parseExpression();
      }
      
      this.expect(TOKEN_TYPES.ARROW);
      
      // Parse consequent (can be a block or expression)
      let consequent;
      if (this.peek().type === TOKEN_TYPES.LBRACE) {
        consequent = this.parseBlock();
      } else {
        consequent = [{ type: 'ExpressionStatement', expression: this.parseExpression() }];
      }
      
      cases.push({ pattern, consequent });
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'MatchStatement',
      discriminant,
      cases
    };
  }

  // Switch statement: switch x { case 1 { ... } case 2 { ... } default { ... } }
  parseSwitchStatement() {
    this.expect(TOKEN_TYPES.SWITCH);
    const discriminant = this.parseExpression();
    this.expect(TOKEN_TYPES.LBRACE);
    
    const cases = [];
    let defaultCase = null;
    
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      if (this.peek().type === TOKEN_TYPES.CASE) {
        this.advance();
        const test = this.parseExpression();
        const consequent = this.parseBlock();
        cases.push({ test, consequent });
      } else if (this.peek().type === TOKEN_TYPES.DEFAULT) {
        this.advance();
        defaultCase = this.parseBlock();
      } else {
        throw new Error(`Unexpected token in switch statement: ${this.peek().type} at line ${this.peek().line}`);
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'SwitchStatement',
      discriminant,
      cases,
      defaultCase
    };
  }

  // On block: on start { }, on loop { }, on pin D2.rising { }
  parseOnBlock() {
    this.expect(TOKEN_TYPES.ON);
    const eventToken = this.expect(TOKEN_TYPES.IDENTIFIER);
    const event = eventToken.value;
    
    // Check for event properties like D2.rising
    let eventProperty = null;
    if (this.peek().type === TOKEN_TYPES.DOT) {
      this.advance();
      eventProperty = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    }
    
    const body = this.parseBlock();
    
    return {
      type: 'OnBlock',
      event,
      eventProperty,
      body
    };
  }

  // Signal declaration: signal btnPress
  parseSignalDeclaration() {
    this.expect(TOKEN_TYPES.SIGNAL);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'SignalDeclaration',
      name
    };
  }

  // Emit statement: emit btnPress
  parseEmitStatement() {
    this.expect(TOKEN_TYPES.EMIT);
    const signal = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'EmitStatement',
      signal
    };
  }

  // Task declaration: task blink every 500ms { }, task background { }
  parseTaskDeclaration() {
    this.expect(TOKEN_TYPES.TASK);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    
    // Check for 'every' or 'background'
    let interval = null;
    let isBackground = false;
    
    if (this.peek().type === TOKEN_TYPES.EVERY) {
      this.advance();
      interval = this.parseExpression(); // Will be a number with time unit
    } else if (this.peek().type === TOKEN_TYPES.BACKGROUND) {
      this.advance();
      isBackground = true;
    }
    
    const body = this.parseBlock();
    
    return {
      type: 'TaskDeclaration',
      name,
      interval,
      isBackground,
      body
    };
  }

  // Wait statement: wait 200ms
  parseWaitStatement() {
    this.expect(TOKEN_TYPES.WAIT);
    const duration = this.parseExpression();
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'WaitStatement',
      duration
    };
  }

  // Timeout statement: timeout 2s { connect() }
  parseTimeoutStatement() {
    this.expect(TOKEN_TYPES.TIMEOUT);
    const duration = this.parseExpression();
    const body = this.parseBlock();
    
    return {
      type: 'TimeoutStatement',
      duration,
      body
    };
  }

  // Atomic block: atomic { pwm.write(200) }
  parseAtomicBlock() {
    this.expect(TOKEN_TYPES.ATOMIC);
    const body = this.parseBlock();
    
    return {
      type: 'AtomicBlock',
      body
    };
  }

  // C++ inline block: @cpp { Serial.println("debug"); }
  parseCppBlock() {
    this.expect(TOKEN_TYPES.AT);
    
    // Expect 'cpp' identifier
    const cppToken = this.expect(TOKEN_TYPES.IDENTIFIER);
    if (cppToken.value !== 'cpp') {
      throw new Error(`Expected 'cpp' after @ but got '${cppToken.value}' at line ${cppToken.line}`);
    }
    
    const body = this.parseBlock();
    
    return {
      type: 'CppBlock',
      body
    };
  }

  // Use statement: use I2C1
  parseUseStatement() {
    this.expect(TOKEN_TYPES.USE);
    const resource = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'UseStatement',
      resource
    };
  }

  // Load statement: load <servo>
  parseLoadStatement() {
    this.expect(TOKEN_TYPES.LOAD);
    this.expect(TOKEN_TYPES.LESS_THAN);
    const library = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.GREATER_THAN);
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'LoadStatement',
      library
    };
  }

  // Alias statement: alias led = D13 or alias led = 13
  parseAliasStatement() {
    this.expect(TOKEN_TYPES.ALIAS);
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.ASSIGN);
    
    // Value can be identifier or number
    let value;
    if (this.peek().type === TOKEN_TYPES.IDENTIFIER) {
      value = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    } else if (this.peek().type === TOKEN_TYPES.NUMBER) {
      value = String(this.expect(TOKEN_TYPES.NUMBER).value);
    } else {
      throw new Error(`Expected identifier or number for alias value at line ${this.peek().line}`);
    }
    
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'AliasStatement',
      name,
      value
    };
  }

  // Config block: config { cpu: atmega328p, clock: 16MHz }
  parseConfigBlock() {
    this.expect(TOKEN_TYPES.CONFIG);
    this.expect(TOKEN_TYPES.LBRACE);
    
    const options = {};
    while (this.peek().type !== TOKEN_TYPES.RBRACE && this.peek().type !== TOKEN_TYPES.EOF) {
      const key = this.expect(TOKEN_TYPES.IDENTIFIER).value;
      this.expect(TOKEN_TYPES.COLON);
      
      // Value can be identifier or number (or number+identifier like 16MHz)
      let value = '';
      if (this.peek().type === TOKEN_TYPES.NUMBER) {
        value = String(this.advance().value);
        // Check if followed by an identifier (like MHz)
        if (this.peek().type === TOKEN_TYPES.IDENTIFIER) {
          value += this.advance().value;
        }
      } else if (this.peek().type === TOKEN_TYPES.IDENTIFIER) {
        value = this.advance().value;
      } else {
        throw new Error(`Unexpected token in config block: ${this.peek().type} at line ${this.peek().line}`);
      }
      
      options[key] = value;
      
      if (this.peek().type === TOKEN_TYPES.COMMA) {
        this.advance();
      }
    }
    
    this.expect(TOKEN_TYPES.RBRACE);
    
    return {
      type: 'ConfigBlock',
      options
    };
  }

  // React declaration: react mut rpm: int
  parseReactDeclaration() {
    this.expect(TOKEN_TYPES.REACT);
    
    // Check for mut
    let isMut = false;
    if (this.peek().type === TOKEN_TYPES.MUT) {
      this.advance();
      isMut = true;
    }
    
    const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
    this.expect(TOKEN_TYPES.COLON);
    const varType = this.parseType();
    
    let init = null;
    if (this.peek().type === TOKEN_TYPES.ASSIGN) {
      this.advance();
      init = this.parseExpression();
    }
    this.optionalExpect(TOKEN_TYPES.SEMICOLON);
    
    return {
      type: 'ReactDeclaration',
      isMut,
      name,
      varType,
      init
    };
  }
}

module.exports = { Parser };
