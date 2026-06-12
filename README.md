# ERP App – Intelligent Enterprise Resource Planning Platform

## Overview

ERP App is a modern Enterprise Resource Planning platform designed to centralize and simplify business operations through an integrated digital environment.

The platform provides essential business management features including customer management, product management, quotations, orders, deliveries, invoicing, payments, receipts, and an AI-powered assistant that helps users interact more efficiently with the system.

This project was developed as part of the Git, GitHub, Artificial Intelligence, Refactoring, Quality Assurance, and Software Engineering module.

---

# Problem Statement

Many small and medium-sized businesses still rely on spreadsheets, manual records, and disconnected tools to manage their operations.

This creates several challenges:

* Data duplication
* Human errors
* Lack of traceability
* Time-consuming administrative tasks
* Poor visibility over business operations

---

# Proposed Solution

ERP App provides a centralized platform that digitizes core business processes and improves operational efficiency through automation and intelligent assistance.

The solution enables organizations to manage their resources, customers, financial transactions, and logistics from a single interface.

---

# Core Features

## Customer Management

* Create customers
* Update customer information
* View customer details
* Delete customers

## Product Management

* Create products
* Update products
* Manage product catalog
* Delete products

## Quotation Management

* Create quotations
* Track quotation status
* Manage customer proposals

## Order Management

* Create orders
* Manage order lifecycle
* Track order information

## Purchase Order Management

* Generate purchase orders
* Manage procurement workflow

## Delivery Management

* Create deliveries
* Track delivery operations
* Manage delivery notes

## Invoice Management

* Generate invoices
* Manage billing operations

## Payment Management

* Register payments
* Track financial transactions

## Receipt Management

* Generate receipts
* Maintain transaction history

## AI Assistant

* Intelligent chatbot integration
* Context-aware responses
* Enhanced user support
* Improved navigation and productivity

---

# Technology Stack

## Frontend

* React.js
* JavaScript
* CSS
* Axios

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Version Control

* Git
* GitHub

## Quality Assurance

* SonarQube

## Artificial Intelligence

* AI Chatbot Integration

---

# System Architecture

```text
Frontend (React)
        │
        ▼
REST API (Express.js)
        │
        ▼
Business Modules
        │
        ▼
MongoDB Database
        │
        ▼
AI Assistant Service
```

---

# Project Structure

```text
ERP_App
│
├── Backend
│   ├── config
│   └── modules
│       ├── client
│       ├── produit
│       ├── devis
│       ├── commande
│       ├── bonCommande
│       ├── livraison
│       ├── bonLivraison
│       ├── facture
│       ├── paiement
│       ├── recu
│       └── chatbot
│
├── Frontend
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   └── services
│
└── README.md
```

---

# Git Workflow

The project follows a structured Git workflow.

## Main Branches

* main
* develop

## Feature Branches

* feature/backend-core-services
* feature/frontend-business-interface
* feature/intelligent-assistant
* feature/code-quality-improvements

## Hotfix Branch

* hotfix/chatbot-request-validation

---

# Quality Improvements

The project includes code quality enhancements through SonarQube analysis.

Implemented improvements include:

* Code refactoring
* Reduction of code smells
* Improved maintainability
* Resolution of identified SonarQube issues

---

# Design Pattern

A Singleton Pattern was applied to the database connection layer to ensure a single and controlled connection instance throughout the application lifecycle.

Benefits:

* Better resource management
* Improved performance
* Centralized connection handling

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
```

## Backend Setup

```bash
cd Backend
npm install
npm start
```

## Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

---

# Team Members

## Workflow & AI Lead

Nabil ELBAYAD

Responsibilities:

* Git workflow management
* Pull Requests
* Release management
* AI integration
* Hotfix management

## Quality & Refactoring Lead

Ali

Responsibilities:

* SonarQube analysis
* Refactoring
* Design pattern implementation
* Quality assurance

## Backend & Business Features

Yahya

Responsibilities:

* Order management
* Purchase order management
* Business workflow implementation

## Frontend & Documentation

Ilyass

Responsibilities:

* Delivery management
* Invoice management
* Documentation
* Business proposal

---

# Release Information

Version: v1.0

Release Type: MVP

Status: Completed

---

# Future Improvements

* Dashboard analytics
* Inventory management
* Reporting system
* Advanced AI assistant
* Role-based access control
* Notification system
* Mobile application

---

# Academic Context

This project was developed as part of a Software Engineering academic project focused on:

* Git & GitHub Collaboration
* Software Quality
* Refactoring
* Artificial Intelligence Integration
* Professional Development Workflow
* Business-Oriented Software Design

---

# License

This project is developed for educational purposes.
