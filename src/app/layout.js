import "./globals.css";

export const metadata = {
  title: "FAVO",
  description: "Premium fashion storefront with a refined black luxury experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
