# Meta WhatsApp Cloud API Integration Guide

This guide documents the direct, production-ready integration between **Rajalakshmi Fireworks** and the **Meta WhatsApp Cloud API (Graph API v22.0)**.

---

## 1. Overview & Architecture

The application communicates directly with Meta's Graph API to deliver transactional order lifecycle updates without third-party intermediaries (e.g. AiSensy, WATI, Twilio).

```
Order Transaction (Committed to DB)
        │
        ▼ (Non-blocking async dispatch)
WhatsApp Service Layer
        ├─ Idempotency Check (orderId + messageType)
        ├─ Phone Normalization (+91 / E.164)
        └─ Audit Log Created (status: PENDING)
        │
        ▼
Meta WhatsApp Client
        ├─ Graph API Authorization (Bearer Token)
        ├─ Request Timeout (10s) + Token Redaction
        └─ Exponential Backoff (429, 5xx)
        │
        ▼
Meta Cloud API (v22.0)
        │
        ▼ (Webhook updates)
/api/whatsapp/webhook
        ├─ GET: Verification Challenge
        ├─ POST: Status Mapping (sent, delivered, read, failed)
        └─ HMAC-SHA256 Signature Verification
        │
        ▼
Database (`whatsapp_messages`) ──▶ Admin Order Inspector UI
```

---

## 2. Meta Cloud API Setup

### Step 1: Create Meta Business Portfolio & App
1. Go to [developers.facebook.com](https://developers.facebook.com/).
2. Create a new App of type **Business**.
3. Under **Add products to your app**, select **WhatsApp** and click **Set up**.

### Step 2: Configure WhatsApp Business Account (WABA) & Phone Number
1. Under **WhatsApp > Configuration**, select or create your WhatsApp Business Account.
2. In **API Setup**, add and verify your official business phone number via SMS/voice code.
3. Note down:
   - **Phone Number ID** (e.g., `109283746501928`)
   - **WhatsApp Business Account ID** (e.g., `209384756102938`)

### Step 3: Generate Permanent System User Access Token
> [!IMPORTANT]
> Do **NOT** use temporary 24-hour test tokens in production.

1. In [business.facebook.com](https://business.facebook.com/settings/system-users), go to **Business Settings > Users > System Users**.
2. Create an Admin System User (e.g., `WhatsApp-Cloud-Integration`).
3. Assign the WhatsApp App asset with full control permissions.
4. Click **Generate New Token**:
   - Select your App.
   - Set Token Expiration: **Never**.
   - Permissions: `whatsapp_business_messaging`, `whatsapp_business_management`.
5. Copy the generated token into `WHATSAPP_ACCESS_TOKEN`.

---

## 3. Environment Variables

Configure these in `.env.production` or your hosting platform (e.g. Vercel):

```env
# Meta WhatsApp Cloud API (Server-Side Only)
WHATSAPP_ACCESS_TOKEN="EAAG..."
WHATSAPP_PHONE_NUMBER_ID="109283746501928"
WHATSAPP_BUSINESS_ACCOUNT_ID="209384756102938"
WHATSAPP_VERIFY_TOKEN="your_custom_secret_verify_token"
WHATSAPP_API_VERSION="v22.0"
WHATSAPP_APP_SECRET="your_meta_app_secret_here"

# Set to true for mock development mode (avoids sending real messages)
WHATSAPP_MOCK_MODE=false
```

---

## 4. Message Templates (Meta Utility Category)

Create the following 6 templates in Meta WhatsApp Manager under **Category: UTILITY** and **Language: English (en)**.

### 1. `order_received`
- **Category:** Utility
- **Body:**
  ```text
  Hello {{1}}, thank you for choosing {{5}}! We have received your order #{{2}} for a total of {{3}}. Your order is scheduled for {{4}}. We will notify you once your order is confirmed.
  ```
- **Variables:**
  - `{{1}}`: Customer Name
  - `{{2}}`: Invoice Number (`FW-20260903-XXXX`)
  - `{{3}}`: Total Amount (`₹1,450.00`)
  - `{{4}}`: Fulfillment Type / Location
  - `{{5}}`: Store Name (`Rajalakshmi Fireworks`)

### 2. `order_confirmed`
- **Category:** Utility
- **Body:**
  ```text
  Hello {{1}}, great news! Your order #{{2}} for {{3}} has been confirmed and is being prepared at our Sivakasi facility. Fulfillment: {{4}}.
  ```

### 3. `order_packed`
- **Category:** Utility
- **Body:**
  ```text
  Hello {{1}}, your order #{{2}} has been packed securely and is ready for {{3}}.
  ```

### 4. `order_out_for_delivery`
- **Category:** Utility
- **Body:**
  ```text
  Hello {{1}}, your order #{{2}} is out for delivery to {{3}}. Please be available to receive your package.
  ```

### 5. `order_delivered`
- **Category:** Utility
- **Body:**
  ```text
  Hello {{1}}, your order #{{2}} has been successfully delivered/collected. Thank you for celebrating with {{3}}!
  ```

### 6. `order_cancelled`
- **Category:** Utility
- **Body:**
  ```text
  Hello {{1}}, your order #{{2}} has been cancelled. If you did not request this or have questions, please contact {{3}} support.
  ```

---

## 5. Webhook Configuration

1. In Meta App Dashboard, navigate to **WhatsApp > Configuration > Webhook**.
2. Click **Edit**:
   - **Callback URL:** `https://your-domain.com/api/whatsapp/webhook`
   - **Verify Token:** Value of your `WHATSAPP_VERIFY_TOKEN`
3. Click **Verify and Save**.
4. In **Webhook Fields**, click **Subscribe** to `messages`.

---

## 6. Local Development & Testing

1. **Mock Mode (Default):**
   When `WHATSAPP_MOCK_MODE=true` or when credentials are not supplied, the application logs simulated sends with synthetic `wamid.mock_...` IDs and does not hit Meta's servers.

2. **Testing Webhooks Locally:**
   Use tools like `ngrok` or `localtunnel` to expose your local Next.js server:
   ```bash
   ngrok http 3000
   ```
   Set callback URL in Meta Developer Dashboard: `https://<ngrok-subdomain>.ngrok.app/api/whatsapp/webhook`.

---

## 7. Admin Features & Observability

- **Notification Audit History:** Every order detail page displays all WhatsApp attempts with timestamps and status badges (`SENT`, `DELIVERED`, `READ`, `FAILED`).
- **Manual Retry:** If an API issue or phone formatting issue causes a failure, authorized store managers can click **Retry** on the order page to re-dispatch the notification.
- **Idempotency:** Repeated status transitions (e.g. `CONFIRMED -> CONFIRMED`) or retried checkout submissions will not spam customers with duplicate notifications.
