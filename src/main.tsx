import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import { store } from "./store/store.ts";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = '305956686069-ogedh312p79n405acsrad4iqg76q9ki5.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </GoogleOAuthProvider>
)
