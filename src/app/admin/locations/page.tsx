"use client";

import dynamic from 'next/dynamic';

const App = dynamic(
  () => import("./LocationManagementClient"),
  { ssr: false }
);

export default function LocationsPage() {
  return <App />;
}
