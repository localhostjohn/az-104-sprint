# AZ-104 Sprint

A focused study application for the Microsoft Azure Administrator (AZ-104) exam. I built this as a practical way to reinforce Azure administration concepts while developing my infrastructure and cloud engineering skills.

## Overview

The application combines short teaching sessions, mock exams and score tracking to support structured revision. It is an independent learning aid, not an official Microsoft product or an exam-dump collection.

## Features

- 80 original questions covering the objectives in the April 2026 AZ-104 skills outline.
- 10-question teaching sprints with instant explanations.
- Weighted 50-question mock exams with a 100-minute target.
- Score history, average, personal best and 800+ readiness tracking.

## Run locally

A current Node.js/npm installation is required. From the repository root:

```bash
npm install
npm run dev
```

Follow the local URL shown by the development server. Review the project configuration before changing deployment settings or installing additional packages.

## GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys a static Pages edition after a push to `main`. The static edition stores score history in the current browser. A separate private deployment uses a database for durable history; that deployment is not included in this repository.

The public application does not require access to a live Azure tenant. Do not enter organisational credentials, tenant secrets or confidential infrastructure details into study examples.

## Infrastructure learning context

My wider learning focuses on Azure administration, identity, networking, compute, storage, monitoring and security. This application supports that learning, but quiz results are not a substitute for practical experience. I use separate lab environments to practise configuration, troubleshooting and documenting technical decisions.

Future improvements may include more scenario-based questions, clearer explanations of incorrect answers, and links from relevant questions to hands-on exercises. These are planned enhancements rather than completed features.

## Status and attribution

This is an independent study project. Questions are original and aligned to the [official Microsoft AZ-104 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104). Microsoft may update exam objectives, so always check the current official study guide when preparing for the exam.

Maintained by John Weekes as part of my infrastructure and cloud learning portfolio. No employer systems or internal documentation are included.
