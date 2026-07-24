# 📖 Availa Room — User Guide

**Conference Room Booking & Availability Management System**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Booking a Conference Room](#3-booking-a-conference-room)
4. [Managing Your Bookings](#4-managing-your-bookings)
5. [Room Display (TV/Kiosk Mode)](#5-room-display-tvkiosk-mode)
6. [Profile Settings](#6-profile-settings)
7. [Admin Panel](#7-admin-panel)
8. [Notifications](#8-notifications)
9. [Dark Mode / Light Mode](#9-dark-mode--light-mode)
10. [FAQ & Troubleshooting](#10-faq--troubleshooting)

---

## 1. Getting Started

### Accessing the Application

Open your web browser and navigate to the application using either the IP or the local domain:

```
http://conferencebooking.tp-link.com
```
*(Alternative IP: `http://10.30.80.159`)*

> **Note:** This is an internal application accessible only within the office network.
> 
> **Domain Setup (Local Use Only):** To use the `conferencebooking.tp-link.com` domain locally, you must first map it to the server's Virtual IP on your PC:
> 1. Open Notepad as **Administrator**.
> 2. Open the file: `C:\Windows\System32\drivers\etc\hosts`
> 3. Add the following line at the bottom (replace with your server's current IP):
>    `10.30.80.159 conferencebooking.tp-link.com`
> 4. Save the file and restart your browser.

### Creating an Account

1. On the login page, click **"Don't have an account? Sign up"**.
2. Fill in the required details:
   - **Full Name** — Your display name (e.g., "Mayank Shukla").
   - **Department** — Select your department from the dropdown. Available departments:
     - Technical, Pre-Sales, Admin, Accounts, HR, Marketing, E-Commerce, Product, Legal, Logistics.
   - **Email** — Your office email address.
   - **Password** — Minimum 6 characters.
3. Click **Sign Up**.
4. You will be automatically logged in and redirected to the Dashboard.

### Signing In

1. Enter your **Email** and **Password**.
2. Click **Sign In**.

---

## 2. Dashboard Overview

After logging in, you land on the **Dashboard** — the central hub of the application.

### What You'll See

| Section | Description |
|---|---|
| **Header Bar** | Shows the app name, navigation links, notification bell, theme toggle, and your profile avatar. |
| **"New Booking" Button** | Located in the top-right of the dashboard. Click to book a room. |
| **Weekly Calendar** | A visual weekly schedule for each conference room showing all confirmed bookings. |
| **Pending Approvals** *(Admin only)* | A table of booking requests awaiting admin approval. |

### Navigation Menu

The left sidebar (or top navigation) contains the following links:

| Link | Description |
|---|---|
| **Dashboard** | View room calendars and create bookings. |
| **My Bookings** | View, edit, or delete your own booking requests. |
| **Room Display** | Full-screen TV/kiosk display mode for conference room schedules. |
| **Admin Panel** | *(Admin users only)* Manage all bookings, rooms, users, analytics, and email settings. |

---

## 3. Booking a Conference Room

### Step-by-Step

1. Click the **"+ New Booking"** button (available on the Dashboard or My Bookings page).
2. A booking dialog will appear. Fill in all required fields (marked with a red asterisk *):

| Field | Description | Example |
|---|---|---|
| **Room** *(required)* | Select an available conference room from the dropdown. Room capacity is shown. | Liberty (Cap: 10) |
| **Meeting Title** *(required)* | A short title for your meeting (max 100 characters). | Sprint Planning |
| **Department** *(required)* | Auto-filled with your department. You can change it. | Technical |
| **Attendees** *(required)* | List the names of people attending. | John, Sarah, Mike |
| **Date** *(required)* | Select the meeting date. Cannot be in the past. | 2026-04-25 |
| **Start Time** *(required)* | Select the start time. | 10:00 AM |
| **End Time** *(required)* | Must be after the start time. | 11:00 AM |
| **Repeat Meeting** *(optional)* | Set a recurrence pattern for the booking. | Weekly |

3. Click **"Submit Request"**.

### Recurrence Options

When creating a new booking, you can optionally set it to repeat:

| Option | Description |
|---|---|
| Does not repeat | One-time booking (default). |
| Daily | Repeats every day at the same time. |
| Weekly | Repeats every week on the same day. |
| Every 2 weeks | Repeats biweekly. |
| Monthly | Repeats once a month on the same date. |

### Important Rules

- ❌ **No past bookings** — You cannot book a time slot that has already passed.
- ❌ **No double-booking** — If a room is already booked for your requested time slot, the system will block the submission with an error message.
- ⏳ **Approval required** — All new bookings are submitted with a **"Pending"** status and require administrator approval before they are confirmed.

---

## 4. Managing Your Bookings

Navigate to **My Bookings** from the sidebar to view all your booking requests.

### Booking Table

Each row shows:
- **Room** — The conference room name.
- **Title** — Your meeting title.
- **Date** — The scheduled date.
- **Time** — Start and end time.
- **Status** — Current status of your booking.

### Booking Status

| Status | Badge Color | Meaning |
|---|---|---|
| **Pending** | Yellow | Waiting for admin approval. |
| **Confirmed** | Green | Approved and scheduled. |
| **Rejected** | Red | Denied by an administrator. |

### Actions (⋮ Menu)

Click the three-dot menu icon (⋮) on any booking to see available actions:

| Action | Description |
|---|---|
| **Edit** | Modify the booking details (room, title, date, time, attendees). Opens the booking form pre-filled with current values. |
| **Delete** | Permanently remove the booking. You will be asked to confirm before deletion. |
| **Add to Calendar** | *(Only for confirmed bookings)* Downloads an `.ics` file that you can import into Outlook, Google Calendar, or Apple Calendar. |

---

## 5. Room Display (TV/Kiosk Mode)

The **Room Display** page is designed to be shown on a TV or tablet mounted outside each conference room.

### How to Access

Navigate to:
```
http://10.30.80.148/room-display
```

> **Tip:** No login is required to view this page! It is publicly accessible.

### Features

| Feature | Description |
|---|---|
| **Live Clock** | Shows the current time and date in real-time. |
| **Room Cards** | Each conference room is displayed as a card showing its current status. |
| **"IN USE" Badge** | A pulsing red badge appears when a room is currently occupied. |
| **"AVAILABLE" Badge** | A green badge appears when the room is free. |
| **Today's Schedule** | Lists all confirmed bookings for today with times, titles, and departments. |
| **Tomorrow Preview** | Shows up to 3 upcoming bookings for tomorrow. |
| **Auto-Refresh** | The display automatically refreshes booking data every 60 seconds. |

### Single Room View

- Click on any room card to enter **full-screen mode** for that specific room.
- This is ideal for mounting a display outside a specific room.
- Click **"← Back"** to return to the all-rooms overview.
- You can also link directly to a single room:  
  ```
  http://10.30.80.148/room-display?room=Liberty
  ```

---

## 6. Profile Settings

### Accessing Profile Settings

Click on your **avatar** or **profile name** in the navigation bar, then select **"Profile Settings"**.

### What You Can Change

| Field | Description |
|---|---|
| **Avatar** | Choose from 6 preset avatars or paste a custom avatar URL. |
| **Full Name** | Update your display name. |
| **Department** | Change your department affiliation. |

Click **"Save Changes"** to apply updates.

---

## 7. Admin Panel

> ⚠️ **Admin-only area.** Regular users cannot access this section.

### Accessing the Admin Panel

Click **"Admin Panel"** in the navigation sidebar. If you are not an admin, you will be redirected to the Dashboard.

### Admin Tabs

The Admin Panel is organized into 5 tabs:

---

### 📬 Tab 1: Bookings

This is your primary booking management view.

#### Pending Requests

A table of all bookings awaiting your approval. For each request, you can see:
- Requester name
- Room, Title, Department
- Date and Time

**Actions:**
| Button | Effect |
|---|---|
| ✅ **Approve** | Changes the booking status to "Confirmed". The requester and attendees will be notified. |
| ❌ **Reject** | Changes the booking status to "Rejected". |

#### All Bookings

A complete history of all bookings (confirmed and rejected). You can re-approve rejected bookings or reject confirmed ones.

---

### 📊 Tab 2: Analytics

A visual analytics dashboard showing booking trends and utilization data. Use this to understand:
- Which rooms are most popular.
- Peak booking hours.
- Department-wise usage.

---

### 🏢 Tab 3: Room Management

Manage your conference rooms:

| Action | Description |
|---|---|
| **Add Room** | Create a new conference room with a name, capacity, equipment list, and image. |
| **Edit Room** | Update room details. |
| **Delete Room** | Remove a room from the system. |

---

### 👥 Tab 4: Users

View and manage all registered users:

| Action | Description |
|---|---|
| View Users | See a list of all registered users with their name, email, department, and role. |
| Change Role | Promote a user to "Admin" or demote back to "User". |
| Delete User | Remove a user account from the system. |

---

### ⚙️ Tab 5: Email Settings

Configure SMTP settings for email notifications. When configured, the system will send email notifications for booking confirmations and rejections.

| Field | Description |
|---|---|
| **SMTP Host** | Your email provider's SMTP server (e.g., `smtp.gmail.com`). |
| **SMTP Port** | Usually `587` for TLS. |
| **Email Address** | The "from" email address. |
| **App Password** | An application-specific password (not your regular email password). |

**Actions:**
- **Save Settings** — Save the SMTP configuration.
- **Test Connection** — Send a test email to verify the configuration works.
- **Delete** (🗑️) — Remove the SMTP configuration and disable email notifications.

> **How to get a Gmail App Password:**  
> Log in to your Google Account → Security → 2-Step Verification → App Passwords → Generate a password for "Mail" and "Other (Custom name)".

---

## 8. Notifications

### In-App Notifications

Click the **🔔 Bell Icon** in the top navigation bar to view your notifications. Notifications are triggered for:
- Booking approvals
- Booking rejections
- System updates

### Email Notifications

If the administrator has configured SMTP settings (see Admin Panel → Email Settings), you will also receive email notifications when your booking is approved or rejected.

---

## 9. Dark Mode / Light Mode

Click the **🌙 Moon / ☀️ Sun icon** in the navigation bar to toggle between Dark Mode and Light Mode. Your preference is saved automatically.

---

## 10. FAQ & Troubleshooting

### Q: I can't access the dashboard.
**A:** Make sure you are connected to the office network. The application is only accessible at `http://10.30.80.148`.

### Q: My booking was rejected. Can I rebook?
**A:** Yes! Simply create a new booking with a different time slot or room. You can also contact the administrator to understand why it was rejected.

### Q: I forgot my password.
**A:** Please contact your system administrator to reset your password.

### Q: How do I know if my booking is confirmed?
**A:** Check the **My Bookings** page. The status column will show:
- 🟡 **Pending** — Still awaiting approval.
- 🟢 **Confirmed** — You're all set!
- 🔴 **Rejected** — The booking was denied.

### Q: Can I book a room for someone else?
**A:** Yes. Simply enter their names in the "Attendees" field. The booking will be associated with your account but visible to administrators.

### Q: How do I add a confirmed booking to my Outlook/Google Calendar?
**A:** On the **My Bookings** page, click the ⋮ menu next to a confirmed booking and select **"Add to Calendar"**. This downloads an `.ics` file you can open in any calendar application.

### Q: The Room Display shows "IN USE" but the room is empty.
**A:** The display reflects the scheduled booking time. If the meeting ended early, the room may still show as "IN USE" until the scheduled end time passes.

---

## Quick Reference Card

| Task | How To |
|---|---|
| Access the app | `http://10.30.80.148` |
| Book a room | Dashboard → **+ New Booking** |
| View my bookings | Sidebar → **My Bookings** |
| Approve a booking (Admin) | Admin Panel → **Bookings** → ✅ Approve |
| Show room on TV | `http://10.30.80.148/room-display` |
| Toggle dark/light mode | Click 🌙/☀️ icon in the header |
| Edit profile | Click avatar → **Profile Settings** |

---

*Availa Room — Conference Room Booking Management System*  
*For support, contact your system administrator.*
