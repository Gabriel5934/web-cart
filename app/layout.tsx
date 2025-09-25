"use client";

import "./globals.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Web Cart</title>
      </head>
      <body>
        <Toaster />

        <div className="mb-16">
          <Suspense>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
