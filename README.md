# VOYA — Campus Interstate Transit Demand & Capacity Platform
*Every journey begins with Voya.*

Piloting at **LAUTECH (Ogbomoso)** for the Interswitch Pan-African Discovery Series Hackathon. VOYA aggregates student travel demand ahead of semester breaks, alerts verified transport operators to deploy extra buses before rush hours, and processes live payments via Interswitch IPG.

## Local Setup
\`\`\`bash
npm install
npm run dev
\`\`\`

## Live Interswitch IPG Integration Specs
1. Add the production script to `index.html`:
   `<script src="https://newwebpay.interswitchng.com/inline-checkout.js"></script>`
2. Wire `triggerInterswitchIPG` with:
   - `merchant_code`: `"MX153376"`
   - `pay_item_id`: *(Assigned Team Pay Item ID)*
   - `amount`: `"1000"` *(₦10.00 in kobo)*
   - `currency`: `566`
   - `mode`: `"LIVE"`
   - `txn_ref`: Unique reference per transaction
