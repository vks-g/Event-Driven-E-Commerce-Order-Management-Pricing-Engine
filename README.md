# Ecommerce Order Management Engine

An event-driven order management system built with **TypeScript**, Express.js, and MongoDB, demonstrating key software design patterns and system design principles.

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
```

### Running

```bash
npm run dev     # Development with ts-node
npm run build   # Compile TypeScript
npm start       # Production (from dist/)
npm test        # Run all tests
```

## Project Structure

```
src/
├── app.ts                        # Express app setup & route mounting
├── server.ts                     # Server entry point & event handler registration
│
├── config/
│   ├── env.ts                    # Environment configuration (port, DB URI, log level)
│   └── database.ts               # MongoDB connection with retry logic
│
├── events/
│   ├── EventBus.ts               # Singleton event bus (Observer pattern)
│   └── handlers/
│       ├── inventoryHandlers.ts  # ORDER_CREATED → reserve stock, ORDER_CANCELLED → release
│       └── orderHandlers.ts      # INVENTORY_RESERVED → confirm order
│
├── inventory/
│   ├── inventoryModel.ts         # Mongoose schema (name, sku, stock, reservedStock, version)
│   ├── inventoryRepository.ts    # Data access layer (CRUD + atomic updates)
│   ├── inventoryService.ts       # Business logic (reserveStock, releaseStock with optimistic locking)
│   ├── inventoryController.ts    # HTTP request handlers
│   └── inventoryRoutes.ts        # Route definitions + Joi validation
│
├── pricing/
│   ├── strategies/
│   │   ├── PricingStrategy.ts    # Abstract base class (Strategy pattern interface)
│   │   ├── RegularPricing.ts     # Returns base price unchanged
│   │   ├── SeasonalPricing.ts    # Seasonal multipliers (summer 15%, holiday 25%, etc.)
│   │   ├── BulkPricing.ts        # Tiered volume discounts (10+ → 5%, 50+ → 15%, 100+ → 25%)
│   │   └── MemberPricing.ts      # Member tier discounts (Silver 5%, Gold 10%, Platinum 15%)
│   ├── decorators/
│   │   ├── DiscountDecorator.ts  # Abstract base class (Decorator pattern interface)
│   │   ├── PercentageDiscount.ts # Percentage-based discount (e.g., 10% off)
│   │   ├── FlatDiscount.ts       # Fixed amount discount (e.g., $5 off, floors at $0)
│   │   ├── CouponDiscount.ts     # Validates coupon codes, applies discount
│   │   └── LoyaltyDiscount.ts    # Loyalty tier discount (bronze through diamond)
│   ├── pricingService.ts         # Cart pricing calculation + strategy simulation
│   ├── pricingController.ts      # HTTP request handlers
│   └── pricingRoutes.ts          # Route definitions
│
├── orders/
│   ├── orderModel.ts             # Mongoose schema (items, status, totalPrice, idempotencyKey)
│   ├── orderStateMachine.ts      # State transition validation (PENDING → CONFIRMED → ...)
│   ├── orderRepository.ts        # Data access layer
│   ├── orderService.ts           # Business logic (create, confirm, cancel, transition)
│   ├── orderController.ts        # HTTP request handlers
│   ├── orderRoutes.ts            # Route definitions + Joi validation
│   └── idempotencyModel.ts       # Idempotency key storage (24h TTL)
│
├── payments/
│   ├── adapters/
│   │   ├── PaymentAdapter.ts     # Abstract interface (processPayment, refundPayment, getStatus)
│   │   └── StripeAdapter.ts      # Stub implementation (returns mock success)
│   ├── paymentService.ts         # Payment orchestration with adapter selection
│   └── paymentRoutes.ts          # Routes defined, handlers return 501 Not Implemented
│
├── middleware/
│   ├── errorHandler.ts           # Centralized error handling
│   ├── validateRequest.ts        # Joi schema validation wrapper
│   ├── rateLimiter.ts            # Rate limiting (100 req/15min)
│   └── idempotencyMiddleware.ts  # Duplicate request protection via Idempotency-Key header
│
├── utils/
│   ├── responseFormatter.ts      # Standard API response envelope { success, data, error }
│   ├── logger.ts                 # Winston logger setup
│   └── constants.ts              # Event names & order status constants
│
└── types/
    └── express.d.ts              # Express Request type augmentation (validatedBody)

tests/
├── unit/
│   ├── pricing/
│   │   ├── strategies.test.ts    # Strategy pattern correctness (14 tests)
│   │   └── decorators.test.ts    # Decorator composition & edge cases (14 tests)
│   └── orders/
│       └── orderStateMachine.test.ts  # State transition validation (8 tests)
├── integration/                  # (reserved for integration tests)
└── tsconfig.json

docs/
└── ARCHITECTURE.md               # Detailed architecture documentation
```

---

## System Architecture

### Module Dependency Graph

```mermaid
graph TB
    Client[Client / Postman] --> API[Express API Layer]

    subgraph "Middleware Pipeline"
        API --> RL[Rate Limiter]
        RL --> ID[Idempotency Check]
        ID --> VH[Validation Handler]
    end

    subgraph "Routes"
        VH --> IR[Inventory Routes]
        VH --> PR[Pricing Routes]
        VH --> OR[Order Routes]
        VH --> PaR[Payment Routes]
    end

    subgraph "Controllers"
        IR --> IC[Inventory Controller]
        PR --> PC[Pricing Controller]
        OR --> OC[Order Controller]
        PaR --> PaC[Payment Controller]
    end

    subgraph "Services"
        IC --> IS[Inventory Service]
        PC --> PS[Pricing Service]
        OC --> OS[Order Service]
        PaC --> PaS[Payment Service]
    end

    subgraph "Event Bus"
        OS -->|emit ORDER_CREATED| EB[EventBus]
        OS -->|emit ORDER_CANCELLED| EB
        EB -->|ORDER_CREATED| IH[Inventory Handler]
        EB -->|ORDER_CANCELLED| IH
        EB -->|INVENTORY_RESERVED| OH[Order Handler]
        IH -->|emit INVENTORY_RESERVED| EB
        IH -->|emit INVENTORY_RELEASED| EB
        OH -->|emit ORDER_CONFIRMED| EB
    end

    subgraph "Data Layer"
        IS --> IRep[Inventory Repository]
        OS --> ORep[Order Repository]
        IRep --> IM[(Inventory Collection)]
        ORep --> OM[(Order Collection)]
        ORep --> IK[(Idempotency Collection)]
    end

    subgraph "Patterns"
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

### Event Flow — Order Creation

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

    C->>API: POST /api/orders {items, strategy}
    API->>OS: createOrder()
    OS->>PS: calculateCartPrice(items, strategy)
    PS-->>OS: {subtotal, total, discounts}
    OS->>DB: Save order (status: PENDING)
    DB-->>OS: Order document
    OS->>EB: emit(ORDER_CREATED, {orderId, items})
    OS-->>API: 201 Created {order}
    API-->>C: Response

    EB->>IH: handleOrderCreated(payload)
    loop For each item
        IH->>IS: reserveStock(sku, qty)
        IS->>DB: Atomic update (optimistic lock)
        DB-->>IS: Updated inventory
    end
    IH->>EB: emit(INVENTORY_RESERVED, {orderId})

    EB->>OH: handleInventoryReserved(payload)
    OH->>OS: confirmOrder(orderId)
    OS->>DB: Update status PENDING → CONFIRMED
    DB-->>OS: Updated order
    OH->>EB: emit(ORDER_CONFIRMED, {orderId})
```

---

### Event Flow — Order Cancellation (Compensating Action)

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
    OS->>DB: Update status → CANCELLED
    OS->>EB: emit(ORDER_CANCELLED, {orderId, items})
    OS-->>API: 200 OK {order}
    API-->>C: Response

    EB->>IH: handleOrderCancelled(payload)
    loop For each item
        IH->>IS: releaseStock(sku, qty)
        IS->>DB: Atomic update (restore stock)
        DB-->>IS: Updated inventory
    end
    IH->>EB: emit(INVENTORY_RELEASED, {orderId})
```

---

## Entity-Relationship Diagram

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

    INVENTORY ||--o{ ORDER_ITEM : "referenced by"
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER }o--o| IDEMPOTENCY_KEY : "cached by"
```

---

## Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING

    PENDING --> CONFIRMED: Stock reserved
    PENDING --> CANCELLED: Insufficient stock / User cancel

    CONFIRMED --> PAYMENT_PROCESSING: Initiate payment
    CONFIRMED --> CANCELLED: User cancel

    PAYMENT_PROCESSING --> PAID: Payment success
    PAYMENT_PROCESSING --> PAYMENT_FAILED: Payment error

    PAID --> SHIPPING: Prepare shipment
    PAID --> REFUNDED: Refund issued

    SHIPPING --> SHIPPED: Dispatched

    SHIPPED --> DELIVERED: Received

    PAYMENT_FAILED --> PENDING: Retry payment
    PAYMENT_FAILED --> CANCELLED: Abandon

    CANCELLED --> [*]
    DELIVERED --> [*]
    REFUNDED --> [*]
```

---

## Use Case Diagram

```mermaid
graph TB
    subgraph "Actors"
        Customer[👤 Customer]
        Admin[👨‍💼 Admin]
        PaymentGateway[💳 Payment Gateway]
    end

    subgraph "Inventory Module"
        UC1[Add Product]
        UC2[View Products]
        UC3[Update Stock]
        UC4[Reserve Stock]
        UC5[Release Stock]
    end

    subgraph "Pricing Module"
        UC6[Calculate Cart Price]
        UC7[Simulate Strategies]
        UC8[List Strategies]
        UC9[Apply Discounts]
    end

    subgraph "Order Module"
        UC10[Create Order]
        UC11[View Order]
        UC12[Confirm Order]
        UC13[Cancel Order]
        UC14[Transition Order Status]
    end

    subgraph "Payment Module"
        UC15[Process Payment]
        UC16[Refund Payment]
        UC17[Check Payment Status]
    end

    Customer --> UC2
    Customer --> UC6
    Customer --> UC7
    Customer --> UC10
    Customer --> UC11
    Customer --> UC13

    Admin --> UC1
    Admin --> UC3
    Admin --> UC12
    Admin --> UC14

    PaymentGateway --> UC15
    PaymentGateway --> UC16
    PaymentGateway --> UC17

    UC10 -.->|uses| UC6
    UC10 -.->|triggers| UC4
    UC13 -.->|triggers| UC5
    UC6 -.->|uses| UC9
```

---

## Request Pipeline

```mermaid
flowchart LR
    subgraph "Incoming Request"
        A[HTTP Request] --> B[CORS]
    end

    subgraph "Global Middleware"
        B --> C[JSON Parser]
        C --> D[Rate Limiter]
    end

    subgraph "Route-Specific"
        D --> E{Route Match?}
        E -->|No| F[404 Handler]
        E -->|Yes| G[Idempotency Check]
    end

    subgraph "Module Pipeline"
        G --> H[Joi Validation]
        H --> I[Controller]
        I --> J[Service Layer]
        J --> K[Repository]
        K --> L[(MongoDB)]
    end

    subgraph "Response"
        L --> K
        K --> J
        J --> I
        I --> M[Response Formatter]
        M --> N[HTTP Response]
    end

    subgraph "Error Path"
        J -.->|error| O[Error Handler]
        H -.->|validation| O
        O --> N
    end
```

---

## Class Diagram — Pricing Engine

```mermaid
classDiagram
    class PricingStrategy {
        <<abstract>>
        +calculatePrice(basePrice, context)* PricingResult
    }

    class RegularPricing {
        +calculatePrice(basePrice, context) PricingResult
    }

    class SeasonalPricing {
        -SEASON_MULTIPLIERS
        +calculatePrice(basePrice, context) PricingResult
    }

    class BulkPricing {
        -BULK_TIERS
        +calculatePrice(basePrice, context) PricingResult
    }

    class MemberPricing {
        -MEMBER_DISCOUNTS
        +calculatePrice(basePrice, context) PricingResult
    }

    class DiscountDecorator {
        <<abstract>>
        +wrappedPricing
        +apply(priceResult, context)* PricingResult
    }

    class PercentageDiscount {
        -percentage
        +apply(priceResult, context) PricingResult
    }

    class FlatDiscount {
        -amount
        +apply(priceResult, context) PricingResult
    }

    class CouponDiscount {
        -VALID_COUPONS
        +apply(priceResult, context) PricingResult
    }

    class LoyaltyDiscount {
        -LOYALTY_DISCOUNTS
        +apply(priceResult, context) PricingResult
    }

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

    PricingService --> PricingStrategy : uses
    PricingService --> DiscountDecorator : uses
```

---

## Class Diagram — Order & Inventory

```mermaid
classDiagram
    class EventBus {
        -instance: EventBus
        -registeredEvents: Map
        +getInstance() EventBus
        +emit(event, payload)
        +on(event, handler)
        +getRegisteredEvents()
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
        +transition(current, new) string
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
        +handleOrderCreated(payload)
        +handleOrderCancelled(payload)
        +registerHandlers()
    }

    class OrderHandler {
        +handleInventoryReserved(payload)
        +registerHandlers()
    }

    EventBus <-- InventoryHandler : registers on
    EventBus <-- OrderHandler : registers on
    OrderService --> OrderStateMachine : validates transitions
    OrderService --> OrderRepository : persists
    OrderService --> EventBus : emits events
    OrderService --> PricingService : calculates price
    InventoryHandler --> InventoryService : reserves/releases
    OrderHandler --> OrderService : confirms order
    InventoryService --> InventoryRepository : persists
```

---

## API Endpoints

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all products |
| GET | `/api/inventory/:sku` | Get product by SKU |
| POST | `/api/inventory` | Add new product |
| PATCH | `/api/inventory/:sku/stock` | Update stock level |

### Pricing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pricing/calculate` | Calculate cart pricing |
| POST | `/api/pricing/simulate` | Compare all strategies side-by-side |
| GET | `/api/pricing/strategies` | List available strategies |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order (supports Idempotency-Key header) |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get order by ID |
| POST | `/api/orders/:id/confirm` | Confirm order (PENDING → CONFIRMED) |
| POST | `/api/orders/:id/cancel` | Cancel order (triggers stock release) |
| POST | `/api/orders/:id/transition` | Transition order to any valid status |
| GET | `/api/orders/transitions` | View full state machine transitions |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/process` | Process payment (stub — 501) |
| POST | `/api/payments/:id/refund` | Refund payment (stub — 501) |
| GET | `/api/payments/:id/status` | Check payment status (stub — 501) |

---

## Design Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Observer** | `EventBus.ts` | Event-driven communication between decoupled modules |
| **Strategy** | `pricing/strategies/` | Runtime pricing algorithm swap (OCP) |
| **Decorator** | `pricing/decorators/` | Composable discount stacking without inheritance explosion |
| **Adapter** | `payments/adapters/` | Payment provider abstraction (DIP) |
| **State Machine** | `orders/orderStateMachine.ts` | Enforced order lifecycle transitions |
| **Repository** | `*Repository.ts` | Data access abstraction from business logic |
| **Singleton** | `EventBus.ts` | Single event bus instance across the application |
| **Middleware** | `middleware/` | Cross-cutting concerns (validation, rate limiting, idempotency) |

## Testing

```bash
npm test          # All tests
npm run test:unit # Unit tests only
```

**Test Coverage: 36 tests passing**

| Test File | Tests | What It Validates |
|-----------|-------|-------------------|
| `strategies.test.ts` | 14 | Each strategy returns correct prices, runtime switching |
| `decorators.test.ts` | 14 | Each decorator applies correctly, composition, edge cases |
| `orderStateMachine.test.ts` | 8 | Valid/invalid transitions, terminal states |
