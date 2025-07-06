// netlify/functions/transaction.js
const admin = require('firebase-admin');

// Load Firebase credentials from environment variables
const serviceAccount = {
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY, // -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDT+0fOT7MttDvb\nPg65CcD2FG3uUdPPSjrvHLLHTJLoTYLfItSk9oXd1WplPgKwA8M67dQsUq2+5zUr\n1x778xL+xHDalr/tE5HdKLHFn13+l688xHW4QplLduNwtOMN4O9xEF527Iqy0Vk8\nmsLNtBkfp65FPx2sx72IVLM0twhRuoDP79oJOcR+QPeIT+RVEaxBXp/TD6GwqUO0\n/diHyECjc/db67i9oTpijSTT9Agw1nvtuYSmEdDxWm55GzVSU5MrrGe8NoytNaBn\n9mYxv3jrhezrZL81C62Cq2CycEGoiFOy+4exjf1eyvixB6Al0VAtN0CVgida6bwT\nwMTLkGZNAgMBAAECggEABeD2nVSdgft5G3vtmZkZJlnrsIvJZXrIBqCTnq5TdqjL\no9eJ8Sc7ECtef39IQMxh6iz1UONcGSq9UUFuhQs5MCKPhKhgmzkLNwhtYa8pQqm/\nPN6v6xPBv5OE/DewAk8GJOsQy5iEwi/HG0SpeV3wwm16ikYVUxjY+0JqE+CtlOKb\nxzpQfAs65d/LcaL4carUZgOFP9PeF3z59eoENwgGZBSz0LTLbKh4g0IReUL+JXaY\nbFBIs3Y3CxhVK3pJ4eCKfiYs0raUGlj0gkqn14r9O8Q+F6ERPTvsyFByGT8010D/\nRwqmLuBUdlSZ72iQ7JvZouhhQHCOVSuQU6KaIidVkQKBgQD0lJ9C0JLQl7djUULb\nVt+TzsRydYpkICb/9fuNK9IN78DU2QUNeEdN5PEIEFqjPQMXV+9OxIRIYHGGFkY8\nCg1o/fFzHA6KxKSGS1xzVsYimjuOCsziOlVyVQMMVFShXiqqUsNjyRNPtU4SPPao\nMdYiMSNu2hE50CEDdGXYsSUr9QKBgQDd4QPdzvt4/eRQVWqw3r84g4QYwHP/U+66\ngB8UoZRi/+NSM/AEb/lYWgh3STPsP23+sN/4XTvEhpMXURcftjhzLx18bGgfE061\nyi3lTjch9GbFt8s4+/TWgVzGOFD/OxsstzTMb1gNIz8HRU2PEEECEpyQnPk8LTOz\nB+DD2ovx+QKBgQCLqhMH5HLyCrD+VfkHp6Qkk346nkRYyMN8hssO4mcg7jf/U64+\n8uBE6ud4413euYh6XAybvjyL2Ab7utyAjHz754dpZCwpsgEBbydr9bFPMSOxCRnW\nVdlVYJZNBBsPyuYyPPC2mqwcaDwczhNMGKle/RBuzLfpe6BeiKlgBEhlwQKBgF/F\nQGX9cY5ICMSkGek+PEuoeNw2Ndt/3wuhQckl9WbGDNjukitYKch5FC5o6oCO4GuO\n7R3HIIUzkUn/Nnv5q2QMci3CnS7MpqzRF/5iRGnjlHjDXHS8THJKZEErDcsdOB2U\n9rVHWjpRfGMnBtM5sNW0MuA44VuYJzifreTb8IwBAoGAdlOjglTBEZMUVIcMZ/oL\nF35WygJRPAvrMfifQ+w2gQgLATeoZcWa/wmhqpmQrvNIi+so5mXFSEt+FiapJZYE\n73/vEI7eiU/T2SzLiNHGuDWxoVUwY7qVv+MSfjjKO6HfhXFhbD6ccqtJ8QlD1FkL\nXn//0cRFrvchfC40+GFgwPw=\n-----END PRIVATE KEY-----
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
};

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error);
        // Throw a more specific error for Netlify to catch
        throw new Error("Firebase initialization failed. Check environment variables.");
    }
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed. Only POST requests are accepted." }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    let data;
    try {
        // Ensure event.body exists and is parsed correctly
        if (!event.body) {
            console.error("No request body found.");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing." }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        data = JSON.parse(event.body);
        console.log("Received data:", data);
    } catch (error) {
        console.error("Failed to parse request body:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON in request body." }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Validate 'type' field to prevent 'replace' error
    if (!data.type || typeof data.type !== 'string') {
        console.error("Invalid or missing 'type' field in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request: 'type' field is required and must be a string." }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Add a timestamp for all logs
    const timestamp = new Date().toISOString();
    const userId = data.userId || 'unknown_user'; // Get userId from data or set as unknown

    try {
        let logRef;
        let responseMessage = "Operation logged successfully.";

        switch (data.type) {
            case 'task_accepted':
                logRef = db.collection('task_logs').add({
                    type: 'task_accepted',
                    taskId: data.taskId,
                    taskTitle: data.taskTitle,
                    userId: userId,
                    timestamp: timestamp,
                    status: 'accepted'
                });
                console.log(`Task ${data.taskId} accepted by ${userId}.`);
                responseMessage = `Task ${data.taskId} accepted and logged.`;
                break;

            case 'task_submitted':
                logRef = db.collection('task_logs').add({
                    type: 'task_submitted',
                    taskId: data.taskId,
                    taskTitle: data.taskTitle,
                    userId: userId,
                    timestamp: timestamp,
                    status: 'submitted_pending_review'
                });
                console.log(`Task ${data.taskId} submitted by ${userId}.`);
                responseMessage = `Task ${data.taskId} submitted and logged.`;
                break;

            case 'pi_payment_approval':
                // This is where your backend communicates with Pi Network's blockchain API
                // In a real app, you'd verify the payment and then call Pi.complete() or Pi.cancel()
                // For now, we'll just log it.

                logRef = db.collection('pi_payments').add({
                    type: 'pi_payment_approval',
                    paymentId: data.paymentId,
                    amount: data.amount,
                    memo: data.memo,
                    userId: userId,
                    timestamp: timestamp,
                    status: 'received_for_approval'
                });
                console.log(`Pi Payment ${data.paymentId} from ${userId} received for approval.`);
                responseMessage = `Pi Payment ${data.paymentId} received for server approval.`;

                // IMPORTANT: In a production app, you would add logic here to call Pi Network's backend endpoint
                // to complete the payment for the user. Example:
                // const Pi = require('@pi-network/pi-platform-api'); // You'd need to install this library
                // await Pi.apiClient.post(`payments/${data.paymentId}/complete`, { uid: userId });
                // Or call your own server that acts as a proxy to Pi Network API.

                break;

            default:
                console.warn(`Unknown data type received: ${data.type}`);
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Unknown data type." }),
                    headers: { 'Content-Type': 'application/json' }
                };
        }

        await logRef; // Wait for the Firestore write to complete

        return {
            statusCode: 200,
            body: JSON.stringify({ message: responseMessage, id: logRef.id }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error.", error: error.message }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
