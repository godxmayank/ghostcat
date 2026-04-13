import './globals.css';

export const metadata = {
  title: 'GhostChat',
  description: 'Zero-data, end-to-end encrypted, room-based chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
