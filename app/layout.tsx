import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wicked Studio Creator Edition",
    template: "%s | Wicked Studio",
  },
  description: "A browser-based creative workspace for animated GIFs, video loops, pixel art, typography, textures and sound design.",
  applicationName: "Wicked Studio",
  keywords: ["GIF creator", "ASCII art", "image to ASCII", "video to ASCII", "video to GIF", "pixel art", "sprite sheets", "motion graphics", "texture generator", "sound design", "ASCII video converter"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "Wicked Studio",
    title: "Wicked Studio Creator Edition",
    description: "Create, edit and export creative assets in one responsive workspace.",
  },
  twitter: {
    card: "summary",
    title: "Wicked Studio Creator Edition",
    description: "A browser-based creative workspace.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#100d19",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}