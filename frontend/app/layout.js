import './globals.css';

export const metadata = {
  title: 'Trade the News',
  description: 'Live simulation game — trade on news, compete for best returns.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
