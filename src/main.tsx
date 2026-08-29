import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { NetworkErrorBoundary } from './components/common/NetworkErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </NetworkErrorBoundary>
  </React.StrictMode>,
);
