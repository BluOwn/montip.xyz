import type React from "react"
import { Link } from "react-router-dom"
import { SOCIAL_LINKS } from "@/constants"
import { Twitter, Github, ExternalLink } from "lucide-react"

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link to="/" className="inline-block">
              <div className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                MonTip
              </div>
            </Link>
            <p className="mt-3 text-gray-600">A decentralized tipping platform on Monad Network.</p>
            <div className="mt-6 flex space-x-4">
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-200 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-200 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-violet-600 transition-colors flex items-center group">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 group-hover:bg-violet-500 transition-colors mr-2"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-gray-600 hover:text-violet-600 transition-colors flex items-center group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 group-hover:bg-violet-500 transition-colors mr-2"></span>
                  Leaderboard
                </Link>
              </li>
              <li>
                <a
                  href="https://testnet.monadexplorer.com/address/0x7BF5B55530BA2B5Eab6d806Ec2D678c57D0A945f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-violet-600 transition-colors flex items-center group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 group-hover:bg-violet-500 transition-colors mr-2"></span>
                  Contract
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Connect</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-violet-600 transition-colors flex items-center"
                >
                  <Twitter className="h-5 w-5 mr-2 text-gray-400" />
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-violet-600 transition-colors flex items-center"
                >
                  <Github className="h-5 w-5 mr-2 text-gray-400" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} MonTip. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-4">
                <Link to="/privacy" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">
                  Privacy Policy
                </Link>
                <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                <Link to="/terms" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
