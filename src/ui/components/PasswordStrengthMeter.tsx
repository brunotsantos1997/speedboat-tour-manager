
import React from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const requirements = [
    { label: 'Pelo menos 8 caracteres', met: password.length >= minLength },
    { label: 'Pelo menos uma letra maiúscula', met: hasUpperCase },
    { label: 'Pelo menos uma letra minúscula', met: hasLowerCase },
    { label: 'Pelo menos um número', met: hasNumbers },
    { label: 'Pelo menos um caractere especial', met: hasSpecialChars },
  ];

  return (
    <div className="space-y-1">
      {requirements.map((req, index) => (
        <div key={index} className={`flex items-center text-sm ${req.met ? 'text-green-600' : 'text-red-600'}`}>
          <svg
            className="w-4 h-4 mr-2 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            {req.met ? (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {req.label}
        </div>
      ))}
    </div>
  );
};

export default PasswordStrengthMeter;
