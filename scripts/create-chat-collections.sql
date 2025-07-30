-- This script shows the structure you need to create in Appwrite Console
-- Go to your Appwrite Console > Database > Create Collection

-- 1. Create "chats" collection with these attributes:
-- Attribute Name: user1_id, Type: String, Size: 255, Required: true
-- Attribute Name: user2_id, Type: String, Size: 255, Required: true  
-- Attribute Name: created_at, Type: DateTime, Required: true
-- Attribute Name: last_message, Type: String, Size: 500, Required: false
-- Attribute Name: last_updated, Type: DateTime, Required: true
-- Attribute Name: is_group, Type: Boolean, Default: false, Required: false

-- 2. Create "messages" collection with these attributes:
-- Attribute Name: chat_id, Type: String, Size: 255, Required: true
-- Attribute Name: sender_id, Type: String, Size: 255, Required: true
-- Attribute Name: message, Type: String, Size: 2000, Required: true
-- Attribute Name: timestamp, Type: DateTime, Required: true
-- Attribute Name: status, Type: String, Size: 50, Default: "sent", Required: true
-- Attribute Name: type, Type: String, Size: 50, Default: "text", Required: true
-- Attribute Name: attachments, Type: String, Size: 500, Required: false

-- 3. Set up Indexes for better performance:
-- chats collection:
-- Index: user1_id (ascending)
-- Index: user2_id (ascending) 
-- Index: last_updated (descending)

-- messages collection:
-- Index: chat_id (ascending)
-- Index: timestamp (descending)
-- Index: sender_id (ascending)

-- 4. Set up Permissions:
-- For both collections, allow:
-- - Create: users
-- - Read: users  
-- - Update: users
-- - Delete: users (optional)
