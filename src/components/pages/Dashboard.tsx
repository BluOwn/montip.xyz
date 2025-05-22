"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { Input, Textarea } from "@/components/common/Input"
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal"
import { Spinner } from "@/components/common/Spinner"
import { useJar } from "@/hooks/useJar"
import { useTips } from "@/hooks/useTips"
import { useWeb3Context } from "@/hooks/useWeb3"
import type { Web3ContextState } from "@/contexts/Web3ContextDefinition"
import type { FrontendSocialLink } from "@/types/contract.types"
import { isValidUsername, isValidTwitterHandle, isValidWebsite, normalizeUsername } from "@/utils/validation"
import { MAX_DESCRIPTION_LENGTH, METAMASK_DOWNLOAD_URL } from "@/constants"
import { socialLinksService } from "@/services/socialLinksService"
import { formatSocialLink } from "@/services/socialLinks"
import { CopyToClipboard } from "react-copy-to-clipboard"
import toast from "react-hot-toast"
import {
  Twitter,
  Globe,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Wallet,
  AlertTriangle,
  Share2,
  Code,
  CheckCircle,
  XCircle,
  Instagram,
  Youtube,
  Github,
  Linkedin,
} from "lucide-react"

export const Dashboard: React.FC = () => {
  const { account, isConnected, connect, balance, isCorrectNetwork, switchNetwork }: Web3ContextState = useWeb3Context()

  const { hasJar, getUserJar, createJar, deleteJar, isUsernameAvailable } = useJar()
  const { withdrawFailedTips } = useTips()

  const [userHasJar, setUserHasJar] = useState(false)
  const [jarUsername, setJarUsername] = useState("")
  const [socialLinks, setSocialLinks] = useState<FrontendSocialLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false)

  // Form states
  const [createUsername, setCreateUsername] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const [socialPlatform, setSocialPlatform] = useState<FrontendSocialLink['platform']>("twitter")
  const [socialValue, setSocialValue] = useState("")
  const [socialError, setSocialError] = useState<string | null>(null)

  // Check if user has a jar
  useEffect(() => {
    const checkUserJar = async () => {
      if (!isConnected || !account) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const hasUserJar = await hasJar(account)
        setUserHasJar(hasUserJar)

        if (hasUserJar) {
          const username = await getUserJar(account)
          setJarUsername(username)
          // Load social links from Pinata/localStorage
          const links = await socialLinksService.getSocialLinksForUser(username)
          setSocialLinks(links)
        }
      } catch (error) {
        console.error("Error checking user jar:", error)
        toast.error("Failed to load your tip jar data")
      } finally {
        setIsLoading(false)
      }
    }

    checkUserJar()
  }, [isConnected, account, hasJar, getUserJar])

  const handleConnectWallet = async () => {
    try {
      await connect()
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast.error("Failed to connect wallet")
    }
  }

  const handleCheckUsername = useCallback(async () => {
    if (!createUsername) {
      setUsernameAvailable(null)
      return
    }
    
    // Normalize username for checking
    const normalizedUsername = normalizeUsername(createUsername)
    
    if (!isValidUsername(normalizedUsername)) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const available = await isUsernameAvailable(normalizedUsername)
      setUsernameAvailable(available)
    } catch (error) {
      console.error("Error checking username:", error)
    } finally {
      setIsCheckingUsername(false)
    }
  }, [createUsername, isUsernameAvailable])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleCheckUsername()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [createUsername, handleCheckUsername])

  const handleCreateJar = async () => {
    if (!account) {
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

    // Normalize username
    const normalizedUsername = normalizeUsername(createUsername)

    if (!normalizedUsername) {
      setCreateError("Username is required")
      return
    }

    if (!isValidUsername(normalizedUsername)) {
      setCreateError("Username can only contain lowercase letters, numbers, underscores, hyphens, and periods (max 32 characters)")
      return
    }

    if (createDescription.length > MAX_DESCRIPTION_LENGTH) {
      setCreateError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`)
      return
    }

    if (usernameAvailable === false) {
      setCreateError("This username is already taken")
      return
    }

    setCreateError(null)
    setIsCreating(true)

    try {
      const success = await createJar(normalizedUsername, createDescription)

      if (success) {
        setUserHasJar(true)
        setJarUsername(normalizedUsername)
        setCreateUsername("")
        setCreateDescription("")
        setSocialLinks([])
      }
    } catch (error) {
      console.error("Error creating jar:", error)
      setCreateError("Error creating tip jar")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteJar = async () => {
    if (!account) return

    setIsDeleting(true)

    try {
      const success = await deleteJar()

      if (success) {
        setUserHasJar(false)
        setJarUsername("")
        setSocialLinks([])
        setIsDeleteModalOpen(false)
      }
    } catch (error) {
      console.error("Error deleting jar:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleWithdrawFailedTips = async () => {
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

    setIsWithdrawing(true)

    try {
      await withdrawFailedTips()
    } catch (error) {
      console.error("Error withdrawing failed tips:", error)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleAddSocialLink = async () => {
    if (!jarUsername) return

    // Validate inputs
    if (socialPlatform === "twitter" && !isValidTwitterHandle(socialValue)) {
      setSocialError("Please enter a valid Twitter handle")
      return
    }

    if (socialPlatform === "website" && !isValidWebsite(socialValue)) {
      setSocialError("Please enter a valid website URL")
      return
    }

    setSocialError(null)
    setIsSocialLoading(true)

    try {
      const success = await socialLinksService.addSocialLinkForUser(jarUsername, socialPlatform, socialValue)

      if (success) {
        // Reload links from service
        const updatedLinks = await socialLinksService.getSocialLinksForUser(jarUsername)
        setSocialLinks(updatedLinks)
        setIsSocialModalOpen(false)
        setSocialValue("")
      } else {
        toast.error("Failed to add social link")
      }
    } catch (error) {
      console.error("Error adding social link:", error)
      toast.error("Error adding social link")
    } finally {
      setIsSocialLoading(false)
    }
  }

  const handleRemoveSocialLink = async (platform: FrontendSocialLink['platform']) => {
    if (!jarUsername) return

    try {
      const success = await socialLinksService.removeSocialLinkForUser(jarUsername, platform)

      if (success) {
        // Reload links from service
        const updatedLinks = await socialLinksService.getSocialLinksForUser(jarUsername)
        setSocialLinks(updatedLinks)
        toast.success("Social link removed")
      } else {
        toast.error("Failed to remove social link")
      }
    } catch (error) {
      console.error("Error removing social link:", error)
      toast.error("Error removing social link")
    }
  }

  const getPlatformIcon = (platform: FrontendSocialLink['platform']) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'website': return <Globe className="w-4 h-4" />
      case 'instagram': return <Instagram className="w-4 h-4" />
      case 'youtube': return <Youtube className="w-4 h-4" />
      case 'github': return <Github className="w-4 h-4" />
      case 'linkedin': return <Linkedin className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <Spinner size="lg" className="text-violet-600" />
              <p className="mt-6 text-lg text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected || !account) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            <CardContent className="p-8">
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center">
                    <Wallet className="text-violet-600 w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You need to connect your wallet to access your dashboard.
                </p>

                {window.ethereum ? (
                  <Button 
                    onClick={handleConnectWallet}
                    size="lg"
                    className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Connect Wallet
                  </Button>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-6">
                      No Web3 wallet detected. Please install a wallet like MetaMask to continue.
                    </p>
                    <a href={METAMASK_DOWNLOAD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-8 py-4 text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Get MetaMask
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            <CardContent className="p-8">
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="text-yellow-600 w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Wrong Network</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Please switch to the Monad Network to continue.</p>
                <Button
                  onClick={switchNetwork}
                  size="lg"
                  className="px-8 py-4 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                >
                  Switch to Monad Network
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!userHasJar) {
    return (
      <div className="bg-gradient-to-b from-violet-50 to-white min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
            <CardHeader className="border-b border-gray-100 bg-white">
              <CardTitle className="text-xl font-bold text-gray-900">Create Your Tip Jar</CardTitle>
           </CardHeader>
           <CardContent className="p-6">
             <div className="space-y-6">
               <p className="text-gray-600">Create your tip jar to start receiving tips from your audience.</p>

               <div className="space-y-6">
                 <div>
                   <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                     Choose a username
                   </label>
                   <div className="relative">
                     <Input
                       id="username"
                       value={createUsername}
                       onChange={(e) => setCreateUsername(e.target.value.toLowerCase())}
                       placeholder="your_username"
                       maxLength={32}
                       hint="Up to 32 characters; lowercase letters, numbers, underscores, hyphens, and periods allowed"
                       required
                       leftAddon={<span className="text-gray-500">@</span>}
                       className="rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                     />
                     {isCheckingUsername && (
                       <div className="absolute right-3 top-2">
                         <Spinner size="xs" className="text-violet-600" />
                       </div>
                     )}
                   </div>

                   {!isValidUsername(normalizeUsername(createUsername)) && createUsername && (
                     <div className="mt-2 flex items-center text-red-600">
                       <XCircle className="w-4 h-4 mr-1" />
                       <p className="text-sm">Username must be up to 32 characters and can only contain lowercase letters, numbers, underscores, hyphens, and periods</p>
                     </div>
                   )}

                   {usernameAvailable === false && createUsername && isValidUsername(normalizeUsername(createUsername)) && (
                     <div className="mt-2 flex items-center text-red-600">
                       <XCircle className="w-4 h-4 mr-1" />
                       <p className="text-sm">This username is already taken</p>
                     </div>
                   )}

                   {usernameAvailable === true && createUsername && isValidUsername(normalizeUsername(createUsername)) && (
                     <div className="mt-2 flex items-center text-green-600">
                       <CheckCircle className="w-4 h-4 mr-1" />
                       <p className="text-sm">Username is available</p>
                     </div>
                   )}
                 </div>

                 <Textarea
                   label="Description (optional)"
                   value={createDescription}
                   onChange={(e) => setCreateDescription(e.target.value)}
                   placeholder="Tell people why they should tip you..."
                   maxLength={MAX_DESCRIPTION_LENGTH}
                   hint={`${createDescription.length}/${MAX_DESCRIPTION_LENGTH} characters`}
                   rows={4}
                   className="rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                 />

                 {createError && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                     <p className="text-sm text-red-600 flex items-start">
                       <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                       <span>{createError}</span>
                     </p>
                   </div>
                 )}
               </div>
             </div>
           </CardContent>
           <CardFooter className="bg-gray-50 p-6">
             <Button
               onClick={handleCreateJar}
               isLoading={isCreating}
               disabled={isCreating || !createUsername || usernameAvailable === false || !isValidUsername(normalizeUsername(createUsername))}
               fullWidth
               className="py-3 rounded-full shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
             >
               Create Tip Jar
             </Button>
           </CardFooter>
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
               <div className="flex justify-between items-center">
                 <CardTitle className="text-xl font-bold text-gray-900">Your Tip Jar</CardTitle>
                 <Link to={`/jar/${jarUsername}`}>
                   <Button
                     variant="outline"
                     size="sm"
                     className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                   >
                     View Public Page
                     <ExternalLink className="ml-2 w-3 h-3" />
                   </Button>
                 </Link>
               </div>
             </CardHeader>
             <CardContent className="p-6">
               <div className="space-y-6">
                 <div className="bg-violet-50 rounded-lg p-6">
                   <p className="text-sm font-medium text-violet-800 mb-2">Username</p>
                   <div className="flex items-center">
                     <p className="text-xl font-bold text-gray-900">@{jarUsername}</p>
                     <CopyToClipboard
                       text={`${window.location.origin}/jar/${jarUsername}`}
                       onCopy={() => toast.success("Link copied to clipboard!")}
                     >
                       <button className="ml-2 text-gray-400 hover:text-violet-600 transition-colors">
                         <Copy className="w-4 h-4" />
                       </button>
                     </CopyToClipboard>
                   </div>
                 </div>

                 <div>
                   <p className="text-sm font-medium text-gray-700 mb-2">Your Jar URL</p>
                   <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                     <p className="text-sm text-gray-700 break-all">
                       {window.location.origin}/jar/{jarUsername}
                     </p>
                     <CopyToClipboard
                       text={`${window.location.origin}/jar/${jarUsername}`}
                       onCopy={() => toast.success("Link copied to clipboard!")}
                     >
                       <button className="ml-2 flex-shrink-0 text-gray-400 hover:text-violet-600 transition-colors">
                         <Copy className="w-4 h-4" />
                       </button>
                     </CopyToClipboard>
                   </div>
                 </div>

                 <div className="pt-4 border-t border-gray-200">
                   <div className="flex justify-between items-center mb-4">
                     <p className="text-sm font-medium text-gray-700">Social Links</p>
                     <Button
                       onClick={() => setIsSocialModalOpen(true)}
                       variant="outline"
                       size="sm"
                       className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       Add Link
                     </Button>
                   </div>
                   
                   {socialLinks.length > 0 ? (
                     <div className="space-y-2">
                       {socialLinks.map((link) => {
                         const formatted = formatSocialLink(link)
                         return (
                           <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <div className="flex items-center">
                               {getPlatformIcon(link.platform)}
                               <span className="ml-2 text-sm font-medium">{formatted.displayName}</span>
                               <span className="ml-2 text-sm text-gray-600">{formatted.label}</span>
                             </div>
                             <button
                               onClick={() => handleRemoveSocialLink(link.platform)}
                               className="text-red-500 hover:text-red-700 transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         )
                       })}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">No social links added yet</p>
                   )}
                 </div>
               </div>
             </CardContent>
             <CardFooter className="bg-gray-50 p-6">
               <div className="flex flex-col sm:flex-row w-full space-y-3 sm:space-y-0 sm:space-x-3">
                 <Button
                   onClick={handleWithdrawFailedTips}
                   variant="outline"
                   className="flex-1 rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                   isLoading={isWithdrawing}
                   disabled={isWithdrawing}
                 >
                   Withdraw Failed Tips
                 </Button>
                 <Button
                   onClick={() => setIsDeleteModalOpen(true)}
                   variant="outline"
                   className="flex-1 rounded-full text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200"
                 >
                   <Trash2 className="w-4 h-4 mr-1" />
                   Delete Jar
                 </Button>
               </div>
             </CardFooter>
           </Card>

           <Card className="border-0 rounded-xl shadow-lg overflow-hidden">
             <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
             <CardHeader className="border-b border-gray-100 bg-white">
               <CardTitle className="text-xl font-bold text-gray-900">Sharing Your Tip Jar</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <div className="space-y-6">
                 <p className="text-gray-600">
                   Share your tip jar link with your audience to start receiving tips. Here are some ways to share it:
                 </p>

                 <div className="space-y-6">
                   <div className="border border-gray-200 rounded-lg overflow-hidden">
                     <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                       <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                         <Share2 className="w-4 h-4 mr-2 text-violet-600" />
                         Share on Social Media
                       </h3>
                     </div>
                     <div className="p-4">
                       <p className="text-sm text-gray-600 mb-3">
                         Copy and paste this text to your social media profiles:
                       </p>
                       <div className="bg-violet-50 p-4 rounded-lg text-sm text-gray-700">
                         Support me by sending a tip! 💰 {window.location.origin}/jar/{jarUsername}
                       </div>
                       <div className="mt-3 flex justify-end">
                         <CopyToClipboard
                           text={`Support me by sending a tip! 💰 ${window.location.origin}/jar/${jarUsername}`}
                           onCopy={() => toast.success("Text copied to clipboard!")}
                         >
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                           >
                             <Copy className="w-3 h-3 mr-1" />
                             Copy Text
                           </Button>
                         </CopyToClipboard>
                       </div>
                     </div>
                   </div>

                   <div className="border border-gray-200 rounded-lg overflow-hidden">
                     <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                       <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                         <Code className="w-4 h-4 mr-2 text-violet-600" />
                         Add to Your Website
                       </h3>
                     </div>
                     <div className="p-4">
                       <p className="text-sm text-gray-600 mb-3">Add this HTML to your website:</p>
                       <div className="bg-violet-50 p-4 rounded-lg text-sm text-gray-700 overflow-x-auto">
                         {`<a href="${window.location.origin}/jar/${jarUsername}" target="_blank">Send me a tip with MonTip!</a>`}
                       </div>
                       <div className="mt-3 flex justify-end">
                         <CopyToClipboard
                           text={`<a href="${window.location.origin}/jar/${jarUsername}" target="_blank">Send me a tip with MonTip!</a>`}
                           onCopy={() => toast.success("HTML copied to clipboard!")}
                         >
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                           >
                             <Copy className="w-3 h-3 mr-1" />
                             Copy HTML
                           </Button>
                         </CopyToClipboard>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>

         <div>
           <Card className="border-0 rounded-xl shadow-lg overflow-hidden sticky top-4">
             <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
             <CardHeader className="border-b border-gray-100 bg-white">
               <CardTitle className="text-xl font-bold text-gray-900">Your Wallet</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Address</p>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700 break-all">{account}</p>
                    <CopyToClipboard text={account} onCopy={() => toast.success("Address copied to clipboard!")}>
                      <button className="ml-2 flex-shrink-0 text-gray-400 hover:text-violet-600 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </CopyToClipboard>
                  </div>
                </div>

                <div className="bg-violet-50 rounded-lg p-6 text-center">
                  <p className="text-sm font-medium text-violet-800 mb-2">Balance</p>
                  <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                    {balance ? `${Number.parseFloat(balance).toFixed(4)} MON` : "0 MON"}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    All tips are sent directly to your connected wallet address. There's no need to withdraw funds
                    from the platform.
                  </p>
                </div>

                <div>
                   <a href={`https://testnet.monadexplorer.com/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-600 hover:text-violet-800 flex items-center transition-colors"
                  >
                    <span>View on Block Explorer</span>
                    <ExternalLink className="ml-1 w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Social Link Modal */}
      <Modal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)} title="Add Social Link" size="md">
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label htmlFor="socialPlatform" className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                id="socialPlatform"
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value as FrontendSocialLink['platform'])}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
              >
                <option value="twitter">Twitter</option>
                <option value="website">Website</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <Input
              label={getInputLabel(socialPlatform)}
              value={socialValue}
              onChange={(e) => setSocialValue(e.target.value)}
              placeholder={getInputPlaceholder(socialPlatform)}
              hint={getInputHint(socialPlatform)}
              leftAddon={getPlatformIcon(socialPlatform)}
              className="rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            />

            {socialError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600 flex items-start">
                  <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{socialError}</span>
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsSocialModalOpen(false)}
            className="rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSocialLink}
            disabled={!socialValue || isSocialLoading}
            isLoading={isSocialLoading}
            className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
          >
            {isSocialLoading ? 'Saving...' : 'Add Link'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Jar Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Tip Jar" size="md">
        <ModalBody>
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="text-red-500 w-8 h-8" />
              </div>
            </div>

            <p className="text-gray-700 text-center">
              Are you sure you want to delete your tip jar? This action cannot be undone.
            </p>
            <p className="text-gray-700 text-center">
              Your username <span className="font-semibold">@{jarUsername}</span> will be permanently deleted.
            </p>
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-700 flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Note: Any tips you've already received will remain in your wallet.</span>
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            className="rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleDeleteJar}
            isLoading={isDeleting}
            disabled={isDeleting}
            className="rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Jar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  </div>
)
}

// Helper functions for social link input
const getInputLabel = (platform: FrontendSocialLink['platform']) => {
switch (platform) {
  case 'twitter': return 'Twitter Handle'
  case 'website': return 'Website URL'
  case 'instagram': return 'Instagram Handle'
  case 'youtube': return 'YouTube Channel'
  case 'github': return 'GitHub Username'
  case 'linkedin': return 'LinkedIn Profile'
  default: return 'Value'
}
}

const getInputPlaceholder = (platform: FrontendSocialLink['platform']) => {
switch (platform) {
  case 'twitter': return '@username'
  case 'website': return 'https://yourwebsite.com'
  case 'instagram': return '@username'
  case 'youtube': return 'https://youtube.com/@channel'
  case 'github': return 'username'
  case 'linkedin': return 'https://linkedin.com/in/username'
  default: return 'Enter value'
}
}

const getInputHint = (platform: FrontendSocialLink['platform']) => {
switch (platform) {
  case 'twitter': return 'Add your Twitter handle with or without the @'
  case 'website': return 'Enter the full URL including http:// or https://'
  case 'instagram': return 'Add your Instagram handle with or without the @'
  case 'youtube': return 'Enter your YouTube channel URL'
  case 'github': return 'Add your GitHub username'
  case 'linkedin': return 'Enter your LinkedIn profile URL'
  default: return ''
}
}

export default Dashboard