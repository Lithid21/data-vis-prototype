import React from 'react';
import {createRoot} from 'react-dom/client';

import { Auth0Provider } from '@auth0/auth0-react';

import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <Auth0Provider
        domain="dev-5ddz999s.us.auth0.com"
        clientId="zDorxVdDQY6IpCwQfNWEDteKTR4D6tid"
        redirectUri={window.location.origin}
    >
        <App />
  </Auth0Provider>
);