"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { useWeb3Context } from "@/hooks/useWeb3"
import { METAMASK_DOWNLOAD_URL, PLATFORM_FEE_PERCENT } from "@/constants"
import {
  Wallet,
  Trophy,
  Zap,
  Shield,
  Coins,
  ChevronRight,
  ExternalLink,
  Users,
  Code,
  MessageSquare,
  Store,
  Settings,
  Heart,
  Gift,
} from "lucide-react"

export const Home: React.FC = () => {
  const { isConnected, connect, isCorrectNetwork, switchNetwork } = useWeb3Context()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    await connect()
    setIsConnecting(false)
  }

  const handleSwitchNetwork = async () => {
    await switchNetwork()
  }

  return (
    <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-24 md:pt-32 md:pb-32 flex flex-col md:flex-row items-center">
          <div className="flex-1 text-center md:text-left md:pr-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                Decentralized Tipping
              </span>
              <span className="block mt-2 text-gray-900">Made Simple</span>
            </h1>
            <p className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto md:mx-0">
              Create your own tip jar and start receiving crypto tips on the Monad Network. No middlemen, no high fees,
              just peer-to-peer value exchange.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {!window.ethereum ? (
                <a
                  href={METAMASK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                >
                  Get MetaMask Wallet
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              ) : isConnected ? (
                !isCorrectNetwork ? (
                  <Button
                    size="lg"
                    onClick={handleSwitchNetwork}
                    className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Switch to Monad Network
                  </Button>
                ) : (
                  <Link to="/dashboard">
                    <Button
                      size="lg"
                      leftIcon={<Settings className="w-5 h-5" />}
                      className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                )
              ) : (
                <Button
                  onClick={handleConnect}
                  size="lg"
                  isLoading={isConnecting}
                  leftIcon={<Wallet className="w-5 h-5" />}
                  className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                >
                  Connect Wallet
                </Button>
              )}
              <Link to="/leaderboard">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Trophy className="w-5 h-5" />}
                  className="px-8 py-4 rounded-full border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200"
                >
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-violet-600 uppercase tracking-wide">Benefits</h2>
            <p className="mt-2 text-3xl font-display font-bold text-gray-900 sm:text-4xl">Why Choose MonTip?</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              The most efficient way to receive support from your audience
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Coins className="w-8 h-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">Low {PLATFORM_FEE_PERCENT}% Fee</h3>
                  <p className="mt-4 text-base text-gray-600 leading-relaxed">
                    Only {PLATFORM_FEE_PERCENT}% platform fee on each tip, significantly lower than traditional payment
                    platforms.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">Instant Payments</h3>
                  <p className="mt-4 text-base text-gray-600 leading-relaxed">
                    Tips are delivered directly to your wallet instantly, no waiting for payouts or settlements.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">Fully Decentralized</h3>
                  <p className="mt-4 text-base text-gray-600 leading-relaxed">
                    Your tip jar is controlled by smart contracts on Monad, not a centralized company.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-violet-600 uppercase tracking-wide">Process</h2>
            <p className="mt-2 text-3xl font-display font-bold text-gray-900 sm:text-4xl">How It Works</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">Get started in just a few simple steps</p>
          </div>

          <div className="mt-16 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-violet-100 -translate-y-1/2 hidden md:block"></div>
            <div className="grid gap-12 md:grid-cols-4 md:gap-8">
              {[
                {
                  step: 1,
                  title: "Connect Wallet",
                  description: "Connect your wallet to the Monad network.",
                },
                {
                  step: 2,
                  title: "Create Your Jar",
                  description: "Choose a username and add optional details.",
                },
                {
                  step: 3,
                  title: "Share Your Link",
                  description: "Share your personalized tip jar link with your audience.",
                },
                {
                  step: 4,
                  title: "Receive Tips",
                  description: "Get tips directly to your wallet with personalized messages.",
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg border-4 border-violet-100 text-violet-600 text-2xl font-bold z-10">
                    {item.step}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-base text-gray-600">{item.description}</p>
                  {item.step < 4 && (
                    <ChevronRight className="hidden md:block absolute top-10 -right-4 w-6 h-6 text-violet-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-violet-600 uppercase tracking-wide">Use Cases</h2>
            <p className="mt-2 text-3xl font-display font-bold text-gray-900 sm:text-4xl">Who Can Use MonTip?</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              MonTip is perfect for anyone who wants to receive support from their audience or community
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "Content Creators",
                description:
                  "YouTubers, streamers, podcasters, writers and artists can receive direct support from fans.",
              },
              {
                icon: <Code className="w-6 h-6" />,
                title: "Open Source Developers",
                description: "Receive contributions for your open source projects without complex donation systems.",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Community Contributors",
                description: "Get rewarded for your valuable contributions to online communities and forums.",
              },
              {
                icon: <Store className="w-6 h-6" />,
                title: "Small Businesses",
                description: "Accept tips from satisfied customers without payment processor fees eating into profits.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:bg-violet-50 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="py-24 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Gift className="text-emerald-600 w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl mb-6">
                  Help Us Improve MonTip
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Share your feedback and get a chance to receive <strong>MON testnet tokens</strong> as a reward. Your input helps us build a better platform for everyone.
                </p>
                <a
                  href="https://forms.gle/Lzh4MFLjvqmA5ou16"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Leave Feedback Now
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
                <p className="mt-4 text-sm text-gray-500">
                  Your feedback is valuable to us and helps make MonTip better for everyone!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">Ready to start receiving tips?</h2>
            <p className="mt-6 text-xl leading-7 text-violet-100">
              Create your tip jar in seconds and start accepting tips from your audience.
            </p>
            <div className="mt-10">
              {!window.ethereum ? (
                <a
                  href={METAMASK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full shadow-lg text-violet-600 bg-white hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                >
                  Get MetaMask First
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              ) : isConnected ? (
                !isCorrectNetwork ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleSwitchNetwork}
                    className="px-8 py-4 rounded-full shadow-lg bg-white text-violet-600 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  >
                    Switch to Monad Network
                  </Button>
                ) : (
                  <Link to="/dashboard">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="px-8 py-4 rounded-full shadow-lg bg-white text-violet-600 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border border-white"
                    >
                      Create Your Tip Jar
                    </Button>
                  </Link>
                )
              ) : (
                <Button
                  onClick={handleConnect}
                  size="lg"
                  variant="secondary"
                  isLoading={isConnecting}
                  className="px-8 py-4 rounded-full shadow-lg bg-white text-violet-600 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                >
                  Connect Wallet to Start
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-violet-600 uppercase tracking-wide">Support</h2>
            <p className="mt-2 text-3xl font-display font-bold text-gray-900 sm:text-4xl">Frequently Asked Questions</p>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            {[
              {
                question: "What is Monad Network?",
                answer:
                  "Monad is a high-performance blockchain designed for scalability and low transaction fees, making it perfect for microtransactions like tips.",
              },
              {
                question: "How much does it cost to create a tip jar?",
                answer:
                  "Creating a tip jar only costs a small network transaction fee on the Monad Network. There are no monthly fees or subscription costs.",
              },
              {
                question: "How do I withdraw my tips?",
                answer:
                  "There's no need to withdraw! Tips are sent directly to your wallet address when someone tips you. You maintain full control of your funds at all times.",
              },
              {
                question: "Is there a minimum tip amount?",
                answer:
                  "Yes, there is a small minimum tip amount to ensure that tips are economically viable after accounting for network fees. This helps prevent spam and ensures that creators receive meaningful support.",
              },
              {
                question: "Can I add my social media links to my tip jar?",
                answer:
                  "Yes! You can add your Twitter handle, website, and other social links to your tip jar profile, making it easy for supporters to find and follow you across platforms.",
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-gray-200 py-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">{item.question}</h3>
                </div>
                <p className="mt-3 text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home