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
        title: 'Translate a Short Pi Article (Hausa)',
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
        description: 'Spend 15 minutes navigating a new feature in the Pi Browser and report bugs.',
        reward: 0.4,
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


// --- Functions to Handle User Interactions ---

// Function for "Accept Task" button
function acceptTask(taskId, buttonElement) {
    // Find the task in allTasksData
    const taskIndexInAll = allTasksData.findIndex(t => t.id === taskId);

    if (taskIndexInAll !== -1) {
        const task = allTasksData[taskIndexInAll];

        // Simulate task acceptance (in a real app, this would involve backend/Pi SDK)
        console.log(`Simulating acceptance for task: ${task.title}`);
        alert(`You have accepted the task: "${task.title}"! This is a simulation. It has been moved to "My Accepted Tasks" tab.`);

        // Mark the task as accepted in allTasksData
        task.status = 'accepted';

        // Re-filter lists to reflect changes
        currentAvailableTasks = allTasksData.filter(t => t.status === 'available');
        acceptedTasks = allTasksData.filter(t => t.status !== 'available');

        // Update localStorage
        saveTasksToLocalStorage();

        // Update the UI
        displayAvailableTasks(); // Re-render available tasks with the removed one
        displayAcceptedTasks(); // Re-render accepted tasks (to ensure it's up-to-date)

        // Switch to "My Accepted Tasks" tab after accepting
        showSection('my-tasks');
    } else {
        console.error('Task not found or already accepted:', taskId);
        alert('Could not find this task or it has already been accepted. Please try again.');
    }
}

// Function for "Submit Task" button
function submitTask(taskId, buttonElement) {
    const taskIndexInAll = allTasksData.findIndex(t => t.id === taskId);

    if (taskIndexInAll !== -1) {
        const task = allTasksData[taskIndexInAll];

        // Simulate task submission
        console.log(`Simulating submission for task: ${task.title}`);
        alert(`You have submitted the task: "${task.title}"! It is now pending review.`);

        // Update status in allTasksData
        task.status = 'pending_review';

        // Re-filter acceptedTasks to reflect changes (important for re-display)
        acceptedTasks = allTasksData.filter(t => t.status !== 'available');

        // Update localStorage
        saveTasksToLocalStorage();

        // Re-display accepted tasks to show updated status and button
        displayAcceptedTasks();
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
        acceptedTasks = allTasksData.filter(task => task.status !== 'available');
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
    loadTasksFromLocalStorage(); // Load any previously saved tasks
    displayAvailableTasks(); // Display available tasks
    displayAcceptedTasks(); // Display accepted tasks (will be empty if none loaded)
    showSection('available-tasks'); // Ensure 'Available Tasks' tab is active by default
});
