"use client"

import * as React from "react"

function ThemeClassHandler({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }, [])
  
  return <>{children}</>
}

export function ThemeProvider({ children, ...props }: { children: React.ReactNode }) {
  return (
    <ThemeClassHandler>{children}</ThemeClassHandler>
  )
}
