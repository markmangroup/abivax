import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operator Spine | Abivax",
  description: "Transaction-grade operator dashboard",
};

export default function AbivaxLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
