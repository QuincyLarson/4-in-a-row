import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppRouter } from './app/routes/AppRouter';
import { AppProviders } from './app/state/AppProviders';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
