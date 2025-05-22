"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { Input, Textarea } from "@/components/common/Input"
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal"
import { Spinner } from "@/components/common/Spinner"
import { useJar } from "@/hooks/useJar"
import { useTips } from "@/hooks/useTips"
import { useWeb3Context } from "@/hooks/useWeb3"
import type { Tip, FrontendSocialLink } from "@/types/contract.types"
import { shortenAddress } from "@/utils/address"
import { formatMON, timeAgo } from "@/utils/formatting"
import { isValidTipMessage } from "@/utils/validation"
import { MIN_TIP_AMOUNT, MAX_TIP_MESSAGE_LENGTH, METAMASK_DOWNLOAD_URL } from "@/constants"
import { socialLinksService } from "@/services/socialLinksService"
import { formatSocialLink } from "@/services/socialLinks"
import toast from "react-hot-toast"
import { CopyToClipboard } from "react-copy-to-clipboard"
import {
  Twitter,
  Globe,
  ExternalLink,
  Copy,
  Wallet,
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  Clock,
  User,
  Share2,
  DollarSign,
  Settings,
  Instagram,
  Youtube,
  Github,
  Linkedin,
} from "lucide-react"

export const JarPage: React.FC = () => {
  const { username: rawUsername } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { account, isConnected, connect, isCorrectNetwork, switchNetwork } = useWeb3Context()
  
  // Normalize username to lowercase for consistency
  const username = rawUsername?.toLowerCase()
  
  const { jar, isLoading: isLoadingJar, error: jarError, refetch } = useJar(username)
  const { tips, isLoading: isLoadingTips, fetchRecentTips, sendTip, loadMoreTips, hasMoreTips } = useTips()

  const [socialLinks, setSocialLinks] = useState<FrontendSocialLink[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSendingTip, setIsSendingTip] = useState(false)
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)
  const [tipAmount, setTipAmount] = useState("0.01")
  const [tipMessage, setTipMessage] = useState("")
  const [tipError, setTipError] = useState<string | null>(null)
  const [isOwnJar, setIsOwnJar] = useState(false)

  // Check if jar belongs to current user
  useEffect(() => {
    if (account && jar?.owner) {
      setIsOwnJar(account.toLowerCase() === jar.owner.toLowerCase())
    } else {
      setIsOwnJar(false)
    }
  }, [account, jar])

  // Close modal if it's own jar
  useEffect(() => {
    if (isTipModalOpen && isOwnJar) {
      setIsTipModalOpen(false)
      toast.error("You cannot tip your own jar")
    }
  }, [isTipModalOpen, isOwnJar])

  // Handle URL case normalization and jar fetching
  useEffect(() => {
    const fetchJarData = async () => {
      if (!username) return;
      
      try {
        // If the URL has uppercase letters, redirect to lowercase
        if (rawUsername !== username) {
          navigate(`/jar/${username}`, { replace: true });
          return;
        }
        
        // Fetch jar data
        if (!jar && !isLoadingJar && !jarError) {
          await refetch(username);
        }
      } catch (error) {
        console.error('Error fetching jar:', error);
      }
    };

    fetchJarData();
  }, [username, rawUsername, navigate, jar, isLoadingJar, jarError, refetch]);

  // Fetch tips data (public access - no wallet required)
  useEffect(() => {
    if (username && jar?.exists && !isLoadingTips && tips.length === 0) {
      fetchRecentTips(username)
    }
  }, [username, jar, isLoadingTips, tips.length, fetchRecentTips])

  // Fetch social links from Pinata/localStorage
  useEffect(() => {
    const loadSocialLinks = async () => {
      if (username) {
        const links = await socialLinksService.getSocialLinksForUser(username)
        setSocialLinks(links)
      }
    }

    loadSocialLinks()
  }, [username])

  const handleSendTip = async () => {
    if (!username) return

    // Prevent self-tipping
    if (isOwnJar) {
      setTipError("You cannot tip your own jar")
      return
    }

    // Validate inputs
    if (Number.parseFloat(tipAmount) < MIN_TIP_AMOUNT) {
      setTipError(`Tip amount must be at least ${MIN_TIP_AMOUNT} MON`)
      return
    }

    if (!isValidTipMessage(tipMessage)) {
      setTipError(`Message must be ${MAX_TIP_MESSAGE_LENGTH} characters or less`)
      return
    }

    setTipError(null)
    setIsSendingTip(true)

    try {
      const success = await sendTip(username, tipAmount, tipMessage)

      if (success) {
        setIsTipModalOpen(false)
        setTipAmount("0.01")
        setTipMessage("")

        // Refresh data
        await Promise.all([refetch(username), fetchRecentTips(username)])
      }
    } catch (error: any) {
      console.error("Error sending tip:", error)
      
      // Handle specific error for self-tipping
      if (error.message && error.message.includes("Cannot tip your own jar")) {
        setTipError("You cannot tip your own jar")
      }
    } finally {
      setIsSendingTip(false)
    }
  }

  const openTipModal = async () => {
    // Prevent opening modal for own jar
    if (isOwnJar) {
      toast.error("You cannot tip your own jar")
      return
    }

    if (!isConnected) {
      await connect()
      return
    }

    if (!isCorrectNetwork) {
      const success = await switchNetwork()
      if (!success) {
        toast.error("Please switch to the Monad Network to continue")
        return
      }
    }

    setIsTipModalOpen(true)
  }

  const handleLoadMore = async () => {
    if (isLoadingMore || !username) return

    setIsLoadingMore(true)
    try {
      await loadMoreTips(username)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const getPlatformIcon = (platform: FrontendSocialLink['platform']) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />
      case 'website': return <Globe className="h-4 w-4" />
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'youtube': return <Youtube className="h-4 w-4" />
      case 'github': return <Github className="h-4 w-4" />
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  if (isLoadingJar) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-center items-center py-24">
           <div className="text-center">
             <Spinner size="lg" className="text-violet-600" />
             <p className="mt-6 text-lg text-gray-600">Loading tip jar...</p>
           </div>
         </div>
       </div>
     </div>
   )
 }

 if (jarError || !jar) {
   return (
     <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
           <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
           <CardContent className="p-8">
             <div className="text-center py-8">
               <div className="flex justify-center mb-6">
                 <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                   <AlertTriangle className="text-red-500 w-10 h-10" />
                 </div>
               </div>
               <h3 className="text-xl font-bold text-red-600 mb-4">Tip Jar Not Found</h3>
               <p className="text-gray-600 mb-8 max-w-md mx-auto">
                 {jarError || "This tip jar doesn't exist or has been deleted."}
               </p>
               <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                 <Button
                   onClick={() => navigate("/")}
                   variant="outline"
                   className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                 >
                   <ArrowLeft className="w-4 h-4 mr-2" />
                   Go Home
                 </Button>
                 <Button
                   onClick={() => navigate("/leaderboard")}
                   className="rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                 >
                   View Leaderboard
                 </Button>
               </div>
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
       <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2">
           <Card className="border-0 rounded-xl shadow-lg overflow-hidden mb-8">
             <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
             <CardHeader className="border-b border-gray-100 bg-white">
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-2xl font-bold text-gray-900">@{jar.username}</CardTitle>
                   <div className="flex items-center mt-1 text-sm text-gray-600">
                     <Wallet className="w-4 h-4 mr-1" />
                     <span>Owner: {shortenAddress(jar.owner)}</span>
                   </div>
                 </div>
                 <div className="flex space-x-2">
                   <CopyToClipboard
                     text={`${window.location.origin}/jar/${jar.username}`}
                     onCopy={() => toast.success("Link copied to clipboard!")}
                   >
                     <Button
                       variant="outline"
                       size="sm"
                       className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                     >
                       <Copy className="w-4 h-4 mr-1" />
                       Copy Link
                     </Button>
                   </CopyToClipboard>
                 </div>
               </div>
             </CardHeader>
<CardContent className="p-6">
  <div className="prose max-w-none">
    <p className="text-gray-700">{jar.description}</p>
  </div>

  {socialLinks.length > 0 && (
    <div className="mt-6 flex flex-wrap gap-3">
      {socialLinks.map((link) => {
        const formatted = formatSocialLink(link);
        return (
          <a
            key={link.id}
            href={formatted.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors text-sm"
          >
            {getPlatformIcon(link.platform)}
            <span className="ml-2">{formatted.label}</span>
          </a>
        );
      })}
    </div>
  )}
</CardContent>


             <CardFooter className="bg-gray-50 p-6">
               {isOwnJar ? (
                 <div className="text-center">
                   <p className="text-gray-600 mb-3">This is your tip jar</p>
                   <Link to="/dashboard">
                     <Button
                       variant="outline"
                       className="py-3 rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                     >
                       <Settings className="w-5 h-5 mr-2" />
                       Manage Your Jar
                     </Button>
                   </Link>
                 </div>
               ) : (
                 <Button
                   onClick={openTipModal}
                   fullWidth
                   className="py-3 rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                 >
                   <DollarSign className="w-5 h-5 mr-2" />
                   Send a Tip
                 </Button>
               )}
             </CardFooter>
           </Card>

           <div className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-900">Recent Tips</h2>
               <span className="text-sm font-medium px-4 py-2 rounded-full bg-violet-100 text-violet-800">
                 Total: {formatMON(jar.totalReceived)}
               </span>
             </div>

             {isLoadingTips ? (
               <div className="flex justify-center py-12">
                 <Spinner size="md" className="text-violet-600" />
               </div>
             ) : tips.length > 0 ? (
               <>
                 <div className="space-y-4">
                   {tips.map((tip: Tip, index: number) => (
                     <Card
                       key={`${tip.sender}-${tip.timestamp}-${index}`}
                       className="border-0 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                     >
                       <CardContent className="p-5">
                         <div className="flex items-start justify-between">
                           <div className="flex items-start">
                             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white">
                               <User className="w-5 h-5" />
                             </div>
                             <div className="ml-3">
                               <p className="text-sm font-medium text-gray-900 flex items-center">
                                 {shortenAddress(tip.sender)}
                                 <CopyToClipboard
                                   text={tip.sender}
                                   onCopy={() => toast.success("Address copied to clipboard!")}
                                 >
                                   <button className="ml-1 text-gray-400 hover:text-violet-600 transition-colors">
                                     <Copy className="w-3 h-3" />
                                   </button>
                                 </CopyToClipboard>
                               </p>
                               <p className="text-xs text-gray-500 mt-1 flex items-center">
                                 <Clock className="w-3 h-3 mr-1" />
                                 {timeAgo(tip.timestamp)}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                               {formatMON(tip.amount)}
                             </p>
                           </div>
                         </div>
                         {tip.message && (
                           <div className="mt-4 pt-4 border-t border-gray-100">
                             <p className="text-sm text-gray-700 flex">
                               <MessageSquare className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                               <span>{tip.message}</span>
                             </p>
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   ))}
                 </div>

                 {hasMoreTips && (
                   <div className="mt-8 text-center">
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
               </>
             ) : (
               <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
                 <CardContent className="p-8">
                   <div className="text-center py-8">
                     <div className="flex justify-center mb-4">
                       <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
                         <DollarSign className="text-violet-500 w-8 h-8" />
                       </div>
                     </div>
                     <p className="text-gray-600 mb-6">No tips yet. Be the first to send a tip!</p>
                     {!isOwnJar && (
                       <Button
                         onClick={openTipModal}
                         variant="outline"
                         className="px-6 py-2 rounded-full border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200"
                       >
                         Send a Tip
                       </Button>
                     )}
                   </div>
                 </CardContent>
               </Card>
             )}
           </div>
         </div>

         <div>
           <Card className="border-0 rounded-xl shadow-lg overflow-hidden sticky top-4">
             <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
             <CardHeader className="border-b border-gray-100 bg-white">
               <CardTitle className="text-xl font-bold text-gray-900">Tip Stats</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <div className="space-y-6">
                 <div className="bg-violet-50 rounded-lg p-6 text-center">
                   <p className="text-sm font-medium text-violet-800 mb-2">Total Received</p>
                   <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                     {formatMON(jar.totalReceived)}
                   </p>
                 </div>

                 <div>
                   {isOwnJar ? (
                     <Link to="/dashboard">
                       <Button
                         variant="outline"
                         fullWidth
                         className="py-3 rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                       >
                         <Settings className="w-5 h-5 mr-2" />
                         Manage Your Jar
                       </Button>
                     </Link>
                   ) : (
                     <Button
                       onClick={openTipModal}
                       fullWidth
                       className="py-3 rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                     >
                       <DollarSign className="w-5 h-5 mr-2" />
                       Send a Tip
                     </Button>
                   )}
                 </div>

                 <div className="pt-4 border-t border-gray-200">
                   <div className="bg-gray-50 rounded-lg p-4">
                     <p className="text-sm text-gray-600">
                       This tip jar is managed by a decentralized smart contract on the Monad Network. Tips go directly
                       to the creator's wallet with only a 1% platform fee.
                     </p>
                   </div>
                 </div>

                 <div>
                   <a href={`https://testnet.monadexplorer.com/address/${jar.owner}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-sm text-violet-600 hover:text-violet-800 flex items-center transition-colors"
                   >
                     <span>View on Block Explorer</span>
                     <ExternalLink className="ml-1 w-3 h-3" />
                   </a>
                 </div>

                 <div className="pt-4 border-t border-gray-200">
                   <Button
                     onClick={() => navigate("/")}
                     variant="outline"
                     fullWidth
                     className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                   >
                     <Share2 className="w-4 h-4 mr-2" />
                     Create Your Own Tip Jar
                   </Button>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>

       {/* Tip Modal - Only shown when user wants to tip (requires wallet) */}
       <Modal isOpen={isTipModalOpen} onClose={() => setIsTipModalOpen(false)} title="Send a Tip" size="md">
         <ModalBody>
           <div className="space-y-6">
             <div className="bg-violet-50 rounded-lg p-4 flex items-center">
               <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white mr-4">
                 <User className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-sm font-medium text-gray-700">Sending tip to</p>
                 <p className="text-lg font-bold text-gray-900">@{jar.username}</p>
               </div>
             </div>

             <Input
               label="Amount (MON)"
               type="number"
               value={tipAmount}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTipAmount(e.target.value)}
               min={MIN_TIP_AMOUNT}
               step="0.01"
               required
               hint={`Minimum tip: ${MIN_TIP_AMOUNT} MON`}
               className="rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
             />

             <Textarea
               label="Message (optional)"
               value={tipMessage}
               onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTipMessage(e.target.value)}
               placeholder="Add a message to your tip..."
               maxLength={MAX_TIP_MESSAGE_LENGTH}
               hint={`${tipMessage.length}/${MAX_TIP_MESSAGE_LENGTH} characters`}
               rows={4}
               className="rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
             />

             {tipError && (
               <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                 <p className="text-sm text-red-600 flex items-start">
                   <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                   <span>{tipError}</span>
                 </p>
               </div>
             )}

             {!window.ethereum && (
               <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                 <p className="text-sm text-yellow-700 flex items-start">
                   <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                   <span>
                     You need a Web3 wallet to send tips. We recommend{" "}
                     
                       <a href={METAMASK_DOWNLOAD_URL}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-violet-600 hover:text-violet-800 underline"
                     >
                       MetaMask
                     </a>
                   </span>
                 </p>
               </div>
             )}
           </div>
         </ModalBody>
         <ModalFooter>
           <Button
             variant="outline"
             onClick={() => setIsTipModalOpen(false)}
             className="rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
           >
             Cancel
           </Button>
           <Button
             onClick={handleSendTip}
             isLoading={isSendingTip}
             disabled={isSendingTip || Number.parseFloat(tipAmount) < MIN_TIP_AMOUNT || isOwnJar}
             className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
           >
             Send Tip
           </Button>
         </ModalFooter>
       </Modal>
     </div>
   </div>
 )
}

export default JarPage