import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '/contexts/AuthContext';
import { LanguageProvider } from '/contexts/LanguageContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CV-IA | CV Analysis with AI',
  description: 'Analyze your CV with the power of artificial intelligence',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Aquí añadimos el favicon */}
        <link rel="icon" href="/icons/icono.png" type="image/png" />
        {/* Otros elementos que podrías agregar */}
      </head>      <body className={inter.className}>
        {/* Proveedor de autenticación para toda la aplicación */}
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
