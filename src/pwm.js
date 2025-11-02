/**
 * PWM Backend Selection Helper
 * Chooses between analogWrite (AVR) and ledcWrite (ESP32/ESP8266)
 */

/**
 * Generate PWM setup code based on backend
 */
function generatePWMSetup(backend) {
  if (backend === 'ledc') {
    return `
// LEDC PWM setup for ESP32/ESP8266
const int LEDC_FREQ = 5000;     // 5 KHz
const int LEDC_RESOLUTION = 8;   // 8-bit resolution (0-255)

struct LEDCChannel {
  int pin;
  int channel;
  bool inUse;
};

LEDCChannel ledcChannels[16];
int ledcChannelCount = 0;

int allocateLEDCChannel(int pin) {
  // Check if pin already has a channel
  for (int i = 0; i < ledcChannelCount; i++) {
    if (ledcChannels[i].pin == pin) {
      return ledcChannels[i].channel;
    }
  }
  
  // Allocate new channel
  if (ledcChannelCount < 16) {
    int channel = ledcChannelCount;
    ledcChannels[channel].pin = pin;
    ledcChannels[channel].channel = channel;
    ledcChannels[channel].inUse = true;
    ledcChannelCount++;
    
    // Setup LEDC channel
    ledcSetup(channel, LEDC_FREQ, LEDC_RESOLUTION);
    ledcAttachPin(pin, channel);
    
    return channel;
  }
  
  return -1; // No channels available
}

void analogWrite(int pin, int value) {
  int channel = allocateLEDCChannel(pin);
  if (channel >= 0) {
    ledcWrite(channel, value);
  }
}
`;
  }
  
  // AVR - no special setup needed, analogWrite is built-in
  return '';
}

/**
 * Generate PWM write function call
 */
function generatePWMWrite(pin, value, backend) {
  if (backend === 'ledc') {
    // For LEDC, we use our wrapper function that handles channel allocation
    return `analogWrite(${pin}, ${value})`;
  }
  
  // For AVR, use standard analogWrite
  return `analogWrite(${pin}, ${value})`;
}

/**
 * Check if a function call is a PWM operation
 */
function isPWMCall(callExpression) {
  if (!callExpression || !callExpression.callee) {
    return false;
  }
  
  const funcName = callExpression.callee.name;
  return funcName === 'analogWrite';
}

/**
 * Get required includes for PWM backend
 */
function getPWMIncludes(backend) {
  if (backend === 'ledc') {
    // ESP32/ESP8266 LEDC includes are part of Arduino.h
    return [];
  }
  
  // AVR doesn't need special includes
  return [];
}

module.exports = {
  generatePWMSetup,
  generatePWMWrite,
  isPWMCall,
  getPWMIncludes
};
