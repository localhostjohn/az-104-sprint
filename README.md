# AZ-104 Sprint

A focused study application for the Microsoft Azure Administrator (AZ-104) exam. I built this as a practical way to reinforce Azure administration concepts while developing my infrastructure and cloud engineering skills.

## Overview

The application combines short teaching sessions, mock exams and score tracking to support structured revision. It is an independent learning aid, not an official Microsoft product or an exam-dump collection.

## Features

- 109 original questions, including 20 new scenario questions, across the April 2026 AZ-104 skills outline.
- 10-question teaching sprints with instant explanations, shuffled answer choices and least-seen question selection.
- Weighted 50-question mock exams with a 100-minute target, favouring questions seen least often on this device.
- Score history, average, personal best and a practice trend based on recent mocks.
- A Study next screen that combines due reviews, objective-level gaps, targeted drills, and a personal-lab task.
- Practice results are shown as percentages, not estimates of Microsoft's scaled exam score.
- Links from the weakest domain to the corresponding Microsoft Learn path.

## How to use it for exam preparation

Finish a QA course topic, take a focused sprint, then practise the configuration in a personal Azure lab. Review missed questions on schedule. Use the 50-question mocks to find weak domains, and validate your progress with unfamiliar questions and Microsoft's Practice Assessment before booking. Repeated questions in this small bank can inflate accuracy; no score in this app guarantees an exam result.

Question exposure counts are kept in this browser and increment only when a question is opened. Clearing site storage or switching devices resets this rotation. Mock results explain every answer, including correct choices.

Objective-level tracking begins with attempts completed after this update; older attempts do not contain that breakdown. Objectives need at least three answered attempts before they are ranked, and repeated questions do not prove mastery. The public edition saves this in browser history; the private database-backed edition stores it in a separate objective-score table.

Existing attempt records retain their stored 0–1000 accuracy value for compatibility, but the interface displays the equivalent percentage. For example, a stored value of 800 means 80% correct in this app, not a Microsoft exam score of 800.

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

Future improvements may include more original scenarios and topic-specific hands-on exercises. These are planned enhancements rather than completed features.

## Status and attribution

This is an independent study project. Questions are original and aligned to the [official Microsoft AZ-104 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104). Microsoft may update exam objectives, so always check the current official study guide when preparing for the exam.

Maintained by John Weekes as part of my infrastructure and cloud learning portfolio. No employer systems or internal documentation are included.
