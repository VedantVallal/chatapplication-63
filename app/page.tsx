"use client"

import { useState, useEffect } from "react"
import AuthForm from "@/auth-form"
import { getCurrentUser } from "@/app/actions"
import UserListSidebar from "@/user-list-sidebar"
import ChatRoom from "@/chat-room"
import { Toaster } from "@/components/ui/toaster"
import type { User } from "@/lib/chat-service"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        setError(null)
        const { success, user } = await getCurrentUser()
        setUserLoggedIn(success)
        setCurrentUser(user)

        if (success && user) {
          console.log("✅ User authenticated:", user.$id)
        } else {
          console.log("❌ No authenticated user found")
        }
      } catch (error) {
        console.error("❌ Error checking user:", error)
        setError("Failed to check authentication status")
        setUserLoggedIn(false)
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setShowChat(true)
    console.log("👤 User selected for chat:", user.Username)
  }

  const handleBackToList = () => {
    setShowChat(false)
    setSelectedUser(null)
    console.log("⬅️ Returning to user list")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        {userLoggedIn ? (
          <>
            {/* Mobile: Show either sidebar or chat */}
            <div className="md:hidden w-full">
              {showChat ? (
                <ChatRoom currentUserId={currentUser?.$id} selectedUser={selectedUser} onBack={handleBackToList} />
              ) : (
                <UserListSidebar
                  currentUser={currentUser}
                  selectedUser={selectedUser}
                  onUserSelect={handleUserSelect}
                />
              )}
            </div>

            {/* Desktop: Show both sidebar and chat */}
            <div className="hidden md:flex w-full">
              {/* Left Sidebar */}
              <div className="w-80 flex-shrink-0 mr-4">
                <UserListSidebar
                  currentUser={currentUser}
                  selectedUser={selectedUser}
                  onUserSelect={handleUserSelect}
                />
              </div>

              {/* Main Content Area (Chat Room) */}
              <div className="flex-1 flex flex-col">
                <ChatRoom currentUserId={currentUser?.$id} selectedUser={selectedUser} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <AuthForm />
          </div>
        )}
      </div>
      <Toaster />
    </>
  )
}
