# Hospital Information Management System (IMS) - Deep Dive Documentation

This document provides a detailed technical and functional overview of the Hospital IMS. It is designed to be accessible to everyone while providing the depth needed for developers or stakeholders to understand the system's inner workings.

---

## 1. Project Overview & Core Goals
The **Hospital IMS** is a full-stack web application built to digitize hospital workflows. 
**Core Goals:**
*   **Centralization:** All data (patients, staff, inventory) exists in one database.
*   **Efficiency:** Automate attendance tracking and inventory stock level monitoring.
*   **Secure Communication:** Provide a safe internal messaging system for staff.
*   **Accessibility:** Role-based dashboards ensure users only see what they need.

---

## 2. Technical Architecture
The system follows a modern **Client-Server Architecture**:

### 🌐 Frontend (Client-Side)
*   **Framework:** Built with **React** and **Vite** for a fast, responsive user experience.
*   **Language:** **TypeScript** is used for "Type Safety," ensuring that data follows strict rules and reducing bugs.
*   **State Management:** React Hooks (`useState`, `useEffect`) manage data flow within the browser.
*   **Visuals:** 
    *   **Lucide React** for modern, clean iconography.
    *   **Recharts** for visualizing hospital performance metrics (e.g., patient admission trends).
    *   **CSS/Tailwind** for a premium, responsive layout.

### 🧠 Backend (Server-Side)
*   **Runtime:** **Node.js** handles the heavy lifting.
*   **API Framework:** **Express.js** manages routes (endpoints) that the frontend talks to.
*   **Database:** **MongoDB** (via **Mongoose**) stores data in a flexible "document" format.
*   **Security:**
    *   **JWT (JSON Web Tokens):** Securely logs users in and keeps them authenticated.
    *   **Bcrypt.js:** Hashes (scrambles) passwords so they are never stored in plain text.
    *   **CORS:** Controls which websites can talk to the backend.

---

## 3. Data Modules (The Digital Filing Cabinet)
Here is exactly what the system tracks:

| Module | What it stores | Key Fields |
| :--- | :--- | :--- |
| **Patients** | Health records & status | Name, Age, Condition, Assigned Doctor, Appointment Date, Status (Admitted/Pending) |
| **Inventory** | Hospital supplies | Item Name, Category (Medicines/Equipment), Quantity, Status (Available/Low Stock) |
| **Attendance** | Staff work logs | User ID, Punch-In Time, Punch-Out Time, Total Hours Worked, Overtime |
| **Staff/Users** | Team member details | Name, Role (Admin/Doctor/Nurse), Department, Username, Daily Work Limits |
| **Messages** | Internal chat | Sender, Receiver, Message Content, Timestamp, Read Status |
| **Notes** | Professional records | Created by User, Content, Timestamp, Related Patient/Admin |

---

## 4. How the System Functions (By Role)

### 👑 Administrator (System Controller)
The Admin dashboard is the "Control Tower":
*   **User Management:** Can create new accounts (e.g., for a new Doctor) or reset passwords.
*   **Inventory Oversight:** Sees a list of all supplies and gets alerts when stock is low.
*   **Hospital Analytics:** Visual charts showing the number of patients and staff performance.
*   **Global Announcements:** Can send a "Broadcast" message that reaches all staff members.

### 🩺 Doctor (Clinical Professional)
*   **Patient Dashboard:** Quick view of all patients assigned to them.
*   **Medical Notes:** Can add detailed notes to a patient's file for future reference.
*   **Communication:** Can message the Admin or Nurses directly to coordinate care.

### 👩‍⚕️ Nurse (Patient Care)
*   **Status Updates:** Monitors patient status and checks for updates from Doctors.
*   **Attendance Tracking:** Punches in/out daily to ensure accurate payroll and work logs.
*   **Internal Messaging:** Stays in the loop with hospital-wide announcements.

### 📦 Staff (Logistics)
*   **Stock Management:** Updates quantities as medicines are received or used.
*   **Category Sorting:** Organizes items by category (e.g., "Surgical Tools," "Medications").

---

## 5. Security & Data Integrity
*   **Password Protection:** Even if someone got access to the database, they couldn't see user passwords because they are scrambled (hashed).
*   **Role Protection:** A Nurse cannot access the "Delete User" function, and a Doctor cannot change inventory levels (unless given permission).
*   **Input Validation:** The system checks that data is correct before saving (e.g., age cannot be negative).

---

## 6. Folder Structure (For Developers)
```text
Hospitle/
├── frontend_IMS/      # React Project (User Interface)
│   ├── src/
│   │   ├── components/ # Reusable UI pieces (Login, Sidebar)
│   │   ├── views/      # Main Dashboards (Admin, Doctor, etc.)
│   │   └── services/   # Communication logic with Backend
├── backend_IMS/       # Node.js Project (Server & Database)
│   ├── src/
│   │   ├── models/     # Database Schemas (Structure of data)
│   │   ├── routes/     # API Endpoints (/auth, /patients)
│   │   └── controllers/# Logic for each API request
└── PROJECT_OVERVIEW.md # This guide
```

---

## 7. Development Roadmap (How to get started)
1.  **Environment Setup:** Create a `.env` file in `backend_IMS` with your MongoDB URI and JWT Secret.
2.  **Install Tools:** Run `npm install` in both `frontend_IMS` and `backend_IMS`.
3.  **Start Backend:** Run `npm run server` (default port 5000).
4.  **Start Frontend:** Run `npm run dev` (default port 5173).

---

*Document Version: 1.1*
*Last Updated: May 2026*
