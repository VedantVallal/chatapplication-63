-- Appwrite Collection Permissions Setup Instructions
-- 
-- You need to set up the following permissions in your Appwrite console:
-- 
-- 1. Go to your Appwrite console: https://fra.cloud.appwrite.io/console
-- 2. Navigate to your project: 688095270039d9016d90
-- 3. Go to Databases > 68897cbe000927e3d9e5
-- 4. For each collection, set the following permissions:

-- USERS COLLECTION (68897cc9000cfe296b0b):
-- Permissions needed:
-- - Read: users (authenticated users can read all users)
-- - Create: users (authenticated users can create user documents)
-- - Update: users (authenticated users can update their own documents)
-- - Delete: users (authenticated users can delete their own documents)

-- CHATS COLLECTION (688a0bc0003d0b6bcd08):
-- Permissions needed:
-- - Read: users (authenticated users can read chats they're part of)
-- - Create: users (authenticated users can create new chats)
-- - Update: users (authenticated users can update chats they're part of)
-- - Delete: users (authenticated users can delete chats they're part of)

-- MESSAGES COLLECTION (688a0cd2002f59dd865d6):
-- Permissions needed:
-- - Read: users (authenticated users can read messages in their chats)
-- - Create: users (authenticated users can create new messages)
-- - Update: users (authenticated users can update their own messages)
-- - Delete: users (authenticated users can delete their own messages)

-- HOW TO SET PERMISSIONS:
-- 1. Click on each collection
-- 2. Go to the "Settings" tab
-- 3. Scroll down to "Permissions"
-- 4. Click "Add Permission"
-- 5. Select "Role: users" (this means any authenticated user)
-- 6. Check the boxes for Read, Create, Update, Delete as needed
-- 7. Click "Update"

-- ALTERNATIVE: You can also set permissions to "any" for testing:
-- - Read: any
-- - Create: any
-- - Update: any
-- - Delete: any
-- 
-- But this is less secure and should only be used for development/testing.

-- After setting permissions, your chat app should work without authorization errors.
