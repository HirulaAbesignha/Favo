# Favo Test Case Documentation

This testing document outlines the detailed quality assurance protocol for the Favo e-commerce platform. It defines structured Unit and Integration test cases mapped directly to each system module.

Our focus revolves around verifying backend logic, ensuring CRUD operational integrity, validating edge-cases, and guaranteeing authorization scopes.

---

## 1. Authentication & User Management Module

| Test ID | Scenario Description | Pre-conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Successful Registration | User does not exist | Submit valid email and matching 6+ char passwords to `/api/auth/register` | 201 Created. Account is saved securely, password hashed. |
| **AUTH-02** | Registration: Weak Password | N/A | Submit password with 5 characters | 400 Bad Request. Fails boundary validation constraint. |
| **AUTH-03** | Registration: Duplicate Email | User exists in DB | Submit registration payload with an already registered email address | 400 Bad Request. System throws email uniqueness constraint error. |
| **AUTH-04** | Valid Login Authorization | Account active | Submit correct credentials | 200 OK. Stateless JWT issued and saved via cookies/headers. |
| **AUTH-05** | Admin Resource Protection | Standard User logged in | Perform a GET request to `/api/admin/dashboard` using standard token | 401 Unauthorized. Access categorically denied for non-admin accounts. |

---

## 2. Customer Address Management

| Test ID | Scenario Description | Pre-conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **ADDR-01** | Creation: Valid Structure | User authenticated | Send address payload with a 10-digit phone number strictly containing numbers | 201 Created. Address binds to user's secure token identity. |
| **ADDR-02** | Creation: Telephone Violation | User authenticated | Send payload where phone number is 9 digits, or contains letters/spaces | 400 Bad Request. Request immediately rejected based on format rules. |
| **ADDR-03** | Update: Default Toggling | User has Address A (default). Create Address B | Flag Address B with `is_default = true` natively | 200 OK. System atomically untoggles Address A's default status in the backend. |
| **ADDR-04** | Delete: Identity Isolation | User A tries to delete Address B | Fire DELETE ping with an ID mapped structurally to another user | 400 Bad Request / 401. Silently ignored or rejected safely. |

---

## 3. Product & Categories Matrix

| Test ID | Scenario Description | Pre-conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **PROD-01** | Create Product with Complete Scope | Admin token active | Send name, price, description, 2 images, and sizes | 201 Created. Returns mapped Product ID. Database creates corresponding distinct inventory vectors automatically. |
| **PROD-02** | Product Image Bound Requirement | Admin token active | Attempt to save product supplying merely 1 image file | 400 Bad Request. Triggers editorial logic failure minimum parameters. |
| **CAT-01** | Delete Root Category | Category contains chained active sub-products | Attempt DELETE API action on primary category grouping | 400 System Restriction. Foreign key constraints block deletions resolving to live product orphans. |

---

## 4. Inventory Logistics

| Test ID | Scenario Description | Pre-conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **INV-01** | Stock Modification by Variations | Product X exists with Size "M" and "L" | Update Size "M" to 15 stock units | 200 OK. Size M shows 15. Size L remains independently untouched. |
| **INV-02** | Inventory Duplication Preventative | Product X exists with Size "M" | Attempt to forcefully map a secondary "Size M" node to Product X | DB triggers Duplicate Sequence violation. 400 Bad Request returned smartly to Admin UI. |
| **INV-03** | Negative Value Restriction | Admin manipulates UI stock value | Manually pass `-5` via the quantity adjuster | Action stripped or DB returns constraint breach. Must evaluate strictly >= 0. |

---

## 5. Orders, Fulfillment & Cart 

| Test ID | Scenario Description | Pre-conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **CR-01** | Global Size-based Order Deduction | Cart contains Size "M". Product holds generic combinations | Proceed with mock payment. API fires `order_items` inserts | Stock globally deducted ONLY for Size 'M' mapped row constraint. Other variants remain cleanly secured. |
| **CR-02** | Zero-Stock Interception Check | Add item to cart. Manually set stock to zero on backend | Process final simulated validation | 400 Reject: System intercepts the atomic loop mid-query checking real-time units, throws insufficient stock warning. |
| **CR-03** | Empty Shopping Request Payload | Checkout initiated | Submit an order loop without array configurations (`items: []`) | 400 Bad Request. System avoids creating dummy orders on blank payload sweeps. |
| **CR-04** | Fulfillment Discrepancy Checks | Choose 'DELIVERY' | Intentionally withhold `delivery_address_id` parameter | 400 Requirement Exception. Reject sequence natively. |

---

## 6. Simulated Virtual Ledger Gateway

| Test ID | Scenario Description | Pre-conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **GATE-01** | Formatted 16 Digit Parsing Success | User selects Cart Value Total | Send `1111222233334444` numerical block | Transactions succeeds natively. `PAID` payload logged securely. |
| **GATE-02** | Invalid Character Parsing Blocking | Mock string input | Input `1111xxxx3333zzzz` via the frontend DOM capture | Frontend UI forces stripped validation natively before transmission. Fails Gateway rulesets otherwise. |
