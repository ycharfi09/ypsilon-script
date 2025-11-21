/**
 * Tests for Interrupt Support in Ypsilon Script
 */

const { compile } = require('../src/compiler');
const { Lexer, TOKEN_TYPES } = require('../src/lexer');
const { Parser } = require('../src/parser');

describe('Interrupt Lexer', () => {
  test('should tokenize interrupt keyword', () => {
    const source = 'interrupt';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.INTERRUPT);
  });

  test('should tokenize interrupt mode keywords', () => {
    const source = 'rising falling change low high';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TOKEN_TYPES.RISING);
    expect(tokens[1].type).toBe(TOKEN_TYPES.FALLING);
    expect(tokens[2].type).toBe(TOKEN_TYPES.CHANGE);
    // low and high are now identifiers, not keywords
    expect(tokens[3].type).toBe(TOKEN_TYPES.IDENTIFIER);
    expect(tokens[3].value).toBe('low');
    expect(tokens[4].type).toBe(TOKEN_TYPES.IDENTIFIER);
    expect(tokens[4].value).toBe('high');
  });
});

describe('Interrupt Parser', () => {
  test('should parse basic interrupt block', () => {
    const source = `
      mut int x = 0
      
      interrupt on 2 rising {
        x = 5
      }
    `;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.body[1].type).toBe('InterruptBlock');
    expect(ast.body[1].pin).toBe(2);
    expect(ast.body[1].mode).toBe('rising');
    expect(ast.body[1].name).toBe(null);
    expect(ast.body[1].body).toBeDefined();
  });

  test('should parse named interrupt block', () => {
    const source = `
      mut int counter = 0
      
      interrupt myISR on 3 falling {
        counter = 0
      }
    `;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.body[1].type).toBe('InterruptBlock');
    expect(ast.body[1].name).toBe('myISR');
    expect(ast.body[1].pin).toBe(3);
    expect(ast.body[1].mode).toBe('falling');
  });

  test('should parse interrupt with identifier pin', () => {
    const source = `
      mut bool flag = false
      
      interrupt on D2 change {
        flag = true
      }
    `;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.body[1].type).toBe('InterruptBlock');
    expect(ast.body[1].pin).toBe('D2');
    expect(ast.body[1].mode).toBe('change');
  });

  test('should parse all interrupt modes', () => {
    const modes = ['rising', 'falling', 'change', 'low', 'high'];
    
    modes.forEach(mode => {
      const source = `
        mut int x = 0
        interrupt on 2 ${mode} { x = 0 }
      `;
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      expect(ast.body[1].mode).toBe(mode);
    });
  });
});

describe('Interrupt Code Generation', () => {
  test('should generate ISR function', () => {
    const source = `
      mut int counter = 0
      
      interrupt on 2 rising {
        counter = counter + 1
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('void isr_0()');
    expect(result.code).toContain('counter = (counter + 1)');
  });

  test('should generate named ISR function', () => {
    const source = `
      mut int counter = 0
      
      interrupt myISR on 2 rising {
        counter = counter + 1
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('void myISR()');
  });

  test('should generate attachInterrupt call', () => {
    const source = `
      mut int x = 0
      
      interrupt on 2 rising {
        x = 0
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('attachInterrupt(digitalPinToInterrupt(2), isr_0, RISING)');
  });

  test('should map interrupt modes correctly', () => {
    const modes = [
      { ys: 'rising', cpp: 'RISING' },
      { ys: 'falling', cpp: 'FALLING' },
      { ys: 'change', cpp: 'CHANGE' },
      { ys: 'low', cpp: 'LOW' },
      { ys: 'high', cpp: 'HIGH' }
    ];
    
    modes.forEach(({ ys, cpp }) => {
      const source = `
        mut int x = 0
        interrupt on 2 ${ys} { x = 0 }
      `;
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.code).toContain(cpp);
    });
  });

  test('should mark ISR-used variables as volatile', () => {
    const source = `
      mut int counter = 0
      mut int otherVar = 0
      
      interrupt on 2 rising {
        counter = counter + 1
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('volatile int counter');
    expect(result.code).not.toContain('volatile int otherVar');
  });

  test('should allow assignment in ISR', () => {
    const source = `
      mut bool flag = false
      
      interrupt on 2 rising {
        flag = true
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('flag = true');
  });

  test('should allow arithmetic in ISR', () => {
    const source = `
      mut int count = 0
      
      interrupt on 2 rising {
        count = count + 1
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
  });

  test('should allow emit in ISR', () => {
    const source = `
      signal buttonPressed
      
      interrupt on 2 rising {
        emit buttonPressed
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('_signal_buttonPressed = true');
  });

  test('should forbid print in ISR', () => {
    const source = `
      interrupt on 2 rising {
        print("test")
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('print() is not allowed in interrupts');
  });

  test('should forbid delay in ISR', () => {
    const source = `
      interrupt on 2 rising {
        delay(100)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('delay() is not allowed in interrupts');
  });

  test('should forbid wait in ISR', () => {
    const source = `
      interrupt on 2 rising {
        wait 100ms
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('wait is not allowed in interrupts');
  });

  test('should forbid while loops in ISR', () => {
    const source = `
      mut int x = 0
      
      interrupt on 2 rising {
        while (true) {
          x = 0
        }
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('loops are not allowed in interrupts');
  });

  test('should forbid for loops in ISR', () => {
    const source = `
      mut int x = 0
      
      interrupt on 2 rising {
        for (int i = 0; i < 10; i = i + 1) {
          x = 0
        }
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('loops are not allowed in interrupts');
  });

  test('should handle multiple interrupts', () => {
    const source = `
      mut int counter1 = 0
      mut int counter2 = 0
      
      interrupt on 2 rising {
        counter1 = counter1 + 1
      }
      
      interrupt on 3 falling {
        counter2 = counter2 + 1
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('void isr_0()');
    expect(result.code).toContain('void isr_1()');
    expect(result.code).toContain('attachInterrupt(digitalPinToInterrupt(2), isr_0, RISING)');
    expect(result.code).toContain('attachInterrupt(digitalPinToInterrupt(3), isr_1, FALLING)');
  });

  test('should update reactive variables in ISR', () => {
    const source = `
      react mut rpm: int = 0
      
      interrupt on 2 rising {
        rpm = rpm + 1
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('volatile int rpm');
  });
});

describe('Complete Interrupt Example', () => {
  test('should compile full interrupt example', () => {
    const source = `
      alias BUTTON_PIN = 2
      alias LED_PIN = 13
      
      mut int buttonPressed = 0
      react mut lastPressTime: int = 0
      
      interrupt buttonISR on BUTTON_PIN rising {
        buttonPressed = buttonPressed + 1
        lastPressTime = millis()
      }
      
      on start {
        pinMode(LED_PIN, OUTPUT)
        pinMode(BUTTON_PIN, INPUT_PULLUP)
      }
      
      on loop {
        if (buttonPressed > 0) {
          digitalWrite(LED_PIN, HIGH)
        } else {
          digitalWrite(LED_PIN, LOW)
        }
        delay(10)
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('void buttonISR()');
    expect(result.code).toContain('volatile int buttonPressed');
    expect(result.code).toContain('volatile int lastPressTime');
    expect(result.code).toContain('attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, RISING)');
  });
});
