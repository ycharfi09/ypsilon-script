/**
 * Ypsilon Script Compiler
 * Main compiler interface
 */

const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { CodeGenerator } = require('./codegen');

class Compiler {
  constructor(source) {
    this.source = source;
  }

  compile() {
    try {
      // Tokenize
      const lexer = new Lexer(this.source);
      const tokens = lexer.tokenize();

      // Parse
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // Generate code
      const generator = new CodeGenerator(ast);
      const code = generator.generate();

      return {
        success: true,
        code,
        ast,
        tokens
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
}

function compile(source) {
  const compiler = new Compiler(source);
  return compiler.compile();
}

module.exports = { Compiler, compile };
