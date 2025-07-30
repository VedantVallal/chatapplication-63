"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, ArrowLeft, MessageCircle, Loader2, AlertCircle, RefreshCw, Settings } from "lucide-react"
import { ChatService, type User, type Message, type Chat } from "@/lib/chat-service"
import { useToast } from "@/hooks/use-toast"

interface ChatRoomProps {
  currentUserId: string | null
  selectedUser: User | null
  onBack?: () => void
}

export default function ChatRoom({ currentUserId, selectedUser, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Check permissions
  const checkPermissions = async () => {
    try {
      const status = await ChatService.getPermissionStatus()
      if (status.errors.length > 0) {
        setPermissionError(`Permission issues detected: ${status.errors.join(", ")}`)
        return false
      }
      setPermissionError(null)
      return true
    } catch (error: any) {
      setPermissionError(error.message)
      return false
    }
  }

  // Load or create chat with selected user
  const initializeChat = async () => {
    if (!currentUserId || !selectedUser) return

    setLoading(true)
    setError(null)
    setPermissionError(null)

    try {
      console.log(`🔄 Initializing chat between ${currentUserId} and ${selectedUser.$id}`)

      // Check permissions first
      const hasPermissions = await checkPermissions()
      if (!hasPermissions) {
        return
      }

      // Get or create chat
      const chat = await ChatService.getOrCreateChat(currentUserId, selectedUser.$id)
      setCurrentChat(chat)

      // Load messages for this chat
      const chatMessages = await ChatService.getChatMessages(chat.$id)
      setMessages(chatMessages)

      console.log(`✅ Chat initialized: ${chat.$id} with ${chatMessages.length} messages`)

      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error("❌ Error initializing chat:", error.message)

      if (error.message.includes("not authorized") || error.message.includes("Permission denied")) {
        setPermissionError(error.message)
      } else {
        setError(error.message)
      }

      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Send a message
  const handleSendMessage = async () => {
    if (!currentUserId || !currentChat || !newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      console.log(`📤 Sending message to chat ${currentChat.$id}`)

      const sentMessage = await ChatService.sendMessage(currentChat.$id, currentUserId, messageText)

      // Add message to local state immediately for better UX
      setMessages((prev) => [...prev, sentMessage])

      console.log(`✅ Message sent: ${sentMessage.$id}`)

      // Scroll to bottom
      setTimeout(scrollToBottom, 100)

      toast({
        title: "Message Sent",
        description: "Your message has been delivered",
      })
    } catch (error: any) {
      console.error("❌ Error sending message:", error.message)
      setNewMessage(messageText) // Restore message text

      if (error.message.includes("not authorized") || error.message.includes("Permission denied")) {
        setPermissionError(error.message)
      }

      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Subscribe to real-time messages
  useEffect(() => {
    if (!currentChat) return

    console.log(`🔄 Setting up real-time subscription for chat ${currentChat.$id}`)

    const unsubscribe = ChatService.subscribeToMessages(currentChat.$id, (newMessage) => {
      console.log(`📨 Received real-time message: ${newMessage.$id}`)

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((msg) => msg.$id === newMessage.$id)) {
          return prev
        }
        return [...prev, newMessage]
      })

      // Scroll to bottom for new messages
      setTimeout(scrollToBottom, 100)
    })

    return () => {
      console.log(`🔄 Cleaning up real-time subscription for chat ${currentChat.$id}`)
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [currentChat])

  // Initialize chat when selected user changes
  useEffect(() => {
    if (selectedUser && currentUserId) {
      initializeChat()
    } else {
      setCurrentChat(null)
      setMessages([])
      setError(null)
      setPermissionError(null)
    }
  }, [selectedUser, currentUserId])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!selectedUser) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Select a User to Chat</h3>
          <p className="text-muted-foreground">Choose someone from the user list to start a conversation</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
              {selectedUser.Username?.[0]?.toUpperCase() || selectedUser.Email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{selectedUser.Username || "Unknown User"}</CardTitle>
            <p className="text-sm text-muted-foreground truncate">{selectedUser.Email || "No email"}</p>
          </div>

          <div className="flex items-center space-x-2">
            {!permissionError && !error && (
              <Badge variant="default" className="bg-green-500">
                Live
              </Badge>
            )}
            {currentChat && (
              <Badge variant="outline" className="text-xs">
                {messages.length} messages
              </Badge>
            )}
          </div>
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

      {/* Messages Area */}
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading chat...</p>
              </div>
            </div>
          ) : error || permissionError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-red-600 mb-2">
                  {permissionError ? "Permission Error" : "Failed to load chat"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">{error || permissionError}</p>
                {!permissionError && (
                  <Button variant="outline" size="sm" onClick={initializeChat} className="text-xs bg-transparent">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">No messages yet</p>
                <p className="text-xs text-muted-foreground">Send a message to start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUserId

                return (
                  <div key={message.$id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`text-xs ${
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                        {isCurrentUser && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ml-2 ${
                              isCurrentUser ? "bg-primary-foreground/20 text-primary-foreground" : ""
                            }`}
                          >
                            {message.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder={`Message ${selectedUser.Username || "user"}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || loading || !!error || !!permissionError}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || loading || !!error || !!permissionError}
              size="sm"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {currentChat && !permissionError && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Chat ID: {currentChat.$id} • Real-time messaging enabled
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
