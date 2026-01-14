# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-14

### Added

- **Full 10 Core Packages**: Complete implementation of SDK, Collector, Storage, Metrics, Reproducibility, Impact, Behavior, Code Tracing, Historical, AI, and Predictive cores.
- **Predictive Core**: Self-healing capabilities with `onPrediction` hooks.
- **AI Core**: Integration with LLMs for human-readable insights.
- **Examples**: End-to-end integration example in `examples/full-flow-integration`.
- **Scripts**: `build-all.sh` and `pack-all.sh` for easy management.
- **Documentation**: Comprehensive READMEs for all packages and root project.

### Fixed

- Resolved circular dependencies in local package builds.
- Fixed `node_modules` git tracking issue.
- Stabilized TypeScript strict mode compliance across all packages.
