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
