# Veeda (Collective Canvas) - MVP Product Requirements Document

## Document Information
**Document Title:** Veeda MVP Product Requirements Document  
**Version:** 1.0  
**Date:** Current Date  
**Status:** Draft  

## Table of Contents
1. [Introduction](#introduction)
2. [Product Overview](#product-overview)
3. [Goals and Success Metrics](#goals-and-success-metrics)
4. [Target Audience](#target-audience)
5. [Core Principles](#core-principles)
6. [Functional Requirements](#functional-requirements)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Design Considerations](#design-considerations)
9. [Out of Scope for MVP](#out-of-scope)
10. [Timeline and Milestones](#timeline-and-milestones)
11. [Risks and Mitigations](#risks-and-mitigations)

<a name="introduction"></a>
## 1. Introduction

This document outlines the requirements for the Minimum Viable Product (MVP) of Veeda, formerly known as Collective Canvas. Veeda aims to be a mindful digital space for organizing thoughts, brainstorming, and knowledge building with an emphasis on intentionality, context, and simplicity.

The MVP will focus on establishing the core user experience of creating, organizing, and connecting information blocks within a personal canvas. This document serves as the primary reference for the product team during the development phase.

<a name="product-overview"></a>
## 2. Product Overview

Veeda is a digital platform designed for creative individuals, professionals, philosophers, and anyone interested in organizing their thoughts for brainstorming and knowledge building. It provides a distinctive digital space for mindful curation, personal reflection, and idea organization.

The MVP will deliver the fundamental canvas-based experience where users can create and arrange blocks of information, draw meaningful connections between them, and add contextual notes and reflections—all within a clean, intentional interface that prioritizes content over features.

<a name="goals-and-success-metrics"></a>
## 3. Goals and Success Metrics

### Primary Goals:
- Deliver a functional core experience for creating and organizing information blocks
- Implement a visual connection system between blocks
- Establish the block immutability principle (non-deletion)
- Create a clean, intuitive user interface
- Build a foundation for future feature expansion

### Success Metrics:
- User registration and retention
- Number of canvases created per user
- Number of blocks created per canvas
- Time spent organizing and connecting blocks
- User feedback on core experience (satisfaction with block creation, connection features)

<a name="target-audience"></a>
## 4. Target Audience (MVP Focus)

The MVP will primarily target:
- Individual users seeking a personal tool to visually organize ideas
- Creative professionals (designers, writers, etc.) looking for a digital thinking space
- Researchers and academics needing to organize research materials and notes
- Knowledge workers wanting to build connections between information snippets
- Lifelong learners seeking to organize study materials and insights

<a name="core-principles"></a>
## 5. Core Principles (MVP Focus)

### Intentionality
- Encourage deliberate content creation through the non-deletion model
- Promote thoughtful arrangement and connection of ideas

### Meaning and Context
- Enable users to build context by visually connecting related blocks
- Allow for the addition of reflections and notes to provide meaning to content

### Simplicity and Clarity
- Provide a clean, distraction-free interface
- Focus on content organization rather than complex features
- Ensure intuitive interactions for core functionality

<a name="functional-requirements"></a>
## 6. Functional Requirements

### 6.1 User Account Management
| ID | Requirement | Priority |
|----|-------------|----------|
| UAM-1 | Users can sign up for a new account | High |
| UAM-2 | Users can log in to their account | High |
| UAM-3 | Users can log out of their account | High |
| UAM-4 | Users can reset their password | Medium |

### 6.2 Canvas Management
| ID | Requirement | Priority |
|----|-------------|----------|
| CM-1 | Users can create a new canvas | High |
| CM-2 | Users can view a list of their existing canvases | High |
| CM-3 | Users can open a canvas to view and interact with its contents | High |
| CM-4 | Users can title their canvas | High |
| CM-5 | Users can see when a canvas was last modified | Medium |

### 6.3 Block Management
| ID | Requirement | Priority |
|----|-------------|----------|
| BM-1 | Users can create new blocks within a canvas | High |
| BM-2 | Users can add text content to a block | High |
| BM-3 | Users can add an image to a block (upload or link) | High |
| BM-4 | Users can add a URL link to a block | High |
| BM-5 | Users can arrange blocks freely on the flexible grid canvas | High |
| BM-6 | Users can edit the content of blocks they own | High |
| BM-7 | Users **cannot** delete a block once created (after grace period) | High |
| BM-8 | Users see clear visual cues indicating blocks cannot be deleted | High |
| BM-9 | Users have a short "Undo" window (<5 minutes) after creating a block | Medium |
| BM-10 | Users can resize blocks | Medium |

### 6.4 Notes/Reflections
| ID | Requirement | Priority |
|----|-------------|----------|
| NR-1 | Users can add a textual note or reflection to a specific block | High |
| NR-2 | Users can view the notes associated with a block | High |
| NR-3 | Users can edit the notes associated with a block | High |
| NR-4 | Users can toggle visibility of notes for cleaner canvas viewing | Medium |

### 6.5 Connections
| ID | Requirement | Priority |
|----|-------------|----------|
| CON-1 | Users can draw a visual connection between two blocks | High |
| CON-2 | Users can view existing connections between blocks | High |
| CON-3 | Users can remove a visual connection between blocks | High |
| CON-4 | Users can select different line styles for connections (straight, curved) | Low |

### 6.6 Sharing/Viewing (Basic)
| ID | Requirement | Priority |
|----|-------------|----------|
| SV-1 | Users can set a canvas to be either private (default) or public | High |
| SV-2 | Users can generate a shareable link for public canvases | High |
| SV-3 | Anyone with a link can view a public canvas (read-only) | High |
| SV-4 | Viewers can see visual indications that a canvas is view-only | Medium |

<a name="non-functional-requirements"></a>
## 7. Non-Functional Requirements

### 7.1 Usability
- The interface must be intuitive, clean, and minimalist
- Content should be prioritized over UI elements
- First-time users should be able to create a canvas with blocks without a tutorial
- Interface elements should have clear affordances (what can be clicked/dragged)

### 7.2 Reliability
- The system must reliably save user data (canvases, blocks, connections, notes)
- Block immutability (no deletion) must be strictly enforced
- Auto-save functionality should prevent data loss
- Users should receive clear confirmation when changes are saved

### 7.3 Performance
- Basic interactions should feel responsive (< 200ms)
- Canvas loading should be reasonably fast for up to 100 blocks
- Block creation and editing should have minimal latency
- Image uploads should show clear progress indicators

### 7.4 Compatibility
- The MVP should function on modern desktop browsers (Chrome, Firefox, Safari, Edge)
- The interface should be responsive for different screen sizes (min. 1024px width)

<a name="design-considerations"></a>
## 8. Design Considerations

### 8.1 Grid System
- Implement a flexible grid system for block arrangement
- Allow free-form placement while maintaining alignment options
- Grid should be visible but unobtrusive

### 8.2 Visual Language
- Develop a clean, minimalist visual language that emphasizes content
- Ensure adequate contrast for readability
- Use visual affordances to indicate interactive elements

### 8.3 Block Design
- Create a consistent visual design for different block types
- Clearly differentiate block types (text, image, link)
- Visually indicate the non-deletable nature of blocks

### 8.4 Connection Visualization
- Design clear visual representations for connections between blocks
- Ensure connections remain visible even when blocks are moved
- Provide intuitive interaction for creating/removing connections

<a name="out-of-scope"></a>
## 9. Out of Scope for MVP

The following features are explicitly out of scope for the MVP:

- Advanced block types (documents, video embeds beyond links)
- Block archiving functionality
- Real-time collaboration features (simultaneous editing)
- Advanced sharing permissions (specific user invites, editing rights)
- Tagging, filtering, or advanced search capabilities
- AI-powered features (suggestions, related explorations)
- "Idea Trails" or snippet expansion features
- Mobile applications (iOS, Android)
- Browser extensions
- API for third-party integrations
- Version history for blocks
- Admin-specific features (soft delete, moderation)
- Detailed free/paid tier structure
- Complex onboarding tutorials

<a name="timeline-and-milestones"></a>
## 10. Timeline and Milestones

A high-level timeline with key milestones will be determined after initial team planning and will be added as an appendix to this document.

<a name="risks-and-mitigations"></a>
## 11. Risks and Mitigations

| Risk | Potential Impact | Mitigation Strategy |
|------|------------------|---------------------|
| User resistance to block non-deletion | User frustration, reduced adoption | Clear explanation during onboarding, implementation of grace period, emphasis on benefits |
| Performance issues with large canvases | Poor user experience, frustration | Implement pagination or virtualization for large canvases, optimize rendering |
| User confusion with the canvas paradigm | Reduced engagement, higher churn | Intuitive design, subtle guidance elements, focused onboarding |
| Security concerns with shared canvases | Privacy breaches, loss of trust | Clear sharing controls, visual indicators for public content | 