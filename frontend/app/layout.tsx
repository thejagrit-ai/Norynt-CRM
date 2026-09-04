// app/layout.tsx — root layout with Google Inter font, reliable CSS pipeline & theme management.
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import 'react-phone-number-input/style.css';
import './globals.css';
import { Providers } from '@/lib/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Norynt CRM',
  description: 'Modern Enterprise CRM Platform',
  manifest: '/manifest.json',
  icons: { icon: '/norynt-crm-mark.png' },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

// Applied before first paint so a light-mode user never sees a dark flash.
// Must stay in sync with LS_THEME_KEY / applyTheme in src/lib/theme.tsx.
const themeInitScript = `(function(){try{var t=localStorage.getItem('norynt_crm_theme');t=(t==='light'||t==='dark')?t:'dark';var r=document.documentElement;r.classList.add(t);r.setAttribute('data-theme',t);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
