# API Contract (Initial)

Base URL:
- Local: `http://localhost:3000`
- API routes: `/api/...`

## General response format
Success:
```json
{ "ok": true, "data": {} }

Error:

{ "ok": false, "error": "MESSAGE_HERE" }
Auth (Member 4)
POST /api/auth/register

Body:

{ "name": "John", "email": "john@mail.com", "password": "123456" }

Returns:

{ "ok": true, "data": { "userId": 1 } }
POST /api/auth/login

Body:

{ "email": "john@mail.com", "password": "123456" }

Returns:

{ "ok": true, "data": { "token": "JWT_TOKEN", "role": "customer" } }
Showcase (Member 1)
GET /api/designs

Query (optional): ?collectionId=1
Returns:

{ "ok": true, "data": [{ "id": 1, "title": "New Drop", "images": ["..."] }] }
GET /api/designs/:id

Returns:

{ "ok": true, "data": { "id": 1, "title": "Design", "description": "", "images": [] } }
Store / Products (Member 2)
GET /api/products

Query (optional): ?q=&categoryId=&minPrice=&maxPrice=&size=
Returns:

{ "ok": true, "data": [{ "id": 1, "name": "Dress", "price": 9900, "stock": 5, "image": "..." }] }
GET /api/products/:id

Returns:

{ "ok": true, "data": { "id": 1, "name": "Dress", "price": 9900, "sizes": ["S","M"], "images": [] } }
Cart & Orders (Member 3)
POST /api/cart/add

Body:

{ "productId": 1, "qty": 2, "size": "M" }

Returns:

{ "ok": true, "data": { "cartCount": 3 } }
GET /api/cart

Returns:

{ "ok": true, "data": [{ "productId": 1, "name": "Dress", "qty": 2, "price": 9900 }] }
POST /api/orders

Body:

{
  "deliveryMethod": "DELIVERY",
  "items": [{ "productId": 1, "qty": 2, "size": "M" }]
}

Returns:

{ "ok": true, "data": { "orderId": 101, "status": "PENDING_PAYMENT" } }
GET /api/orders/me

Returns:

{ "ok": true, "data": [{ "orderId": 101, "status": "PAID" }] }
Payment + Delivery (Member 4)
POST /api/payment/simulate

Body:

{ "orderId": 101, "cardNumber": "4242424242424242", "expiry": "12/28", "cvv": "123" }

Returns:

{ "ok": true, "data": { "paymentStatus": "PAID", "transactionId": "TXN_ABC123" } }
POST /api/orders/:id/delivery

Body:

{ "addressLine1": "No 12", "city": "Colombo", "postalCode": "00100", "phone": "0771234567" }

Returns:

{ "ok": true, "data": { "deliveryMethod": "DELIVERY" } }
POST /api/orders/:id/pickup

Body:

{ "pickupLocationId": 1 }

Returns:

{ "ok": true, "data": { "deliveryMethod": "PICKUP" } }

---

## 5) `docs/db-schema.md` (copy-paste)
Create **`docs/db-schema.md`**:

```md
# Database Schema (Initial - MySQL)

## Users & Roles
### `users`
- id (PK)
- name
- email (unique)
- password_hash
- role (`customer` | `admin`)
- created_at

## Showcase
### `collections`
- id (PK)
- name
- description
- created_at

### `designs`
- id (PK)
- collection_id (FK -> collections.id)
- title
- description
- created_at

### `design_images`
- id (PK)
- design_id (FK -> designs.id)
- image_url

## Store
### `categories`
- id (PK)
- name

### `products`
- id (PK)
- category_id (FK -> categories.id)
- name
- description
- price
- is_active
- created_at

### `product_images`
- id (PK)
- product_id (FK -> products.id)
- image_url

### `product_stock`
- id (PK)
- product_id (FK -> products.id)
- size (e.g., S/M/L)
- quantity

## Orders
### `orders`
- id (PK)
- user_id (FK -> users.id)
- delivery_method (`DELIVERY` | `PICKUP`)
- status (`PENDING_PAYMENT` | `PAID` | `CONFIRMED` | `READY` | `DELIVERED` | `PICKED_UP`)
- total_amount
- created_at

### `order_items`
- id (PK)
- order_id (FK -> orders.id)
- product_id (FK -> products.id)
- size
- qty
- unit_price

## Delivery & Pickup
### `addresses`
- id (PK)
- order_id (FK -> orders.id)
- address_line1
- address_line2
- city
- postal_code
- phone

### `pickup_locations`
- id (PK)
- name
- address
- phone

## Payments (Simulated)
### `payments`
- id (PK)
- order_id (FK -> orders.id)
- transaction_id
- method (`SIMULATED_CARD` | `COD`)
- status (`PAID` | `FAILED` | `PENDING`)
- created_at