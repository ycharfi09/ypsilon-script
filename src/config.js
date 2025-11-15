/**
 * Ypsilon Script Configuration Manager
 * Handles config block parsing and mapping to Arduino CLI settings
 */

// Mapping of YS board names to Arduino FQBN (Fully Qualified Board Name)
// Supports both modern board names (arduino_uno) and legacy MPU names (atmega328p)
const BOARD_TO_FQBN = {
  // Modern board names (preferred)
  'arduino_uno': 'arduino:avr:uno',
  'arduino_nano': 'arduino:avr:nano',
  'arduino_mega': 'arduino:avr:mega',
  'arduino_leonardo': 'arduino:avr:leonardo',
  'esp32': 'esp32:esp32:esp32',
  'esp32_dev': 'esp32:esp32:esp32',
  'esp8266': 'esp8266:esp8266:generic',
  'esp8266_generic': 'esp8266:esp8266:generic',
  // Legacy MPU names (backward compatibility)
  'atmega328p': 'arduino:avr:uno',
  'atmega2560': 'arduino:avr:mega',
  'atmega32u4': 'arduino:avr:leonardo'
};

// Backward compatibility alias
const MPU_TO_FQBN = BOARD_TO_FQBN;

// Low-memory boards that should show warnings for experimental features
const LOW_MEMORY_BOARDS = ['arduino_uno', 'arduino_nano', 'atmega328p'];

// Default configuration values
const DEFAULT_CONFIG = {
  board: 'arduino_uno',
  clock: '16MHz',
  uart: 'off',
  port: 'auto',
  pwm: 'auto'
};

// Determine PWM backend based on board
function getPWMBackend(board) {
  const fqbn = BOARD_TO_FQBN[board] || BOARD_TO_FQBN['arduino_uno'];
  
  if (fqbn.includes('esp8266') || fqbn.includes('esp32')) {
    return 'ledc'; // ESP boards use LEDC
  }
  return 'analogWrite'; // AVR boards use analogWrite
}

// Parse clock speed to build property format
function parseClockSpeed(clock) {
  // Convert formats like "16MHz" to "16000000L"
  const match = clock.match(/^(\d+)MHz$/i);
  if (match) {
    const mhz = parseInt(match[1]);
    return `${mhz * 1000000}L`;
  }
  
  // If already in numeric format, return as-is
  if (/^\d+L?$/.test(clock)) {
    return clock.endsWith('L') ? clock : clock + 'L';
  }
  
  // Default to 16MHz
  return '16000000L';
}

// Validate board name
function validateBoard(board) {
  if (!BOARD_TO_FQBN[board]) {
    const validBoards = Object.keys(BOARD_TO_FQBN).filter(b => !b.includes('atmega')).join(', ');
    const legacyBoards = Object.keys(BOARD_TO_FQBN).filter(b => b.includes('atmega')).join(', ');
    throw new Error(
      `Unknown board '${board}'.\n` +
      `Valid boards: ${validBoards}\n` +
      `Legacy MPU names (deprecated): ${legacyBoards}`
    );
  }
}

// Check if board is low-memory (for warnings)
function isLowMemoryBoard(board) {
  return LOW_MEMORY_BOARDS.includes(board);
}

/**
 * Config class to manage YS configuration
 */
class Config {
  constructor(configBlock = null, options = {}) {
    // Start with defaults
    this.options = { ...DEFAULT_CONFIG };
    
    // Merge config block if provided
    if (configBlock && configBlock.options) {
      const blockOptions = { ...configBlock.options };
      
      // Support both 'board' and 'mpu' (legacy), prefer 'board'
      if (blockOptions.mpu && !blockOptions.board) {
        blockOptions.board = blockOptions.mpu;
        delete blockOptions.mpu;
      } else if (blockOptions.cpu && !blockOptions.board) {
        // Also support 'cpu' for transition
        blockOptions.board = blockOptions.cpu;
        delete blockOptions.cpu;
      }
      
      this.options = { ...this.options, ...blockOptions };
    }
    
    // Store whether this is for a main file (for validation)
    this.isMainFile = options.isMainFile || false;
    
    // Validate board
    if (this.options.board) {
      try {
        validateBoard(this.options.board);
      } catch (error) {
        const errorMsg = `⚠ Config Error: ${error.message}\n` +
                        `   Using default (arduino_uno).\n` +
                        `   Please update your config block with a valid board name.`;
        console.warn(errorMsg);
        this.options.board = DEFAULT_CONFIG.board;
      }
    }
  }
  
  /**
   * Validate that config has all required fields for upload
   * Should be called when @main is present
   */
  validateForUpload() {
    const errors = [];
    const warnings = [];
    
    if (!this.options.board) {
      errors.push('Missing required field: board (e.g., arduino_uno, arduino_mega, esp32)');
    }
    
    if (!this.options.clock) {
      errors.push('Missing required field: clock (e.g., 16MHz, 8MHz)');
    }
    
    if (!this.options.uart) {
      warnings.push('UART not specified. Default is "off". Set "uart: on" to enable serial monitor.');
    }
    
    if (!this.options.port) {
      warnings.push('Port not specified. Default is "auto". You can specify a port like "COM3" or "/dev/ttyUSB0".');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get beginner-friendly error message for missing/invalid config
   */
  getConfigErrorMessage() {
    const validation = this.validateForUpload();
    
    if (!validation.valid) {
      let message = '❌ Config Error: Your @main file must have a complete config block.\n\n';
      message += 'Missing or invalid fields:\n';
      validation.errors.forEach(err => {
        message += `  • ${err}\n`;
      });
      message += '\nExample of a correct config block:\n\n';
      message += 'config {\n';
      message += '  board: arduino_uno,\n';
      message += '  clock: 16MHz,\n';
      message += '  uart: on,\n';
      message += '  port: auto\n';
      message += '}\n\n';
      message += 'Valid board names:\n';
      message += '  • arduino_uno (Arduino Uno)\n';
      message += '  • arduino_nano (Arduino Nano)\n';
      message += '  • arduino_mega (Arduino Mega 2560)\n';
      message += '  • arduino_leonardo (Arduino Leonardo)\n';
      message += '  • esp32 (ESP32 boards)\n';
      message += '  • esp8266 (ESP8266 boards)\n';
      
      return message;
    }
    
    return null;
  }
  
  /**
   * Get the Arduino FQBN for this config
   */
  getFQBN() {
    return BOARD_TO_FQBN[this.options.board] || BOARD_TO_FQBN['arduino_uno'];
  }
  
  /**
   * Get build properties for Arduino CLI
   */
  getBuildProperties() {
    const props = [];
    
    // Add F_CPU if clock is specified
    if (this.options.clock) {
      const fcpu = parseClockSpeed(this.options.clock);
      props.push(`F_CPU=${fcpu}`);
    }
    
    return props;
  }
  
  /**
   * Get the PWM backend for this board
   */
  getPWMBackend() {
    // Allow manual override
    if (this.options.pwm && this.options.pwm !== 'auto') {
      return this.options.pwm;
    }
    
    // Auto-detect based on board
    return getPWMBackend(this.options.board);
  }
  
  /**
   * Check if UART should be enabled
   */
  isUARTEnabled() {
    return this.options.uart === 'on' || this.options.uart === true;
  }
  
  /**
   * Get port setting
   */
  getPort() {
    return this.options.port;
  }
  
  /**
   * Check if this is a low-memory board
   */
  isLowMemoryBoard() {
    return isLowMemoryBoard(this.options.board);
  }
  
  /**
   * Get all options
   */
  getOptions() {
    // For backward compatibility, also expose board as mpu
    return { 
      ...this.options,
      mpu: this.options.board // backward compatibility
    };
  }
  
  /**
   * Print config diagnostics
   */
  printDiagnostics() {
    console.log('YS Configuration:');
    console.log(`  Board: ${this.options.board}`);
    console.log(`  FQBN: ${this.getFQBN()}`);
    console.log(`  Clock: ${this.options.clock}`);
    console.log(`  UART: ${this.options.uart}`);
    console.log(`  Port: ${this.options.port}`);
    console.log(`  PWM Backend: ${this.getPWMBackend()}`);
  }
}

module.exports = {
  Config,
  BOARD_TO_FQBN,
  MPU_TO_FQBN, // Backward compatibility
  DEFAULT_CONFIG,
  LOW_MEMORY_BOARDS,
  getPWMBackend,
  parseClockSpeed,
  validateBoard,
  validateMPU: validateBoard, // Backward compatibility alias
  isLowMemoryBoard
};
