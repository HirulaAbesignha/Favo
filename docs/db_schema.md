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