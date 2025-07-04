// script.js
// Initial data for all tasks (including those that might be accepted)
let allTasksData = [
    {
        id: 'task001',
        title: 'Write a Short Essay on Pi Network',
        description: 'Write a brief essay (200 words) about the importance of Pi Network.',
        reward: 0.5,
        currency: 'Pi',
        duration: '30 min',
        category: 'Content Creation',
        status: 'available' // available, accepted, pending_review, completed
    },
    {
        id: 'task002',
        title: 'Watch a Video and Give Feedback',
        description: 'Watch a 2-minute video on a new Pi feature and provide your feedback.',
        reward: 0.2,
        currency: 'Pi',
        duration: '5 min',
        category: 'Feedback',
        status: 'available'
    },
    {
        id: 'task003',
        title: 'Complete a Short Survey',
        description: 'Fill out a 3-minute survey about your opinions on crypto applications.',
        reward: 0.3,
        currency: 'Pi',
        duration: '10 min',
        category: 'Survey',
        status: 'available'
    },
    {
        id: 'task004',
        title: 'Invite 3 Friends to Pi Network',
        description: 'Invite three new Pioneers to join Pi Network using your referral code.',
        reward: 1.0,
        currency: 'Pi',
        duration: 'Variable',
        category: 'Referral',
        status: 'available'
    },
    {
        id: 'task005',
        title: 'Translate a Short Pi Article in to your local language ()',
        description: 'Translate a short article about Pi Network into Hausa (approx. 500 words).',
        reward: 0.7,
        currency: 'Pi',
        duration: '1 hour',
        category: 'Translation',
        status: 'available'
    },
    {
        id: 'task006',
        title: 'Test Pi Browser Feature',
        description: 'Spend 15 minutes navigating a new feature in the Pi Browser and report a bugs.',
        reward: 0.40,
        currency: 'Pi',
        duration: '15 min',
        category: 'Bug Testing',
        status: 'available'
    },
    {
        id: 'task007',
        title: 'Create a Pi-themed Meme',
        description: 'Design and create an original meme related to Pi Network and its vision.',
        reward: 0.25,
        currency: 'Pi',
        duration: '20 min',
        category: 'Creative',
        status: 'available'
    },
    {
        id: 'task008',
        title: 'Participate in a Community Poll',
        description: 'Vote on important community decisions within the Pi app or forums.',
        reward: 0.1,
        currency: 'Pi',
        duration: '2 min',
        category: 'Community',
        status: 'available'
    },
    {
        id: 'task009',
        title: 'Share Pi News on Social Media',
        description: 'Share a recent Pi Network official announcement on one of your social media platforms.',
        reward: 0.15,
        currency: 'Pi',
        duration: '5 min',
        category: 'Marketing',
        status: 'available'
    },
    {
        id: 'task010',
        title: 'Write a Product Review for a Pi App',
        description: 'Write an honest review for a Pi Ecosystem application on their listing page.',
        reward: 0.6,
        currency: 'Pi',
        duration: '40 min',
        category: 'Review',
        status: 'available'
    }
];

// Array to store available tasks (filtered from allTasksData based on status and search)
let currentAvailableTasks = [];

// Array to store accepted tasks (filtered from allTasksData based on status)
let acceptedTasks = [];

// --- Global DOM Elements for Pi Integration ---
let piPayButton;
let piPaymentStatus;
let isAuthenticated = false; // Flag to check if user is authenticated with Pi
let piUser = null; // Store authenticated Pi user data

// Define your Netlify Function URL here
// IMPORTANT: Use your actual Netlify app URL
const NETLIFY_FUNCTION_URL = 'https://jocular-pixie-748976.netlify.app/.netlify/functions/transaction';

// --- Functions to Manage Tasks Display ---

function displayAvailableTasks() {
    const tasksListDiv = document.getElementById('available-tasks-list');
    tasksListDiv.innerHTML = ''; // Clear previous content

    const searchTerm = document.getElementById('task-search').value.toLowerCase();

    // Filter tasks based on search term and availability
    const filteredAndAvailableTasks = currentAvailableTasks.filter(task =>
        (task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm))
    );

    if (filteredAndAvailableTasks.length === 0) {
        tasksListDiv.innerHTML = '<p>No available tasks match your search. Try a different term!</p>';
        return;
    }

    filteredAndAvailableTasks.forEach(task => {
        const taskCardDiv = document.createElement('div');
        taskCardDiv.className = 'task-card';
        taskCardDiv.innerHTML = `
            <h3>${task.title}</h3>
            <p class="task-meta">
                <span><i class="far fa-clock"></i> Duration: ${task.duration}</span>
                <span><i class="fas fa-tags"></i> Category: ${task.category}</span>
            </p>
            <p>${task.description}</p>
            <p>Reward: <strong><i class="fas fa-coins"></i> ${task.reward} ${task.currency}</strong></p>
            <button id="accept-${task.id}" onclick="acceptTask('${task.id}', this)">Accept Task</button>
        `;
        tasksListDiv.appendChild(taskCardDiv);
    });
}

function displayAcceptedTasks() {
    const acceptedTasksListDiv = document.getElementById('accepted-tasks-list');
    acceptedTasksListDiv.innerHTML = ''; // Clear previous content

    if (acceptedTasks.length === 0) {
        acceptedTasksListDiv.innerHTML = '<p>You haven\'t accepted any tasks yet. Go to "Available Tasks" to find some!</p>';
        return;
    }

    acceptedTasks.forEach(task => {
        const taskCardDiv = document.createElement('div');
        taskCardDiv.className = 'task-card';
        let statusText = '';
        let buttonHtml = '';

        if (task.status === 'accepted') {
            statusText = 'Accepted - In Progress';
            buttonHtml = `<button onclick="submitTask('${task.id}', this)">Submit Task</button>`;
        } else if (task.status === 'pending_review') {
            statusText = 'Pending Review';
            buttonHtml = `<button disabled>Awaiting Verification</button>`;
        } else if (task.status === 'completed') {
            statusText = 'Completed - Reward Paid!';
            buttonHtml = `<button disabled>Task Completed</button>`;
        }

        taskCardDiv.innerHTML = `
            <h3>${task.title}</h3>
            <p class="task-meta">
                <span><i class="far fa-clock"></i> Duration: ${task.duration}</span>
                <span><i class="fas fa-tags"></i> Category: ${task.category}</span>
            </p>
            <p>${task.description}</p>
            <p>Reward: <strong><i class="fas fa-coins"></i> ${task.reward} ${task.currency}</strong></p>
            <p>Status: <em>${statusText}</em></p>
            ${buttonHtml}
        `;
        acceptedTasksListDiv.appendChild(taskCardDiv);
    });
}


// --- Functions to Handle User Interactions (Now with Backend Integration) ---

// Function for "Accept Task" button
async function acceptTask(taskId, buttonElement) {
    const taskIndexInAll = allTasksData.findIndex(t => t.id === taskId);

    if (taskIndexInAll !== -1) {
        const task = allTasksData[taskIndexInAll];

        // 1. Mark the task as accepted locally
        task.status = 'accepted';

        // 2. Prepare data for backend (Firestore)
        const transactionData = {
            type: 'task_accepted',
            taskId: task.id,
            taskTitle: task.title,
            timestamp: new Date().toISOString(),
            userId: piUser ? piUser.username : 'guest_user' // Include Pi user ID if authenticated
        };

        try {
            buttonElement.disabled = true; // Disable button to prevent multiple clicks
            buttonElement.textContent = 'Accepting...';
            
            // 3. Send data to Netlify Function (Backend)
            const response = await fetch(NETLIFY_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Task acceptance logged to Firestore:', result);
                alert(`You have accepted the task: "${task.title}"! It has been moved to "My Accepted Tasks" tab.`);
                // Update localStorage after successful backend operation
                saveTasksToLocalStorage();
            } else {
                console.error('Failed to log task acceptance to Firestore:', result.message);
                alert(`Error accepting task: ${result.message}. Please try again.`);
                // Revert status if backend failed
                task.status = 'available'; 
            }
        } catch (error) {
            console.error('Network or unknown error accepting task:', error);
            alert(`Network error or unknown issue. Please check your connection and try again.`);
            // Revert status if network error
            task.status = 'available'; 
        } finally {
            buttonElement.disabled = false; // Re-enable button
            buttonElement.textContent = 'Accept Task';

            // Re-filter lists to reflect changes (or revert if error)
            currentAvailableTasks = allTasksData.filter(t => t.status === 'available');
            acceptedTasks = allTasksData.filter(t => t.status !== 'available');

            // Update the UI
            displayAvailableTasks();
            displayAcceptedTasks();
            showSection('my-tasks'); // Switch to "My Accepted Tasks" tab after accepting
        }
    } else {
        console.error('Task not found or already accepted:', taskId);
        alert('Could not find this task or it has already been accepted. Please try again.');
    }
}

// Function for "Submit Task" button
async function submitTask(taskId, buttonElement) {
    const taskIndexInAll = allTasksData.findIndex(t => t.id === taskId);

    if (taskIndexInAll !== -1) {
        const task = allTasksData[taskIndexInAll];

        // 1. Mark the task as pending_review locally
        task.status = 'pending_review';

        // 2. Prepare data for backend (Firestore)
        const transactionData = {
            type: 'task_submitted',
            taskId: task.id,
            taskTitle: task.title,
            timestamp: new Date().toISOString(),
            userId: piUser ? piUser.username : 'guest_user' // Include Pi user ID if authenticated
            // In a real app, you'd also send submission details here (e.g., URL, screenshot evidence)
        };

        try {
            buttonElement.disabled = true; // Disable button
            buttonElement.textContent = 'Submitting...';

            // 3. Send data to Netlify Function (Backend)
            const response = await fetch(NETLIFY_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Task submission logged to Firestore:', result);
                alert(`You have submitted the task: "${task.title}"! It is now pending review.`);
                // Update localStorage after successful backend operation
                saveTasksToLocalStorage();
            } else {
                console.error('Failed to log task submission to Firestore:', result.message);
                alert(`Error submitting task: ${result.message}. Please try again.`);
                // Revert status if backend failed
                task.status = 'accepted'; 
            }
        } catch (error) {
            console.error('Network or unknown error submitting task:', error);
            alert(`Network error or unknown issue. Please check your connection and try again.`);
            // Revert status if network error
            task.status = 'accepted'; 
        } finally {
            buttonElement.disabled = false; // Re-enable button
            buttonElement.textContent = 'Submit Task';

            // Re-filter acceptedTasks and re-display
            acceptedTasks = allTasksData.filter(t => t.status !== 'available');
            displayAcceptedTasks();
        }
    } else {
        console.error('Task not found in all tasks data:', taskId);
        alert('Error submitting task. Please try again.');
    }
}


// Function to switch between tabs (Available Tasks, My Accepted Tasks, Terms, Privacy)
function showSection(sectionId) {
    // Hide all main sections
    document.querySelectorAll('main section').forEach(section => {
        section.classList.remove('active-section');
        section.classList.add('hidden-section');
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');
        targetSection.classList.add('active-section');
    }

    // Update active state for tab buttons (only for main tabs)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    // Check if the clicked section is one of the main tabs
    if (sectionId === 'available-tasks' || sectionId === 'my-tasks') {
        const activeButton = document.querySelector(`.tab-button[onclick="showSection('${sectionId}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }


    // Always ensure the display functions are called when switching tabs
    if (sectionId === 'available-tasks') {
        document.getElementById('task-search').value = ''; // Clear search bar when returning to available tasks
        // Re-initialize currentAvailableTasks from allTasksData based on status 'available'
        currentAvailableTasks = allTasksData.filter(task => task.status === 'available');
        filterTasks(); // Apply any existing search filter (though we just cleared it)
    } else if (sectionId === 'my-tasks') {
        // Re-initialize acceptedTasks from allTasksData based on status 'accepted', 'pending_review', or 'completed'
        acceptedTasks = allTasksData.filter(task => task.status !== 'available'); // Fixed typo: t.status instead of t
        displayAcceptedTasks();
    }
    // No specific display functions for Terms or Privacy sections, as their content is static in HTML.
}


// Function to filter tasks based on search input
function filterTasks() {
    displayAvailableTasks(); // Simply re-call displayAvailableTasks which now includes filtering
}

// Simple alert function (used for Pi Connect button)
function showAlert(message) {
    alert(message);
}

// --- Local Storage Management ---

function saveTasksToLocalStorage() {
    // We'll save the entire allTasksData array, as it holds the true status of all tasks
    localStorage.setItem('piTasker_allTasksData', JSON.stringify(allTasksData));
    console.log('Tasks saved to localStorage.');
}

function loadTasksFromLocalStorage() {
    const savedAllTasks = localStorage.getItem('piTasker_allTasksData');

    if (savedAllTasks) {
        allTasksData = JSON.parse(savedAllTasks);
        console.log('All tasks data loaded from localStorage:', allTasksData);
    } else {
        // If no tasks are saved, it's the first run, so use initial allTasksData (defined globally at the top)
        console.log('No task data in localStorage, using default.');
    }

    // Initialize currentAvailableTasks and acceptedTasks based on the loaded allTasksData
    currentAvailableTasks = allTasksData.filter(task => task.status === 'available');
    acceptedTasks = allTasksData.filter(task => task.status !== 'available');
}


// --- Initialize App ---
// This runs when the DOM (HTML structure) is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // --- Pi SDK Integration Start ---
    piPayButton = document.getElementById('payPiButton');
    piPaymentStatus = document.getElementById('paymentStatus');

    if (!piPayButton || !piPaymentStatus) {
        console.error("Critical: Missing Pi payment button or status element in HTML. Pi integration will not work.");
        // We'll proceed with the rest of the app, but Pi features will be disabled or not work.
    } else {
        try {
            // PI APP ID FROM YOUR PREVIOUS CONVERSATION
            Pi.init({ appId: "njocinapbollg8f925qksyexa6brsk4n7gja6iw74rxluu7m1rendh8y37pffqyo", version: "2.0" });
            console.log("Pi SDK Initialized with App ID.");
            piPaymentStatus.textContent = "Pi SDK Ready. Click button to Authenticate & Pay.";
            piPayButton.addEventListener('click', authenticateAndPay); // Attach the function to the button
        } catch (error) {
            console.error("Failed to initialize Pi SDK:", error);
            piPaymentStatus.textContent = "Error initializing Pi SDK. Please ensure you are in Pi Browser and check console for details.";
            if (piPayButton) piPayButton.disabled = true; // Disable button if there's an error
        }
    }

    // Function to start Authentication and then initiate payment
    async function authenticateAndPay() {
        if (!piPayButton || !piPaymentStatus) {
            console.error("Pi elements not found, cannot proceed with authentication.");
            return;
        }

        if (isAuthenticated && piUser) { // If already authenticated and user data is available
            initiatePiPayment(); // Directly proceed to payment
            return;
        }

        try {
            piPaymentStatus.textContent = "Authenticating with Pi Network...";
            piPayButton.disabled = true; // Disable button during authentication

            // Request permission for username and payments
            const authResult = await Pi.authenticate(['username', 'payments']);

            isAuthenticated = true;
            piUser = authResult.user; // Store authenticated user info
            console.log("Authentication successful:", authResult);
            piPaymentStatus.textContent = `Authenticated as: ${piUser.username}. Ready to pay.`;
            piPayButton.textContent = "Pay 0.0001 Pi (Test)"; // Change button text

            // Now initiate payment
            initiatePiPayment();

        } catch (error) {
            console.error("Authentication failed:", error);
            piPaymentStatus.textContent = `Authentication failed: ${error.message}. Please ensure you are logged into Pi Browser.`;
            alert(`Authentication failed: ${error.message}. Please ensure you are logged into Pi Browser.`);
            if (piPayButton) piPayButton.disabled = false; // Re-enable button
        }
    }

    // Function to initiate payment
    async function initiatePiPayment() { // Made async to await backend call
        if (!piPayButton || !piPaymentStatus) {
            console.error("Pi elements not found, cannot proceed with payment.");
            return;
        }

        piPaymentStatus.textContent = "Initiating payment...";
        piPayButton.disabled = true; // Disable button during payment

        const amountToPay = 0.0001; // Small amount for testing (Test-Pi)
        const memoForPayment = "Test transaction for PiTasker App verification (Step 11)";

        Pi.sendPayment({
            amount: amountToPay,
            memo: memoForPayment,
            metadata: {
                purpose: "App Verification Step 11",
                app: "PiTasker",
                userId: piUser ? piUser.username : 'unknown_user' // Include user ID in metadata
            }
        }, {
            onReadyForServerApproval: async function(paymentId) { // IMPORTANT: This is where we notify your server
                piPaymentStatus.textContent = `Payment ${paymentId} ready for server approval.`;
                console.log(`Payment ${paymentId} ready for server approval. Notifying backend.`);

                // Send payment ID to your Netlify Function for server-side completion
                try {
                    const response = await fetch(NETLIFY_FUNCTION_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            type: 'pi_payment_approval', // New type for your backend to handle
                            paymentId: paymentId,
                            amount: amountToPay,
                            memo: memoForPayment,
                            userId: piUser ? piUser.username : 'unknown_user'
                        }),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        console.log('Payment approval request sent to backend successfully:', result);
                        piPaymentStatus.textContent = `Payment ${paymentId} is being processed by the server.`;
                        // Frontend now waits for onComplete/onIncomplete from Pi SDK after server calls Pi.complete()
                    } else {
                        console.error('Failed to send payment approval to backend:', result.message);
                        piPaymentStatus.textContent = `Payment ${paymentId} failed backend approval: ${result.message}`;
                        alert(`Payment failed to be approved by server: ${result.message}`);
                        // Optionally, call Pi.cancel() here if the server explicitly signals a failure
                        // Pi.cancel(paymentId);
                        if (piPayButton) piPayButton.disabled = false;
                    }
                } catch (error) {
                    console.error('Network or unknown error during payment approval:', error);
                    piPaymentStatus.textContent = `Network error during payment approval.`;
                    alert(`Network error: ${error.message}`);
                    if (piPayButton) piPayButton.disabled = false;
                }
            },
            onComplete: function(paymentId) {
                piPaymentStatus.textContent = `Payment ${paymentId} successful! You can now go back to Pi Developer App.`;
                alert("Payment successful! You can now go back to the Pi Developer App and click 'Verify' for Step 11.");
                console.log("Payment successful:", paymentId);
                if (piPayButton) piPayButton.disabled = false; // Re-enable button
            },
            onIncomplete: function(paymentId) {
                piPaymentStatus.textContent = `Payment ${paymentId} incomplete. Check Pi wallet.`;
                alert("Payment incomplete. Please check your Pi wallet or network connection.");
                console.warn("Payment incomplete:", paymentId);
                if (piPayButton) piPayButton.disabled = false; // Re-enable button
            },
            onCancel: function() {
                piPaymentStatus.textContent = "Payment canceled by user.";
                alert("Payment canceled by user.");
                console.log("Payment canceled by user.");
                if (piPayButton) piPayButton.disabled = false; // Re-enable button
            }
        });
    }
    // --- Pi SDK Integration End ---


    // Load tasks and display them
    loadTasksFromLocalStorage();
    displayAvailableTasks();
    displayAcceptedTasks();
    showSection('available-tasks'); // Ensure 'Available Tasks' tab is active by default
});

// Expose functions globally if they are called directly from HTML (e.g., onclick)
window.showSection = showSection;
window.acceptTask = acceptTask;
window.submitTask = submitTask;
window.filterTasks = filterTasks;
window.showAlert = showAlert;
