import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserPlanProvider } from '../contexts/UserPlanContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Inicializar Firebase (asegúrate de tener un archivo de configuración)
import '../config/firebase'; // Asegúrate de crear este archivo

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserPlanProvider>
      <Component {...pageProps} />
      <ToastContainer />
    </UserPlanProvider>
  );
}

export default MyApp;
