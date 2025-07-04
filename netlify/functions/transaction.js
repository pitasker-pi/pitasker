// netlify/functions/transaction.js

const admin = require('firebase-admin');

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
    };

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error.message);
        throw new Error("Firebase initialization failed. Check environment variables.");
    }
}

const db = admin.firestore();

const PI_APP_ID = "njocinapbollg8f925qksyexa6brsk4n7gja6iw74rxluu7m1rendh8y37pffqyo";
const PI_BLOCKCHAIN_API = "https://api.testnet.minepi.com/v2/payments"; // Use testnet for development

async function completePiPayment(paymentId) {
    try {
        const response = await fetch(`${PI_BLOCKCHAIN_API}/${paymentId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PI_APP_ID}`
            },
            body: JSON.stringify({
                txid: 'server_approved_txid_placeholder'
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
    console.log("Received event:", JSON.stringify(event, null, 2));

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
        console.error("Failed to parse request body or body is empty:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Bad Request: Invalid JSON body or empty body.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    // --- CRITICAL NEW CHECK HERE FOR TYPE ERROR ---
    // This ensures 'data' and 'data.type' exist before proceeding
    if (!data || typeof data.type === 'undefined') {
        console.error("Missing or undefined 'type' field in request body:", data);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Bad Request: Missing or invalid "type" field in request body.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
    // --- END CRITICAL NEW CHECK ---

    switch (data.type) {
        case 'task_accepted':
        case 'task_submitted':
            try {
                const transactionRecord = {
                    ...data,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
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
            const { paymentId, amount, memo } = data;
            console.log(`Received server approval request for paymentId: ${paymentId}, amount: ${amount}, memo: ${memo}`);

            const completeResult = await completePiPayment(paymentId);

            if (completeResult.success) {
                await db.collection('pi_payments').add({
                    paymentId: paymentId,
                    amount: amount,
                    memo: memo,
                    status: 'completed',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    piBlockchainData: completeResult.data
                });
                console.log(`Payment ${paymentId} marked as completed in Firestore.`);

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Pi payment completed by server.', data: completeResult.data }),
                    headers: { 'Content-Type': 'application/json' },
                };
            } else {
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
