import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CV-IA | CV Analysis with AI',
  description: 'Analyze your CV with the power of artificial intelligence',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Proveedor de autenticación para toda la aplicación */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}