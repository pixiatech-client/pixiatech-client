"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes"

function ThemeClassHandler({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  
  React.useEffect(() => {
    if (resolvedTheme === "dark") {
      document.body.classList.add("dark-theme")
      document.body.classList.remove("light-theme")
    } else {
      document.body.classList.add("light-theme")
      document.body.classList.remove("dark-theme")
    }
  }, [resolvedTheme])
  
  return <>{children}</>
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeClassHandler>{children}</ThemeClassHandler>
    </NextThemesProvider>
  )
}
