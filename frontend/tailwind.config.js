/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tinglev: {
          navy: {
            950: '#001424',
            900: '#001E36', // Deep Corporate Navy
            850: '#00243F',
            800: '#002B49', // Tinglev Petroleum Blue
            700: '#003E6B',
            600: '#00558F',
          },
          blue: {
            50: '#eef8fd',
            100: '#d5effa',
            200: '#aee0f6',
            300: '#72ccf0',
            400: '#31b3e7',
            500: '#009FE3', // Official Tinglev Cyan/Azure Blue
            600: '#008DD2', // Tinglev Blue Action
            700: '#0070A8',
            800: '#045c88',
            900: '#094c70',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#F05A22', // Official Tinglev Accent Orange
            600: '#e0460f',
            700: '#c2360a',
            800: '#9a2c0c',
            900: '#7c270e',
          },
        },
        // Brand mapping directly to Tinglev Blue for instant compatibility
        brand: {
          50: '#eef8fd',
          100: '#d5effa',
          200: '#aee0f6',
          300: '#72ccf0',
          400: '#31b3e7',
          500: '#009FE3',
          600: '#008DD2',
          700: '#0070A8',
          800: '#045c88',
          900: '#094c70',
          950: '#001E36',
        },
        corporate: {
          navy: '#001E36',
          petroleum: '#002B49',
          slate: '#003E6B',
          card: '#ffffff',
          accent: '#009FE3',
          orange: '#F05A22',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 2px 12px -2px rgba(0, 0, 0, 0.05), 0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 6px 16px -4px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
