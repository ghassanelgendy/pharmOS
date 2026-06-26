# pharmOS - Product Requirements Document (PRD)

This document details the functional and non-functional requirements for **pharmOS** (formerly PharmaCare), a web-based Pharmacy Management System.

---

## 1. User Authentication & Onboarding
This module handles secure access and internal staff provisioning for the pharmacy.

### Deep Functionality
The system uses a straightforward gateway to get staff into the system while ensuring they are assigned the correct permissions based on their job title. It handles basic input validation to keep bad data out.

### Functional Requirements
* **Login Inputs**: The main login screen requires a valid user email and password.
* **Inline Validation**: Features inline error validation, alerting users with messages like `"Please enter valid email"` if the formatting is wrong.
* **Session Persistence**: Users can check a `"Remember me"` box to stay logged in across browser sessions.
* **Navigation Links**: The login portal includes direct navigation links for `"Sign Up"`, `"Forgot Password"`, and `"Need Help?"`.
* **Registration Details**: When signing up, new staff members must input their:
  * Name
  * Contact Number
  * NIC (National Identity Card)
  * Email
  * Password
* **Operational Roles**: During account creation, users are required to select their specific operational role:
  * `Pharmacist` (Administrator)
  * `Assistant Pharmacist`
  * `Cashier`

---

## 2. Main Dashboard & System Overview
This is the central landing page staff see immediately after logging in.

### Deep Functionality
It acts as the command center. It aggregates high-level statistics, tracks sales visually, and surfaces urgent inventory alerts so staff know exactly what needs attention first.

### Functional Requirements
* **Toast Notifications**: The system displays a transient `"Logged in Successfully"` toast notification with a close button upon entry.
* **Doctor Interactions Metrics**: A top-level metrics row breaks down doctor interactions, showing counts for:
  * Total Doctor Users
  * Doctor Orders Available
  * Verified Doctor Orders
  * Picked Up Doctor Orders
* **Sales Visualization**: A central "Sales Information Chart" provides a stacked bar graph visualizing monthly sales totals, color-coded by specific drug names.
* **Inventory Alerts**: Dedicated notification panels surface critical inventory issues, specifically listing the `Name` and `Batch ID` for items falling under:
  * Expire Date Notification
  * Out of Stock Notification
  * About To Get Finished Notification
* **Quick Navigation Actions**: These notification panels include quick-action buttons, like `"View Expire Date Notifications"`, allowing users to click through directly to the relevant management screens.

---

## 3. Point of Sale (PoS) & Billing Engine
This is the core transactional module where cashiers process customer orders.

### Deep Functionality
The system handles a visual product catalog, dynamic cart management, and real-time financial calculations, tying directly into the sales database upon checkout.

### Functional Requirements
* **Visual Catalog & Search**: Users can search for drugs via a text input and view results as visual cards displaying:
  * Drug image
  * Drug name
  * Unit price
* **Cart Management**: Users can input a specific quantity on a drug card and click `"Add to Bill."` The system must generate a unique ID for each line item in the cart.
* **Real-Time Calculations**: The checkout panel dynamically calculates the `Total` based on the sum of `(Price * Quantity)` for all items in the bill.
* **Payment Processing**: Users can input a `Paid Amount`. The system automatically calculates the `Balance` (change) to return to the customer.
* **Checkout Completion Actions**: Clicking `"Check Out"` triggers three sequential actions:
  1. Deduct the purchased quantities from the central inventory.
  2. Log the transaction data to the backend for the Sales Report.
  3. Display a success notification (`"Transaction Added to Sales Report !!"`) and allow the user to print the final receipt.

---

## 4. Automated Inventory & Restock Management
This feature tracks the lifecycle of the pharmacy's stock, automatically flagging problematic inventory and streamlining the reordering process.

### Deep Functionality
The system monitors batch expiry dates and stock levels, categorizing them into actionable lists. It includes a built-in email trigger to request new stock from specific suppliers.

### Functional Requirements
* **Lifecycle Categorization**: The system automatically sorts inventory into specific views based on database triggers:
  * **Out of Stock**: Quantity equals `0`.
  * **About To Get Out of Stock**: Quantity falls below a predefined minimum threshold.
  * **Expired Drugs**: The current date has passed the batch's `Expire Date`.
  * **About To Expire Drugs**: The `Expire Date` falls within a specific upcoming window (e.g., next 30 days).
* **Restock Request Trigger**: Every flagged item has a `"Request"` button.
* **Restock Modal**: Clicking `"Request"` opens a modal pre-populated with:
  * Drug Name
  * Previous unit price
  * Linked Supplier's Email
  * Remaining Quantity
* **Direct Ordering**: Users can input the required quantity into the modal and click `"Send Email"` to automatically dispatch an email restock request to the supplier's email address.

---

## 5. Supplier Directory
A CRM-style module to manage the vendors who supply the pharmacy.

### Deep Functionality
Maintains a searchable database of suppliers, linking them to specific drugs to enable the automated restock feature mentioned above.

### Functional Requirements
* **Supplier Creation**: Administrators can add new suppliers by inputting:
  * Supplier ID
  * Name
  * Email
  * Contact Number
  * Comma-separated list of `"Drugs Available"` from that vendor
* **Supplier Listing & Search**: The system displays all suppliers in a tabular format. Users can search and filter the list by supplier name in real time.
* **Record Management**: Users can edit existing supplier details or delete a supplier record entirely.

---

## 6. Role-Based Account Management
A centralized hub for adding and managing users, split between internal staff and external doctors.

### Deep Functionality
Handles user provisioning with strict role differentiation, ensuring users only see the modules relevant to their jobs.

### Functional Requirements
* **Internal Staff Provisioning**: Administrators can create new accounts for pharmacy staff.
  * Requires: User Name, Contact Number, NIC, Email, and Password.
  * Assigns specific role permissions: `Pharmacist`, `Assistant Pharmacist`, or `Cashier`.
* **Doctor Account Provisioning**: External doctor accounts can be provisioned to manage prescriptions/orders.
  * Requires: Standard contact fields and a mandatory **Doctor SLMC register number**.
  * Supports: Profile picture uploads for doctor verification.

---

## 7. Doctor Orders Management
A tracking system for prescriptions or bulk orders placed directly by registered doctors.

### Deep Functionality
Manages the fulfillment workflow of doctor orders from placement to pickup.

### Functional Requirements
* **Order Workflows**: Orders are categorized and grouped by status:
  * `New Orders`
  * `Verified Orders`
  * `Picked Up Orders`
* **Order Details display**: The UI must display:
  * Submitting doctor's details (Name, Contact Number, DoctorID, Email)
  * Order payload (requested Drug Names, Drug Prices, Quantities, and calculated Total cost)
  * Scheduled `Pickup Date` for the handoff.
* **Status Updates**: Staff can interact with orders using:
  * `"View Order"` and `"Order Verify"` buttons to move orders through the fulfillment pipeline.
  * `"Picked Up"` button to mark a verified order as fulfilled, automatically logging the pickup date and moving the record to the historical tab.

---

## 8. Analytics & Sales Reporting
A visual dashboard for tracking business performance.

### Deep Functionality
Aggregates transactional data from the PoS system and visualizes it using MongoDB as the underlying data source.

### Functional Requirements
* **Revenue Tracking**: Renders a bar chart displaying total sales revenue (in EGP/Rs) grouped by month.
* **Product Performance**: Renders a horizontal bar chart displaying the `"Number of drugs sold (Ratio)"` for the 100 most recent transactions, allowing the pharmacy to easily identify fast-moving items.
