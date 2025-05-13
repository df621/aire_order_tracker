import './globals.css';

// app/layout.js (or wherever you define <head>)
export const metadata = {
  title: 'Aire | Pedidos',
  icons: {
    icon: '/favicon.png', 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}