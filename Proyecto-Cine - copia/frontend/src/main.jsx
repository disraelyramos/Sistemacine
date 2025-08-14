import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';

import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


import App from './App';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="758136141731-dnk8rpb4h2nho420s7l3hfvccfmu18mj.apps.googleusercontent.com">
    <BrowserRouter>
      <>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
