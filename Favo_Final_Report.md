# Title Page
[Format as per guidelines in Word]
**IT2150: IT Project**
**2nd Year, Semester 2, 2026**
**Assignment 05 Final Report**

**FAVO PLATFORM**
**An Integrated E-Commerce and Operations Application**

**Team Members**
[Add Registration Numbers and Names]
Group Number: [Group Number]
Campus: [Campus]
Date of Submission: [Date]

<div style="page-break-after: always"></div>

# Declaration
We, the undersigned, hereby declare that the work presented in this report is our own original work. This report has not been submitted for any other academic qualification at this or any other institution. All sources of information have been duly acknowledged. 

We further declare that the system described herein, the Favo Platform, was designed and developed by the team listed below as part of the IT2150 IT Project module.

Group Number: [Your Group Number]
Module: IT2150 IT Project
Project Title: Favo Platform

| Registration Number | Full Name | Signature |
|---------------------|-----------|-----------|
| [ID 1]              | [Name 1]  |           |
| [ID 2]              | [Name 2]  |           |
| [ID 3]              | [Name 3]  |           |
| [ID 4]              | [Name 4]  |           |
| [ID 5]              | [Name 5]  |           |
| [ID 6]              | [Name 6]  |           |

<div style="page-break-after: always"></div>

# Abstract
The modern retail and e-commerce landscape requires robust, multi-faceted systems to handle everything from user browsing to back-end inventory and delivery logistics. The Favo Platform was developed to address these operational needs through a unified, high-performance web and mobile application ecosystem. 

This report details the design and development of the Favo Platform, built primarily using Next.js, React Native, and MySQL. The platform is segmented into six core modules: Order & Cart, Product & Inventory, Showcase CMS, Delivery Management, Pickup Management, and User/Payment/Security. These modules work in tandem to provide a seamless experience for customers shopping online, administrators managing inventory and site content, and logistics personnel handling deliveries and pickups.

By centralizing these services, Favo eliminates the friction of disjointed retail systems. The report covers the requirement analysis, architectural design, database modeling, and evaluation of the implemented system, demonstrating its functionality, performance, and successful alignment with the project objectives.

**Keywords**: E-Commerce, Inventory Management, Next.js, Mobile Application, Delivery Tracking, Content Management System (CMS), MySQL.

<div style="page-break-after: always"></div>

# Acknowledgement
The successful completion of this project would not have been possible without the guidance, support, and collaboration of numerous individuals, and we take this opportunity to express our sincere gratitude. We extend our deepest appreciation to our module lecturers and instructors for their invaluable academic guidance, constructive feedback, and commitment to the learning outcomes of the IT2150 module.

We also acknowledge the institutional support provided by the Sri Lanka Institute of Information Technology (SLIIT). Finally, we wish to acknowledge the collective dedication of all team members whose collaborative effort, mutual accountability, and shared commitment to quality made this project a meaningful learning experience.

<div style="page-break-after: always"></div>

# Table of Contents
*(To be generated automatically using MS Word)*

# List of Tables
*(To be generated automatically using MS Word)*

# List of Figures
*(To be generated automatically using MS Word)*

# List of Abbreviations
- **API**: Application Programming Interface
- **CMS**: Content Management System
- **CRUD**: Create, Read, Update, Delete
- **ER**: Entity-Relationship
- **SLIIT**: Sri Lanka Institute of Information Technology
- **SWOT**: Strengths, Weaknesses, Opportunities, Threats
- **UI/UX**: User Interface / User Experience

<div style="page-break-after: always"></div>

# Chapter 1: Introduction

## 1.1 Problem and Motivation
Retail businesses often struggle with fragmented systems where inventory, online storefronts, delivery management, and customer relations operate in silos. This fragmentation leads to operational inefficiencies, delayed order fulfillment, and poor customer experiences. Administrators lack real-time visibility into stock levels, while customers face clunky interfaces and uncertain delivery timelines. The motivation behind the Favo Platform is to consolidate these disconnected retail processes into a single, cohesive ecosystem. By integrating the frontend shopping experience with robust backend inventory and delivery workflows, Favo aims to streamline operations and enhance user satisfaction.

## 1.2 Literature Review
The shift towards unified commerce platforms has been widely documented. Modern e-commerce architecture relies heavily on decoupled frontend and backend systems (Headless Commerce), allowing for greater flexibility across web and mobile platforms. Frameworks like Next.js have proven effective in delivering Server-Side Rendered (SSR) content that optimizes performance and SEO for digital storefronts. Furthermore, the integration of real-time delivery tracking and centralized CMS for showcase management directly addresses the digital friction identified in contemporary retail studies.

## 1.3 Aim and Objectives
### 1.3.1 Aim
The primary aim of this project is to design, develop, and evaluate the Favo Platform—a comprehensive e-commerce and retail management system that integrates product showcasing, inventory management, secure payments, and logistics (delivery/pickup) into a unified application suite for web and mobile users.

### 1.3.2 Objectives
1. Design a user-friendly frontend (Showcase CMS & Order/Cart) for customers to browse products and place orders.
2. Implement a secure User/Payment/Security module for authentication and transactions.
3. Develop a robust Product & Inventory module with real-time stock deduction and force-delete bypass mechanisms.
4. Create dedicated Delivery Management and Pickup Management modules for logistical tracking and status updates.
5. Provide a seamless cross-platform experience by extending the platform to a React Native mobile application.

## 1.4 Solution Overview
The Favo Platform provides a full-stack solution utilizing Next.js for the web interface and API routes, MySQL for relational data management, and React Native for mobile accessibility. The system empowers administrators to manage products dynamically via the CMS, processes real-time inventory deductions upon orders, and provides delivery personnel with tools to update fulfillment statuses seamlessly.

**Git Repository Link**: [https://github.com/HirulaAbesignha/Favo](https://github.com/HirulaAbesignha/Favo)

<div style="page-break-after: always"></div>

# Chapter 2: Requirement Analysis

## 2.1 Stakeholder Analysis
| Stakeholder | Role in System | Primary Interest | Influence on Requirements |
|-------------|----------------|------------------|---------------------------|
| **Customer** | End-User | Browsing products, placing orders, secure payments, tracking delivery | High - Drives UI/UX and core cart functionalities |
| **Administrator** | Manager | Managing inventory, updating CMS, overseeing sales | High - Drives Product & Inventory and CMS features |
| **Delivery Driver** | Logistics | Viewing assigned orders, updating delivery statuses | Medium - Drives Delivery Management module |
| **Developers** | Technical Team | System performance, scalability, codebase maintenance | High - Drives architectural decisions |

## 2.2 Feasibility and SWOT Analysis
### 2.2.1 Feasibility
- **Technical Feasibility**: High. The use of Next.js, React, and MySQL is well-documented and supported by vast community resources.
- **Operational Feasibility**: High. The system mirrors standard e-commerce workflows, requiring minimal training for end-users and admins.
- **Economic Feasibility**: High. Utilizing open-source frameworks and low-cost cloud hosting minimizes financial overhead.

### 2.2.2 SWOT Analysis
- **Strengths**: Unified system architecture; modern tech stack (Next.js) ensuring high performance; comprehensive coverage of the retail lifecycle.
- **Weaknesses**: Reliance on continuous internet connectivity; cold-start challenges for new merchants adapting to the system.
- **Opportunities**: Expansion to multiple mobile platforms (iOS/Android); potential integration with third-party logistics APIs.
- **Threats**: Rapid changes in web framework ecosystems; stringent data protection regulations requiring continuous security auditing.

## 2.3 Requirements Modelling
The functional requirements are divided across the six core modules:
1. **Order & Cart**: Users shall be able to add items to a cart, calculate totals, and checkout.
2. **Product & Inventory**: Admins shall be able to perform CRUD operations on products; system must auto-deduct stock upon purchase.
3. **Showcase CMS**: Admins shall configure the homepage layout, banners, and featured items.
4. **Delivery/Pickup Management**: Personnel shall update fulfillment statuses (e.g., Pending, Dispatched, Delivered).
5. **User/Payment/Security**: System shall support secure registration/login using JWT and bcrypt hashing.

<div style="page-break-after: always"></div>

# Chapter 3: Design and Development

## 3.1 System Architecture
The Favo Platform employs a client-server architecture. The frontend is built with React/Next.js, providing a responsive UI. The backend consists of Next.js API routes that interface with a MySQL database. A React Native mobile app acts as an additional client, consuming the same RESTful APIs.

*(Insert System Architecture Diagram Here)*
*Figure 3.1: High-Level System Architecture*

## 3.2 Process and Workflow Diagrams
### 3.2.1 Order Fulfillment Workflow
When a customer places an order, the system authenticates the user, verifies inventory availability, and processes the payment. Upon success, inventory is atomically deducted, and the order is routed to the Delivery Management queue.

*(Insert Workflow Diagram Here)*
*Figure 3.2: Order Fulfillment Process*

## 3.3 Database Design
The database is structured relationally using MySQL. Core tables include:
- `users`: Stores credentials, roles (admin/customer/driver), and profile data.
- `products`: Contains SKUs, pricing, descriptions, and stock levels.
- `orders`: Links users to products, storing total amounts, timestamps, and fulfillment status.
- `categories`: Hierarchical structuring for the Showcase CMS.

*(Insert ER Diagram Here)*
*Figure 3.3: Database Entity-Relationship Diagram*

## 3.4 Development Methodologies
Development followed an agile approach, assigning specific modules to team members. Key backend challenges, such as bypassing database constraint errors during product deletion (Force Delete), were resolved by implementing cascading logic in the API controllers.

<div style="page-break-after: always"></div>

# Chapter 4: Results and Evaluation

## 4.1 System Outcomes
The Favo Platform was successfully implemented, delivering a working prototype that covers the entire retail lifecycle. The Next.js frontend is responsive and performant, while the backend API reliably handles concurrent requests for inventory updates and order placements.

## 4.2 System Performance and Testing
- **Functional Testing**: All core use cases, including user authentication, cart management, and status updates via the Delivery Fulfillment dropdown, were tested and validated. 
- **Performance**: The Next.js SSR implementation resulted in fast initial page load times, crucial for e-commerce SEO. API routes handling inventory deduction execute within acceptable latency thresholds.
- **Bug Resolution**: Critical bugs, such as Next.js Image component errors receiving invalid source strings, were successfully debugged and patched.

## 4.3 User Feedback
Initial evaluations by peer testers indicated high usability. The administrative dashboard provided clear visibility into stock levels, and the "force delete" feature was highlighted as a practical solution to inventory management constraints.

<div style="page-break-after: always"></div>

# Chapter 5: Conclusion

## 5.1 Objective Achievement
All core objectives were met. The six distinct modules were successfully integrated into a cohesive platform. The seamless interaction between the frontend Showcase CMS and the backend Product & Inventory logic demonstrates a thorough understanding of full-stack development principles.

## 5.2 Overall Aim
The project successfully achieved its aim of building a unified e-commerce and retail operations application. Favo stands as a robust solution that mitigates digital fragmentation in retail, offering a unified portal for all stakeholders.

## 5.3 Summary of Key Achievements
- Developed a high-performance, SSR-enabled digital storefront using Next.js.
- Implemented secure JWT-based authentication and role-based access control.
- Designed a reliable MySQL database schema handling complex relationships between orders, inventory, and users.
- Delivered a cross-platform backend capable of serving both web and mobile clients.

<div style="page-break-after: always"></div>

# References
1. Vercel, "Next.js Documentation," [Online]. Available: https://nextjs.org/docs.
2. Oracle, "MySQL 8.0 Reference Manual," [Online]. Available: https://dev.mysql.com/doc/refman/8.0/en/.
3. Meta, "React Native," [Online]. Available: https://reactnative.dev/.
*(Ensure to format references using an academic style such as IEEE or APA using a reference management tool as per assignment guidelines).*

<div style="page-break-after: always"></div>

# Appendix A
### Team Contribution

| Team Member Name | Registration Number | Assigned Module | Contribution (%) | Work Evidence |
|------------------|---------------------|-----------------|------------------|---------------|
| [Name 1]         | [ID 1]              | Order & Cart    | [XX]%            | Git Commits, UI dev |
| [Name 2]         | [ID 2]              | Product & Inv   | [XX]%            | API endpoints |
| [Name 3]         | [ID 3]              | Showcase CMS    | [XX]%            | Database Design|
| [Name 4]         | [ID 4]              | Delivery Mgmt   | [XX]%            | Testing, Bug fixes|
| [Name 5]         | [ID 5]              | Pickup Mgmt     | [XX]%            | React Native app|
| [Name 6]         | [ID 6]              | User/Security   | [XX]%            | Auth flow     |

*All members agree on the contribution percentages listed above.*

<div style="page-break-after: always"></div>

# Appendix B
### Additional Supporting Material
- **Screenshots**: *(Insert screenshots of the Favo Web Homepage, Admin Dashboard, and Mobile App Login Screen here)*
- **Testing Logs**: *(Insert snippets of unit testing or API testing via Postman here if applicable)*
