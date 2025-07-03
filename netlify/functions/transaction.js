// netlify/functions/transaction.js

const admin = require('firebase-admin');

// Ensure Firebase Admin SDK is initialized only once
// Check if the app is already initialized to prevent multiple initializations
if (!admin.apps.length) {
    // This is the service account key configuration.
    // It reads the values from Netlify Environment Variables.
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key from environment variables needs special handling
        // if it contains literal '\n' characters from copy-pasting.
        // It's best practice to strip actual newlines when setting the variable in Netlify,
        // so we don't need .replace(/\\n/g, '\n') here anymore.
        privateKey: process.env.FIREBASE_PRIVATE_KEY
    };

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error.message);
        // If initialization fails, throw an error to prevent function execution
        throw new Error("Firebase initialization failed. Check environment variables.");
    }
}

const db = admin.firestore();

// --- Pi SDK Server-Side Configuration (New) ---
// IMPORTANT: Use your actual Pi App ID and Pi Blockchain URL
// These should also ideally be in Netlify Environment Variables for production
// For now, hardcoding for demonstration based on your provided Pi App ID
const PI_APP_ID = "njocinapbollg8f925qksyexa6brsk4n7gja6iw74rxluu7m1rendh8y37pffqyo";
const PI_BLOCKCHAIN_API = "https://api.testnet.minepi.com/v2/payments"; // Use testnet for development

// Function to call Pi.complete() from your backend
async function completePiPayment(paymentId) {
    try {
        const response = await fetch(`${PI_BLOCKCHAIN_API}/${paymentId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PI_APP_ID}` // Use your Pi App ID as a bearer token
            },
            // The body should be empty or contain any necessary metadata for completion
            body: JSON.stringify({
                txid: 'server_approved_txid_placeholder' // Placeholder, actual txid comes from Pi Network
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Pi payment ${paymentId} successfully completed on blockchain:`, data);
            return { success: true, message: "Payment completed successfully on Pi Network.", data: data };
        } else {
            console.error(`Failed to complete Pi payment ${paymentId}:`, data);
            return { success: false, message: `Failed to complete payment on Pi Network: ${data.message || response.statusText}`, errorData: data };
        }
    } catch (error) {
        console.error(`Error completing Pi payment ${paymentId} server-side:`, error);
        return { success: false, message: `Server error during payment completion: ${error.message}` };
    }
}

// Function to call Pi.cancel() from your backend
async function cancelPiPayment(paymentId) {
    try {
        const response = await fetch(`${PI_BLOCKCHAIN_API}/${paymentId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PI_APP_ID}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Pi payment ${paymentId} successfully cancelled on blockchain:`, data);
            return { success: true, message: "Payment cancelled successfully on Pi Network.", data: data };
        } else {
            console.error(`Failed to cancel Pi payment ${paymentId}:`, data);
            return { success: false, message: `Failed to cancel payment on Pi Network: ${data.message || response.statusText}`, errorData: data };
        }
    } catch (error) {
        console.error(`Error cancelling Pi payment ${paymentId} server-side:`, error);
        return { success: false, message: `Server error during payment cancellation: ${error.message}` };
    }
}


exports.handler = async (event, context) => {
    // Log the entire event object for debugging
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Ensure it's a POST request
    if (event.httpMethod !== 'POST') {
        console.warn('Method Not Allowed:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are accepted.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
        console.log("Parsed request body:", data);
    } catch (error) {
        console.error("Failed to parse request body:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Bad Request: Invalid JSON body.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    // Handle different types of transactions
    switch (data.type) {
        case 'task_accepted':
        case 'task_submitted':
            try {
                // Add a timestamp and log the user ID if available from authentication
                const transactionRecord = {
                    ...data, // Include all data sent from the frontend
                    timestamp: admin.firestore.FieldValue.serverTimestamp(), // Firestore's server timestamp
                    // If you integrate Pi.authenticate() on frontend and send user.username
                    // userId: data.userId || 'unknown_user',
                };

                const docRef = await db.collection('transactions').add(transactionRecord);
                console.log(`${data.type.replace('_', ' ')} logged to Firestore with ID:`, docRef.id);

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: `${data.type.replace('_', ' ')} logged successfully!`, transactionId: docRef.id }),
                    headers: { 'Content-Type': 'application/json' },
                };
            } catch (error) {
                console.error(`Error processing ${data.type.replace('_', ' ')}:`, error);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ message: `Error processing ${data.type.replace('_', ' ')}: ${error.message}` }),
                    headers: { 'Content-Type': 'application/json' },
                };
            }

        case 'pi_payment_approval':
            // This is the critical part for server-side payment completion
            const { paymentId, amount, memo } = data; // Get payment details from the frontend
            console.log(`Received server approval request for paymentId: ${paymentId}, amount: ${amount}, memo: ${memo}`);

            // --- Server-side validation (IMPORTANT FOR PRODUCTION) ---
            // In a real application, you would perform several checks here:
            // 1. Verify 'amount' and 'memo' match what you expect for this paymentId.
            //    You might store payment intents in your database when the frontend initiates Pi.sendPayment.
            // 2. Check if the paymentId has already been processed to prevent double-spending.
            // 3. Ensure the user making the request is authorized (if you have user sessions).
            // --- End of validation ---

            // For now, assuming validation passes, proceed to complete the payment
            const completeResult = await completePiPayment(paymentId);

            if (completeResult.success) {
                // Optionally, save the successful payment record to your Firestore database
                await db.collection('pi_payments').add({
                    paymentId: paymentId,
                    amount: amount,
                    memo: memo,
                    status: 'completed',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    piBlockchainData: completeResult.data // Store data returned from Pi blockchain
                });
                console.log(`Payment ${paymentId} marked as completed in Firestore.`);

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Pi payment completed by server.', data: completeResult.data }),
                    headers: { 'Content-Type': 'application/json' },
                };
            } else {
                // Optionally, save the failed payment attempt
                await db.collection('pi_payments').add({
                    paymentId: paymentId,
                    amount: amount,
                    memo: memo,
                    status: 'failed_completion',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    errorMessage: completeResult.message,
                    errorData: completeResult.errorData
                });
                console.error(`Failed to complete Pi payment ${paymentId} server-side, marked as failed in Firestore.`);

                // You might also call cancelPiPayment(paymentId) here if it's a critical failure
                // or if the payment can be safely cancelled.
                // await cancelPiPayment(paymentId);

                return {
                    statusCode: 500,
                    body: JSON.stringify({ message: `Server failed to complete Pi payment: ${completeResult.message}` }),
                    headers: { 'Content-Type': 'application/json' },
                };
            }

        default:
            console.warn("Unknown transaction type:", data.type);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Bad Request: Unknown transaction type.' }),
                headers: { 'Content-Type': 'application/json' },
            };
    }
};
