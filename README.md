📋 Project Overview
A comprehensive full-stack MERN application for managing employee leave requests and reimbursements with role-based access control. The system provides separate dashboards for Employees, Managers, and Administrators with features like leave application, approval workflows, reimbursement claims, and detailed analytics.

🚀 Live Demo
[Add your deployed application link here]

✨ Features
🔐 Authentication & Authorization
JWT-based authentication

Role-based access control (Admin, Manager, Employee)

Secure password hashing with bcrypt

Session management with token expiry

👥 User Roles
Employee
View personal dashboard with leave summary

Apply for leave (Annual, Sick, Casual, Unpaid)

Track leave balance in real-time

Submit reimbursement claims with proof documents

View leave and reimbursement history

Cancel pending requests

Manager
Team dashboard with analytics

View and manage team leave requests

Approve/reject leave applications

Review team reimbursement claims

View team member details and statistics

Track pending requests

Admin
Complete system overview

User management (CRUD operations)

View all leave and reimbursement requests

Process payments for approved reimbursements

Generate comprehensive reports

System configuration and settings

Export data to CSV

📊 Key Features
Leave Management
Multiple leave types (Annual, Sick, Casual, Unpaid)

Automatic leave balance calculation

Leave approval workflow

Leave history tracking

Calendar view of leaves

Reimbursement Management
Submit expense claims with proof documents

Multiple categories (Travel, Food, Medical, etc.)

Currency support (USD, EUR, GBP, INR, AED)

File upload for receipts/invoices

Approval workflow (Pending → Approved → Paid)

Payment tracking with transaction IDs

Analytics & Reports
Interactive charts and graphs

Leave trends analysis

Reimbursement category breakdown

User activity monitoring

Financial summaries

Export reports to CSV/PDF

Dark Mode
System preference detection

Manual toggle

Persistent preference storage

Smooth transitions

🛠️ Tech Stack
Frontend
React 18 - UI library

Vite - Build tool and dev server

React Router 6 - Navigation and routing

Tailwind CSS - Styling and UI components

Context API - State management

Recharts - Data visualization

React Hot Toast - Notifications

React Icons - Icon library

Date-fns - Date manipulation

Axios - HTTP client

Backend
Node.js - Runtime environment

Express.js - Web framework

MongoDB - Database

Mongoose - ODM

JWT - Authentication

Bcryptjs - Password hashing

Express Validator - Input validation

Multer - File upload handling

Nodemailer - Email notifications (optional)

Development Tools
Nodemon - Auto-restart server

ESLint - Code linting

Prettier - Code formatting

Git - Version control
