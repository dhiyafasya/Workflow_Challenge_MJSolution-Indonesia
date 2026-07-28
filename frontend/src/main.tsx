import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/css/style.css';
import './assets/css/login.css';
import './assets/css/sidebar.css';
import './assets/css/overview.css';
import './assets/css/devices.css';
import './assets/css/contents.css';
import './assets/css/playlist.css';
import './assets/css/device-client.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
