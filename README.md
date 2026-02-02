# 🚀 Fullstack Log Monitoring System

High-performance log monitoring dashboard capable of visualizing data from **ClickHouse** and **Elasticsearch** in real-time. Built with **Java (Quarkus)** and **React**.

![Java](https://img.shields.io/badge/Java-17%2B-orange)
![Quarkus](https://img.shields.io/badge/Quarkus-3.x-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![AntDesign](https://img.shields.io/badge/Ant%20Design-5.0-red)
![License](https://img.shields.io/badge/License-MIT-green)

## 🏗️ Architecture

This project follows a **Layered Architecture** with Clean Code principles:

* **Backend:** Quarkus (REST API, Record DTOs, Service Layer, Repository Pattern)
* **Frontend:** React + Vite + Ant Design (Component-based architecture)
* **Data Stores:** ClickHouse (Analytics), Elasticsearch (Full-text Search)
* **Ingestion:** Apache NiFi (Data Pipeline)

## 📂 Project Structure

```bash
.
├── QuarkusProject/      # Backend Service (Java/Quarkus)
│   ├── src/main/java/com/quarkusproject/
│   │   ├── api/         # REST Controllers
│   │   ├── service/     # Business Logic
│   │   ├── repository/  # Data Access (ClickHouse/Elastic)
│   │   └── dto/         # Data Transfer Objects (Records)
└── log-frontend/        # Frontend Application (React)
    ├── src/
    │   ├── components/  # Reusable UI Components
    │   ├── services/    # API Integration
