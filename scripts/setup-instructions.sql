-- SETUP INSTRUCTIONS FOR APPWRITE CHAT COLLECTIONS
-- Follow these steps to enable full chat functionality:

-- 1. Go to your Appwrite Console: https://fra.cloud.appwrite.io/console/project/688095270039d9016d90
-- 2. Navigate to Database > Your Database (68897cbe000927e3d9e5)
-- 3. Create two new collections:

-- COLLECTION 1: "chats"
-- Collection ID: chats
-- Attributes:
-- - user1_id (String, 255 chars, Required)
-- - user2_id (String, 255 chars, Required)
-- - created_at (DateTime, Required)
-- - last_message (String, 500 chars, Optional)
-- - last_updated (DateTime, Required)
-- - is_group (Boolean, Default: false, Optional)

-- COLLECTION 2: "messages"
-- Collection ID: messages
-- Attributes:
-- - chat_id (String, 255 chars, Required)
-- - sender_id (String, 255 chars, Required)
-- - message (String, 2000 chars, Required)
-- - timestamp (DateTime, Required)
-- - status (String, 50 chars, Default: "sent", Required)
-- - type (String, 50 chars, Default: "text", Required)
-- - attachments (String, 500 chars, Optional)

-- 4. Set Permissions for both collections:
-- - Create: users
-- - Read: users
-- - Update: users
-- - Delete: users (optional)

-- 5. Create Indexes for better performance:
-- For "chats" collection:
-- - Index on user1_id (ascending)
-- - Index on user2_id (ascending)
-- - Index on last_updated (descending)

-- For "messages" collection:
-- - Index on chat_id (ascending)
-- - Index on timestamp (descending)
-- - Index on sender_id (ascending)

-- After creating these collections, the app will automatically switch from demo mode to full database mode with real-time messaging!
