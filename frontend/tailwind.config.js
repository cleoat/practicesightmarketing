export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111',
        secondary: '#3B82F6',
        accent: '#E05929',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        bg: '#F9F8F6',
        border: '#E5E3DE',
        muted: '#AAA'
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "sans-serif"]
      },
      borderRadius: {
        btn: '9px',
        input: '6px',
        card: '8px'
      }
    }
  },
  plugins: []
}
