import React, { useState } from 'react';
import { styled } from 'goober';
import { useAuthStore } from '../../stores/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const ModalOverlay = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled('div')`
  background: #2f343c;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid #495563;
  position: relative;
  animation: modalSlideIn 0.2s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CloseButton = styled('button')`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #a7b6c2;
  cursor: pointer;
  font-size: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #495563;
    color: #f5f8fa;
  }
`;

const Title = styled('h2')`
  color: #f5f8fa;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px 0;
  text-align: center;
`;

const Form = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled('label')`
  color: #a7b6c2;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled('input')`
  background: #252a30;
  border: 1px solid #495563;
  border-radius: 6px;
  padding: 12px 16px;
  color: #f5f8fa;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #48aff0;
  }

  &::placeholder {
    color: #8a9ba8;
  }
`;

const Button = styled('button')`
  background: #48aff0;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    background: #3a9dd9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ToggleText = styled('p')`
  color: #a7b6c2;
  font-size: 14px;
  text-align: center;
  margin: 24px 0 0 0;
`;

const ToggleLink = styled('button')`
  background: none;
  border: none;
  color: #48aff0;
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;

  &:hover {
    color: #3a9dd9;
  }
`;

const ErrorMessage = styled('div')`
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.3);
  border-radius: 6px;
  padding: 12px 16px;
  color: #fecaca;
  font-size: 14px;
  margin-bottom: 16px;
`;

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
      onClose();
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    clearError();
    setFormData({ email: '', password: '', name: '' });
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <Title>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </Title>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <InputGroup>
              <Label>Name</Label>
              <Input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              placeholder={mode === 'register' ? 'Create a password (8+ chars, uppercase, lowercase, number/symbol)' : 'Enter your password'}
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
            />
          </InputGroup>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
        </Form>

        <ToggleText>
          {mode === 'login' 
            ? "Don't have an account? " 
            : 'Already have an account? '
          }
          <ToggleLink onClick={toggleMode}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </ToggleLink>
        </ToggleText>
      </ModalContent>
    </ModalOverlay>
  );
};