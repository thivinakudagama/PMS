import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectHub PMS",
  description: "A project management system for users, roles, projects, tasks, and delivery operations"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
