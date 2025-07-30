import { Client, Databases, ID, Account, Query } from "appwrite"

// Initialize Appwrite client with your exact configuration
const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("688095270039d9016d90")

const databases = new Databases(client)
const account = new Account(client)

// Your exact Database and Collection IDs
const chatDatabaseId = "68897cbe000927e3d9e5"
const usersCollectionId = "68897cc9000cfe296b0b"
const chatsCollectionId = "688a0bc0003d0b6bcd08"
const messagesCollectionId = "688a0cd2002f59dd865d"

// Helper function to check if Appwrite is accessible
export async function checkAppwriteConnection(): Promise<{
  connected: boolean
  error?: string
}> {
  try {
    // Try to get account info as a connectivity test
    await account.get()
    console.log("✅ Appwrite connection successful")
    return { connected: true }
  } catch (error: any) {
    // If it's just a "no session" error, Appwrite is still accessible
    if (error.message?.includes("missing scope") || error.message?.includes("unauthorized")) {
      console.log("✅ Appwrite accessible (no active session)")
      return { connected: true }
    }

    console.error("❌ Appwrite connection failed:", error.message)
    return { connected: false, error: error.message }
  }
}

// Helper function to check collection permissions
export async function checkCollectionPermissions(): Promise<{
  usersAccessible: boolean
  chatsAccessible: boolean
  messagesAccessible: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let usersAccessible = false
  let chatsAccessible = false
  let messagesAccessible = false

  try {
    // Check users collection
    try {
      await databases.listDocuments(chatDatabaseId, usersCollectionId, [Query.limit(1)])
      usersAccessible = true
      console.log("✅ Users collection accessible")
    } catch (error: any) {
      console.log("❌ Users collection not accessible:", error.message)
      errors.push(`Users collection: ${error.message}`)
    }

    // Check chats collection
    try {
      await databases.listDocuments(chatDatabaseId, chatsCollectionId, [Query.limit(1)])
      chatsAccessible = true
      console.log("✅ Chats collection accessible")
    } catch (error: any) {
      console.log("❌ Chats collection not accessible:", error.message)
      errors.push(`Chats collection: ${error.message}`)
    }

    // Check messages collection
    try {
      await databases.listDocuments(chatDatabaseId, messagesCollectionId, [Query.limit(1)])
      messagesAccessible = true
      console.log("✅ Messages collection accessible")
    } catch (error: any) {
      console.log("❌ Messages collection not accessible:", error.message)
      errors.push(`Messages collection: ${error.message}`)
    }
  } catch (error: any) {
    errors.push(`General error: ${error.message}`)
  }

  return { usersAccessible, chatsAccessible, messagesAccessible, errors }
}

// Retry wrapper for database operations with better error handling
export async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      console.error(`❌ Operation failed (attempt ${attempt}/${retries}):`, error.message)

      // Don't retry permission errors
      if (error.message?.includes("not authorized") || error.message?.includes("missing scope")) {
        throw new Error(`Permission denied: ${error.message}. Please check your Appwrite collection permissions.`)
      }

      if (attempt === retries) {
        throw error
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))
    }
  }

  throw new Error("Max retries exceeded")
}

export {
  client,
  databases,
  account,
  chatDatabaseId,
  usersCollectionId,
  chatsCollectionId,
  messagesCollectionId,
  ID,
  Query,
}
