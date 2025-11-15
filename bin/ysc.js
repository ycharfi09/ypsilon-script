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
  ysc <command> <input.ys|folder> [options]
  ysc <input.ys|folder> [output.ino]  (legacy mode - compile only)

Commands:
  compile <file|folder>  - Compile YS file or project folder to Arduino C++ (.ino)
  upload <file|folder>   - Compile and upload to board
  run <file|folder>      - Compile, upload, and open serial monitor

Arguments:
  input.ys        - Input Ypsilon Script file (single file mode)
  folder          - Project folder containing .ys files (project mode)
  output.ino      - Output Arduino C++ file (optional, defaults to input name with .ino extension)

Options:
  -h, --help      - Show this help message
  -v, --version   - Show version
  --ast           - Print AST instead of generating code
  --tokens        - Print tokens instead of generating code
  --config        - Show config diagnostics
  --skip-main     - Skip @main check (for compiling module files)
  -r, --retrieve  - Enable code retrieval from board (experimental)

Examples:
  ysc blink.ys                  # Compile single file to blink.ino
  ysc my-project/               # Compile project folder (finds @main file)
  ysc compile blink.ys          # Compile to blink.ino
  ysc upload my-project/        # Compile project folder and upload
  ysc upload blink.ys --r       # Upload with code retrieval enabled
  ysc run blink.ys              # Compile, upload, and monitor
  ysc blink.ys output.ino       # Compile to specific output
  ysc blink.ys --ast            # Show AST

Project Structure:
  Each project should be in its own folder with one file marked with @main.
  The main file must include a config block with board settings.
  The main file cannot be named "main.ys".
  
  Example:
    my-project/
      app.ys          # Contains @main and config block
      utils.ys        # Module file (no @main)
      config.ys       # Module file (no @main)

Config Block Requirements:
  Files with @main must include a config block:
  
  config {
    board: arduino_uno,
    clock: 16MHz,
    uart: on,
    port: auto
  }
  
  Valid board names: arduino_uno, arduino_nano, arduino_mega, 
                     arduino_leonardo, esp32, esp8266

Note:
  - Code retrieval (--r flag) is experimental on low-memory boards like Arduino Uno
  - This project must be cloned from GitHub - there is no npm package available
`);}


/**
 * Find all .ys files in a folder that have @main directive
 */
function findMainFiles(folderPath) {
  const mainFiles = [];
  
  try {
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      if (file.endsWith('.ys')) {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file has @main directive (should be at the top)
        if (content.trim().startsWith('@main')) {
          mainFiles.push({
            file: file,
            path: filePath
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading folder '${folderPath}': ${error.message}`);
    process.exit(1);
  }
  
  return mainFiles;
}

/**
 * Validate main file name - cannot be main.ys
 */
function validateMainFileName(fileName) {
  if (fileName.toLowerCase() === 'main.ys') {
    console.error(`Error: The main file cannot be named 'main.ys'.`);
    console.error(`\nSuggestion: Rename your file to something descriptive like 'app.ys', 'project.ys', or '${path.basename(process.cwd())}.ys'.`);
    console.error(`This helps keep your project organized and makes the purpose of each file clear.`);
    process.exit(1);
  }
}

/**
 * Find the main entry file in a folder
 * Returns the path to the main file
 */
function findMainEntryFile(folderPath) {
  const mainFiles = findMainFiles(folderPath);
  
  if (mainFiles.length === 0) {
    console.error(`❌ Error: No entry point found in folder '${folderPath}'.`);
    console.error(`\nYour project needs exactly one file with @main at the top.`);
    console.error(`\nTo fix this:`);
    console.error(`  1. Add @main at the top of your main project file`);
    console.error(`  2. Make sure the file ends with .ys extension`);
    console.error(`  3. Add a config block with your board settings`);
    console.error(`\nExample main file (app.ys):`);
    console.error(`  @main`);
    console.error(`  `);
    console.error(`  config {`);
    console.error(`    board: arduino_uno,`);
    console.error(`    clock: 16MHz,`);
    console.error(`    uart: on`);
    console.error(`  }`);
    console.error(`  `);
    console.error(`  # Your code here...`);
    process.exit(1);
  }
  
  if (mainFiles.length > 1) {
    console.error(`❌ Error: Multiple entry points detected in folder '${folderPath}'.`);
    console.error(`\nYour project can only have ONE file with @main.`);
    console.error(`\nFiles with @main:`);
    mainFiles.forEach(f => console.error(`  • ${f.file}`));
    console.error(`\nTo fix this:`);
    console.error(`  1. Choose which file should be the main entry point`);
    console.error(`  2. Remove @main from the other files`);
    console.error(`  3. Other files automatically become modules/libraries`);
    console.error(`\nTip: Usually your main file is named after your project (e.g., robot.ys, blink.ys)`);
    process.exit(1);
  }
  
  // Validate the main file name
  validateMainFileName(mainFiles[0].file);
  
  return mainFiles[0].path;
}

function compileFile(inputFile, outputFile = null, options = {}) {
  // Check if input is a directory
  let isDirectory = false;
  let actualInputFile = inputFile;
  
  if (fs.existsSync(inputFile)) {
    const stats = fs.statSync(inputFile);
    isDirectory = stats.isDirectory();
    
    if (isDirectory) {
      // Find the main entry file in the folder
      actualInputFile = findMainEntryFile(inputFile);
      console.log(`Found entry point: ${path.basename(actualInputFile)}`);
    }
  } else {
    console.error(`Error: Path '${inputFile}' not found.`);
    console.error(`\nMake sure the file or folder exists and the path is correct.`);
    process.exit(1);
  }

  // Validate main.ys filename for single file compilation too
  const fileName = path.basename(actualInputFile);
  validateMainFileName(fileName);

  const source = fs.readFileSync(actualInputFile, 'utf8');
  const basePath = path.dirname(path.resolve(actualInputFile));
  const result = compile(source, { basePath });

  if (!result.success) {
    console.error('Compilation Error:');
    console.error(result.error);
    console.error(`\nFailed to compile: ${actualInputFile}`);
    process.exit(1);
  }
  
  // Check for @main directive
  if (!result.hasMain) {
    if (options.skipMainCheck) {
      // Allow compilation but show warning
      console.warn(`\n⚠ Warning: Compiling a single module without @main.`);
      console.warn(`This file appears to be a library or module, not a complete project.`);
      console.warn(`\nTo build a complete project:`);
      console.warn(`  1. Add @main at the top of your main project file`);
      console.warn(`  2. Add a config block with your board settings`);
      console.warn(`  3. Or compile the folder containing the file with @main`);
      console.warn(``);
    } else {
      console.error(`❌ Error: No @main directive found in ${fileName}.`);
      console.error(`\nEvery Ypsilon Script project needs exactly one file with @main at the top.`);
      console.error(`This marks the entry point of your program.`);
      console.error(`\nTo fix this:`);
      console.error(`  1. Add @main as the first line of your main file`);
      console.error(`  2. Add a config block with your board settings`);
      console.error(`  3. Keep other files without @main (they become modules)`);
      console.error(`\nExample:`);
      console.error(`  @main`);
      console.error(`  `);
      console.error(`  config {`);
      console.error(`    board: arduino_uno,`);
      console.error(`    clock: 16MHz,`);
      console.error(`    uart: on`);
      console.error(`  }`);
      console.error(`  `);
      console.error(`  const int LED = 13`);
      console.error(`  on start { pinMode(LED, OUTPUT) }`);
      console.error(`\nNote: If this is a module file, you can compile it with --skip-main flag,`);
      console.error(`      but it won't produce a runnable program.`);
      process.exit(1);
    }
  }
  
  // Validate config for @main files
  if (result.hasMain && result.config) {
    const errorMsg = result.config.getConfigErrorMessage();
    if (errorMsg) {
      console.error(errorMsg);
      process.exit(1);
    }
  } else if (result.hasMain && !result.config) {
    console.error(`❌ Error: @main file must include a config block.\n`);
    console.error(`Your main file needs to specify board configuration for upload.`);
    console.error(`\nAdd a config block like this:\n`);
    console.error(`config {`);
    console.error(`  board: arduino_uno,`);
    console.error(`  clock: 16MHz,`);
    console.error(`  uart: on,`);
    console.error(`  port: auto`);
    console.error(`}\n`);
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
    const baseName = path.basename(actualInputFile, '.ys');
    outputFile = path.join(path.dirname(actualInputFile), baseName + '.ino');
  }

  // Write output
  fs.writeFileSync(outputFile, result.code);
  console.log(`✓ Successfully compiled ${path.basename(actualInputFile)} to ${path.basename(outputFile)}`);
  
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
    console.error('❌ Error: No config found. Cannot upload without board configuration.');
    process.exit(1);
  }
  
  // Show warning for code retrieval on low-memory boards
  if (options.enableRetrieval && result.config.isLowMemoryBoard()) {
    console.warn(`\n⚠ Experimental Feature: Code retrieval on ${result.config.getOptions().board}.`);
    console.warn(`   Low-memory boards like Arduino Uno have limited resources.`);
    console.warn(`   Use at your own risk. This feature may cause instability.\n`);
  }
  
  // Create sketch directory for Arduino CLI
  const sketchDir = path.dirname(outputFile);
  const sketchName = path.basename(outputFile, '.ino');
  
  console.log('');
  const uploadResult = uploadSketch(sketchDir, result.config, options.enableRetrieval);
  
  if (!uploadResult.success) {
    console.error('Upload failed:', uploadResult.error);
    if (uploadResult.stderr) {
      console.error(uploadResult.stderr);
    }
    process.exit(1);
  }
  
  // If code retrieval is enabled, wait for board response
  if (options.enableRetrieval) {
    console.log('\n📡 Code retrieval enabled. Board will listen for retrieval request after reboot...');
    console.log('   (This is an experimental feature. Results may vary.)\n');
  }
}

function handleRun(args, options) {
  const inputFile = args[0];
  
  // First compile
  const { result, outputFile } = compileFile(inputFile, null, { ...options, quiet: false });
  
  if (!result.config) {
    console.error('❌ Error: No config found. Cannot run without board configuration.');
    process.exit(1);
  }
  
  // Show warning for code retrieval on low-memory boards
  if (options.enableRetrieval && result.config.isLowMemoryBoard()) {
    console.warn(`\n⚠ Experimental Feature: Code retrieval on ${result.config.getOptions().board}.`);
    console.warn(`   Low-memory boards like Arduino Uno have limited resources.`);
    console.warn(`   Use at your own risk. This feature may cause instability.\n`);
  }
  
  // Create sketch directory for Arduino CLI
  const sketchDir = path.dirname(outputFile);
  
  console.log('');
  const uploadResult = uploadSketch(sketchDir, result.config, options.enableRetrieval);
  
  if (!uploadResult.success) {
    console.error('Upload failed:', uploadResult.error);
    if (uploadResult.stderr) {
      console.error(uploadResult.stderr);
    }
    process.exit(1);
  }
  
  // If code retrieval is enabled, wait for board response
  if (options.enableRetrieval) {
    console.log('\n📡 Code retrieval enabled. Board will listen for retrieval request after reboot...');
    console.log('   (This is an experimental feature. Results may vary.)\n');
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
  const skipMainCheck = args.includes('--skip-main');
  const enableRetrieval = args.includes('-r') || args.includes('--retrieve');
  
  // Filter out options from args
  const fileArgs = args.filter(arg => !arg.startsWith('-'));
  
  // Determine command
  const command = fileArgs[0];
  
  if (command === 'compile') {
    handleCompile(fileArgs.slice(1), { showAST, showTokens, showConfig, skipMainCheck });
  } else if (command === 'upload') {
    handleUpload(fileArgs.slice(1), { showAST, showTokens, showConfig, skipMainCheck, enableRetrieval });
  } else if (command === 'run') {
    handleRun(fileArgs.slice(1), { showAST, showTokens, showConfig, skipMainCheck, enableRetrieval });
  } else {
    // Legacy mode - first arg is the file
    const inputFile = fileArgs[0];
    const outputFile = fileArgs[1];
    compileFile(inputFile, outputFile, { showAST, showTokens, showConfig, skipMainCheck });
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
