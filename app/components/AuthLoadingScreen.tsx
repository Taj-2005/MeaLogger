import React from 'react';
import LoadingScreen from './LoadingScreen';

interface AuthLoadingScreenProps {
  message?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Please wait...',
}) => {
  return <LoadingScreen message={message} variant="default" />;
};

export default AuthLoadingScreen;

