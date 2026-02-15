/**
 * Ypsilon Script Compiler
 * Main compiler interface
 */

const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { CodeGenerator } = require('./codegen');
const { SemanticAnalyzer } = require('./semantic-analyzer');
const { Config } = require('./config');
const fs = require('fs');
const path = require('path');

class Compiler {
  constructor(source, options = {}) {
    this.source = source;
    this.basePath = options.basePath || process.cwd();
    // Only set fileReader if explicitly provided, or default to fs.readFileSync
    // when basePath is explicitly provided (indicating real file compilation)
    this.fileReader = options.fileReader !== undefined 
      ? options.fileReader 
      : (options.basePath ? ((filePath) => fs.readFileSync(filePath, 'utf8')) : null);
  }

  compile() {
    try {
      // Tokenize
      const lexer = new Lexer(this.source);
      const tokens = lexer.tokenize();

      // Parse
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      // Extract config block from AST for semantic analysis
      let configBlock = null;
      for (const stmt of ast.body) {
        if (stmt.type === 'ConfigBlock') {
          configBlock = stmt;
          break;
        }
      }
      const config = new Config(configBlock);
      
      // Semantic analysis - check for undeclared variables, platform restrictions, etc.
      const analyzer = new SemanticAnalyzer(ast, config);
      const analysisResult = analyzer.analyze();
      
      // If semantic analysis found errors, return them
      if (!analysisResult.success) {
        const errorMessages = analysisResult.errors.map(err => {
          return `Error at line ${err.line}: ${err.message}`;
        }).join('\n\n');
        
        return {
          success: false,
          error: errorMessages,
          semanticErrors: analysisResult.errors
        };
      }
      
      // Check for @main directive
      const hasMain = ast.body.some(stmt => stmt.type === 'MainDirective');

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
        tokens,
        hasMain,
        config: generator.config // Return the config for use in CLI
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
