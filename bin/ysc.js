#!/usr/bin/env node

/**
 * Ypsilon Script Compiler CLI
 * Command-line interface for compiling YS files to Arduino C++
 */

const fs = require('fs');
const path = require('path');
const { compile } = require('../src/compiler');

function printUsage() {
  console.log(`
Ypsilon Script Compiler (ysc)
Usage: ysc <input.ys> [output.ino]

Arguments:
  input.ys    - Input Ypsilon Script file
  output.ino  - Output Arduino C++ file (optional, defaults to input name with .ino extension)

Options:
  -h, --help  - Show this help message
  -v, --version - Show version
  --ast       - Print AST instead of generating code
  --tokens    - Print tokens instead of generating code

Examples:
  ysc blink.ys
  ysc blink.ys output.ino
  ysc blink.ys --ast
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    const pkg = require('../package.json');
    console.log(`Ypsilon Script Compiler v${pkg.version}`);
    process.exit(0);
  }

  const inputFile = args[0];
  const showAST = args.includes('--ast');
  const showTokens = args.includes('--tokens');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File '${inputFile}' not found`);
    process.exit(1);
  }

  const source = fs.readFileSync(inputFile, 'utf8');
  const result = compile(source);

  if (!result.success) {
    console.error('Compilation Error:');
    console.error(result.error);
    process.exit(1);
  }

  if (showTokens) {
    console.log(JSON.stringify(result.tokens, null, 2));
    process.exit(0);
  }

  if (showAST) {
    console.log(JSON.stringify(result.ast, null, 2));
    process.exit(0);
  }

  // Determine output file
  let outputFile = args.find(arg => !arg.startsWith('-') && arg !== inputFile);
  if (!outputFile) {
    const baseName = path.basename(inputFile, '.ys');
    outputFile = path.join(path.dirname(inputFile), baseName + '.ino');
  }

  // Write output
  fs.writeFileSync(outputFile, result.code);
  console.log(`✓ Successfully compiled ${inputFile} to ${outputFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
