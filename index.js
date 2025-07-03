const express = require('express');
const app = express();
const port = 3000;

// Firebase Admin SDK import and initialization
// Make sure to replace "./serviceAccountKey.json" with the correct path to your service account key file.
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware to parse JSON data from the request body.
// This is crucial for handling incoming JSON payloads from clients.
app.use(express.json());

// API endpoint for handling transactions.
// This route will listen for POST requests to '/transaction'.
app.post('/transaction', (req, res) => {
  // Extract the transaction data sent in the request body.
  const transactionData = req.body;

  console.log('Transaction received:', transactionData);

  // --- Firebase Admin SDK Usage Example (Uncomment and modify as needed) ---
  // Here's where you would integrate your actual Firebase logic,
  // for example, saving the transaction data to Firestore or Realtime Database.

  /*
  admin.firestore().collection('transactions').add(transactionData)
    .then(() => {
      console.log('Transaction saved to Firestore successfully!');
      res.json({ message: 'Transaction successfully processed and saved!', data: transactionData });
    })
    .catch(error => {
      console.error("Error saving transaction to Firestore:", error);
      res.status(500).json({ message: 'An error occurred while processing the transaction.', error: error.message });
    });
  */

  // For demonstration, we'll just send a success message back.
  // If you uncomment the Firebase logic above, make sure to remove or adjust this line.
  res.json({ message: 'Transaction received!', data: transactionData });
});

// The server starts listening for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('You can now send POST requests to http://localhost:3000/transaction');
});
