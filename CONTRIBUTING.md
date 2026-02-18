# Contributing to Perfex ERP

Thank you for your interest in contributing to Perfex ERP! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 🤝 Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

1. **Node.js 18+** and **pnpm 8+**
2. **Git** for version control
3. **Code editor** (VS Code recommended)
4. **Basic knowledge** of TypeScript, React, and SQL

### Setup Development Environment

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/perfex.git
cd perfex

# 3. Add upstream remote
git remote add upstream https://github.com/devfactory/perfex.git

# 4. Install dependencies
pnpm install

# 5. Copy environment files
cp apps/web/.env.example apps/web/.env
cp apps/workers/api/.dev.vars.example apps/workers/api/.dev.vars

# 6. Run database migrations
pnpm --filter @perfex/database migrate:local

# 7. Start development servers
pnpm dev
```

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards below
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Test locally
pnpm dev
```

### 4. Commit Your Changes

Follow our [commit convention](#commit-convention):

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

1. Go to GitHub and create a Pull Request
2. Fill in the PR template
3. Link related issues
4. Wait for review

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions/primitives

```typescript
// Good ✅
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid ❌
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper TypeScript types for props
- Extract reusable logic into custom hooks

```typescript
// Good ✅
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}
```

### File Naming

- **Components**: PascalCase - `UserProfile.tsx`
- **Utilities**: camelCase - `formatDate.ts`
- **Hooks**: camelCase with use prefix - `useAuth.ts`
- **Types**: PascalCase - `User.ts` or `user.types.ts`

### Code Organization

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layouts/      # Layout components
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── pages/            # Page components
├── store/            # State management
└── types/            # TypeScript types
```

### API Design

- Use RESTful conventions
- Return consistent response format
- Include proper error handling
- Validate all inputs with Zod

```typescript
// Good ✅
app.post('/users', async (c) => {
  const body = await c.req.json();

  const validation = createUserSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: validation.error.errors }
    }, 400);
  }

  const user = await usersService.create(validation.data);
  return c.json({ success: true, data: user }, 201);
});
```

### Database

- Always use Drizzle ORM (no raw SQL)
- Include organizationId in all queries
- Use transactions for related operations
- Add proper indexes

```typescript
// Good ✅
const user = await db
  .select()
  .from(users)
  .where(and(
    eq(users.id, userId),
    eq(users.organizationId, organizationId)
  ))
  .get();
```

## 📦 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(auth): add password reset functionality

# Bug fix
fix(invoices): correct tax calculation rounding

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(services): extract common validation logic

# Multiple changes
feat(crm): add company import feature

- Add CSV import functionality
- Add validation for imported data
- Add error reporting

Closes #123
```

### Scope

Use the module name or component affected:
- `auth`, `finance`, `crm`, `inventory`, etc.
- `api`, `frontend`, `database`
- Component names: `button`, `modal`, `table`

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console errors
- [ ] Build succeeds

### PR Template

When creating a PR, include:

1. **Description**: What does this PR do?
2. **Motivation**: Why is this change needed?
3. **Changes**: List of changes made
4. **Testing**: How to test the changes
5. **Screenshots**: For UI changes
6. **Checklist**: Complete the checklist
7. **Related Issues**: Link related issues

### Review Process

1. At least one maintainer review required
2. All CI checks must pass
3. Resolve all review comments
4. Maintainer will merge when approved

### After Merge

- Delete your feature branch
- Update your local repository
- Celebrate! 🎉

## 🧪 Testing Guidelines

### Unit Tests

Test individual functions and components:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
describe('POST /api/v1/users', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### E2E Tests

Test user flows:

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('input[name="email"]', 'admin@democompany.com');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## 📚 Documentation

### Code Comments

- Add JSDoc comments for functions
- Explain "why", not "what"
- Document complex algorithms
- Add TODO comments for future work

```typescript
/**
 * Calculate the depreciation amount for a fixed asset
 * @param asset - The asset to depreciate
 * @param method - Depreciation method (straight-line, declining-balance)
 * @returns The depreciation amount for the current period
 */
export function calculateDepreciation(
  asset: FixedAsset,
  method: DepreciationMethod
): number {
  // Complex calculation logic here...
}
```

### README Updates

When adding new features:
- Update relevant README sections
- Add usage examples
- Include configuration options
- Update feature list

### API Documentation

Document new endpoints:
- HTTP method and path
- Request parameters
- Request body schema
- Response format
- Error codes
- Examples

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try the latest version
3. Gather reproduction steps

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Actual behavior**
What actually happens.

**Screenshots**
Add screenshots if applicable.

**Environment**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, screenshots, or examples.
```

## 🎓 Learning Resources

### Project Documentation
- [README.md](./README.md) - Project overview
- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - Technical documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup instructions

### External Resources
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Hono.js Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security@perfex.com
- **General**: Email support@perfex.com

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project README

Thank you for contributing to Perfex ERP! 🎉

---

**Last Updated**: January 2025
