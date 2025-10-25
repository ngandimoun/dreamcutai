import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

// Custom SVG Icons
const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export function Navigation() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const getThemeIcon = () => {
    return theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  }

  return (
    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="grid h-5 w-10 grid-cols-3 gap-0.5">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#00444d] via-blue-500 to-purple-800"
              style={{
                opacity: i === 4 ? 1 : 0.6,
              }}
            />
          ))}
        </div>
        <span className="text-xl font-bold text-primary">DreamCut</span>
      </Link>

      {/* Social Media Links */}
      <div className="hidden items-center gap-6 md:flex">
        <Link 
          href="https://twitter.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white transition-colors hover:text-purple-400"
        >
          <XIcon className="h-5 w-5" />
        </Link>
        <Link 
          href="https://linkedin.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white transition-colors hover:text-purple-400"
        >
          <LinkedInIcon className="h-5 w-5" />
        </Link>
      </div>

      {/* Theme Toggle Button */}
      <Button 
        variant="outline" 
        onClick={toggleTheme}
        className="border-2 border-purple-500 bg-transparent text-white hover:bg-purple-500/10"
      >
        {getThemeIcon()}
      </Button>
    </nav>
  )
}
