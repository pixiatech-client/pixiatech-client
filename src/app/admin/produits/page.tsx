"use client";

import dynamic from 'next/dynamic';

const App = dynamic(
  () => import("./ProductManagementClient"),
  { ssr: false }
);

export default function ProduitsPage() {
  return <App />;
}