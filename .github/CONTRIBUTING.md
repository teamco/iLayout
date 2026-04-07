# Contributing to Subscription Management Platform

Thank you for your interest in contributing to our project! We welcome contributions from everyone.

## 🚀 Getting Started

1.  **Fork the repository** and create your branch from `main`.
2.  **Install dependencies** using Yarn v4:
    ```bash
    pnpm install
    ```
3.  **Create a branch** for your changes:
    ```bash
    git checkout -b feature/my-new-feature
    ```

## 🛠️ Development Workflow

We use **Nx** for monorepo management. Always prefer using Nx commands for tasks:

- **Serve the application**: `pnpm dev` (or `nx serve`)
- **Build projects**: `pnpm build` (or `nx build <project-name>`)
- **Linting**: `pnpm lint` (or `nx lint <project-name>`)
- **Testing**: `pnpm test` (or `nx test <project-name>`)

### 📋 Coding Standards

- **TypeScript**: Use strict typing and follow existing patterns.
- **Naming**:
  - `I` prefix for interfaces (e.g., `ITenant`).
  - `T` prefix for types (e.g., `TUserRole`).
  - `E` prefix for enums (e.g., `EStatus`).
- **Imports**: Ensure all imports are correctly resolved and avoid circular dependencies.
- **Clean Code**: Avoid duplicated logic, unused imports, and unnecessary variables.

## 🧪 Testing Requirements

**A change is incomplete without verification logic.**

1.  **Unit Tests**: Add unit tests for any new logic in `__tests__` directories adjacent to the source files.
2.  **Naming**: Use `*.unit.test.ts` for unit tests and `*.spec.ts` where appropriate.
3.  **Coverage**: Maintain high test coverage (80% minimum for frontend projects).
4.  **Verification**: Before submitting, ensure all tests pass and the project builds successfully.

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code restructuring
- `test:` for adding/fixing tests
- `chore:` for maintenance tasks

## 📜 Documentation

**MANDATORY RULE**: Update all related documentation (`.md` files) upon successful completion of a task. This includes:
- Updating `ARCHITECTURE.md` for structural changes.
- Adding new test documentation in `docs/` if necessary.

## 🛡️ Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](../CODE_OF_CONDUCT.md).

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE.md).
