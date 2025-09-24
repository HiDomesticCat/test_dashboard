/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#050816"
        },
        brand: {
          primary: "#38bdf8",
          secondary: "#f472b6",
          accent: "#facc15",
          danger: "#f87171",
          success: "#34d399"
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans TC"', "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 16px 50px -12px rgba(15, 23, 42, 0.45)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};
