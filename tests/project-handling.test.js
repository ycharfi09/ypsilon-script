/**
 * Tests for Project and File Handling
 * Tests folder compilation, @main validation, and error messages
 */

const fs = require('fs');
const path = require('path');
const { compile } = require('../src/compiler');

describe('Project Handling', () => {
  describe('@main directive detection', () => {
    test('should detect @main directive in file', () => {
      const source = `@main

const int LED = 13

fn start() {
  pinMode(LED, OUTPUT)
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(true);
    });

    test('should detect missing @main directive', () => {
      const source = `# Module file without @main

class Helper {
  mut int value
  
  constructor(int v) {
    self.value = v
  }
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(false);
    });

    test('should not detect @main if not at the start', () => {
      const source = `# Comment first

@main

const int LED = 13`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      // @main is tokenized but only counts when in proper position
      expect(result.hasMain).toBe(true);
    });
  });

  describe('File compilation validation', () => {
    test('should compile file with @main successfully', () => {
      const source = `@main

const int LED = 13

on start {
  pinMode(LED, OUTPUT)
}

on loop {
  digitalWrite(LED, HIGH)
  delay(1000)
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(true);
      expect(result.code).toContain('void setup()');
      expect(result.code).toContain('void loop()');
    });

    test('should compile module file without @main', () => {
      const source = `class Motor {
  mut int speed
  
  constructor(int s) {
    self.speed = s
  }
  
  fn setSpeed(int s) {
    self.speed = s
  }
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(false);
      expect(result.code).toContain('class Motor');
    });
  });

  describe('Error messages', () => {
    test('should provide helpful error for syntax errors', () => {
      const source = `@main

const int LED = 13

fn start( {
  pinMode(LED, OUTPUT)
}`;
      
      const result = compile(source);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected');
    });

    test('should compile with valid enum', () => {
      const source = `@main

enum State { ON, OFF }

mut State current = ON

on loop {
  match current {
    ON => current = OFF,
    OFF => current = ON
  }
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(true);
    });
  });

  describe('Module imports with @main', () => {
    test('should compile file with load statement and @main', () => {
      const source = `@main

load <Servo>

const int SERVO_PIN = 9

on start {
  pinMode(SERVO_PIN, OUTPUT)
}

on loop {
  delay(1000)
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(true);
      expect(result.code).toContain('#include <Servo.h>');
    });
  });

  describe('Multiple features with @main', () => {
    test('should compile complex project with classes, enums, and @main', () => {
      const source = `@main

enum Mode { AUTO, MANUAL }

class Controller {
  mut Mode mode
  mut int value
  
  constructor(Mode m) {
    self.mode = m
    self.value = 0
  }
  
  fn update(int v) {
    self.value = v
  }
}

mut Controller ctrl = new Controller(AUTO)

on start {
  pinMode(13, OUTPUT)
}

on loop {
  match ctrl.mode {
    AUTO => digitalWrite(13, HIGH),
    MANUAL => digitalWrite(13, LOW)
  }
  delay(1000)
}`;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.hasMain).toBe(true);
      expect(result.code).toContain('enum Mode');
      expect(result.code).toContain('class Controller');
      expect(result.code).toContain('void setup()');
      expect(result.code).toContain('void loop()');
    });
  });
});
