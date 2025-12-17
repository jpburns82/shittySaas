# Phase 3: Messages Thread Detail Page - Implementation Plan

## Overview

Build the thread detail page where users view full message history and reply with text + attachments.

**Routing decision:** Keep implicit threading with `/dashboard/messages/[recipientId]?listing=[listingId]` pattern.

---

## Implementation Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Schema - Add MessageAttachment model | ✅ Complete |
| 2 | Thread Detail Page | ✅ Complete |
| 3 | Attachment Upload Endpoint | ✅ Complete |
| 4 | Enhanced Send Message API | ✅ Complete |
| 5 | Reply Composer with Attachments | ✅ Complete |
| 6 | Message Bubble with Attachments | ✅ Complete |
| 7 | Mark as Read Endpoint | ⏳ (integrated into page load) |
| 8 | Block User API | ✅ Complete |
| 9 | Report Message API | ✅ Complete |
| 10 | Notification Settings | ⏳ Pending |

**Last Updated:** December 17, 2025

---

## Key Decisions Summary

| Decision | Answer |
|----------|--------|
| Thread structure | Always tied to a listing |
| Who can message | Members only (buyer ↔ seller ↔ admin) |
| Content | Text + attachments (5MB max, 3 files max) |
| Storage | Attachments → R2, metadata → PostgreSQL |
| Real-time | No (email alerts + manual refresh for MVP) |
| Notifications | User-configurable (instant/digest/off) |
| Deleted listing | Keep thread, show banner |
| Block user | Simple flag, blocks new messages |
| Delete convo | Soft delete (hidden, data retained) |
| Threading model | Implicit (user1, user2, listing tuple) |

---

## What Already Exists (Reuse)

| Component | Location |
|-----------|----------|
| Message model | `prisma/schema.prisma` (lines 382-409) |
| BlockedUser model | `prisma/schema.prisma` (lines 411-426) |
| R2 upload utilities | `src/lib/r2.ts` |
| Messages API | `src/app/api/messages/route.ts` |
| Inbox page | `src/app/dashboard/messages/page.tsx` |
| MessageThread component | `src/components/messages/message-thread.tsx` |
| MessageInput component | `src/components/messages/message-input.tsx` |
| useMessages hook | `src/hooks/use-messages.ts` |
| Email notifications | `src/lib/email.ts` |

---

## Implementation Steps

### Step 1: Schema - Add MessageAttachment model
**File:** `prisma/schema.prisma`

```prisma
model MessageAttachment {
  id         String   @id @default(cuid())
  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  messageId  String
  fileName   String
  fileSize   Int      // bytes
  fileKey    String   // R2 object key
  mimeType   String?
  createdAt  DateTime @default(now())

  @@index([messageId])
}
```

Add to Message model:
```prisma
attachments MessageAttachment[]
```

Add to User model for notification preferences:
```prisma
messageNotifications String @default("instant") // "instant" | "digest" | "off"
```

Run: `pnpm db:generate && pnpm db:push`

---

### Step 2: Thread Detail Page (Read-Only First)
**Create:** `src/app/dashboard/messages/[recipientId]/page.tsx`

- Server component that fetches conversation
- Get `recipientId` from params, `listingId` from searchParams
- Verify auth, verify recipient exists
- Fetch messages between current user and recipient (with optional listing filter)
- Show ThreadHeader with recipient info + listing context
- Render messages using existing MessageThread component
- Handle deleted listing case: show banner if listing was deleted

---

### Step 3: Attachment Upload Endpoint
**Create:** `src/app/api/messages/upload/route.ts`

- POST endpoint for message attachments
- Auth required
- Accept FormData with files
- Limits: 5MB max per file, 3 files max
- Allowed types: images, PDFs, common documents
- Upload to R2 under `message-attachments/{userId}/{nanoid}.{ext}`
- Return: `{ key, url, fileName, fileSize, mimeType }`

---

### Step 4: Enhanced Send Message API
**Modify:** `src/app/api/messages/route.ts`

Update POST to accept attachment keys:
```typescript
body: {
  content: string,
  receiverId: string,
  listingId?: string,
  attachments?: { key: string, fileName: string, fileSize: number, mimeType: string }[]
}
```

- Create Message record
- Create MessageAttachment records linked to message
- Send email notification (include attachment count in email)

---

### Step 5: Reply Composer with Attachments
**Create:** `src/components/messages/message-composer.tsx`

- Text input (reuse MessageInput logic)
- Attachment button to add files
- File preview with remove option
- Upload files on selection (show progress)
- Send button submits message + attachment keys
- Shift+Enter for newline, Enter to send

**Create:** `src/components/messages/attachment-preview.tsx`

- Thumbnail for images
- Icon + filename for other types
- File size display
- Remove button

---

### Step 6: Message Bubble with Attachments
**Create:** `src/components/messages/message-bubble.tsx`

- Display message content
- Show attachments with download links
- Image attachments: thumbnail preview, click to expand
- Other files: icon + filename + download button
- Timestamp and read status indicator

---

### Step 7: Mark as Read Endpoint
**Create:** `src/app/api/messages/read/route.ts`

- POST with `{ recipientId, listingId? }`
- Mark all unread messages from that user as read
- Called when thread page loads

---

### Step 8: Block User API
**Create:** `src/app/api/users/[userId]/block/route.ts`

- POST to block user (creates BlockedUser record)
- DELETE to unblock user
- Auth required
- Prevent blocking self

Update message sending to check blocked status before allowing send.

---

### Step 9: Report Message API
**Create:** `src/app/api/messages/[messageId]/report/route.ts`

- POST to report a message
- Uses existing Report model with `entityType: MESSAGE`
- Requires reason selection

---

### Step 10: Notification Settings
**Create:** `src/app/dashboard/settings/notifications/page.tsx`

- Radio buttons: Instant / Daily digest / Off
- Save to user.messageNotifications field

**Create:** `src/app/api/settings/notifications/route.ts`

- GET: return current setting
- PATCH: update setting

---

## File Summary

### New Files to Create
```
src/app/dashboard/messages/[recipientId]/page.tsx
src/app/api/messages/upload/route.ts
src/app/api/messages/read/route.ts
src/app/api/messages/[messageId]/report/route.ts
src/app/api/users/[userId]/block/route.ts
src/app/api/settings/notifications/route.ts
src/app/dashboard/settings/notifications/page.tsx
src/components/messages/message-composer.tsx
src/components/messages/message-bubble.tsx
src/components/messages/attachment-preview.tsx
```

### Files to Modify
```
prisma/schema.prisma (add MessageAttachment, update Message & User)
src/app/api/messages/route.ts (add attachment support to POST)
src/lib/validations.ts (add attachment validation schema)
src/lib/r2.ts (add message-attachments category)
src/types/user.ts (add MessageAttachment type)
```

---

## Out of Scope (Future)
- Real-time WebSocket updates
- Digest email batching cron job
- Rich text/markdown formatting
- Typing indicators
- Read receipts (beyond basic readAt)

---

## Codebase Exploration Summary

### Current Message Model (prisma/schema.prisma)
```prisma
model Message {
  id          String   @id @default(cuid())
  listing     Listing? @relation(fields: [listingId], references: [id])
  listingId   String?
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  senderId    String
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  receiverId  String
  content     String   @db.Text
  readAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([listingId])
  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
}
```

### Current BlockedUser Model
```prisma
model BlockedUser {
  id          String   @id @default(cuid())
  blocker     User     @relation("Blocker", fields: [blockerId], references: [id])
  blockerId   String
  blocked     User     @relation("Blocked", fields: [blockedId], references: [id])
  blockedId   String
  createdAt   DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
}
```

### R2 Storage Configuration (src/lib/r2.ts)
- S3-compatible client configured for Cloudflare R2
- Existing categories: screenshots (5MB), files (100MB), avatars (2MB)
- Helper functions: `uploadFile()`, `deleteFile()`, `getPresignedUploadUrl()`, `getPresignedDownloadUrl()`

### Existing Messages API (src/app/api/messages/route.ts)
- GET: Fetches conversations, supports userId and listingId filters, auto-marks as read
- POST: Creates message, validates content (1-5000 chars), sends email notification

### Existing Components
- `MessageThread` - Displays conversation history with bubble styling
- `MessageInput` - Textarea with Enter to send, Shift+Enter for newline
- `ContactForm` - Quick message form on listing pages
- `ThreadHeader` - Shows conversation metadata

### Existing Hooks (src/hooks/use-messages.ts)
- `useMessages()` - Fetches messages with polling support
- `useUnreadCount()` - Gets unread count for badge

---

## Files Created/Modified (Steps 1-6)

### New Files Created
```
src/app/dashboard/messages/[recipientId]/page.tsx       # Thread detail server component
src/app/dashboard/messages/[recipientId]/thread-client.tsx  # Thread client component
src/app/api/messages/upload/route.ts                    # Attachment upload endpoint
src/app/api/messages/attachments/[attachmentId]/download/route.ts  # Attachment download
src/app/api/users/[userId]/block/route.ts               # Block/unblock user endpoint
src/app/api/reports/route.ts                            # Report submission endpoint
src/components/messages/message-composer.tsx            # Reply composer with attachments
src/components/messages/message-bubble.tsx              # Individual message display
src/components/messages/attachment-preview.tsx          # Pending attachment in composer
src/components/messages/attachment-display.tsx          # Sent attachment display
src/components/messages/system-message.tsx              # System notification display
```

### Files Modified
```
prisma/schema.prisma          # Added MessageAttachment, updated Message & User
src/app/api/messages/route.ts # Added attachment support, block checking
src/lib/validations.ts        # Added messageAttachmentSchema
src/lib/r2.ts                 # Added message-attachments category
src/lib/constants.ts          # Added MESSAGE_LIMITS
src/lib/email.ts              # Updated sendMessageNotificationEmail
src/types/user.ts             # Added MessageWithAttachments, AttachmentInput types
```

---

*Plan created: December 16, 2025*
*Steps 1-6 implemented: December 17, 2025*
