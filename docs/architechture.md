# Architecture Overview — Event-Driven E-Commerce Order Management & Pricing Engine

> **Stack:** TypeScript · Express.js · MongoDB · EventBus (Observer Pattern)

---

## Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Module Dependency Graph](#2-module-dependency-graph)
3. [Request Pipeline](#3-request-pipeline)
4. [Event Flow — Order Creation](#4-event-flow--order-creation)
5. [Event Flow — Order Cancellation](#5-event-flow--order-cancellation)
6. [Order State Machine](#6-order-state-machine)
7. [Pricing Engine — Class Diagram](#7-pricing-engine--class-diagram)
8. [Order & Inventory — Class Diagram](#8-order--inventory--class-diagram)
9. [Entity-Relationship Diagram](#9-entity-relationship-diagram)
10. [Design Patterns Summary](#10-design-patterns-summary)
11. [API Endpoints Reference](#11-api-endpoints-reference)

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                  HTTP Requests (REST API / Postman)                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                       MIDDLEWARE PIPELINE                           │
│   CORS → JSON Parser → Rate Limiter → Idempotency → Joi Validation  │
└────┬──────────────┬───────────────┬──────────────┬──────────────────┘
     │              │               │              │
┌────▼───┐   ┌──────▼──┐   ┌───────▼──┐   ┌───────▼──────┐
│Inventory│   │ Pricing │   │  Orders  │   │   Payments   │
│ Routes  │   │  Routes │   │  Routes  │   │   Routes     │
└────┬────┘   └──────┬──┘   └───────┬──┘   └───────┬──────┘
     │               │              │               │
┌────▼────┐   ┌──────▼──┐   ┌───────▼──┐   ┌───────▼──────┐
│Inventory│   │ Pricing │   │  Order   │   │   Payment    │
│Controller│  │Controller│  │Controller│   │  Controller  │
└────┬────┘   └──────┬──┘   └───────┬──┘   └───────┬──────┘
     │               │              │               │
┌────▼────┐   ┌──────▼──┐   ┌───────▼──┐   ┌───────▼──────┐
│Inventory│   │ Pricing │   │  Order   │   │   Payment    │
│ Service │   │ Service │   │  Service │   │   Service    │
└────┬────┘   └──────┬──┘   └───┬───┬──┘   └───────┬──────┘
     │               │          │   │               │
     │         ┌─────┴──────┐   │   │        ┌──────▼──────┐
     │         │  Strategy  │   │   │        │   Adapter   │
     │         │ + Decorator│   │   │        │  (Stripe)   │
     │         └────────────┘   │   │        └─────────────┘
     │                          │   │
┌────▼────────────────┐  ┌──────▼───▼─────────────────────────┐
│ Inventory Repository│  │           EVENT BUS                  │
└────┬────────────────┘  │  ORDER_CREATED → InventoryHandler   │
     │                   │  ORDER_CANCELLED → InventoryHandler  │
     │                   │  INVENTORY_RESERVED → OrderHandler   │
     │                   └──────────────────────────────────────┘
┌────▼────────────────────────────────────────────────────────┐
│                        DATA LAYER (MongoDB)                  │
│       Inventory Collection · Orders Collection · Idempotency │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Module Dependency Graph

```mermaid
graph TB
    Client[Client / Postman] --> API[Express API Layer]

    subgraph Middleware["Middleware Pipeline"]
        API --> RL[Rate Limiter]
        RL --> ID[Idempotency Check]
        ID --> VH[Validation Handler]
    end

    subgraph Routes
        VH --> IR[Inventory Routes]
        VH --> PR[Pricing Routes]
        VH --> OR[Order Routes]
        VH --> PaR[Payment Routes]
    end

    subgraph Controllers
        IR --> IC[Inventory Controller]
        PR --> PC[Pricing Controller]
        OR --> OC[Order Controller]
        PaR --> PaC[Payment Controller]
    end

    subgraph Services
        IC --> IS[Inventory Service]
        PC --> PS[Pricing Service]
        OC --> OS[Order Service]
        PaC --> PaS[Payment Service]
    end

    subgraph EventBus["Event Bus (Observer)"]
        OS -->|emit ORDER_CREATED| EB[EventBus]
        OS -->|emit ORDER_CANCELLED| EB
        EB -->|ORDER_CREATED| IH[Inventory Handler]
        EB -->|ORDER_CANCELLED| IH
        EB -->|INVENTORY_RESERVED| OH[Order Handler]
        IH -->|emit INVENTORY_RESERVED| EB
        IH -->|emit INVENTORY_RELEASED| EB
        OH -->|emit ORDER_CONFIRMED| EB
    end

    subgraph DataLayer["Data Layer"]
        IS --> IRep[Inventory Repository]
        OS --> ORep[Order Repository]
        IRep --> IM[(Inventory Collection)]
        ORep --> OM[(Order Collection)]
        ORep --> IK[(Idempotency Collection)]
    end

    subgraph Patterns["Design Patterns"]
        PS --> STRAT[Strategy Pattern]
        PS --> DECOR[Decorator Pattern]
        PaS --> ADAPT[Adapter Pattern]
        OS --> FSM[State Machine]
    end

    STRAT --> Reg[RegularPricing]
    STRAT --> Seas[SeasonalPricing]
    STRAT --> Bulk[BulkPricing]
    STRAT --> Memb[MemberPricing]

    DECOR --> Pct[PercentageDiscount]
    DECOR --> Flat[FlatDiscount]
    DECOR --> Coup[CouponDiscount]
    DECOR --> Loy[LoyaltyDiscount]

    ADAPT --> Stripe[StripeAdapter]
```

---

## 3. Request Pipeline

```mermaid
flowchart LR
    subgraph Incoming["Incoming Request"]
        A[HTTP Request] --> B[CORS]
    end

    subgraph Global["Global Middleware"]
        B --> C[JSON Parser]
        C --> D[Rate Limiter\n100 req / 15 min]
    end

    subgraph Route["Route-Specific"]
        D --> E{Route Match?}
        E -->|No| F[404 Handler]
        E -->|Yes| G[Idempotency Check]
    end

    subgraph Module["Module Pipeline"]
        G --> H[Joi Validation]
        H --> I[Controller]
        I --> J[Service Layer]
        J --> K[Repository]
        K --> L[(MongoDB)]
    end

    subgraph Response
        L --> K2[Repository]
        K2 --> J2[Service]
        J2 --> I2[Controller]
        I2 --> M[Response Formatter\n{ success, data, error }]
        M --> N[HTTP Response]
    end

    subgraph Errors["Error Path"]
        J -.->|throws| O[Centralized\nError Handler]
        H -.->|validation fail| O
        O --> N
    end
```

---

## 4. Event Flow — Order Creation

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Gateway
    participant OS as OrderService
    participant PS as PricingService
    participant DB as MongoDB
    participant EB as EventBus
    participant IH as InventoryHandler
    participant IS as InventoryService
    participant OH as OrderHandler

    C->>API: POST /api/orders { items, strategy }
    API->>OS: createOrder()
    OS->>PS: calculateCartPrice(items, strategy)
    PS-->>OS: { subtotal, total, discountsApplied }
    OS->>DB: Save order (status: PENDING)
    DB-->>OS: Order document
    OS->>EB: emit(ORDER_CREATED, { orderId, items })
    OS-->>API: 201 Created { order }
    API-->>C: Response (async flow continues below)

    EB->>IH: handleOrderCreated(payload)
    loop For each item
        IH->>IS: reserveStock(sku, qty)
        IS->>DB: Atomic update with optimistic lock (version check)
        DB-->>IS: Updated inventory document
    end
    IH->>EB: emit(INVENTORY_RESERVED, { orderId })

    EB->>OH: handleInventoryReserved(payload)
    OH->>OS: confirmOrder(orderId)
    OS->>DB: Update status PENDING → CONFIRMED
    DB-->>OS: Updated order
    OH->>EB: emit(ORDER_CONFIRMED, { orderId })
```

---

## 5. Event Flow — Order Cancellation

Cancellation triggers a **compensating transaction** to restore reserved inventory.

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Gateway
    participant OS as OrderService
    participant DB as MongoDB
    participant EB as EventBus
    participant IH as InventoryHandler
    participant IS as InventoryService

    C->>API: POST /api/orders/:id/cancel
    API->>OS: cancelOrder(orderId)
    OS->>DB: Validate transition → CANCELLED (via State Machine)
    OS->>DB: Update status → CANCELLED
    OS->>EB: emit(ORDER_CANCELLED, { orderId, items })
    OS-->>API: 200 OK { order }
    API-->>C: Response (async compensation below)

    EB->>IH: handleOrderCancelled(payload)
    loop For each item
        IH->>IS: releaseStock(sku, qty)
        IS->>DB: Atomic update (restore reservedStock → stock)
        DB-->>IS: Updated inventory document
    end
    IH->>EB: emit(INVENTORY_RELEASED, { orderId })
```

---

## 6. Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Order created

    PENDING --> CONFIRMED : Stock reserved (auto via event)
    PENDING --> CANCELLED : Insufficient stock / User cancel

    CONFIRMED --> PAYMENT_PROCESSING : Initiate payment
    CONFIRMED --> CANCELLED : User cancel

    PAYMENT_PROCESSING --> PAID : Payment success
    PAYMENT_PROCESSING --> PAYMENT_FAILED : Payment error

    PAID --> SHIPPING : Prepare shipment
    PAID --> REFUNDED : Refund issued

    SHIPPING --> SHIPPED : Dispatched

    SHIPPED --> DELIVERED : Delivered to customer

    PAYMENT_FAILED --> PENDING : Retry payment
    PAYMENT_FAILED --> CANCELLED : Abandon

    CANCELLED --> [*]
    DELIVERED --> [*]
    REFUNDED --> [*]
```

**Valid Transitions Table:**

| From | To | Trigger |
|------|-----|---------|
| `PENDING` | `CONFIRMED` | `INVENTORY_RESERVED` event |
| `PENDING` | `CANCELLED` | Insufficient stock / user request |
| `CONFIRMED` | `PAYMENT_PROCESSING` | Initiate payment |
| `CONFIRMED` | `CANCELLED` | User cancel |
| `PAYMENT_PROCESSING` | `PAID` | Payment success |
| `PAYMENT_PROCESSING` | `PAYMENT_FAILED` | Payment error |
| `PAYMENT_FAILED` | `PENDING` | Retry |
| `PAYMENT_FAILED` | `CANCELLED` | Abandon |
| `PAID` | `SHIPPING` | Shipment prepared |
| `PAID` | `REFUNDED` | Refund issued |
| `SHIPPING` | `SHIPPED` | Dispatched |
| `SHIPPED` | `DELIVERED` | Received |

---

## 7. Pricing Engine — Class Diagram

```mermaid
classDiagram
    class PricingStrategy {
        <<abstract>>
        +calculatePrice(basePrice, context) PricingResult
    }

    class RegularPricing {
        +calculatePrice(basePrice, context) PricingResult
    }

    class SeasonalPricing {
        -SEASON_MULTIPLIERS Map
        +calculatePrice(basePrice, context) PricingResult
    }
    note for SeasonalPricing "summer: +15%\nholiday: +25%"

    class BulkPricing {
        -BULK_TIERS Array
        +calculatePrice(basePrice, context) PricingResult
    }
    note for BulkPricing "10+: -5%\n50+: -15%\n100+: -25%"

    class MemberPricing {
        -MEMBER_DISCOUNTS Map
        +calculatePrice(basePrice, context) PricingResult
    }
    note for MemberPricing "Silver: -5%\nGold: -10%\nPlatinum: -15%"

    class DiscountDecorator {
        <<abstract>>
        #wrappedPricing PricingStrategy
        +apply(priceResult, context) PricingResult
    }

    class PercentageDiscount {
        -percentage number
        +apply(priceResult, context) PricingResult
    }

    class FlatDiscount {
        -amount number
        +apply(priceResult, context) PricingResult
    }
    note for FlatDiscount "Floors at $0"

    class CouponDiscount {
        -VALID_COUPONS Map
        +apply(priceResult, context) PricingResult
    }

    class LoyaltyDiscount {
        -LOYALTY_DISCOUNTS Map
        +apply(priceResult, context) PricingResult
    }
    note for LoyaltyDiscount "bronze → diamond tiers"

    class PricingService {
        +calculateItemPrice(item, strategy, discounts, context) ItemResult
        +calculateCartPrice(items, strategy, discounts, context) CartResult
        +simulateStrategies(items, context) StrategyMap
        +getAvailableStrategies() StrategyInfo[]
    }

    PricingStrategy <|-- RegularPricing
    PricingStrategy <|-- SeasonalPricing
    PricingStrategy <|-- BulkPricing
    PricingStrategy <|-- MemberPricing

    DiscountDecorator <|-- PercentageDiscount
    DiscountDecorator <|-- FlatDiscount
    DiscountDecorator <|-- CouponDiscount
    DiscountDecorator <|-- LoyaltyDiscount

    PricingService --> PricingStrategy : selects at runtime
    PricingService --> DiscountDecorator : stacks decorators
```

---

## 8. Order & Inventory — Class Diagram

```mermaid
classDiagram
    class EventBus {
        -instance EventBus
        -registeredEvents Map
        +getInstance() EventBus
        +emit(event, payload) void
        +on(event, handler) void
        +getRegisteredEvents() string[]
    }

    class OrderService {
        +createOrder(items, strategy, discounts, context, idempotencyKey) Order
        +confirmOrder(orderId) Order
        +cancelOrder(orderId, reason) Order
        +getOrder(orderId) Order
        +listOrders() Order[]
        +transitionOrder(orderId, newStatus) Order
    }

    class OrderStateMachine {
        +isValidTransition(from, to) boolean
        +transition(current, next) string
        +getAvailableTransitions(status) string[]
        +getAllStatuses() string[]
    }

    class OrderRepository {
        +create(orderData) Order
        +findById(id) Order
        +findByIdAndUpdate(id, data) Order
        +findAll() Order[]
    }

    class InventoryService {
        +addProduct(data) Inventory
        +getProduct(sku) Inventory
        +listProducts() Inventory[]
        +reserveStock(sku, qty) Inventory
        +releaseStock(sku, qty) Inventory
        +updateProductStock(sku, stock) Inventory
    }

    class InventoryRepository {
        +addProduct(data) Inventory
        +findBySku(sku) Inventory
        +findAll() Inventory[]
        +updateStock(sku, stockChange, reservedChange, version) boolean
        +updateProduct(sku, data) Inventory
    }

    class InventoryHandler {
        +handleOrderCreated(payload) void
        +handleOrderCancelled(payload) void
        +registerHandlers() void
    }

    class OrderHandler {
        +handleInventoryReserved(payload) void
        +registerHandlers() void
    }

    class PaymentAdapter {
        <<abstract>>
        +processPayment(orderId, amount) PaymentResult
        +refundPayment(paymentId) RefundResult
        +getStatus(paymentId) StatusResult
    }

    class StripeAdapter {
        +processPayment(orderId, amount) PaymentResult
        +refundPayment(paymentId) RefundResult
        +getStatus(paymentId) StatusResult
    }

    EventBus <.. InventoryHandler : subscribes to
    EventBus <.. OrderHandler : subscribes to
    EventBus <.. OrderService : emits to

    OrderService --> OrderStateMachine : validates transitions
    OrderService --> OrderRepository : persists
    OrderService --> PricingService : calculates price

    InventoryHandler --> InventoryService : reserves / releases
    InventoryHandler --> EventBus : emits INVENTORY_RESERVED

    OrderHandler --> OrderService : confirms order
    OrderHandler --> EventBus : emits ORDER_CONFIRMED

    InventoryService --> InventoryRepository : persists

    PaymentAdapter <|-- StripeAdapter
```

---

## 9. Entity-Relationship Diagram

```mermaid
erDiagram
    INVENTORY {
        ObjectId _id PK
        string name
        string sku UK
        number basePrice
        string category
        number stock
        number reservedStock
        number version
        Date createdAt
        Date updatedAt
    }

    ORDER {
        ObjectId _id PK
        OrderItem[] items
        string status
        number totalPrice
        number subtotal
        object[] discountsApplied
        string pricingStrategy
        string paymentId
        string shippingId
        string idempotencyKey UK
        Date createdAt
        Date updatedAt
    }

    ORDER_ITEM {
        string sku
        string name
        number quantity
        number basePrice
        number finalPrice
    }

    IDEMPOTENCY_KEY {
        ObjectId _id PK
        string key UK
        object response
        number statusCode
        Date createdAt
    }

    INVENTORY ||--o{ ORDER_ITEM : "referenced by SKU"
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER }o--o| IDEMPOTENCY_KEY : "cached by"
```

**Key data notes:**

- `INVENTORY.version` enables **optimistic locking** — prevents race conditions during concurrent stock reservations.
- `IDEMPOTENCY_KEY` has a **24-hour TTL** — duplicate `POST /api/orders` requests with the same `Idempotency-Key` header return the cached response.
- `ORDER_ITEM.finalPrice` stores the price **at time of purchase**, insulating against future price changes.

---

## 10. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Observer** | `events/EventBus.ts` | Decoupled async communication — OrderService emits, Inventory/Order handlers react |
| **Strategy** | `pricing/strategies/` | Swap pricing algorithm at runtime without modifying consumers (OCP) |
| **Decorator** | `pricing/decorators/` | Stack discounts composably — e.g. `MemberPricing + CouponDiscount + LoyaltyDiscount` |
| **Adapter** | `payments/adapters/` | Abstract payment providers behind a uniform interface (DIP) |
| **State Machine** | `orders/orderStateMachine.ts` | Enforce valid order lifecycle transitions; invalid moves throw errors |
| **Repository** | `*Repository.ts` files | Isolate data access from business logic; swap DB without touching services |
| **Singleton** | `events/EventBus.ts` | One shared event bus instance across the entire application |
| **Middleware Chain** | `middleware/` | Cross-cutting concerns (rate limiting, idempotency, validation, error handling) |

---

## 11. API Endpoints Reference

### Inventory — `/api/inventory`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/inventory` | List all products |
| `GET` | `/api/inventory/:sku` | Get product by SKU |
| `POST` | `/api/inventory` | Add new product |
| `PATCH` | `/api/inventory/:sku/stock` | Update stock level |

### Pricing — `/api/pricing`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/pricing/calculate` | Calculate cart price with chosen strategy + discounts |
| `POST` | `/api/pricing/simulate` | Compare all strategies side-by-side |
| `GET` | `/api/pricing/strategies` | List available strategies |

### Orders — `/api/orders`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/orders` | Create order (supports `Idempotency-Key` header) |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/orders/:id/confirm` | Confirm order (`PENDING → CONFIRMED`) |
| `POST` | `/api/orders/:id/cancel` | Cancel order (triggers stock release via event) |
| `POST` | `/api/orders/:id/transition` | Transition to any valid next status |
| `GET` | `/api/orders/transitions` | View full state machine transition map |

### Payments — `/api/payments` *(stub — returns 501)*

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/payments/process` | Process payment |
| `POST` | `/api/payments/:id/refund` | Refund payment |
| `GET` | `/api/payments/:id/status` | Check payment status |

---

## Project Structure

```
src/
├── app.ts                        # Express app setup & route mounting
├── server.ts                     # Entry point & event handler registration
├── config/
│   ├── env.ts                    # Environment config (port, DB URI, log level)
│   └── database.ts               # MongoDB connection with retry logic
├── events/
│   ├── EventBus.ts               # Singleton event bus (Observer pattern)
│   └── handlers/
│       ├── inventoryHandlers.ts  # ORDER_CREATED → reserve | ORDER_CANCELLED → release
│       └── orderHandlers.ts      # INVENTORY_RESERVED → confirm order
├── inventory/                    # Inventory module (model, repo, service, controller, routes)
├── pricing/
│   ├── strategies/               # RegularPricing, SeasonalPricing, BulkPricing, MemberPricing
│   └── decorators/               # PercentageDiscount, FlatDiscount, CouponDiscount, LoyaltyDiscount
├── orders/                       # Order module + State Machine + Idempotency model
├── payments/
│   └── adapters/                 # PaymentAdapter (abstract) + StripeAdapter (stub)
├── middleware/                   # errorHandler, validateRequest, rateLimiter, idempotencyMiddleware
├── utils/                        # responseFormatter, logger (Winston), constants
└── types/
    └── express.d.ts              # Express Request type augmentation

tests/
├── unit/
│   ├── pricing/
│   │   ├── strategies.test.ts    # 14 tests — strategy correctness
│   │   └── decorators.test.ts    # 14 tests — decorator composition & edge cases
│   └── orders/
│       └── orderStateMachine.test.ts  # 8 tests — valid/invalid transitions
└── integration/                  # Reserved
```

---

*Generated from source: [vks-g/Event-Driven-E-Commerce-Order-Management-Pricing-Engine](https://github.com/vks-g/Event-Driven-E-Commerce-Order-Management-Pricing-Engine)*
