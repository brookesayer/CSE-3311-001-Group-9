Full-Stack Travel App
This is a complete full-stack web application featuring a React frontend, a Python/Flask backend API, and a PostgreSQL database. The entire system is containerized using Docker and managed with Docker Compose for easy setup and deployment.

🚀 Tech Stack
Frontend: React (with Vite for building)

Web Server: Nginx (serves the frontend and acts as a reverse proxy)

Backend: Python with Flask

Database: PostgreSQL

Containerization: Docker & Docker Compose

📋 Prerequisites
Before you begin, you need to have the following software installed on your machine:

Docker Desktop: This is the most important requirement as it provides both Docker and Docker Compose. You can download it from the official Docker website.

Git: For cloning the repository.

⚙️ First-Time Setup and Installation
Follow these steps to get the application running for the first time.

1. Clone the Repository
Open your terminal or command prompt and clone the project to your local machine.

git clone <your-repository-url>
cd <your-repository-folder>

2. Create Environment Configuration Files
This is the most critical step. The application uses .env files to manage secret credentials, which are intentionally not checked into Git. You need to create two of them.

A. Create the Database Environment File

Create a new file in the root of the project named exactly .env.db and paste the following content into it:

# PostgreSQL Database Credentials for the container
POSTGRES_DB=mydatabase
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mysecretpassword

B. Create the Backend Environment File

Create a second file in the root of the project named exactly .env and paste the following content into it. This tells the Python application how to find the database inside the Docker network.

# Backend Database Connection URL
DATABASE_URL=postgresql://myuser:mysecretpassword@db:5432/mydatabase

3. Build and Run with Docker Compose
With Docker Desktop running, you can now build and start all the services with a single command.

Build the images: This command reads the Dockerfiles and creates the container images for your frontend and backend.

docker compose build

Start the services: This command starts the database, backend, and frontend containers in the correct order. The -d flag runs them in the background (detached mode).

docker compose up -d

That's it! The entire application stack is now running.

🌐 Accessing the Application
Frontend (Main Application):
Open your web browser and go to: http://localhost:8080

Backend API (for testing):
You can test the API directly at: http://localhost:5000/api/places

Database:
You can connect to the PostgreSQL database using a tool like pgAdmin or DBeaver with the following credentials:

Host: localhost

Port: 5432

Database: mydatabase

Username: myuser

Password: mysecretpassword

Commands
Here are the most common commands for managing the application.

Start all services in the background:

docker compose up -d

Stop all services:

docker compose down

View logs from all services:

docker compose logs

View logs from a specific service (e.g., backend):

docker compose logs backend

Force a rebuild of all images:

docker compose build --no-cache
