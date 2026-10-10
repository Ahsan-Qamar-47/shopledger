# ShopLedger Demo Script 🎬

This script is designed to help you record a smooth 3-5 minute demo video for your final submission.

## Preparation
1. Open your live Vercel frontend URL.
2. Ensure your backend is awake (refresh the page to ensure data loads quickly).
3. Have your recording software ready (e.g., OBS, Loom, or ScreenRec).

## Scene 1: Introduction (0:00 - 0:30)
- **Action:** Show the Login screen.
- **Voiceover:** "Hello, this is my final project submission for ShopLedger, a Khata and Inventory management system designed for small businesses. It's fully deployed on Vercel using the MERN stack."
- **Action:** Log in using the demo account (`demo@shopledger.com` / `Password123!`).

## Scene 2: The Dashboard (0:30 - 1:00)
- **Action:** Hover over the dashboard charts and metrics.
- **Voiceover:** "Once logged in, the dashboard gives the shop owner an immediate overview of total Udhaar (receivables), today's sales, and an interactive 7-day chart. Notice the active alerts for Low Stock and Top Debtors, giving actionable insights immediately."

## Scene 3: Flow A - Inventory & Credit Sale (1:00 - 2:30)
- **Action:** Navigate to **Inventory**. 
- **Voiceover:** "Let's look at the inventory. We have full CRUD capabilities, and the system intelligently flags items dropping below their threshold."
- **Action:** Navigate to **Khata (Customers)**. Click **+ Add Customer**, add a quick test customer. 
- **Action:** Click into that new customer to view their statement. Click **Add Sale**.
- **Voiceover:** "I will now record a credit sale. The system ensures I cannot sell more stock than I have." 
- **Action:** Try to add a quantity higher than the stock to show the error toast. Then correct it, and save the sale.
- **Action:** Show the updated balance in the statement view.

## Scene 4: Flow B - WhatsApp & Payments (2:30 - 3:30)
- **Action:** Still on the customer statement, click the **Send WhatsApp Reminder** button. 
- **Voiceover:** "ShopLedger can instantly generate a polite payment reminder and pass it directly to WhatsApp Web or the WhatsApp app, reducing friction for the shop owner."
- **Action:** Close the WhatsApp tab, go back, and click **Add Payment**. Record a partial payment.
- **Action:** Click **Download PDF**.
- **Voiceover:** "Finally, owners can export a professional PDF statement to hand physically to the customer or save for their records."

## Scene 5: Conclusion (3:30 - 4:00)
- **Action:** Go back to the Dashboard.
- **Voiceover:** "You can see the Dashboard metrics have updated in real-time. The application is fully mobile-responsive and secured with strict backend validations. Thank you for watching!"
