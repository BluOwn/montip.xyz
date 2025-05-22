"use client"

import type React from "react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "../common/Button"
import { useWeb3Context } from "@/hooks/useWeb3"
import { shortenAddress } from "@/utils/address"
import { Menu, X, Wallet, ChevronDown } from "lucide-react"

export const Header: React.FC = () => {
  const { account, balance, isConnected, connect } = useWeb3Context()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleConnect = async () => {
    await connect()
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img 
                  src="/logo.png" 
                  alt="MonTip Logo" 
                  className="h-8 w-8"
                />
                <span className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                  MonTip
                </span>
              </Link>
            </div>

            <nav className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "border-violet-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                Home
              </Link>

              <Link
                to="/leaderboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/leaderboard")
                    ? "border-violet-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                Leaderboard
              </Link>

              {isConnected && (
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "border-violet-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700"
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="px-3 py-1 bg-violet-50 rounded-full">
                  <span className="text-sm font-medium text-violet-700">
                    {balance ? `${Number.parseFloat(balance).toFixed(4)} MON` : "0 MON"}
                  </span>
                </div>

                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200 flex items-center"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs mr-2">
                      {account ? account.substring(2, 4).toUpperCase() : ""}
                    </div>
                    {shortenAddress(account || "")}
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                size="sm"
                className="rounded-full px-4 py-2 shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500 transition-colors"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
              isActive("/")
                ? "bg-violet-50 border-violet-500 text-violet-700"
                : "border-transparent text-gray-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>

          <Link
            to="/leaderboard"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
              isActive("/leaderboard")
                ? "bg-violet-50 border-violet-500 text-violet-700"
                : "border-transparent text-gray-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Leaderboard
          </Link>

          {isConnected && (
            <Link
              to="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-violet-50 border-violet-500 text-violet-700"
                  : "border-transparent text-gray-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="pt-4 pb-3 border-t border-gray-200">
          {isConnected ? (
            <div className="flex items-center px-4 py-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {account ? account.substring(2, 4).toUpperCase() : ""}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{shortenAddress(account || "")}</div>
                <div className="text-sm font-medium text-violet-600">
                  {balance ? `${Number.parseFloat(balance).toFixed(4)} MON` : "0 MON"}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3">
              <Button
                onClick={handleConnect}
                fullWidth
                className="rounded-full py-2 shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}