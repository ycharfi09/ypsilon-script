/**
 * Ypsilon Script Configuration Manager
 * Handles config block parsing and mapping to Arduino CLI settings
 */

// Mapping of YS MPU names to Arduino FQBN (Fully Qualified Board Name)
const MPU_TO_FQBN = {
  'atmega328p': 'arduino:avr:uno',
  'atmega2560': 'arduino:avr:mega',
  'esp8266': 'esp8266:esp8266:generic',
  'esp32': 'esp32:esp32:esp32'
};

// Default configuration values
const DEFAULT_CONFIG = {
  mpu: 'atmega328p',
  clock: '16MHz',
  uart: 'off',
  port: 'auto',
  pwm: 'auto'
};

// Determine PWM backend based on board
function getPWMBackend(mpu) {
  const fqbn = MPU_TO_FQBN[mpu] || MPU_TO_FQBN['atmega328p'];
  
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

// Validate MPU name
function validateMPU(mpu) {
  if (!MPU_TO_FQBN[mpu]) {
    const validMPUs = Object.keys(MPU_TO_FQBN).join(', ');
    throw new Error(`Unknown MPU '${mpu}'. Valid options: ${validMPUs}`);
  }
}

/**
 * Config class to manage YS configuration
 */
class Config {
  constructor(configBlock = null) {
    // Start with defaults
    this.options = { ...DEFAULT_CONFIG };
    
    // Merge config block if provided
    if (configBlock && configBlock.options) {
      this.options = { ...this.options, ...configBlock.options };
    }
    
    // Validate MPU
    if (this.options.mpu) {
      try {
        validateMPU(this.options.mpu);
      } catch (error) {
        console.warn(`Warning: ${error.message}. Using default (atmega328p).`);
        this.options.mpu = DEFAULT_CONFIG.mpu;
      }
    }
  }
  
  /**
   * Get the Arduino FQBN for this config
   */
  getFQBN() {
    return MPU_TO_FQBN[this.options.mpu] || MPU_TO_FQBN['atmega328p'];
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
    return getPWMBackend(this.options.mpu);
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
   * Get all options
   */
  getOptions() {
    return { ...this.options };
  }
  
  /**
   * Print config diagnostics
   */
  printDiagnostics() {
    console.log('YS Configuration:');
    console.log(`  Board (MPU): ${this.options.mpu}`);
    console.log(`  FQBN: ${this.getFQBN()}`);
    console.log(`  Clock: ${this.options.clock}`);
    console.log(`  UART: ${this.options.uart}`);
    console.log(`  Port: ${this.options.port}`);
    console.log(`  PWM Backend: ${this.getPWMBackend()}`);
  }
}

module.exports = {
  Config,
  MPU_TO_FQBN,
  DEFAULT_CONFIG,
  getPWMBackend,
  parseClockSpeed,
  validateMPU
};
