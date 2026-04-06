# Database Schema

This schema now follows the ERD structure used in the project proposal.

## Users
### `users`
- `id` PK
- `name`
- `email` unique
- `password_hash`
- `role` (`customer` | `admin`)
- `created_at`

## Showcase
### `collections`
- `id` PK
- `name`
- `description` nullable

### `designs`
- `id` PK
- `collection_id` FK -> `collections.id`
- `title`
- `description` nullable
- `created_at`

### `design_images`
- `id` PK
- `design_id` FK -> `designs.id`
- `image_url`
- `sort_order`

## Store
### `categories`
- `id` PK
- `name`

### `products`
- `id` PK
- `category_id` FK -> `categories.id`
- `name`
- `description`
- `price`
- `is_active`
- `created_at`

### `product_images`
- `id` PK
- `product_id` FK -> `products.id`
- `image_url`
- `sort_order`

### `product_variants`
- `id` PK
- `product_id` FK -> `products.id`
- `size`
- `stock_qty`
- `sku` nullable

## Cart
### `carts`
- `id` PK
- `user_id` FK -> `users.id`
- `created_at`

### `cart_items`
- `id` PK
- `cart_id` FK -> `carts.id`
- `product_id` FK -> `products.id`
- `variant_id` FK -> `product_variants.id` nullable
- `qty`

## Orders
### `orders`
- `id` PK
- `user_id` FK -> `users.id`
- `delivery_method` (`DELIVERY` | `PICKUP`)
- `status` (`PENDING_PAYMENT` | `PAID` | `CONFIRMED` | `READY` | `DELIVERED` | `PICKED_UP` | `CANCELLED`)
- `total_amount`
- `created_at`

### `order_items`
- `id` PK
- `order_id` FK -> `orders.id`
- `product_id` FK -> `products.id`
- `variant_id` FK -> `product_variants.id` nullable
- `qty`
- `unit_price`

## Delivery and Pickup
### `pickup_locations`
- `id` PK
- `name`
- `address`
- `phone`

### `order_pickup`
- `id` PK
- `order_id` FK -> `orders.id` unique
- `pickup_location_id` FK -> `pickup_locations.id`

### `addresses`
- `id` PK
- `order_id` FK -> `orders.id` unique
- `address_line1`
- `address_line2` nullable
- `city`
- `postal_code`
- `phone`

## Payments
### `payments`
- `id` PK
- `order_id` FK -> `orders.id`
- `user_id` FK -> `users.id`
- `method` (`SIMULATED_CARD` | `COD`)
- `status` (`PAID` | `FAILED` | `PENDING`)
- `transaction_id` nullable
- `created_at`
