import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ApiError } from '@/shared/lib/api-client';
import { useAuth } from '@/shared/lib/auth-context';

export function useRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register({ email, password, firstName, lastName });
      navigate(`/verify-email?sent=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof ApiError && error.key === 'usernameExists') {
        toast.error('An account with this email already exists.', {
          action: {
            label: 'Sign in',
            onClick: () => navigate('/login'),
          },
        });
      } else {
        toast.error(error instanceof Error ? error.message : 'Registration failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    handleSubmit,
  };
}
