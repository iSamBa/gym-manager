// This file is required for the app directory root.
// The actual HTML structure is in [locale]/layout.tsx
// The middleware handles locale redirection.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
