#!/usr/bin/env node

/**
 * Ypsilon Script Compiler CLI
 * Command-line interface for compiling YS files to Arduino C++
 */

const fs = require('fs');
const path = require('path');
const { compile } = require('../src/compiler');
const { compileSketch, uploadSketch, compileAndUpload, openSerialMonitor } = require('../src/arduino');

function printUsage() {
  console.log(`
Ypsilon Script Compiler (ysc)

Usage: 
  ysc <command> <input.ys> [options]
  ysc <input.ys> [output.ino]  (legacy mode - compile only)

Commands:
  compile <file>  - Compile YS file to Arduino C++ (.ino)
  upload <file>   - Compile and upload to board
  run <file>      - Compile, upload, and open serial monitor

Arguments:
  input.ys        - Input Ypsilon Script file
  output.ino      - Output Arduino C++ file (optional, defaults to input name with .ino extension)

Options:
  -h, --help      - Show this help message
  -v, --version   - Show version
  --ast           - Print AST instead of generating code
  --tokens        - Print tokens instead of generating code
  --config        - Show config diagnostics

Examples:
  ysc blink.ys                  # Compile to blink.ino
  ysc compile blink.ys          # Compile to blink.ino
  ysc upload blink.ys           # Compile and upload
  ysc run blink.ys              # Compile, upload, and monitor
  ysc blink.ys output.ino       # Compile to specific output
  ysc blink.ys --ast            # Show AST
`);
}

function compileFile(inputFile, outputFile = null, options = {}) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File '${inputFile}' not found`);
    process.exit(1);
  }

  const source = fs.readFileSync(inputFile, 'utf8');
  const basePath = path.dirname(path.resolve(inputFile));
  const result = compile(source, { basePath });

  if (!result.success) {
    console.error('Compilation Error:');
    console.error(result.error);
    process.exit(1);
  }
  
  // Check for @main directive
  if (!result.hasMain && !options.skipMainCheck) {
    console.error('Error: No entry file found — add @main at the top of the file that starts your program.');
    console.error(`\nMissing @main in ${inputFile}`);
    process.exit(1);
  }

  if (options.showTokens) {
    console.log(JSON.stringify(result.tokens, null, 2));
    return result;
  }

  if (options.showAST) {
    console.log(JSON.stringify(result.ast, null, 2));
    return result;
  }

  if (options.showConfig && result.config) {
    result.config.printDiagnostics();
    return result;
  }

  // Determine output file
  if (!outputFile) {
    const baseName = path.basename(inputFile, '.ys');
    outputFile = path.join(path.dirname(inputFile), baseName + '.ino');
  }

  // Write output
  fs.writeFileSync(outputFile, result.code);
  console.log(`✓ Successfully compiled ${inputFile} to ${outputFile}`);
  
  // Show config diagnostics if present
  if (result.config && !options.quiet) {
    console.log('');
    result.config.printDiagnostics();
  }

  return { result, outputFile };
}

function handleCompile(args, options) {
  const inputFile = args[0];
  const outputFile = args[1];
  compileFile(inputFile, outputFile, options);
}

function handleUpload(args, options) {
  const inputFile = args[0];
  
  // First compile
  const { result, outputFile } = compileFile(inputFile, null, { ...options, quiet: false });
  
  if (!result.config) {
    console.error('Error: No config found. Cannot upload without board configuration.');
    process.exit(1);
  }
  
  // Create sketch directory for Arduino CLI
  const sketchDir = path.dirname(outputFile);
  const sketchName = path.basename(outputFile, '.ino');
  
  console.log('');
  const uploadResult = uploadSketch(sketchDir, result.config);
  
  if (!uploadResult.success) {
    console.error('Upload failed:', uploadResult.error);
    if (uploadResult.stderr) {
      console.error(uploadResult.stderr);
    }
    process.exit(1);
  }
}

function handleRun(args, options) {
  const inputFile = args[0];
  
  // First compile
  const { result, outputFile } = compileFile(inputFile, null, { ...options, quiet: false });
  
  if (!result.config) {
    console.error('Error: No config found. Cannot run without board configuration.');
    process.exit(1);
  }
  
  // Create sketch directory for Arduino CLI
  const sketchDir = path.dirname(outputFile);
  
  console.log('');
  const uploadResult = uploadSketch(sketchDir, result.config);
  
  if (!uploadResult.success) {
    console.error('Upload failed:', uploadResult.error);
    if (uploadResult.stderr) {
      console.error(uploadResult.stderr);
    }
    process.exit(1);
  }
  
  // Open serial monitor if UART is enabled
  if (result.config.isUARTEnabled()) {
    console.log('');
    const monitor = openSerialMonitor(uploadResult.port);
    
    if (monitor) {
      // Handle Ctrl+C to exit
      process.on('SIGINT', () => {
        console.log('\nClosing serial monitor...');
        monitor.kill();
        process.exit(0);
      });
    }
  } else {
    console.log('\nUART not enabled in config. Skipping serial monitor.');
    console.log('To enable, add "uart: on" to your config block.');
  }
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

  const showAST = args.includes('--ast');
  const showTokens = args.includes('--tokens');
  const showConfig = args.includes('--config');
  
  // Filter out options from args
  const fileArgs = args.filter(arg => !arg.startsWith('-'));
  
  // Determine command
  const command = fileArgs[0];
  
  if (command === 'compile') {
    handleCompile(fileArgs.slice(1), { showAST, showTokens, showConfig });
  } else if (command === 'upload') {
    handleUpload(fileArgs.slice(1), { showAST, showTokens, showConfig });
  } else if (command === 'run') {
    handleRun(fileArgs.slice(1), { showAST, showTokens, showConfig });
  } else {
    // Legacy mode - first arg is the file
    const inputFile = fileArgs[0];
    const outputFile = fileArgs[1];
    compileFile(inputFile, outputFile, { showAST, showTokens, showConfig });
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
