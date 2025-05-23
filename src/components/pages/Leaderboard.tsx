"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { Spinner } from "@/components/common/Spinner"
import { getReadOnlyContract } from "@/services/web3"
import { ethers } from "ethers"
import { formatMON } from "@/utils/formatting"
import { Link } from "react-router-dom"
import { LEADERBOARD_PAGE_SIZE } from "@/constants"
import {
  Trophy,
  Medal,
  Award,
  ExternalLink,
  AlertTriangle,
  Share2,
  Globe,
  MessageSquare,
  Heart,
  Calendar,
} from "lucide-react"

interface JarData {
  username: string
  totalReceived: number
  rank?: number
}

export const Leaderboard: React.FC = () => {
  const [jars, setJars] = useState<JarData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const pageSize = LEADERBOARD_PAGE_SIZE

  const fetchJars = async (pageNumber: number) => {
    try {
      const contract = getReadOnlyContract()
      
      // First, get all usernames from the contract
      let allUsernames: string[] = []
      let index = 0
      
      // Try to get usernames from allUsernames array
      try {
        while (true) {
          try {
            const username = await contract.allUsernames(index)
            if (username && username.length > 0) {
              allUsernames.push(username)
              index++
            } else {
              break
            }
          } catch (err) {
            // If we get an error, we've reached the end of the array
            break
          }
        }
      } catch (err) {
        console.log("Could not fetch from allUsernames array, trying alternative method")
      }

      // If we couldn't get usernames from allUsernames, we need an alternative approach
      if (allUsernames.length === 0) {
        console.log("No usernames found in allUsernames array")
        setJars([])
        setHasMore(false)
        return
      }

      // Get jar info for each username and filter out non-existent jars
      const jarPromises = allUsernames.map(async (username) => {
        try {
          const jarInfo = await contract.getJarInfo(username)
          const exists = jarInfo[0] !== ethers.ZeroAddress
          
          if (exists) {
            return {
              username,
              owner: jarInfo[0],
              description: jarInfo[1],
              totalReceived: Number.parseFloat(ethers.formatEther(jarInfo[2])),
            }
          }
          return null
        } catch (err) {
          console.error(`Error fetching jar info for ${username}:`, err)
          return null
        }
      })

      const jarResults = await Promise.all(jarPromises)
      const validJars = jarResults.filter(jar => jar !== null) as Array<{
        username: string
        owner: string
        description: string
        totalReceived: number
      }>

      // Sort jars by totalReceived in descending order
      validJars.sort((a, b) => b.totalReceived - a.totalReceived)

      // Filter to only show jars that have received tips (totalReceived > 0)
      const tippedJars = validJars.filter(jar => jar.totalReceived > 0)

      // Apply pagination
      const offset = (pageNumber - 1) * pageSize
      const paginatedJars = tippedJars.slice(offset, offset + pageSize)

      const jarsData: JarData[] = paginatedJars.map((jar, index) => ({
        username: jar.username,
        totalReceived: jar.totalReceived,
        rank: offset + index + 1,
      }))

      if (pageNumber === 1) {
        setJars(jarsData)
      } else {
        setJars((prevJars) => [...prevJars, ...jarsData])
      }

      // Check if there are more jars to load
      setHasMore(offset + paginatedJars.length < tippedJars.length)
    } catch (err: any) {
      console.error("Error fetching jars:", err)
      setError(err.message || "Failed to fetch jars")
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await fetchJars(1)
      } catch (error) {
        console.error("Error loading leaderboard:", error)
        setError("Failed to load leaderboard data")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      await fetchJars(page + 1)
      setPage(page + 1)
    } catch (error) {
      console.error("Error loading more data:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400 w-5 h-5" />
      case 2:
        return <Medal className="text-gray-400 w-5 h-5" />
      case 3:
        return <Medal className="text-amber-600 w-5 h-5" />
      default:
        return <span className="text-sm font-medium">{rank}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <Spinner size="lg" className="text-violet-600" />
              <p className="mt-6 text-lg text-gray-600">Loading top tip jars...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
            <CardContent>
              <div className="text-center py-12">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="text-red-500 w-10 h-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-3">Error Loading Leaderboard</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              Top Tip Jars
            </span>
          </h1>
          <div className="flex justify-center mt-4 mb-6">
            <Award className="text-yellow-400 w-10 h-10" />
          </div>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the most popular tip jars on MonTip and see who's receiving the most support
          </p>
        </div>

        <Card className="border-0 rounded-xl shadow-lg overflow-hidden mb-16">
          <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          <CardHeader className="border-b border-gray-100 bg-white">
            <CardTitle className="text-xl font-bold text-gray-900">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {jars.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th
                          scope="col"
                          className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"
                        >
                          Rank
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          Username
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          Total Received
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {jars.map((jar) => (
                        <tr
                          key={jar.username}
                          className={`hover:bg-violet-50 transition-colors ${jar.rank && jar.rank <= 3 ? "bg-violet-50" : ""}`}
                        >
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex justify-center items-center">
                              {jar.rank && jar.rank <= 3 ? (
                                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                  {getRankIcon(jar.rank)}
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  {getRankIcon(jar.rank!)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                {jar.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-base font-semibold text-gray-900">@{jar.username}</div>
                                {jar.rank && jar.rank <= 3 && (
                                  <div className="text-xs text-violet-600 mt-1 font-medium">
                                    {jar.rank === 1 ? "Top Earner" : jar.rank === 2 ? "Rising Star" : "Popular Creator"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-base text-gray-900 text-right font-semibold">
                            {formatMON(jar.totalReceived)}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <Link to={`/jar/${jar.username}`}>
                              <Button
                                size="sm"
                                className="rounded-full px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                              >
                                View Jar
                                <ExternalLink className="ml-2 w-3 h-3" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMore && (
                  <div className="py-8 text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      isLoading={isLoadingMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2 rounded-full border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200"
                    >
                      Load More
                    </Button>
                  </div>
                )}

                {!hasMore && jars.length > 0 && (
                  <p className="py-6 text-center text-sm text-gray-500">You've reached the end of the list</p>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
                    <Trophy className="text-violet-500 w-8 h-8" />
                  </div>
                </div>
                <p className="text-gray-600 mb-6 text-lg">No tip jars with tips found</p>
                <Link to="/dashboard">
                  <Button className="px-6 py-3 rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200">
                    Create a Tip Jar
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="max-w-3xl mx-auto mb-16">
          <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">How to Get on the Leaderboard</h3>
              <p className="text-gray-600 mb-6">
                The leaderboard ranks tip jars by the total amount of MON they've received. Here are some ways to climb
                the ranks:
              </p>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                {[
                  {
                    icon: <Share2 className="w-5 h-5" />,
                    text: "Share your tip jar link on your social media accounts",
                  },
                  {
                    icon: <Globe className="w-5 h-5" />,
                    text: "Add your tip jar link to your website or blog",
                  },
                  {
                    icon: <MessageSquare className="w-5 h-5" />,
                    text: "Include your tip jar link in your content descriptions",
                  },
                  {
                    icon: <Heart className="w-5 h-5" />,
                    text: "Thank supporters publicly when they send tips",
                  },
                  {
                    icon: <Calendar className="w-5 h-5" />,
                    text: "Use your tip jar for special events or fundraising",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mr-4">
                      {item.icon}
                    </div>
                    <p className="text-gray-700">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    fullWidth
                    className="py-3 rounded-full border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200"
                  >
                    Create or Manage Your Tip Jar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard