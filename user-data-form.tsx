"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveUserData } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

const MIN_PASSWORD_LENGTH = 6 // Example minimum password length
const MAX_NUMBER_LENGTH = 10 // Define the maximum length for the number

export default function UserDataForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [number, setNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const trimmedNumber = number.trim()

    // Basic client-side validation
    if (!trimmedUsername || !trimmedEmail || !trimmedPassword || !trimmedNumber) {
      toast({
        title: "Validation Error",
        description: "All fields are required.",
        variant: "destructive",
      })
      return
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: "Validation Error",
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        variant: "destructive",
      })
      return
    }

    // New validation for Number length
    if (trimmedNumber.length > MAX_NUMBER_LENGTH) {
      toast({
        title: "Validation Error",
        description: `Number cannot be longer than ${MAX_NUMBER_LENGTH} characters.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await saveUserData({
        username: trimmedUsername,
        email: trimmedEmail,
        password: trimmedPassword,
        number: trimmedNumber,
      })

      if (result.success) {
        setUsername("")
        setEmail("")
        setPassword("")
        setNumber("")
        toast({
          title: "Success!",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save user data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Store User Data</CardTitle>
        <CardDescription>Enter user details to save them in the Appwrite database.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Number</Label>
            <Input
              id="number"
              type="tel" // Use type="tel" for phone numbers
              placeholder="Enter phone number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              disabled={loading}
              maxLength={MAX_NUMBER_LENGTH} // Add maxLength attribute here
            />
            <p className="text-sm text-muted-foreground text-right">
              {number.length}/{MAX_NUMBER_LENGTH}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save User Data"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Your data will be stored in the Appwrite database.
      </CardFooter>
    </Card>
  )
}
