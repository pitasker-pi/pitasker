const admin = require("firebase-admin");

// IMPORTANT: This will retrieve your service account credentials from Netlify Environment Variables.
// This is crucial for security; do NOT upload your serviceAccountKey.json file directly.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin SDK only if it hasn't been initialized already.
// This ensures it's initialized once per function instance.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Netlify Function handler: This is the main entry point for your serverless function.
exports.handler = async function(event, context) {
  // Check if the HTTP method is POST. If not, return a Method Not Allowed error.
  if (event.httpMethod !== 'POST') {
    console.warn('Method Not Allowed:', event.httpMethod); // Log for debugging
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are accepted.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  let transactionData;
  try {
    // Attempt to parse the JSON data from the request body.
    transactionData = JSON.parse(event.body);
    console.log('Transaction received:', transactionData); // Log the successfully parsed transaction data
  } catch (parseError) {
    // Catch errors if the request body is not valid JSON.
    console.error("Error parsing request body:", parseError);
    return {
      statusCode: 400, // Bad Request for invalid JSON
      body: JSON.stringify({ message: 'Invalid JSON format in request body.', error: parseError.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Save the transaction data to your Firestore 'transactions' collection.
    await admin.firestore().collection('transactions').add(transactionData);
    
    console.log('Transaction saved to Firestore successfully!'); // Success log
    
    // Send a success response back to the client.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Transaction successfully processed and saved!', data: transactionData }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (firestoreError) {
    // Catch any errors that occur during the Firestore save operation.
    console.error("Error saving transaction to Firestore:", firestoreError); // Detailed error log
    
    // Send an error response back to the client.
    return {
      statusCode: 500, // Internal Server Error
      body: JSON.stringify({ message: 'An error occurred while processing the transaction.', error: firestoreError.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
