# Backend API Documentation

This documentation provides an overview of the API endpoints available in the backend application, including their request payloads and responses.

## Authentication (`/auth`)

### Register User

**POST** `/auth/register`

- **Description**: Registers a new user.
- **Access**: Public
- **Payload**: `RegisterUserDto`
  ```json
  {
    "name": "string",
    "mobileNo": "string",
    "post": "string",
    "email": "string (email format)",
    "password": "string (min 6 chars)",
    "role": "string (optional, default: 'user')"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "status": "success"
  }
  ```

### Login User

**POST** `/auth/login`

- **Description**: Logs in a user. Sets `access_token` and `refresh_token` cookies.
- **Access**: Public
- **Payload**: `LoginUserDto`
  ```json
  {
    "identifier": "string",
    "password": "string (min 6 chars)"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User logged in successfully",
    "status": "success"
  }
  ```

### Logout User

**POST** `/auth/logout`

- **Description**: Logs out the current user and clears cookies.
- **Access**: Authenticated
- **Payload**: None
- **Response**:
  ```json
  {
    "message": "Logged out successfully",
    "status": "success"
  }
  ```

### Refresh Token

**POST** `/auth/refresh`

- **Description**: Refreshes the access token using the refresh token cookie.
- **Access**: Public (Requires `refresh_token` cookie)
- **Payload**: None
- **Response**:
  ```json
  {
    "message": "Token refreshed successfully",
    "status": "success"
  }
  ```

### Get Profile

**GET** `/auth/profile`

- **Description**: Retrieves the profile of the currently authenticated user.
- **Access**: Authenticated
- **Payload**: None
- **Response**:
  ```json
  {
    "user": { ... },
    "message": "Profile fetched successfully",
    "status": "success"
  }
  ```

---

## Admin (`/admin`)

### Get Employees

**POST** `/admin/get-employees`

- **Description**: Retrieves a list of employees based on filters.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN)
- **Payload**: `GetEmployeesDto`
  ```json
  {
    "page": "number (optional)",
    "limit": "number (optional)",
    "post": ["string"] (optional),
    "role": ["string"] (optional)
  }
  ```
- **Response**: JSON data representing the list of employees.

### Add Employee

**POST** `/admin/add-employee`

- **Description**: Adds a new employee.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN)
- **Payload**: `AddEmployeeDto`
  ```json
  {
    "name": "string",
    "mobileNo": "string",
    "post": "string",
    "email": "string (email format)",
    "password": "string (min 6 chars)",
    "role": "string"
  }
  ```
- **Response**: JSON data of the added employee.

### Update Employee

**POST** `/admin/update-employee`

- **Description**: Updates an existing employee's details.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN)
- **Payload**: `UpdateEmployeeDto`
  ```json
  {
    "id": "string",
    "post": "string (optional)",
    "role": "string (optional)",
    "employeeId": "string"
  }
  ```
- **Response**: JSON data of the updated employee.

### Delete Employee

**DELETE** `/admin/delete-employee/:id`

- **Description**: Deletes an employee by ID.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN)
- **Params**:
  - `id`: string
- **Response**: JSON data confirming deletion.

---

## Employee (`/employee`)

### Upload Report

**POST** `/employee/report-upload`

- **Description**: Uploads report files (.pdf or .csv).
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN, MANAGER, QUALITY)
- **Payload**: `FormData`
  - `files`: File[] (Max 10)
  - `reportName`: string
  - `employeeId`: string
- **Response**: JSON data confirming upload.

### Get Reports

**GET** `/employee/get-reports`

- **Description**: Retrieves a paginated list of reports.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN, MANAGER, QUALITY)
- **Query Params**:
  - `page`: number (default 1)
  - `limit`: number (default 10)
- **Response**: JSON data containing reports.

### Delete Report

**POST** `/employee/delete-report`

- **Description**: Deletes a specific report.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN, MANAGER, QUALITY)
- **Payload**: `ReportDeleteDto`
  ```json
  {
    "reportId": "string"
  }
  ```
- **Response**: JSON data confirming deletion.

### Scheduled Deleted Report

**GET** `/employee/scheduled-deleted-report`

- **Description**: (Internal/Admin) Trigger for scheduled report deletion logic?
- **Access**: Authenticated (Role: SUPER_ADMIN)
- **Response**: JSON data.

### Download Report

**GET** `/employee/download-report/:reportId`

- **Description**: Downloads a specific report file.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN, MANAGER, QUALITY)
- **Params**:
  - `reportId`: string
- **Response**: File stream/download.

### Abort Report

**GET** `/employee/abort-report/:reportId`

- **Description**: Aborts a report process.
- **Access**: Authenticated (Role: SUPER_ADMIN)
- **Params**:
  - `reportId`: string
- **Response**: JSON data.

### Get Reports By Employee ID

**GET** `/employee/get-reports-by-employee-id/:employeeId`

- **Description**: Retrieves reports for a specific employee.
- **Access**: Authenticated (Roles: SUPER_ADMIN, REPORT_ADMIN, TEMP_ADMIN, MANAGER, QUALITY)
- **Params**:
  - `employeeId`: string
- **Query Params**:
  - `page`: number (default 1)
  - `limit`: number (default 10)
- **Response**: JSON data.

---

## App (`/`)

### Get Hello

**GET** `/`

- **Description**: Health check or basic greeting.
- **Response**: `string`
