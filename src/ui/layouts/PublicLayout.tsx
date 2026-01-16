import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-gray-100">
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;
