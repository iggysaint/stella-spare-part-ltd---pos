import React, { useState } from 'react';
import { UserSession } from '../../types';
import { authService } from '../../services/authService';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Wrench,
  Check
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedAccount, setSelectedAccount] = useState<'stella' | 'admin'>('stella');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedAccount) {
      setErrorMessage('Please select an account.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login({
        account: selectedAccount,
        password,
      });

      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else if (res.user.isLoggedIn) {
        onLoginSuccess(res.user);
      }
    } catch {
      setErrorMessage('Login failed. Please check credentials and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-accent text-surface border border-border">
            <Wrench className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              Stella Spare Part Ltd
            </h1>
            <p className="text-sm text-secondary mt-1">
              Tema Station, Accra — POS Register
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="mt-8 bg-surface p-6 sm:p-8 rounded-lg border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Account Selector Cards */}
            <div>
              <label className="block text-xs font-semibold text-secondary mb-2.5">
                Select Account to Open Counter
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Mama Stella Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccount('stella');
                    setErrorMessage(null);
                  }}
                  className={`p-4 rounded-lg border text-left transition flex flex-col items-start gap-3 select-none ${
                    selectedAccount === 'stella'
                      ? 'border-accent bg-accent-soft text-accent ring-2 ring-accent'
                      : 'border-border bg-surface-muted hover:bg-surface text-secondary'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-accent text-surface flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    {selectedAccount === 'stella' && (
                      <span className="w-5 h-5 rounded-lg bg-accent text-surface flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-primary">Mama Stella</h3>
                    <p className="text-xs text-secondary mt-0.5">Counter & Sales</p>
                  </div>
                </button>

                {/* Administrator Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccount('admin');
                    setErrorMessage(null);
                  }}
                  className={`p-4 rounded-lg border text-left transition flex flex-col items-start gap-3 select-none ${
                    selectedAccount === 'admin'
                      ? 'border-accent bg-accent-soft text-accent ring-2 ring-accent'
                      : 'border-border bg-surface-muted hover:bg-surface text-secondary'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-accent text-surface flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    {selectedAccount === 'admin' && (
                      <span className="w-5 h-5 rounded-lg bg-accent text-surface flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-primary">Administrator</h3>
                    <p className="text-xs text-secondary mt-0.5">Full System Access</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-secondary mb-1.5">
                Password (6+ characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-11 py-3 bg-surface-muted border border-border rounded-lg text-primary placeholder:text-secondary text-sm font-medium focus:outline-hidden focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:text-primary rounded-lg transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div 
                className="p-3 bg-danger/10 border border-danger text-danger text-xs font-semibold rounded-lg flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-base flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <span>Logging in...</span>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-secondary mt-6">
          Offline-ready Point of Sale · Stella Spare Part Ltd
        </p>

      </div>
    </div>
  );
};
