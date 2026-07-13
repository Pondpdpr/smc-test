import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ApiError } from '@/shared/lib/api-client';
import { useAuth } from '@/shared/lib/auth-context';

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      if (error instanceof ApiError && error.key === 'emailNotVerified') {
        toast.error('Please verify your email before signing in.', {
          action: {
            label: 'Resend email',
            onClick: () => navigate(`/verify-email?resend=${encodeURIComponent(email)}`),
          },
        });
      } else {
        toast.error(error instanceof Error ? error.message : 'Sign in failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { email, setEmail, password, setPassword, isSubmitting, handleSubmit };
}
