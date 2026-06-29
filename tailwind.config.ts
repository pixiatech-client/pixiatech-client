import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './gestion-de-produits-audiovisuels/**/*.{js,ts,jsx,tsx}'
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      maxWidth: {
        '8xl': '90rem',
      },
      height: {
        'dvh': '100dvh',
      },
      minHeight: {
        'dvh': '100dvh',
      },
      fontFamily: {
        body: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        mono: ['var(--font-inter)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        display: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        headline: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        tech: ['var(--font-orbitron)', 'sans-serif'],
      },
      colors: {
        bluish: "#7182ff",
        greenish: "#3cff52",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        aura: {
          bg: "var(--aura-bg)",
          card: "var(--aura-card)",
          border: "var(--aura-border)",
          accent: "var(--aura-accent)",
          "accent-glow": "rgba(59, 130, 246, 0.5)",
          success: "var(--aura-success)",
          "text-dim": "var(--aura-text-dim)",
        },
        theme: {
          card: "var(--theme-card-bg)",
          "card-border": "var(--theme-card-border)",
          "card-text": "var(--theme-card-text)",
          hover: "var(--theme-hover-bg)",
          active: "var(--theme-active-bg)",
          text: "var(--theme-text-primary)",
          "text-secondary": "var(--theme-text-secondary)",
          icon: "var(--theme-icon)",
          sidebar: "var(--theme-sidebar-bg)",
          app: "var(--theme-page-bg)",
          "btn-primary-bg": "var(--theme-btn-primary-bg)",
          "btn-primary-text": "var(--theme-btn-primary-text)",
          "btn-primary-hover": "var(--theme-btn-primary-hover)",
          "btn-secondary-bg": "var(--theme-btn-secondary-bg)",
          "btn-secondary-text": "var(--theme-btn-secondary-text)",
          "btn-secondary-hover": "var(--theme-btn-secondary-hover)",
          "sidebar-bg": "var(--theme-sidebar-bg)",
          "sidebar-text": "var(--theme-sidebar-text)",
          "sidebar-border": "var(--theme-sidebar-border)",
          "sidebar-active-bg": "var(--theme-sidebar-active-bg)",
          "sidebar-active-text": "var(--theme-sidebar-active-text)",
          "nav-bg": "var(--theme-nav-bg)",
          "nav-text": "var(--theme-nav-text)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'gradient': {
            to: { 'background-position': '200% center' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient": "gradient 8s linear infinite",
        "wiggle": "wiggle 0.5s ease-in-out infinite",
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'aura-accent-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
