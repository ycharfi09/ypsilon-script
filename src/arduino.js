/**
 * Arduino CLI Integration Helper
 * Handles compilation and upload using Arduino CLI
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Check if Arduino CLI is installed
 */
function isArduinoCLIInstalled() {
  try {
    execSync('arduino-cli version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Auto-detect serial port based on platform
 */
function detectPort() {
  const platform = os.platform();
  
  try {
    if (platform === 'win32') {
      // Windows - look for COM ports
      const output = execSync('arduino-cli board list', { encoding: 'utf8' });
      const match = output.match(/COM\d+/);
      return match ? match[0] : null;
    } else {
      // Linux/Mac - look for USB ports
      const output = execSync('arduino-cli board list', { encoding: 'utf8' });
      
      // Try to find /dev/ttyUSB* or /dev/ttyACM* or /dev/cu.usbserial*
      let match = output.match(/\/dev\/ttyUSB\d+/);
      if (!match) match = output.match(/\/dev\/ttyACM\d+/);
      if (!match) match = output.match(/\/dev\/cu\.usbserial[^\s]*/);
      
      return match ? match[0] : null;
    }
  } catch (error) {
    console.warn('Warning: Could not auto-detect port:', error.message);
    return null;
  }
}

/**
 * Compile Arduino sketch using Arduino CLI
 */
function compileSketch(sketchPath, config) {
  if (!isArduinoCLIInstalled()) {
    throw new Error('Arduino CLI is not installed. Please install it from https://arduino.github.io/arduino-cli/');
  }
  
  const fqbn = config.getFQBN();
  const buildProps = config.getBuildProperties();
  
  console.log(`Compiling for board: ${fqbn}`);
  
  let command = `arduino-cli compile --fqbn ${fqbn}`;
  
  // Add build properties
  buildProps.forEach(prop => {
    command += ` --build-property ${prop}`;
  });
  
  command += ` ${sketchPath}`;
  
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✓ Compilation successful');
    return { success: true, output };
  } catch (error) {
    console.error('✗ Compilation failed');
    return { success: false, error: error.message, stderr: error.stderr };
  }
}

/**
 * Upload sketch to board using Arduino CLI
 */
function uploadSketch(sketchPath, config, enableRetrieval = false) {
  if (!isArduinoCLIInstalled()) {
    throw new Error('Arduino CLI is not installed. Please install it from https://arduino.github.io/arduino-cli/');
  }
  
  const fqbn = config.getFQBN();
  let port = config.getPort();
  
  // Auto-detect port if set to 'auto'
  if (port === 'auto') {
    console.log('Auto-detecting port...');
    port = detectPort();
    if (!port) {
      throw new Error('Could not auto-detect port. Please specify port explicitly in config.');
    }
    console.log(`Detected port: ${port}`);
  }
  
  console.log(`Uploading to ${port}...`);
  
  // Note: enableRetrieval would need firmware support to actually work
  // For now, we just acknowledge the flag but don't change upload behavior
  // The actual code retrieval would be implemented in the generated firmware
  
  const command = `arduino-cli upload --fqbn ${fqbn} --port ${port} ${sketchPath}`;
  
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✓ Upload successful');
    return { success: true, output, port };
  } catch (error) {
    console.error('✗ Upload failed');
    return { success: false, error: error.message, stderr: error.stderr };
  }
}

/**
 * Open serial monitor
 */
function openSerialMonitor(port, baudRate = 9600) {
  if (!port || port === 'auto') {
    port = detectPort();
    if (!port) {
      throw new Error('Could not detect port for serial monitor');
    }
  }
  
  console.log(`Opening serial monitor on ${port} at ${baudRate} baud...`);
  console.log('Press Ctrl+C to exit\n');
  
  // Use arduino-cli monitor if available
  if (isArduinoCLIInstalled()) {
    const monitor = spawn('arduino-cli', ['monitor', '--port', port, '--config', `baudrate=${baudRate}`], {
      stdio: 'inherit'
    });
    
    return monitor;
  } else {
    console.error('Arduino CLI not found. Serial monitor requires Arduino CLI.');
    return null;
  }
}

/**
 * Compile and upload in one step
 */
function compileAndUpload(sketchPath, config) {
  // Compile first
  const compileResult = compileSketch(sketchPath, config);
  if (!compileResult.success) {
    return compileResult;
  }
  
  // Then upload
  const uploadResult = uploadSketch(sketchPath, config);
  return uploadResult;
}

module.exports = {
  isArduinoCLIInstalled,
  detectPort,
  compileSketch,
  uploadSketch,
  openSerialMonitor,
  compileAndUpload
};
