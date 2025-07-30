"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, LogOut, Loader2, AlertCircle, RefreshCw, Settings } from "lucide-react"
import { ChatService, type User } from "@/lib/chat-service"
import { signOutUser } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

interface UserListSidebarProps {
  currentUser: any
  selectedUser: User | null
  onUserSelect: (user: User) => void
}

export default function UserListSidebar({ currentUser, selectedUser, onUserSelect }: UserListSidebarProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load users from Appwrite
  const loadUsers = async () => {
    if (!currentUser?.$id) return

    setLoading(true)
    setError(null)
    setPermissionError(null)

    try {
      console.log("🔄 Loading users from Appwrite...")
      const fetchedUsers = await ChatService.getAllUsers(currentUser.$id)
      setUsers(fetchedUsers)
      console.log(`✅ Loaded ${fetchedUsers.length} users`)

      if (fetchedUsers.length === 0) {
        toast({
          title: "No Other Users",
          description: "You're the only user registered. Invite others to start chatting!",
        })
      }
    } catch (error: any) {
      console.error("❌ Error loading users:", error.message)

      if (error.message.includes("not authorized") || error.message.includes("Permission denied")) {
        setPermissionError(error.message)
      } else {
        setError(error.message)
      }

      toast({
        title: "Failed to Load Users",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      console.log("🔄 Signing out user...")
      await signOutUser()
    } catch (error: any) {
      console.error("❌ Error signing out:", error)
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Load users on component mount
  useEffect(() => {
    if (currentUser?.$id) {
      loadUsers()
    }
  }, [currentUser])

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{currentUser?.name || currentUser?.email || "User"}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">
                {users.length} {users.length === 1 ? "user" : "users"} available
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="p-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      {/* Permission Error Alert */}
      {permissionError && (
        <Alert className="m-4 mb-0" variant="destructive">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Collection Permissions Required</p>
              <p className="text-sm">{permissionError}</p>
              <p className="text-xs">
                Please set up collection permissions in your Appwrite console. Check the setup-permissions.sql file for
                detailed instructions.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <CardContent className="flex-1 p-0">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Available Users
            </h3>
            {!loading && !permissionError && (
              <Button variant="ghost" size="sm" onClick={loadUsers} className="p-1 h-6 w-6">
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : error || permissionError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-red-600 mb-2">
                  {permissionError ? "Permission Error" : "Failed to load users"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">{error || permissionError}</p>
                {!permissionError && (
                  <Button variant="outline" size="sm" onClick={loadUsers} className="text-xs bg-transparent">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">No other users found</p>
                <p className="text-xs text-muted-foreground">Invite others to register and start chatting!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {users.map((user) => (
                <div
                  key={user.$id}
                  onClick={() => onUserSelect(user)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.$id === user.$id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-600 text-white">
                      {user.Username?.[0]?.toUpperCase() || user.Email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.Username || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.Email || "No email"}</p>
                  </div>
                  {selectedUser?.$id === user.$id && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
