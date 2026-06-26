# pharmOS - Pharmacy Management System

<p align="center">
  <img src="public/logo.png" alt="pharmOS Logo" width="180"/>
</p>

A modern, responsive pharmacy management system designed to streamline point of sale (POS) transactions, track inventory, process prescriptions, and manage supplier orders.

---

## 🚀 Getting Started

### 📋 Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [Docker](https://www.docker.com/) (Optional, for running MongoDB) or a local installation of [MongoDB](https://www.mongodb.com/)

### 🐳 Running MongoDB with Docker
The project includes a `docker-compose.yml` file to quickly spin up a MongoDB database instance without needing to install it locally.

To start the database:
```bash
docker-compose up -d
```
This runs MongoDB on the default port `27017` with a persistent volume `mongodb_data`.

### 🛠️ Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ghassanelgendy/pharmos.git
   cd pharmos
   ```
2. Install the project dependencies:
   ```bash
   npm install
   ```

### 🚨 Running the Project

#### 1. Start the Backend API Server
Make sure your MongoDB instance is running (via Docker or local service), then start the Express server:
```bash
npm run start:server
```
The server will run on `http://localhost:3000/`.

#### 2. Start the Frontend Development Server (Vite + React)
In a separate terminal window, run:
```bash
npm run dev
```
Navigate to `http://localhost:5173/` (or the port specified in your terminal output) to open the application in your browser.

---

## 📦 Building for Production

To compile the TypeScript code and bundle the frontend assets for production:
```bash
npm run build
```
The production-ready assets will be compiled into the `dist/` directory.
