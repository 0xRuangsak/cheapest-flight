# Cheapest Flight Finder

Cheapest Flight Finder is a full-stack application that helps users discover the world's cheapest flights by searching creative multi-stop routes. It features a Go backend for flight data processing and a Next.js frontend for a modern, responsive user interface.

## Features

- Multi-stop route analysis (up to 3 stops) to uncover hidden deals
- Real-time flight pricing (Amadeus API integration)
- Modern UI built with Next.js and Tailwind CSS
- Dockerized for easy deployment

## Project Structure

```
.
├── apps/
│   ├── backend/   # Go backend API
│   └── frontend/  # Next.js frontend
├── docker-compose.yml
├── Dockerfile
├── iata-icao.csv
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- [Go](https://golang.org/) (for backend)
- [Node.js](https://nodejs.org/) (for frontend)
- [Docker](https://www.docker.com/) (optional, for containerized setup)

### Running Locally

#### Backend

```sh
cd apps/backend
go run main.go
```

#### Frontend

```sh
cd apps/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the frontend.

### Using Docker

You can run both backend and frontend with Docker Compose:

```sh
docker-compose up --build
```

## Deployment

The frontend can be easily deployed on [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).  
See [apps/frontend/README.md](apps/frontend/README.md) for more details.

## License

This project is licensed under the MIT License. See