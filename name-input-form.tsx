"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveName } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

const MAX_NAME_LENGTH = 20 // Define the maximum length for the name

export default function NameInputForm() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      toast({
        title: "Validation Error",
        description: "Name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      toast({
        title: "Validation Error",
        description: `Name cannot be longer than ${MAX_NAME_LENGTH} characters.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await saveName(trimmedName) // Use trimmedName for submission
      if (result.success) {
        setName("") // Clear input on success
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
      console.error("Failed to save name:", error)
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
        <CardTitle>Store Your Name</CardTitle>
        <CardDescription>Enter your name to save it in the Appwrite database.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              maxLength={MAX_NAME_LENGTH} // Add maxLength attribute here
            />
            <p className="text-sm text-muted-foreground text-right">
              {name.length}/{MAX_NAME_LENGTH}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Name"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Your name will be stored in the Appwrite database.
      </CardFooter>
    </Card>
  )
}
