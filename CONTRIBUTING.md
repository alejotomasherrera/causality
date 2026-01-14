# CONTRIBUTING

## Code of Conduct

This project and everyone participating in it is governed by the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## How to Contribute

1.  **Fork** the repository.
2.  **Clone** your fork.
3.  **Create a branch** (`git checkout -b feature/amazing-feature`).
4.  **Commit** your changes (`git commit -m 'feat: add amazing feature'`).
5.  **Push** to your branch (`git push origin feature/amazing-feature`).
6.  **Open a Pull Request**.

## Development Workflow

### Building

Use the script to build all packages in order:

```bash
./scripts/build-all.sh
```

### Testing

Each package has its own tests. Navigate to the package and run:

```bash
npm test
```

## Pull Request Guidelines

- Ensure all builds pass.
- Write tests for new features.
- Update documentation if API changes.
