# Veeda Collective Canvas

A collaborative canvas application built with Deno, React, GraphQL, and Supabase.

## Overview

This project aims to provide a real-time collaborative space where users can create and interact with content blocks on a shared canvas. Inspired by Are.na, it combines channel-based organization with a flexible canvas interface for easier knowledge management and discovery. It features a modern tech stack focused on TypeScript, developer experience, and leveraging Supabase for backend services.

## Tech Stack

*   **Backend:**
    *   Runtime: Deno
    *   Web Framework: Hono
    *   API: GraphQL (graphql-yoga)
    *   Database & Auth: Supabase (PostgreSQL, GoTrue)
    *   Language: TypeScript
*   **Frontend:**
    *   Framework: React
    *   Build Tool: Vite
    *   Routing: TanStack Router
    *   Data Fetching/State: TanStack Query (React Query)
    *   Canvas Rendering: React Flow
    *   Auth/DB Client: Supabase Client JS
    *   Language: TypeScript
    *   Styling: CSS Modules

## Features (Current)

*   User Authentication (Signup/Login via Supabase Auth)
*   Canvas Management:
    *   List user's canvases
    *   Create new canvases
    *   View individual canvases
    *   Update canvas titles
*   Block Management:
    *   Create new blocks (currently 'text' type)
    *   Update block positions (drag & drop)
    *   Update block content (double-click to edit text blocks)
*   Connection Management:
    *   Create connections (edges) between blocks
    *   Delete connections

## Project Setup

### Prerequisites

*   [Deno](https://deno.land/) (v1.40 or later recommended)
*   [Node.js](https://nodejs.org/) and npm (for frontend dependencies)
*   [Supabase CLI](https://supabase.com/docs/guides/cli)
*   Access to a Supabase project (or run locally)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd veedaspace
    ```

2.  **Backend Setup:**
    *   Navigate to the `backend` directory: `cd backend`
    *   **Environment Variables:** Create a `.env` file based on `.env.example` (you'll need to create this file if it doesn't exist) and fill in your Supabase project URL and keys:
        ```dotenv
        SUPABASE_URL=your_supabase_project_url
        SUPABASE_ANON_KEY=your_supabase_anon_key
        SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
        ```
    *   **Supabase Local Development (Recommended):**
        *   Ensure Supabase CLI is installed and Docker is running.
        *   Link your project: `supabase link --project-ref <your-project-ref>` (replace with your actual Supabase project reference)
        *   Start Supabase services: `supabase start`
        *   Apply database migrations: `supabase db push` (or `supabase migration up` if you manage migrations manually)
        *   The local Supabase URL and keys will be outputted by `supabase start`. Update your `.env` file accordingly.
    *   Install Deno dependencies (usually done automatically on first run): `deno cache src/main.ts` (optional pre-caching)

3.  **Frontend Setup:**
    *   Navigate to the `web` directory: `cd ../web`
    *   Install Node.js dependencies: `npm install`
    *   **Environment Variables:** Create a `.env.local` file and add your Supabase URL and Anon key (ensure the variables are prefixed with `VITE_`):
        ```dotenv
        VITE_SUPABASE_URL=your_supabase_project_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        ```
        *(Use the same values as in the backend `.env` file)*

### Running the Application

1.  **Start the Backend Server:**
    *   From the `backend` directory:
    *   Use the Deno task defined in `deno.jsonc`:
        ```bash
        deno task dev
        ```
    *   This usually runs the server with watch mode and allows reading environment variables.

2.  **Start the Frontend Development Server:**
    *   From the `web` directory:
    *   ```bash
        npm run dev
        ```

3.  **Access the Application:**
    *   Open your browser and navigate to the URL provided by the Vite development server (usually `http://localhost:5173`).

### Running with Docker Compose (Alternative)

If you have Docker and Docker Compose installed, you can run both the backend and frontend services using a single command from the project's root directory:

1.  **Prerequisites:**
    *   Docker Desktop or Docker Engine & Docker Compose installed.
    *   Ensure the `.env` file exists in the `backend` directory as described in the **Backend Setup** section (Docker Compose will use this).

2.  **Start the Services:**
    *   From the project root directory (`veedaspace`):
    ```bash
    docker compose up --build -d
    ```
    *   `--build`: Builds the web image if it doesn't exist or if the `web/Dockerfile` or related files have changed.
    *   `-d`: Runs the containers in detached mode (background).

3.  **Access the Application:**
    *   Open your browser and navigate to `http://localhost:5173`.

4.  **Stopping the Services:**
    *   From the project root directory:
    ```bash
    docker compose down
    ```

## Scripts

*   `backend/`:
    *   `deno task dev`: Runs the backend server with file watching and environment variable loading.
    *   `deno task start`: Runs the backend server (production mode).
*   `web/`:
    *   `npm run dev`: Starts the frontend development server.
    *   `npm run build`: Builds the frontend for production.
    *   `npm run lint`: Lints the frontend code. 