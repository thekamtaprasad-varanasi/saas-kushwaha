import './globals.css';
import ServiceWorker from './ServiceWorker';

export const metadata = {
  title: 'Psychiatrist Pro',
  description: 'Where Mental Healing Meets Technology',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Psychiatrist Pro',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}