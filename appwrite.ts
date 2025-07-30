import { Client, Databases, ID, Account } from "appwrite" // Import Account

// IMPORTANT: In a real application, these should be stored as environment variables (e.g., process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
// For this v0 preview, they are hardcoded as .env files are not supported in Next.js.
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // Your Appwrite Endpoint
  .setProject("688095270039d9016d90") // Your Project ID

const databases = new Databases(client)
const account = new Account(client) // Initialize Account service

const databaseId = "68897cbe000927e3d9e5" // Your Database ID
const collectionId = "68897cc9000cfe296b0b" // Your Collection ID

export { client, databases, account, databaseId, collectionId, ID } // Export account
