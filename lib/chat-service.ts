import {
  databases,
  client,
  chatDatabaseId,
  usersCollectionId,
  chatsCollectionId,
  messagesCollectionId,
  Query,
  ID,
  withRetry,
  checkCollectionPermissions,
} from "@/lib/appwrite"

export interface User {
  $id: string
  Username?: string
  Email?: string
  Number?: string
  Password?: string
  $createdAt?: string
}

export interface Chat {
  $id: string
  user1_id: string
  user2_id: string
  created_at: string
  is_group?: boolean
  last_message?: string
  last_updated: string
}

export interface Message {
  $id: string
  chat_id: string
  sender_id: string
  message: string
  timestamp: string
  status: string
  type: string
  attachments?: string
}

export class ChatService {
  private static permissionsChecked = false
  private static permissionStatus = {
    usersAccessible: false,
    chatsAccessible: false,
    messagesAccessible: false,
    errors: [] as string[],
  }

  // Check permissions once per session
  private static async ensurePermissions(): Promise<void> {
    if (!this.permissionsChecked) {
      this.permissionStatus = await checkCollectionPermissions()
      this.permissionsChecked = true

      if (this.permissionStatus.errors.length > 0) {
        console.warn("⚠️ Collection permission issues detected:", this.permissionStatus.errors)
      }
    }
  }

  // Helper method to normalize user data
  private static normalizeUser(user: any): User | null {
    try {
      if (!user || !user.$id) return null

      return {
        $id: user.$id,
        Username: user.Username || "Unknown User",
        Email: user.Email || "No Email",
        Number: user.Number || "No Number",
        Password: user.Password,
        $createdAt: user.$createdAt || new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error normalizing user:", error)
      return null
    }
  }

  // Get all users except current user
  static async getAllUsers(currentUserId: string): Promise<User[]> {
    if (!currentUserId) {
      throw new Error("Current user ID is required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.usersAccessible) {
      throw new Error("Users collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const users = await withRetry(async () => {
        const response = await databases.listDocuments(chatDatabaseId, usersCollectionId, [
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ])

        if (!response?.documents) {
          throw new Error("No documents in response")
        }

        return response.documents
          .filter((doc: any) => doc?.$id && doc.$id !== currentUserId)
          .map((doc: any) => this.normalizeUser(doc))
          .filter((user: User | null): user is User => user !== null && user.Username !== "Unknown User")
      })

      console.log(`✅ Loaded ${users.length} users from Appwrite`)
      return users
    } catch (error: any) {
      console.error("❌ Error fetching users from Appwrite:", error.message)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }
  }

  // Find existing chat between two users
  static async findExistingChat(user1Id: string, user2Id: string): Promise<Chat | null> {
    if (!user1Id || !user2Id) {
      throw new Error("Both user IDs are required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.chatsAccessible) {
      throw new Error("Chats collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const chat = await withRetry(async () => {
        const response = await databases.listDocuments(chatDatabaseId, chatsCollectionId, [
          Query.or([
            Query.and([Query.equal("user1_id", user1Id), Query.equal("user2_id", user2Id)]),
            Query.and([Query.equal("user1_id", user2Id), Query.equal("user2_id", user1Id)]),
          ]),
          Query.limit(1),
        ])

        return (response?.documents?.[0] as Chat) || null
      })

      if (chat) {
        console.log("✅ Found existing chat:", chat.$id)
      }
      return chat
    } catch (error: any) {
      console.error("❌ Error finding existing chat:", error.message)
      throw new Error(`Failed to find chat: ${error.message}`)
    }
  }

  // Create new chat between two users
  static async createNewChat(user1Id: string, user2Id: string): Promise<Chat> {
    if (!user1Id || !user2Id) {
      throw new Error("Both user IDs are required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.chatsAccessible) {
      throw new Error("Chats collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const response = await withRetry(async () => {
        return await databases.createDocument(chatDatabaseId, chatsCollectionId, ID.unique(), {
          user1_id: user1Id,
          user2_id: user2Id,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          is_group: false,
        })
      })

      console.log("✅ Created new chat in Appwrite:", response.$id)
      return response as Chat
    } catch (error: any) {
      console.error("❌ Error creating new chat:", error.message)
      throw new Error(`Failed to create chat: ${error.message}`)
    }
  }

  // Get or create chat between two users
  static async getOrCreateChat(user1Id: string, user2Id: string): Promise<Chat> {
    if (!user1Id || !user2Id) {
      throw new Error("Both user IDs are required")
    }

    try {
      let chat = await this.findExistingChat(user1Id, user2Id)
      if (!chat) {
        chat = await this.createNewChat(user1Id, user2Id)
      }
      return chat
    } catch (error: any) {
      console.error("❌ Error getting or creating chat:", error.message)
      throw new Error(`Failed to get or create chat: ${error.message}`)
    }
  }

  // Get messages for a specific chat
  static async getChatMessages(chatId: string, limit = 50): Promise<Message[]> {
    if (!chatId) {
      throw new Error("Chat ID is required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.messagesAccessible) {
      throw new Error("Messages collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const messages = await withRetry(async () => {
        const response = await databases.listDocuments(chatDatabaseId, messagesCollectionId, [
          Query.equal("chat_id", chatId),
          Query.orderAsc("timestamp"),
          Query.limit(limit),
        ])

        return (response?.documents as Message[]) || []
      })

      console.log(`✅ Loaded ${messages.length} messages for chat ${chatId}`)
      return messages
    } catch (error: any) {
      console.error("❌ Error getting chat messages:", error.message)
      throw new Error(`Failed to get messages: ${error.message}`)
    }
  }

  // Send a new message
  static async sendMessage(
    chatId: string,
    senderId: string,
    message: string,
    type = "text",
    attachments?: string,
  ): Promise<Message> {
    if (!chatId || !senderId || !message) {
      throw new Error("Chat ID, sender ID, and message are required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.messagesAccessible) {
      throw new Error("Messages collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const response = await withRetry(async () => {
        return await databases.createDocument(chatDatabaseId, messagesCollectionId, ID.unique(), {
          chat_id: chatId,
          sender_id: senderId,
          message: message,
          timestamp: new Date().toISOString(),
          status: "sent",
          type: type,
          ...(attachments && { attachments }),
        })
      })

      // Update chat's last message
      await this.updateChatLastMessage(chatId, message)

      console.log("✅ Message sent to Appwrite:", response.$id)
      return response as Message
    } catch (error: any) {
      console.error("❌ Error sending message:", error.message)
      throw new Error(`Failed to send message: ${error.message}`)
    }
  }

  // Update chat's last message and timestamp
  static async updateChatLastMessage(chatId: string, lastMessage: string): Promise<void> {
    if (!chatId || !lastMessage) {
      return
    }

    try {
      await withRetry(async () => {
        await databases.updateDocument(chatDatabaseId, chatsCollectionId, chatId, {
          last_message: lastMessage,
          last_updated: new Date().toISOString(),
        })
      })

      console.log("✅ Updated chat last message")
    } catch (error: any) {
      console.error("❌ Error updating chat last message:", error.message)
      // Don't throw here as this is not critical
    }
  }

  // Get user's chats
  static async getUserChats(userId: string): Promise<Chat[]> {
    if (!userId) {
      throw new Error("User ID is required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.chatsAccessible) {
      throw new Error("Chats collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const chats = await withRetry(async () => {
        const response = await databases.listDocuments(chatDatabaseId, chatsCollectionId, [
          Query.or([Query.equal("user1_id", userId), Query.equal("user2_id", userId)]),
          Query.orderDesc("last_updated"),
          Query.limit(50),
        ])

        return (response?.documents as Chat[]) || []
      })

      console.log(`✅ Loaded ${chats.length} chats for user ${userId}`)
      return chats
    } catch (error: any) {
      console.error("❌ Error getting user chats:", error.message)
      throw new Error(`Failed to get chats: ${error.message}`)
    }
  }

  // Subscribe to real-time messages for a chat
  static subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    if (!chatId) {
      console.error("❌ Chat ID is required for subscription")
      return () => {}
    }

    try {
      const unsubscribe = client.subscribe(
        `databases.${chatDatabaseId}.collections.${messagesCollectionId}.documents`,
        (response) => {
          try {
            const payload = response.payload as any
            if (payload?.chat_id === chatId) {
              if (response.events.some((event) => event.includes(".create"))) {
                console.log("✅ Received real-time message:", payload.$id)
                callback(payload as Message)
              }
            }
          } catch (error) {
            console.error("❌ Error processing real-time message:", error)
          }
        },
      )

      console.log("✅ Subscribed to real-time messages for chat:", chatId)
      return unsubscribe
    } catch (error: any) {
      console.error("❌ Error subscribing to messages:", error.message)
      return () => {}
    }
  }

  // Subscribe to real-time chat updates
  static subscribeToChatUpdates(userId: string, callback: (chat: Chat) => void) {
    if (!userId) {
      console.error("❌ User ID is required for subscription")
      return () => {}
    }

    try {
      const unsubscribe = client.subscribe(
        `databases.${chatDatabaseId}.collections.${chatsCollectionId}.documents`,
        (response) => {
          try {
            const payload = response.payload as any
            if (payload && (payload.user1_id === userId || payload.user2_id === userId)) {
              if (response.events.some((event) => event.includes(".update") || event.includes(".create"))) {
                console.log("✅ Received real-time chat update:", payload.$id)
                callback(payload as Chat)
              }
            }
          } catch (error) {
            console.error("❌ Error processing real-time chat update:", error)
          }
        },
      )

      console.log("✅ Subscribed to real-time chat updates for user:", userId)
      return unsubscribe
    } catch (error: any) {
      console.error("❌ Error subscribing to chat updates:", error.message)
      return () => {}
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    if (!userId) {
      throw new Error("User ID is required")
    }

    await this.ensurePermissions()

    if (!this.permissionStatus.usersAccessible) {
      throw new Error("Users collection is not accessible. Please check collection permissions in Appwrite console.")
    }

    try {
      const user = await withRetry(async () => {
        const response = await databases.getDocument(chatDatabaseId, usersCollectionId, userId)
        return this.normalizeUser(response)
      })

      if (user) {
        console.log("✅ Found user:", user.Username)
      }
      return user
    } catch (error: any) {
      console.error("❌ Error fetching user by ID:", error.message)
      throw new Error(`Failed to get user: ${error.message}`)
    }
  }

  // Get permission status
  static async getPermissionStatus(): Promise<{
    usersAccessible: boolean
    chatsAccessible: boolean
    messagesAccessible: boolean
    errors: string[]
  }> {
    await this.ensurePermissions()
    return this.permissionStatus
  }
}
