# Database Collections Summary

This document provides a summary of all Mongoose schemas defined in the backend `src` directory.

---

## 1. User
**File Path:** `src/user/entities/RegisterUser.entity.ts`

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `name` | String | Yes | No | |
| `email` | String | Yes | Yes | |
| `post` | String | Yes | No | |
| `mobileNo` | String | Yes | Yes | |
| `password` | String | Yes | No | |
| `role` | String | No | No | `Role.USER` |
| `employeeId` | String | No | No | Auto-incremented in `pre('save')` hook |
| `createdOn` | Date | No | No | `Date.now()` |
| `updatedOn` | Date | No | No | `Date.now()` |
| `refreshToken` | String | No | No | |
| `isVerified` | Boolean | No | No | `false` |
| `profilePicture` | String | No | No | |
| `description` | String | No | No | `'Employee of Metalixia'` |
| `address` | String | No | No | |

---

## 2. Attendance
**File Path:** `src/attendance/entities/attendance.schema.ts`
**Timestamps:** Mapped to `createdOn` and `updatedOn`.

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `employeeId` | String | Yes | No | |
| `month` | String | Yes | No | |
| `year` | String | Yes | No | |
| `location` | String | Yes | No | |
| `fileName` | String | Yes | No | |
| `uploadedBy` | String | Yes | No | Store uploader's ID |
| `isDeleted` | Boolean | No | No | `false` |
| `deletedAt` | Date | No | No | |

---

## 3. Report
**File Path:** `src/employee/entities/report.schema.ts`
**Timestamps:** Mapped to `uploadedTime` and `updatedTime`.

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `name` | String | Yes | No | |
| `fileType` | String | Yes | No | |
| `location` | String | Yes | No | |
| `employeeId` | String | Yes | No | |
| `status` | String | Yes | No | Enum: `["pending", "approved", "rejected", "mailed"]`, Default: `"pending"` |
| `originalName` | String | Yes | No | |
| `isDeleted` | Boolean | No | No | `false` |
| `deletedAt` | Date | No | No | |

---

## 4. Payslip
**File Path:** `src/payslip/entities/payslip.schema.ts`
**Timestamps:** Mapped to `createdOn` and `updatedOn`.

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `employeeId` | String | Yes | No | |
| `month` | String | Yes | No | |
| `year` | String | Yes | No | |
| `location` | String | Yes | No | |
| `fileName` | String | Yes | No | |
| `uploadedBy` | String | Yes | No | |
| `isDeleted` | Boolean | No | No | `false` |
| `deletedAt` | Date | No | No | |

---

## 5. CompanyMaterial
**File Path:** `src/material/entities/company-material.schema.ts`
**Timestamps:** Mapped to `createdAt` and `updatedAt`.

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `materialName` | String | Yes | No | |
| `companyName` | String | Yes | No | |
| `quantity` | Number | Yes | No | |
| `unit` | String | Yes | No | |
| `receivedBy` | String | No | No | `null` |
| `receivedById` | String | No | No | `null` |
| `inventoryLocation` | String | Yes | No | |
| `expectedOn` | Date | No | No | `null` |
| `deliveryBy` | Date | No | No | `null` |
| `receivedOn` | Date | No | No | `null` |
| `createdAt` | Date | No | No | Automatically populated |
| `updatedAt` | Date | No | No | Automatically populated |

---

## 6. RawMaterial
**File Path:** `src/material/entities/raw-material.schema.ts`
**Timestamps:** Mapped to `receivedAt` and `updatedAt`.

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `materialName` | String | Yes | No | |
| `quantity` | Number | Yes | No | |
| `unit` | String | Yes | No | |
| `price` | Number | Yes | No | |
| `source` | String | Yes | No | |
| `receivedBy` | String | Yes | No | |
| `receivedById` | String | Yes | No | |
| `receivedAt` | Date | No | No | Automatically populated |
| `updatedAt` | Date | No | No | Automatically populated |

---

## 7. Verification
**File Path:** `src/email/entities/verification.schema.ts`
**Timestamps:** Uses default `createdAt` and `updatedAt`.
**Indexes:** `expiresAt` field has a TTL index of 0 (documents delete automatically when expired).

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `email` | String | Yes | No | |
| `userId` | ObjectId | Yes | No | Ref: `'User'` |
| `otp` | String | Yes | No | |
| `expiresAt` | Date | Yes | No | |
| `useCount` | Number | No | No | `0` |
| `isUsed` | Boolean | No | No | `false` |

---

## 8. Email
**File Path:** `src/email/entities/email.schema.ts`
**Timestamps:** Mapped to `sentAt` only (no update timestamp).

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `to` | String | Yes | No | |
| `subject` | String | Yes | No | |
| `message` | String | Yes | No | |
| `attachments` | [String] | No | No | `[]` (Paths to files) |
| `status` | String | No | No | `'sent'` |
| `senderId` | String | Yes | No | |

---

## 9. EmailTemplate
**File Path:** `src/email/entities/email-template.schema.ts`
**Timestamps:** Uses default `createdAt` and `updatedAt`.

| Field | Type | Required | Unique | Default/Notes |
| :--- | :--- | :---: | :---: | :--- |
| `name` | String | Yes | No | |
| `subject` | String | Yes | No | |
| `body` | String | Yes | No | |
