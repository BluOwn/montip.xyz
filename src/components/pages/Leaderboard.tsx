"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react"

interface JarData {
  username: string
  totalReceived: number
  rank?: number
  createdAt: number // We'll use index as a proxy for creation order
}

type SortOption = 'tips_desc' | 'tips_asc' | 'newest' | 'oldest'

export const Leaderboard: React.FC = () => {
  const [allJars, setAllJars] = useState<JarData[]>([])
  const [displayedJars, setDisplayedJars] = useState<JarData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [sortBy, setSortBy] = useState<SortOption>('tips_desc')
  const [showFilters, setShowFilters] = useState(false)
  const pageSize = LEADERBOARD_PAGE_SIZE
  const isFetchingRef = useRef(false)

  const fetchAllJars = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping...")
      return
    }
    
    isFetchingRef.current = true
    setIsLoading(true)
    setError(null)
    setDebugInfo("Starting fetch...")
    
    try {
      const contract = getReadOnlyContract()
      console.log("Contract instance:", contract.address)
      
      // Get all usernames from the contract with retries
      const allUsernames: string[] = []
      let index = 0
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3
      
      while (consecutiveErrors < maxConsecutiveErrors) {
        try {
          const username = await contract.allUsernames(index)
          if (username && username.length > 0) {
            allUsernames.push(username)
            console.log(`Found username at index ${index}:`, username)
            index++
            consecutiveErrors = 0 // Reset error counter on success
          } else {
            consecutiveErrors++
          }
        } catch (err) {
          consecutiveErrors++
          console.log(`Error at index ${index}, consecutive errors: ${consecutiveErrors}`)
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("Reached max consecutive errors, stopping username fetch")
            break
          }
        }
      }

      console.log(`Total usernames found: ${allUsernames.length}`)
      setDebugInfo(`Found ${allUsernames.length} usernames`)

      if (allUsernames.length === 0) {
        console.log("No usernames found")
        setAllJars([])
        setDisplayedJars([])
        isFetchingRef.current = false
        return
      }

      // Fetch jar info with retry logic and better error handling
      const fetchJarWithRetry = async (username: string, originalIndex: number, maxRetries = 3): Promise<JarData | null> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Progressive delay: 100ms, 200ms, 400ms
            const delay = 100 * attempt
            await new Promise(resolve => setTimeout(resolve, delay))
            
            const jarInfo = await contract.getJarInfo(username)
            const exists = jarInfo[0] !== ethers.ZeroAddress
            
            if (exists) {
              const totalReceived = Number.parseFloat(ethers.formatEther(jarInfo[2]))
              console.log(`Jar ${username}: ${totalReceived} MON`)
              
              // Return ALL jars, not just ones with tips
              return {
                username,
                totalReceived,
                createdAt: originalIndex, // Use index as proxy for creation order
              }
            }
            return null
          } catch (err) {
            console.error(`Error fetching jar info for ${username} (attempt ${attempt}/${maxRetries}):`, err)
            
            // If this is the last attempt, return null
            if (attempt === maxRetries) {
              // For network errors, try to return a basic jar entry
              if (err instanceof Error && (
                err.message.includes('missing revert data') || 
                err.message.includes('network') ||
                err.message.includes('timeout') ||
                err.message.includes('CALL_EXCEPTION')
              )) {
                console.log(`Creating fallback entry for ${username} due to network error`)
                return {
                  username,
                  totalReceived: 0, // Default to 0 tips for network errors
                  createdAt: originalIndex,
                }
              }
              return null
            }
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 200 * attempt))
          }
        }
        return null
      }

      // Process jars in smaller batches to reduce network load
      const batchSize = 2
      const allValidJars: JarData[] = []
      
      for (let i = 0; i < allUsernames.length; i += batchSize) {
        const batch = allUsernames.slice(i, i + batchSize)
        const batchPromises = batch.map((username, batchIndex) => 
          fetchJarWithRetry(username, i + batchIndex)
        )
        
        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result, batchIndex) => {
          const globalIndex = i + batchIndex
          if (result.status === 'fulfilled' && result.value !== null) {
            allValidJars.push(result.value)
          } else if (result.status === 'rejected') {
            console.error(`Failed to fetch jar for ${allUsernames[globalIndex]}:`, result.reason)
            // Create a fallback entry for failed requests
            allValidJars.push({
              username: allUsernames[globalIndex],
              totalReceived: 0,
              createdAt: globalIndex,
            })
          }
        })
        
        // Small delay between batches
        if (i + batchSize < allUsernames.length) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      console.log(`Total valid jars: ${allValidJars.length}`)
      setDebugInfo(`Found ${allUsernames.length} usernames, ${allValidJars.length} valid jars`)

      setAllJars(allValidJars)
      
    } catch (err: any) {
      console.error("Error fetching jars:", err)
      setError(err.message || "Failed to fetch jars")
      setDebugInfo(`Error: ${err.message}`)
      setAllJars([])
      setDisplayedJars([])
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  // Sort and paginate jars based on current sort option
  const sortAndPaginateJars = useCallback((jars: JarData[], sortOption: SortOption, pageNum: number) => {
    let sortedJars = [...jars]
    
    switch (sortOption) {
      case 'tips_desc':
        sortedJars.sort((a, b) => b.totalReceived - a.totalReceived)
        break
      case 'tips_asc':
        sortedJars.sort((a, b) => a.totalReceived - b.totalReceived)
        break
      case 'newest':
        sortedJars.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'oldest':
        sortedJars.sort((a, b) => a.createdAt - b.createdAt)
        break
    }
    
    // Add rank based on sorted order (only for tips sorting)
    if (sortOption === 'tips_desc') {
      sortedJars = sortedJars.map((jar, index) => ({
        ...jar,
        rank: index + 1
      }))
    } else {
      // Remove rank for other sorting options
      sortedJars = sortedJars.map(jar => {
        const { rank, ...jarWithoutRank } = jar
        return jarWithoutRank
      })
    }
    
    // Paginate
    const startIndex = 0
    const endIndex = pageNum * pageSize
    return sortedJars.slice(startIndex, endIndex)
  }, [pageSize])

  // Update displayed jars when sort option changes
  useEffect(() => {
    if (allJars.length > 0) {
      const sorted = sortAndPaginateJars(allJars, sortBy, page)
      setDisplayedJars(sorted)
    }
  }, [allJars, sortBy, page, sortAndPaginateJars])

  // Initial load - ensure it only runs once
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (mounted && !isFetchingRef.current) {
        await fetchAllJars()
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
  }, []) // Remove fetchAllJars from dependencies to prevent re-runs

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setPage(1) // Reset to first page when sorting changes
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
  }

  const handleRefresh = async () => {
    // Clear existing data before refresh
    setAllJars([])
    setDisplayedJars([])
    setPage(1)
    await fetchAllJars()
  }

  const hasMore = displayedJars.length < allJars.length

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

  const getSortIcon = (currentSort: SortOption) => {
    switch (currentSort) {
      case 'tips_desc':
        return <ArrowDown className="w-4 h-4" />
      case 'tips_asc':
        return <ArrowUp className="w-4 h-4" />
      case 'newest':
        return <ArrowDown className="w-4 h-4" />
      case 'oldest':
        return <ArrowUp className="w-4 h-4" />
      default:
        return <ArrowUpDown className="w-4 h-4" />
    }
  }

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'tips_desc':
        return 'Most Tips'
      case 'tips_asc':
        return 'Least Tips'
      case 'newest':
        return 'Newest First'
      case 'oldest':
        return 'Oldest First'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <Spinner size="lg" className="text-violet-600" />
              <p className="mt-6 text-lg text-gray-600">Loading all tip jars...</p>
              <p className="mt-2 text-sm text-gray-500">{debugInfo}</p>
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
                <p className="text-gray-600 mb-2 max-w-md mx-auto">{error}</p>
                <p className="text-sm text-gray-500 mb-8">{debugInfo}</p>
                <Button
                  onClick={handleRefresh}
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
              All Tip Jars
            </span>
          </h1>
          <div className="flex justify-center mt-4 mb-6">
            <Award className="text-yellow-400 w-10 h-10" />
          </div>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Discover all tip jars on MonTip and see who's receiving support from their community
          </p>
          {allJars.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Showing {displayedJars.length} of {allJars.length} tip jars
            </p>
          )}
        </div>

        <Card className="border-0 rounded-xl shadow-lg overflow-hidden mb-16">
          <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          <CardHeader className="border-b border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl font-bold text-gray-900">All Tip Jars</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Sort Options */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-full border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200 w-full sm:w-auto"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {getSortLabel(sortBy)}
                    {getSortIcon(sortBy)}
                  </Button>
                  
                  {showFilters && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            handleSortChange('tips_desc')
                            setShowFilters(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-violet-50 transition-colors flex items-center justify-between ${
                            sortBy === 'tips_desc' ? 'bg-violet-50 text-violet-700' : 'text-gray-700'
                          }`}
                        >
                          Most Tips First
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleSortChange('tips_asc')
                            setShowFilters(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-violet-50 transition-colors flex items-center justify-between ${
                            sortBy === 'tips_asc' ? 'bg-violet-50 text-violet-700' : 'text-gray-700'
                          }`}
                        >
                          Least Tips First
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleSortChange('newest')
                            setShowFilters(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-violet-50 transition-colors flex items-center justify-between ${
                            sortBy === 'newest' ? 'bg-violet-50 text-violet-700' : 'text-gray-700'
                          }`}
                        >
                          Newest First
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleSortChange('oldest')
                            setShowFilters(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-violet-50 transition-colors flex items-center justify-between ${
                            sortBy === 'oldest' ? 'bg-violet-50 text-violet-700' : 'text-gray-700'
                          }`}
                        >
                          Oldest First
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-violet-600 hover:text-violet-700 rounded-full hover:bg-violet-50 transition-all duration-200"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {displayedJars.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        {sortBy === 'tips_desc' && (
                          <th
                            scope="col"
                            className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"
                          >
                            Rank
                          </th>
                        )}
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
                      {displayedJars.map((jar, index) => (
                        <tr
                          key={`${jar.username}-${index}`}
                          className={`hover:bg-violet-50 transition-colors ${
                            jar.rank && jar.rank <= 3 ? "bg-violet-50" : jar.totalReceived === 0 ? "bg-gray-50" : ""
                          }`}
                        >
                          {sortBy === 'tips_desc' && (
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-center">
                              <div className="flex justify-center items-center">
                                {jar.rank && jar.rank <= 3 ? (
                                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                    {getRankIcon(jar.rank)}
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    {jar.rank ? getRankIcon(jar.rank) : <span className="text-sm font-medium">{index + 1}</span>}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                {jar.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-base font-semibold text-gray-900">@{jar.username}</div>
                                {jar.totalReceived === 0 && (
                                  <div className="text-xs text-gray-500 mt-1">No tips yet</div>
                                )}
                                {jar.rank && jar.rank <= 3 && (
                                  <div className="text-xs text-violet-600 mt-1 font-medium">
                                    {jar.rank === 1 ? "Top Earner" : jar.rank === 2 ? "Rising Star" : "Popular Creator"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-base text-gray-900 text-right font-semibold">
                            <span className={jar.totalReceived === 0 ? "text-gray-400" : ""}>
                              {formatMON(jar.totalReceived)}
                            </span>
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
                      className="px-6 py-2 rounded-full border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200"
                    >
                      Load More ({allJars.length - displayedJars.length} remaining)
                    </Button>
                  </div>
                )}

                {!hasMore && displayedJars.length > 0 && (
                  <p className="py-6 text-center text-sm text-gray-500">
                    Showing all {allJars.length} tip jars
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
                    <Trophy className="text-violet-500 w-8 h-8" />
                  </div>
                </div>
                <p className="text-gray-600 mb-2 text-lg">No tip jars found</p>
                <p className="text-sm text-gray-500 mb-6">{debugInfo}</p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleRefresh}
                    variant="outline"
                    className="px-6 py-2 rounded-full border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200"
                  >
                    Refresh Page
                  </Button>
                  <br />
                  <Link to="/dashboard">
                    <Button className="px-6 py-3 rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200">
                      Create a Tip Jar
                    </Button>
                  </Link>
                </div>
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
                All tip jars are shown here, but you can climb the rankings by receiving more tips. Here are some ways to get more support:
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