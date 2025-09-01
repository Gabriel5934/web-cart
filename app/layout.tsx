"use client";

import "./globals.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Suspense, useState } from "react";
import { Context } from "./context";
import { Toaster } from "react-hot-toast";
import { User } from "./firebase/users/types";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <html lang="en">
      <head>
        <title>Web Cart</title>
      </head>
      <body>
        <Toaster />

        <div className="mb-16">
          <Context.Provider value={{ auth: { user, setUser } }}>
            <Suspense>{children}</Suspense>
          </Context.Provider>
        </div>
      </body>
    </html>
  );
}
