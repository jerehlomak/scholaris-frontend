import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, rightPanel }) => {
  return (
    <div className="min-h-screen bg-brand-gray-light flex items-center justify-center p-4">
      <div className="w-full max-w-[1100px] min-h-[600px] flex flex-col lg:flex-row bg-white rounded-xl overflow-hidden shadow-xl">

        <div className="w-full lg:w-2/5 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          {children}
        </div>
        <div className="w-full lg:w-3/5 p-4 lg:p-4">
          <div className="w-full h-full bg-brand-teal rounded-lg overflow-hidden relative text-white flex flex-col justify-between shadow-inner">
            {rightPanel}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
