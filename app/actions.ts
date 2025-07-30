"use server"

import { databases, account, chatDatabaseId, usersCollectionId, ID } from "@/lib/appwrite"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

interface UserData {
  Username: string
  Email: string
  Password: string
  Number: string
}

// Helper function to check if Appwrite is initialized
function isAppwriteInitialized(): boolean {
  return databases && account && typeof databases.createDocument === "function"
}

export async function signUpUser(data: UserData) {
  if (!isAppwriteInitialized()) {
    return { success: false, message: "Appwrite service is not available. Please try again later." }
  }

  try {
    // First, check if there's already an active session and delete it
    try {
      await account.deleteSession("current")
      console.log("Deleted existing session before sign up")
    } catch (error: any) {
      // It's okay if there's no session to delete
      console.log("No existing session to delete during sign up")
    }

    // 1. Create user in Appwrite Authentication
    const user = await account.create(ID.unique(), data.Email, data.Password, data.Username)

    // 2. Create email/password session
    await account.createEmailPasswordSession(data.Email, data.Password)

    // 3. Store user data in Appwrite database
    await databases.createDocument(
      chatDatabaseId,
      usersCollectionId,
      user.$id, // Use the Appwrite user ID as the document ID
      {
        Username: data.Username,
        Email: data.Email,
        Password: data.Password, // Note: In production, don't store passwords in plain text
        Number: data.Number,
      },
    )

    console.log("✅ User created successfully in Appwrite:", user.$id)
    revalidatePath("/")
    return { success: true, message: "Sign up successful! You are now logged in." }
  } catch (error: any) {
    console.error("❌ Error during sign up:", error)

    // Handle specific error cases
    if (error.message?.includes("user with the same id, email, or phone already exists")) {
      return { success: false, message: "An account with this email already exists. Please try logging in instead." }
    }

    return { success: false, message: `Sign up failed: ${error.message || "Unknown error"}` }
  }
}

export async function signInUser(email: string, password: string) {
  if (!isAppwriteInitialized()) {
    return { success: false, message: "Appwrite service is not available. Please try again later." }
  }

  try {
    // First, check if there's already an active session
    try {
      const currentUser = await account.get()
      if (currentUser) {
        console.log("User already logged in:", currentUser.email)
        // If the user is already logged in with the same email, just return success
        if (currentUser.email === email) {
          revalidatePath("/")
          return { success: true, message: "You are already logged in!" }
        } else {
          // If logged in with different email, delete the session first
          await account.deleteSession("current")
          console.log("Deleted existing session for different user")
        }
      }
    } catch (error: any) {
      // No active session, which is fine for login
      console.log("No existing session found during sign in")
    }

    // Create new session
    await account.createEmailPasswordSession(email, password)
    console.log("✅ User signed in successfully")
    revalidatePath("/")
    return { success: true, message: "Login successful!" }
  } catch (error: any) {
    console.error("❌ Error during sign in:", error)

    // Handle specific error cases
    if (error.message?.includes("Invalid credentials")) {
      return { success: false, message: "Invalid email or password. Please check your credentials and try again." }
    }

    if (error.message?.includes("Creation of a session is prohibited when a session is active")) {
      // This shouldn't happen now, but just in case
      try {
        await account.deleteSession("current")
        await account.createEmailPasswordSession(email, password)
        revalidatePath("/")
        return { success: true, message: "Login successful!" }
      } catch (retryError: any) {
        return { success: false, message: `Login failed: ${retryError.message || "Unknown error"}` }
      }
    }

    return { success: false, message: `Login failed: ${error.message || "Unknown error"}` }
  }
}

export async function signOutUser() {
  if (!isAppwriteInitialized()) {
    console.warn("Appwrite not initialized, redirecting anyway")
    revalidatePath("/")
    redirect("/")
    return
  }

  try {
    await account.deleteSession("current")
    console.log("✅ User signed out successfully")
  } catch (error: any) {
    if (error.message && error.message.includes("missing scope (account)")) {
      console.warn("Attempted to sign out a guest or invalid session. Proceeding with redirect.")
    } else if (error.message !== "NEXT_REDIRECT") {
      console.error("Unexpected error during sign out attempt:", error)
    }
  }

  revalidatePath("/")
  redirect("/")
}

export async function getCurrentUser() {
  if (!isAppwriteInitialized()) {
    console.log("Appwrite not initialized")
    return { success: false, user: null, message: "Service not available" }
  }

  try {
    const user = await account.get()
    console.log("✅ Current user found:", user.$id)
    return { success: true, user }
  } catch (error: any) {
    console.log("No active session or error:", error.message)
    return { success: false, user: null, message: error.message || "No active session" }
  }
}
