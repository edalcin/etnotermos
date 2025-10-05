# Phase 1: Quickstart Guide

This guide provides instructions for setting up and running the EtnoTermos application locally using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Running the Application

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd etnotermos
    ```

2.  **Create a `.env` file:**

    Create a `.env` file in the root of the project and add the following environment variables:

    ```
    MONGO_URI=mongodb://mongodb:27017/etnotermos
    GOOGLE_CLIENT_ID=<your-google-client-id>
    GOOGLE_CLIENT_SECRET=<your-google-client-secret>
    ```

3.  **Run with Docker Compose:**

    ```bash
    docker-compose up -d
    ```

    This will start the following services:

    -   `etnotermos-app`: The main application (e.g., a Node.js server).
    -   `mongodb`: The MongoDB database.
    -   `meilisearch`: The Meilisearch instance.

4.  **Access the application:**

    The application will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

Once the application is running, the API documentation (powered by Swagger UI) will be available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).