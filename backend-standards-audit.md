# Backend Developer Standards Audit

This document identifies bugs, code duplications, and standard violations in the backend codebase.

## 1. Logic & Code Duplication
> [!IMPORTANT]
> Redundant code increases maintenance costs and the likelihood of inconsistent behavior.

- **Service Cloning**: `AttendanceService` and `PayslipService` are nearly identical.
    - [attendance.service.ts](file:///c:/Project/Metalixia/backend/src/attendance/attendance.service.ts)
    - [payslip.service.ts](file:///c:/Project/Metalixia/backend/src/payslip/payslip.service.ts)
    - *Issue*: CRUD logic, file deletion, and pagination are duplicated.
- **Manual "Joins"**: Both services manually fetch employee data from `UserService` and join it in memory.
    - *Example*: Mapping `employeeId` and `uploadedBy` strings to user names in every `findAll` method.
- **Repeated Pagination Logic**: Every service manually calculates `skip`, `limit`, `totalPages`, and `countDocuments`.
    - [material.service.ts:L40](file:///c:/Project/Metalixia/backend/src/material/material.service.ts#L40)
    - [user.service.ts:L79](file:///c:/Project/Metalixia/backend/src/user/user.service.ts#L79)

## 2. Naming & Convention Inconsistencies
> [!TIP]
> Consistent naming makes the codebase easier to navigate for new developers.

- **File Naming**:
    - [RegisterUser.entity.ts](file:///c:/Project/Metalixia/backend/src/user/entities/RegisterUser.entity.ts) uses **PascalCase**.
    - [raw-material.schema.ts](file:///c:/Project/Metalixia/backend/src/material/entities/raw-material.schema.ts) uses **kebab-case**.
- **Timestamp Fields**:
    - `User` and `Attendance` use `createdOn` and `updatedOn`.
    - `CompanyMaterial` and `RawMaterial` use `createdAt` and `updatedAt`.
    - `Report` uses `uploadedTime` and `updatedTime`.
- **Entity vs Schema**: Mixed use of `.entity.ts` and `.schema.ts` file extensions.

## 3. Architectural Issues
- **Redundant Wrapper Services**: `AdminService` is a thin wrapper that adds no value over `UserService`.
    - [admin.service.ts](file:///c:/Project/Metalixia/backend/src/admin/admin.service.ts)
- **Hardcoded Default Values**: Default page sizes and enum values are scattered across services instead of being centralized in a config or constants file.

## 4. Security & Reliability
> [!WARNING]
> These issues could lead to data corruption or security vulnerabilities.

- **Race Conditions in ID Generation**: The `pre('save')` hook for `employeeId` in [RegisterUser.entity.ts](file:///c:/Project/Metalixia/backend/src/user/entities/RegisterUser.entity.ts#L54) is not atomic.
    - If two users register simultaneously, they may receive the same `employeeId`.
- **Redundant Password Hashing**: Hashing logic is implemented in both `AuthService` and `AdminService`.
    - [auth.service.ts:L27](file:///c:/Project/Metalixia/backend/src/auth/auth.service.ts#L27)
    - [admin.service.ts:L23](file:///c:/Project/Metalixia/backend/src/admin/admin.service.ts#L23)
- **Synchronous Filesystem Calls**: Use of `fs.unlinkSync` and `fs.existsSync` blocks the Node.js event loop.
    - [attendance.service.ts:L108](file:///c:/Project/Metalixia/backend/src/attendance/attendance.service.ts#L108)

## Recommended Improvements
1. **Abstract Pagination**: Create a base service or utility for paginated queries.
2. **Standardize Mongoose Refs**: Use Mongoose `ObjectId` and `ref` to allow automatic `populate()` instead of manual in-memory joins.
3. **Unified File Service**: Create a dedicated service for file uploads and deletions to centralize error handling and use async `fs` methods.
4. **Centralize ID Generation**: Use a dedicated collection or transaction for auto-incrementing IDs to ensure uniqueness.
