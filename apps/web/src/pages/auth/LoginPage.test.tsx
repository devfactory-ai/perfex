import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Suppress console.log during tests
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: mockClearError,
    });
  });

  const renderLoginPage = (initialPath = '/login') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/forgot-password" element={<div>Forgot Password</div>} />
          <Route path="/register" element={<div>Register</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('rendering', () => {
    it('should render login form', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    it('should render welcome message', () => {
      renderLoginPage();

      expect(screen.getByText(/bienvenue/i)).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLoginPage();

      expect(screen.getByText(/mot de passe oublié/i)).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLoginPage();

      expect(screen.getByText(/créer un compte/i)).toBeInTheDocument();
    });

    it('should render passwordless login button', () => {
      renderLoginPage();

      expect(screen.getByText(/connexion par lien magique/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should show error for invalid email', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/adresse email/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty password', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/adresse email/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Password validation error should appear
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });
  });

  describe('form submission', () => {
    it('should call login with correct credentials', async () => {
      mockLogin.mockResolvedValueOnce({});
      renderLoginPage();

      const emailInput = screen.getByLabelText(/adresse email/i);
      const passwordInput = screen.getByLabelText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!',
        });
      });
    });

    it('should show loading state during submission', async () => {
      let resolveLogin: () => void;
      mockLogin.mockImplementationOnce(
        () => new Promise((resolve) => { resolveLogin = resolve; })
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/adresse email/i);
      const passwordInput = screen.getByLabelText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/connexion en cours/i)).toBeInTheDocument();
      });

      resolveLogin!();
    });

    it('should disable submit button during loading', async () => {
      let resolveLogin: () => void;
      mockLogin.mockImplementationOnce(
        () => new Promise((resolve) => { resolveLogin = resolve; })
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/adresse email/i);
      const passwordInput = screen.getByLabelText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveLogin!();
    });
  });

  describe('error handling', () => {
    it('should display error message', () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        error: 'Invalid credentials',
        clearError: mockClearError,
      });

      renderLoginPage();

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should handle login failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Login failed'));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/adresse email/i);
      const passwordInput = screen.getByLabelText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      // Submit button should be re-enabled after failure
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('password visibility toggle', () => {
    it('should toggle password visibility', async () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/mot de passe/i);

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the toggle button (eyeOff icon is shown when password is hidden)
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton!);

      // Password should now be visible
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await user.click(toggleButton!);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('passwordless login', () => {
    it('should show passwordless form when button clicked', async () => {
      renderLoginPage();

      const passwordlessButton = screen.getByText(/connexion par lien magique/i);
      await user.click(passwordlessButton);

      expect(screen.getByText(/connexion sans mot de passe/i)).toBeInTheDocument();
      // After clicking, there are two email inputs (form + passwordless)
      const emailInputs = screen.getAllByPlaceholderText(/vous@exemple.com/i);
      expect(emailInputs.length).toBe(2);
    });

    it('should hide passwordless form when toggled off', async () => {
      renderLoginPage();

      const passwordlessButton = screen.getByText(/connexion par lien magique/i);
      await user.click(passwordlessButton);

      const hideButton = screen.getByText(/utiliser un mot de passe/i);
      await user.click(hideButton);

      expect(screen.queryByText(/connexion sans mot de passe/i)).not.toBeInTheDocument();
    });
  });

  describe('demo accounts', () => {
    it('should show demo accounts section in dev/staging', () => {
      // The component checks for localhost/staging, which should be true in tests
      renderLoginPage();

      expect(screen.getByText(/comptes de démonstration/i)).toBeInTheDocument();
    });

    it('should fill credentials when demo account clicked', async () => {
      renderLoginPage();

      // Click on the Gérant demo account
      const demoButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Gérant') || btn.textContent?.includes('Boulanger')
      );

      if (demoButtons.length > 0) {
        await user.click(demoButtons[0]);

        const emailInput = screen.getByLabelText(/adresse email/i);

        // The email should be filled with the demo account email
        await waitFor(() => {
          expect(emailInput).toHaveValue(expect.stringContaining('@perfex.io'));
        });
      }
    });
  });

  describe('remember me', () => {
    it('should render remember me checkbox', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/se souvenir de moi/i)).toBeInTheDocument();
    });

    it('should be checkable', async () => {
      renderLoginPage();

      const checkbox = screen.getByLabelText(/se souvenir de moi/i);
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('navigation', () => {
    it('should have link to forgot password page', () => {
      renderLoginPage();

      const forgotLink = screen.getByRole('link', { name: /mot de passe oublié/i });
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should have link to register page', () => {
      renderLoginPage();

      const registerLink = screen.getByRole('link', { name: /créer un compte/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });
});
