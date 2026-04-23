import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LoginGate } from "../components/auth/login-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyDay Astro Real Time Dashboard",
  description: "Real-time operations and user analytics",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LoginGate>{children}</LoginGate>
      </body>
    </html>
  );
}
