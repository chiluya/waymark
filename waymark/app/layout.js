import "./globals.css";


export const metadata = {
  title: "Waymark — daily progress tracker",
  description: "Log reps, posts and study hours. Watch the path fill in.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><ellipse cx='16' cy='25' rx='10' ry='4' fill='%2314261f'/><ellipse cx='16' cy='17' rx='7' ry='3.5' fill='%231e6b4b'/><ellipse cx='16' cy='10' rx='4' ry='3' fill='%2314261f'/></svg>",
  },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" >
      <body>{children}</body>
    </html>
  );
}
