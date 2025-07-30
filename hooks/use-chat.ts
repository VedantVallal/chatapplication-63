"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChatService, type User, type Chat, type Message } from "@/lib/chat-service"

export function useChat(currentUserId: string | null) {
  const [users, setUsers] = useState<User[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)

  // Use refs to track subscriptions and prevent memory leaks
  const messageSubscriptionRef = useRef<Promise<() => void> | null>(null)
  const chatSubscriptionRef = useRef<Promise<() => void> | null>(null)

  // Load users
  const loadUsers = useCallback(async () => {
    if (!currentUserId) return

    try {
      setError(null)
      const fetchedUsers = await ChatService.getAllUsers(currentUserId)
      setUsers(fetchedUsers)
      console.log(`✅ Loaded ${fetchedUsers.length} users`)
    } catch (error: any) {
      console.error("❌ Error loading users:", error.message)
      setError(`Failed to load users: ${error.message}`)
      setUsers([])
    }
  }, [currentUserId])

  // Load chats for current user
  const loadChats = useCallback(async () => {
    if (!currentUserId) return

    try {
      setError(null)
      const fetchedChats = await ChatService.getUserChats(currentUserId)
      setChats(fetchedChats)
      console.log(`✅ Loaded ${fetchedChats.length} chats`)
    } catch (error: any) {
      console.error("❌ Error loading chats:", error.message)
      setError(`Failed to load chats: ${error.message}`)
      setChats([])
    }
  }, [currentUserId])

  // Start a chat with another user
  const startChat = useCallback(
    async (otherUserId: string) => {
      if (!currentUserId || !otherUserId) {
        setError("User IDs are required to start a chat")
        return
      }

      setLoading(true)
      setError(null)

      try {
        console.log(`🔄 Starting chat between ${currentUserId} and ${otherUserId}`)

        // Get or create chat
        const chat = await ChatService.getOrCreateChat(currentUserId, otherUserId)
        setCurrentChat(chat)

        // Load messages for this chat
        const chatMessages = await ChatService.getChatMessages(chat.$id)
        setMessages(chatMessages)

        console.log(`✅ Chat started: ${chat.$id} with ${chatMessages.length} messages`)
      } catch (error: any) {
        console.error("❌ Error starting chat:", error.message)
        setError(error.message)
        setCurrentChat(null)
        setMessages([])
      } finally {
        setLoading(false)
      }
    },
    [currentUserId],
  )

  // Send a message
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!currentUserId || !currentChat || !messageText.trim()) {
        throw new Error("Missing required data to send message")
      }

      try {
        console.log(`📤 Sending message to chat ${currentChat.$id}`)

        const sentMessage = await ChatService.sendMessage(currentChat.$id, currentUserId, messageText.trim())

        // Add message to local state
        setMessages((prev) => [...prev, sentMessage])

        console.log(`✅ Message sent: ${sentMessage.$id}`)
        return sentMessage
      } catch (error: any) {
        console.error("❌ Error sending message:", error.message)
        throw error
      }
    },
    [currentUserId, currentChat],
  )

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUserId || !currentChat) return

    console.log("🔄 Setting up real-time subscriptions...")

    // Subscribe to new messages
    const unsubscribeMessages = ChatService.subscribeToMessages(currentChat.$id, (newMessage) => {
      console.log("📨 Received new message:", newMessage.$id)
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((msg) => msg.$id === newMessage.$id)) {
          return prev
        }
        return [...prev, newMessage]
      })
    })

    // Subscribe to chat updates
    const unsubscribeChats = ChatService.subscribeToChatUpdates(currentUserId, (updatedChat) => {
      console.log("💬 Received chat update:", updatedChat.$id)
      setChats((prev) => prev.map((chat) => (chat.$id === updatedChat.$id ? updatedChat : chat)))
    })

    return () => {
      console.log("🔄 Cleaning up real-time subscriptions...")
      if (typeof unsubscribeMessages === "function") {
        unsubscribeMessages()
      }
      if (typeof unsubscribeChats === "function") {
        unsubscribeChats()
      }
    }
  }, [currentUserId, currentChat])

  // Clear chat data when user changes
  useEffect(() => {
    if (!currentUserId) {
      setCurrentChat(null)
      setMessages([])
      setError(null)
    }
  }, [currentUserId])

  // Initial load
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUserId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        await Promise.all([loadUsers(), loadChats()])
      } catch (error: any) {
        console.error("❌ Error initializing chat:", error.message)
        setError(`Failed to initialize chat: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    initializeChat()
  }, [currentUserId, loadUsers, loadChats])

  return {
    users,
    chats,
    messages,
    loading,
    error,
    currentChat,
    startChat,
    sendMessage,
    refreshUsers: loadUsers,
    refreshChats: loadChats,
  }
}
