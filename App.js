/**
 * Personal UPI Expense Tracker
 * Android-only React Native app for tracking UPI transactions
 */

import React, {useState} from 'react';
import DashboardScreen from './src/screens/DashboardScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);

  if (!hasStarted) {
    return <WelcomeScreen onComplete={() => setHasStarted(true)} />;
  }

  return <DashboardScreen />;
};

export default App;
