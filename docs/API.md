# Edge Function API

This document describes Supabase Edge Functions used by ParkNear.

Base invocation pattern (client):

```ts
await supabase.functions.invoke('<function-name>', {
  body: { ...payload }
});
```

All functions support CORS preflight and JSON responses.

## 1) `create-razorpay-order`

Creates a Razorpay order for a pending booking.

### Request body

```json
{
  "booking_id": "uuid",
  "amount_paise": 12345
}
```

### Success response

```json
{
  "order_id": "order_...",
  "amount": 12345,
  "currency": "INR",
  "key_id": "rzp_test_..."
}
```

### Notes

- Requires authenticated user (Authorization header)
- Validates booking belongs to seeker and is payable
- Rejects amount mismatch

---

## 2) `verify-payment`

Verifies Razorpay signature and confirms booking.

### Request body

```json
{
  "booking_id": "uuid",
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

### Success response (shape)

```json
{
  "success": true,
  "booking": {
    "...": "confirmed booking row with spot/vehicle context"
  }
}
```

### Notes

- Validates signature using `RAZORPAY_KEY_SECRET`
- Marks booking paid/confirmed and generates gate OTP

---

## 3) `cancel-booking`

Cancels booking from seeker side with rule-based refund.

### Request body

```json
{
  "booking_id": "uuid",
  "reason": "optional text"
}
```

### Success response

```json
{
  "success": true,
  "refund_amount": 250
}
```

### Notes

- Refund policy depends on status/time before start
- Inserts refund transaction when applicable

---

## 4) `detect-no-show`

Triggers DB RPC `run_no_show_detection`.

### Request

- Usually scheduled task
- Optional auth via `Authorization: Bearer <CRON_SECRET>`

### Success response

```json
{
  "processed": 3
}
```

### Notes

- Uses service role
- Applies no-show state/strike/penalty logic

---

## 5) `send-notification`

Sends push notification via Expo push gateway.

### Request body

```json
{
  "userId": "uuid",
  "title": "string",
  "body": "string",
  "data": { "screen": "chat", "bookingId": "uuid" },
  "preferenceKey": "new_chat_message"
}
```

### Success response (examples)

```json
{ "ok": true, "expo": { "...": "expo response" } }
```

or skipped:

```json
{ "ok": true, "skipped": "preference_disabled" }
```

### Notes

- Requires authenticated caller
- Checks `users.notification_preferences`
- Clears stale token when Expo returns `DeviceNotRegistered`

---

## Error Conventions

Common error format:

```json
{ "error": "message" }
```

Common statuses:

- `400` invalid payload
- `401` unauthorized
- `403` forbidden
- `404` missing resource
- `405` method not allowed
- `500/502` server/upstream failures

