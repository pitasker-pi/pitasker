const express = require('express');
const app = express();
const port = 3000;

// Firebase Admin SDK import and initialization
// Ensure "./serviceAccountKey.json" points to your actual service account key file.
// This file should be kept secure and NOT pushed to public repositories.
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware to parse incoming JSON data from request bodies.
// This is essential for your API to correctly read JSON payloads sent by clients.
app.use(express.json());

// API endpoint for handling transactions.
// This route listens for POST requests to '/transaction'.
app.post('/transaction', (req, res) => {
  // Extract the transaction data sent in the request body.
  const transactionData = req.body;

  console.log('Transaction received:', transactionData);

  // --- Firebase Admin SDK: Saving Transaction to Firestore ---
  // The code below has been uncommented to enable saving transactionData to Firestore.
  // Make sure your Firestore rules and Service Account permissions allow write operations
  // to the 'transactions' collection.

  admin.firestore().collection('transactions').add(transactionData)
    .then(() => {
      console.log('Transaction saved to Firestore successfully!');
      // Send a success response back to the client after saving.
      res.json({ message: 'Transaction successfully processed and saved!', data: transactionData });
    })
    .catch(error => {
      console.error("Error saving transaction to Firestore:", error);
      // Send an error response back to the client if saving fails.
      // Use status 500 for internal server errors.
      res.status(500).json({ message: 'An error occurred while processing the transaction.', error: error.message });
    });
});

// Start the server and listen for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('You can now send POST requests to http://localhost:3000/transaction');
});,
