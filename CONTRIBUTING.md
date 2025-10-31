# Contributing to Ypsilon Script

Thank you for your interest in contributing to Ypsilon Script! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ypsilon-script.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Test the compiler
node bin/ysc.js examples/blink.ys
```

## Project Structure

```
ypsilon-script/
├── src/              # Source code
│   ├── lexer.js      # Tokenizer
│   ├── parser.js     # Parser (builds AST)
│   ├── codegen.js    # Code generator (AST to C++)
│   ├── compiler.js   # Main compiler
│   └── index.js      # Package entry point
├── bin/              # CLI tool
│   └── ysc.js        # Command-line interface
├── examples/         # Example programs
├── tests/            # Test files
└── docs/             # Documentation
```

## Making Changes

### Code Style

- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code patterns

### Adding Features

1. Write tests first (TDD approach recommended)
2. Implement the feature
3. Update documentation
4. Add examples if applicable

### Testing

All changes should include tests. Run the test suite before submitting:

```bash
npm test
```

Tests are located in the `tests/` directory and use Jest.

### Adding Examples

When adding new language features, please add corresponding examples:

1. Create a `.ys` file in `examples/`
2. Compile it to verify it works: `node bin/ysc.js examples/yourexample.ys`
3. Document the example in the README

## Submitting Changes

1. Ensure all tests pass: `npm test`
2. Commit your changes with a clear message:
   ```
   git commit -m "Add feature: description of what you added"
   ```
3. Push to your fork: `git push origin feature/your-feature-name`
4. Create a Pull Request

### Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include test coverage for new features
- Update documentation as needed
- Keep PRs focused on a single feature or fix

## Reporting Issues

When reporting bugs, please include:

- YS code that reproduces the issue
- Expected behavior
- Actual behavior
- Error messages (if any)
- Your environment (Node.js version, OS)

## Feature Requests

We welcome feature requests! Please:

- Check if the feature has already been requested
- Provide a clear use case
- Include example code if possible

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help each other learn and grow

## Questions?

Feel free to open an issue for questions or discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
