/**
 * Ypsilon Script Compiler
 * Main compiler interface
 */

const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { CodeGenerator } = require('./codegen');
const fs = require('fs');
const path = require('path');

class Compiler {
  constructor(source, options = {}) {
    this.source = source;
    this.basePath = options.basePath || process.cwd();
    this.fileReader = options.fileReader || ((filePath) => {
      return fs.readFileSync(filePath, 'utf8');
    });
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
      const generator = new CodeGenerator(ast, {
        basePath: this.basePath,
        fileReader: this.fileReader
      });
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

function compile(source, options) {
  const compiler = new Compiler(source, options);
  return compiler.compile();
}

module.exports = { Compiler, compile };
