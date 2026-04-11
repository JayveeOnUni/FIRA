# Project Overview

## Title
FIRA: Web-Based Recruitment Platform for Fil International Recruitment Agency with Applicant Tracking and SBERT-Based Candidate-Job Matching

## Vision
Build a single platform that supports:
1. Public recruitment visibility
2. End-to-end recruitment operations
3. AI-assisted candidate-job matching

## Primary Users
- Applicant
- Employer
- Agency Staff

## System Layers
1. **Public Website Layer**
   - Informational pages and job search
2. **Recruitment Management Layer**
   - Applicant, employer, agency operations and ATS lifecycle
3. **Intelligent Matching Layer**
   - Text preprocessing, embeddings, similarity scoring, and ranking

## Phase 1 Deliverables
- requirement analysis and scope boundaries
- module decomposition
- high-level user workflows
- architecture and integration planning
- initial database entity planning
- clean repository and service scaffolds
- setup instructions and development roadmap

## Out-of-Scope in Phase 1
- full authentication and permission implementation
- complete CRUD and ATS business workflows
- real SBERT pipeline integration
- production deployment and optimization
- complete automated testing suite

## Assumptions
- One primary organization initially (Fil International Recruitment Agency), with structure compatible for future multi-tenant evolution.
- Role model begins with Applicant, Employer, and Agency Staff; finer-grained permissions can be introduced later.
- AI service starts as an external service endpoint to keep backend/API integration decoupled.
