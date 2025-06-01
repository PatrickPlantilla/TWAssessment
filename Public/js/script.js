document.addEventListener('DOMContentLoaded', () => {
  // Body and Container Logic
  let authToken = localStorage.getItem('authToken');
  let userData = null;

  // Function to show a message
  const showMessage = (elementId, message, isError = false) => {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.color = isError ? 'red' : 'green';
  };

  // Function to calculate BMI and get status
  const calculateBmi = (weight, height) => {
    const heightInMeters = height / 100;
    if (heightInMeters === 0) return null;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  };

  const getBmiStatus = (bmi) => {
    if (bmi === null) return '';
    if (bmi < 18.5) return 'underweight';
    if (bmi >= 18.5 && bmi < 25) return 'healthy';
    if (bmi >= 25 && bmi < 30) return 'overweight';
    return 'obese';
  };

  const displayWeightStatus = (element, weight, height) => {
    const bmi = calculateBmi(weight, height);
    const status = getBmiStatus(bmi);
    element.textContent = `${weight} kg`;
    element.className = `weight-status ${status}`;
  };

  // Function to calculate recommended weight range (BMI 25 to 29.99)
  const calculateRecommendedWeightRange = (height) => {
    const heightInMeters = height / 100;
    if (heightInMeters === 0) return 'N/A';
    const minWeight = parseFloat((18.5 * heightInMeters * heightInMeters).toFixed(2));
    const maxWeight = parseFloat((24.88 * heightInMeters * heightInMeters).toFixed(2));
    return `${minWeight} - ${maxWeight}`;
  };

  // Show/hide nav and backgrounds for signup/login/main
  function showSignupSection() {
    document.body.classList.add('signup-bg');
    document.body.classList.remove('login-bg', 'show-main');
    document.getElementById('signup-section').style.display = 'block';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('main-nav').style.display = 'none';
  }
  function showLoginSection() {
    document.body.classList.add('login-bg');
    document.body.classList.remove('signup-bg', 'show-main');
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('main-nav').style.display = 'none';
  }
  function showMainContent() {
    document.body.classList.add('show-main');
    document.body.classList.remove('signup-bg', 'login-bg');
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('main-nav').style.display = 'block';
  }

  // Function to fetch user data
  let fetchUserData = async () => {
    if (!authToken) {
      showSignupSection();
      return;
    }

    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        localStorage.removeItem('authToken');
        authToken = null;
        showSignupSection();
        return;
      }
      userData = await response.json();
      displayUserData(userData);
      generateCalendar(userData.weights);
      renderWeightGraph(userData.weights);
      showMainContent();
    } catch (error) {
      console.error('Error fetching user data:', error);
      showMessage('main-content', 'Failed to load user data.', true);
      localStorage.removeItem('authToken');
      authToken = null;
      showSignupSection();
    }
  };

  // Function to display user data on the main page
  const displayUserData = (user) => {
    statsName.textContent = user.name;
    statsAge.textContent = user.age;
    statsHeight.textContent = user.height;
    statsDate.textContent = user.latestWeightDate ? new Date(user.latestWeightDate).toLocaleDateString() : 'N/A';
    displayWeightStatus(statsWeight, user.weight, user.height);
    recommendedWeightRangeElement.textContent = calculateRecommendedWeightRange(user.height);
  };

  // Signup and Login Logic
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const signupMessage = document.getElementById('signup-message');
  const loginMessage = document.getElementById('login-message');

  // Function to handle sign up
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const age = document.getElementById('signup-age').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const weight = document.getElementById('signup-weight').value;
    const height = document.getElementById('signup-height').value;
    signupMessage.textContent = '';
    signupMessage.style.color = '';
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, username, password, weight, height })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        authToken = data.token;
        await fetchUserData();
        showMainContent();
      } else {
        signupMessage.textContent = data.message || 'Sign up failed.';
        signupMessage.style.color = 'red';
      }
    } catch (error) {
      signupMessage.textContent = 'Sign up failed. Please try again.';
      signupMessage.style.color = 'red';
    }
  });

  // Function to handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        authToken = data.token;
        showMessage('login-message', 'Login successful!');
        await fetchUserData();
      } else {
        showMessage('login-message', data.message, true);
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('login-message', 'An error occurred during login.', true);
    }
  });

  // Get the links to switch between signup and login
  const goToLoginLink = document.querySelector('#signup-section a[href="#login-section"]');
  const goToSignupLink = document.querySelector('#login-section a[href="#signup-section"]');

  // Event listener for the "Log In" link on the signup section
  if (goToLoginLink) {
    goToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginSection();
      signupMessage.textContent = '';
    });
  }

  // Event listener for the "Sign Up" link on the login section
  if (goToSignupLink) {
    goToSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSignupSection();
      loginMessage.textContent = '';
    });
  }

  // Main Content Logic
  const logoutLink = document.getElementById('logoutLink');
  const addWeightForm = document.getElementById('add-weight-form');
  const statsDate = document.getElementById('stats-date');
  const statsName = document.getElementById('stats-name');
  const statsAge = document.getElementById('stats-age');
  const statsHeight = document.getElementById('stats-height');
  const statsWeight = document.getElementById('stats-weight');
  const recommendedWeightRangeElement = document.getElementById('recommended-weight-range');
  const calendarMonthsDiv = document.getElementById('calendar-months');

  // Function to handle logout
  logoutLink.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    authToken = null;
    userData = null;
    // Clear login and signup fields for security
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    showLoginSection();
    if (location.hash !== '#login-section') {
      location.hash = '#login-section';
    }
  });

  // Function to generate the calendar
  const generateCalendar = (weightsData) => {
    if (calendarMonthsDiv) calendarMonthsDiv.innerHTML = '';
    const today = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Show the 4 most recent months, including the current month
    for (let i = 3; i >= 0; i--) {
      // Calculate the month offset from the current month
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(year, month, 1).getDay();

      const monthDiv = document.createElement('div');
      monthDiv.className = 'calendar-month';
      monthDiv.innerHTML = `<h3>${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthDate)}</h3><div class="month-grid"></div>`;
      if (calendarMonthsDiv) calendarMonthsDiv.appendChild(monthDiv);
      const monthGrid = monthDiv.querySelector('.month-grid');
      monthGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';

      // Add day headers
      daysOfWeek.forEach(day => {
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('day-header');
        headerDiv.textContent = day;
        monthGrid.appendChild(headerDiv);
      });

      // Add empty cells for the first week to align with the correct day
      for (let j = 0; j < firstDayOfMonth; j++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day';
        emptyCell.style.background = 'transparent';
        emptyCell.style.border = 'none';
        monthGrid.appendChild(emptyCell);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = day;

        const weightEntry = weightsData.find(w => new Date(w.date).toDateString() === date.toDateString());
        if (weightEntry) {
          dayDiv.classList.add('has-weight');
          dayDiv.addEventListener('click', () => showWeightPopup(userData, weightEntry.weight));
        }

        monthGrid.appendChild(dayDiv);
      }
    }
  };

  // Popup Logic
  const weightPopup = document.getElementById('weight-popup');
  const closePopup = weightPopup.querySelector('.close-button');
  const popupName = document.getElementById('popup-name');
  const popupAge = document.getElementById('popup-age');
  const popupHeight = document.getElementById('popup-height');
  const popupCurrentWeight = document.getElementById('popup-current-weight');
  const weightThisDay = document.getElementById('weight-this-day');

  // Function to show the weight popup
  const showWeightPopup = (user, weight) => {
    popupName.textContent = user.name;
    popupAge.textContent = user.age;
    popupHeight.textContent = user.height;
    displayWeightStatus(popupCurrentWeight, user.weight, user.height);
    displayWeightStatus(weightThisDay, weight, user.height);
    weightPopup.style.display = 'flex';
  };

  // Function to close the weight popup
  closePopup.addEventListener('click', () => {
    weightPopup.style.display = 'none';
  });

  // Add: Popup for duplicate weight entry
  const duplicateWeightPopup = document.createElement('div');
  duplicateWeightPopup.className = 'overlay';
  duplicateWeightPopup.style.display = 'none';
  duplicateWeightPopup.innerHTML = `
    <div class="popup-content">
      <span class="close-button" id="close-duplicate-popup">&times;</span>
      <h3>Duplicate Entry</h3>
      <p>You already inputted a weight for today.</p>
      <p id="duplicate-weight-info"></p>
    </div>
  `;
  document.body.appendChild(duplicateWeightPopup);
  const closeDuplicatePopup = document.getElementById('close-duplicate-popup');
  closeDuplicatePopup.addEventListener('click', () => {
    duplicateWeightPopup.style.display = 'none';
  });
  const duplicateWeightInfo = document.getElementById('duplicate-weight-info');

  // Function to handle adding new weight
  addWeightForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const weight = document.getElementById('new-weight').value;
    if (!authToken) {
      showMessage('add-weight-message', 'You must be logged in to add weight.', true);
      return;
    }

    // Check if today's weight already exists
    const todayStr = new Date().toDateString();
    if (userData && userData.weights) {
      const todayWeightEntry = userData.weights.find(w => new Date(w.date).toDateString() === todayStr);
      if (todayWeightEntry) {
        duplicateWeightInfo.textContent = `Today's weight: ${todayWeightEntry.weight} kg`;
        duplicateWeightPopup.style.display = 'flex';
        return;
      }
    }

    try {
      const response = await fetch('/api/add-weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ weight })
      });
      const data = await response.json();
      if (response.ok) {
        showMessage('add-weight-message', 'Weight added successfully!');
        await fetchUserData(); // Refresh user data and calendar
        document.getElementById('new-weight').value = '';
      } else {
        showMessage('add-weight-message', data.message, true);
      }
    } catch (error) {
      console.error('Error adding weight:', error);
      showMessage('add-weight-message', 'Failed to add weight.', true);
    }
  });

  // Profile Picture Picker Logic
  // Elements
  const profilePicImg = document.getElementById('profile-pic');
  const navProfilePicImg = document.getElementById('nav-profile-pic');
  const profilePicModal = document.getElementById('profile-pic-popup');
  const profilePicModalClose = document.getElementById('close-profile-pic-popup');
  const profilePicChoices = document.getElementById('profile-pic-options');

  // List of available profile picture image URLs
  const availableProfilePics = [
    'https://lh3.googleusercontent.com/d/1VQ34T98i1BPS_Injn0tZNnLUaPFxrgUk',
    'https://lh3.googleusercontent.com/d/13uy-7VA6XvHZ1mnoVYlWUFdMxh282WIh',
    'https://lh3.googleusercontent.com/d/1ZuUtUBB76Z9JPCttXMu30NkaFx3TcZ9n',
    'https://lh3.googleusercontent.com/d/1FHTnbs63mMZ6KlyMxS3xzz5gCiYakh0x',
    'https://lh3.googleusercontent.com/d/1FIedfZiv3DPO8OQodNABWT0Efi9FFzVH',
    'https://lh3.googleusercontent.com/d/1PkogS6SqWxAXKyAetfupVMayNrwQx-O5',
    'https://lh3.googleusercontent.com/d/1u_XKLMNQNMTv-wx_IUI9SWC0NSECw4V0',
    'https://lh3.googleusercontent.com/d/1EDZnp2MgKGV-UGu5OzgaST44C08sdJSV'
  ];

  // Set profile picture from localStorage or default
  function setProfilePicFromStorageOrDefault() {
    let selectedPic = localStorage.getItem('selectedProfilePic');
    if (!selectedPic) {
      selectedPic = availableProfilePics[0];
    }
    if (profilePicImg) profilePicImg.src = selectedPic;
    if (navProfilePicImg) {
      navProfilePicImg.src = selectedPic;
      navProfilePicImg.style.display = 'inline-block';
    }
  }
  setProfilePicFromStorageOrDefault();

  // Helper to populate the modal with selectable images
  function populateProfilePicChoices() {
    profilePicChoices.innerHTML = '';
    availableProfilePics.forEach(picUrl => {
      const img = document.createElement('img');
      img.src = picUrl;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      img.style.cursor = 'pointer';
      img.style.border = '2px solid #ccc';
      img.addEventListener('click', () => {
        localStorage.setItem('selectedProfilePic', picUrl);
        if (profilePicImg) profilePicImg.src = picUrl;
        if (navProfilePicImg) {
          navProfilePicImg.src = picUrl;
          navProfilePicImg.style.display = 'inline-block';
        }
        profilePicModal.style.display = 'none';
      });
      profilePicChoices.appendChild(img);
    });
  }

  // Open modal on profile image click
  if (profilePicImg && profilePicModal) {
    profilePicImg.addEventListener('click', () => {
      populateProfilePicChoices();
      profilePicModal.style.display = 'flex';
    });
  }

  // Close modal on close button click
  if (profilePicModalClose) {
    profilePicModalClose.addEventListener('click', () => {
      profilePicModal.style.display = 'none';
    });
  }

  if (profilePicModal) {
    profilePicModal.addEventListener('click', (e) => {
      if (e.target === profilePicModal) {
        profilePicModal.style.display = 'none';
      }
    });
  }

  // Weight Progress Line Graph Logic
  const weightGraphSVG = document.getElementById('weight-graph');

  // Responsive: re-render graph on SVG/container resize
  let lastGraphData = null;
  function renderWeightGraph(weightsData) {
    if (!weightGraphSVG) return;
    weightGraphSVG.innerHTML = '';
    if (!userData) return;
    lastGraphData = weightsData;

    // Get actual rendered SVG size
    let width = weightGraphSVG.clientWidth || 1200;
    let height = weightGraphSVG.clientHeight || 250;
    // If width/height are 0 (SVG not visible yet), fallback to attributes
    if (!width) {
      const wAttr = weightGraphSVG.getAttribute('width');
      width = wAttr && wAttr.endsWith('px') ? parseInt(wAttr) : 1200;
    }
    if (!height) {
      const hAttr = weightGraphSVG.getAttribute('height');
      height = hAttr && hAttr.endsWith('px') ? parseInt(hAttr) : 250;
    }

    // Calculate the 4-month range
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = [];
    let d = new Date(startMonth);
    while (d <= endMonth) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    // Map weights by date string for fast lookup
    const weightMap = {};
    (weightsData || []).forEach(w => {
      const dateStr = new Date(w.date).toDateString();
      weightMap[dateStr] = w.weight;
    });

    // Prepare data for graph: array of {date, weight|null}
    const graphData = days.map(date => ({
      date,
      weight: weightMap[date.toDateString()] !== undefined ? weightMap[date.toDateString()] : null
    }));

    // Calculate yMin and yMax from the data
    const weightsOnly = graphData.filter(d => d.weight !== null).map(d => d.weight);
    let yMin = 0, yMax = 100;
    if (weightsOnly.length > 0) {
      yMin = Math.floor(Math.min(...weightsOnly) / 5) * 5 - 5;
      yMax = Math.ceil(Math.max(...weightsOnly) / 5) * 5 + 5;
      if (yMin < 0) yMin = 0;
      if (yMax - yMin < 20) yMax = yMin + 20;
    }
    const margin = { left: 36, right: 16, top: 24, bottom: 32 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const yScale = (w) => margin.top + plotH - ((w - yMin) / (yMax - yMin)) * plotH;
    const xScale = (i) => {
      if (graphData.length === 1) return margin.left + plotW / 2;
      return margin.left + (plotW * (i / (graphData.length - 1)));
    };

    //Draw grid lines
    // Horizontal grid lines every 5kg
    for (let yVal = yMin; yVal <= yMax; yVal += 5) {
      const y = yScale(yVal);
      const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gridLine.setAttribute('x1', margin.left);
      gridLine.setAttribute('x2', width - margin.right);
      gridLine.setAttribute('y1', y);
      gridLine.setAttribute('y2', y);
      gridLine.setAttribute('stroke', '#e5e7eb');
      gridLine.setAttribute('stroke-width', '1');
      gridLine.setAttribute('class', 'weight-graph-grid-line');
      weightGraphSVG.appendChild(gridLine);
    }
    // Vertical grid lines at the start of each month
    let monthCursor = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
    while (monthCursor <= endMonth) {
      // Find index of first day of this month in graphData
      const idx = graphData.findIndex(d => d.date.getFullYear() === monthCursor.getFullYear() && d.date.getMonth() === monthCursor.getMonth() && d.date.getDate() === 1);
      if (idx !== -1) {
        const x = xScale(idx);
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', x);
        gridLine.setAttribute('x2', x);
        gridLine.setAttribute('y1', margin.top);
        gridLine.setAttribute('y2', height - margin.bottom);
        gridLine.setAttribute('stroke', '#e5e7eb');
        gridLine.setAttribute('stroke-width', '1');
        gridLine.setAttribute('class', 'weight-graph-grid-line');
        weightGraphSVG.appendChild(gridLine);
      }
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }

    // Draw line (only connect consecutive days with data)
    let linePath = '';
    let prevHadData = false;
    graphData.forEach((d, i) => {
      if (d.weight !== null) {
        const x = xScale(i);
        const y = yScale(d.weight);
        if (!prevHadData) {
          linePath += `M${x},${y}`;
        } else {
          linePath += ` L${x},${y}`;
        }
        prevHadData = true;
      } else {
        prevHadData = false;
      }
    });
    if (linePath) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', linePath);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#3b82f6');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('class', 'weight-graph-line');
      weightGraphSVG.appendChild(path);
    }

    // Draw dots for days with data
    graphData.forEach((d, i) => {
      if (d.weight !== null) {
        const x = xScale(i);
        const y = yScale(d.weight);
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', 6);
        dot.setAttribute('fill', '#fff');
        dot.setAttribute('stroke', '#3b82f6');
        dot.setAttribute('stroke-width', '2');
        dot.setAttribute('class', 'weight-graph-dot');
        dot.style.cursor = 'pointer';

        // Hover label logic
        let labelGroup = null;
        dot.addEventListener('mouseenter', (e) => {
          // Remove any existing hover label
          const prev = weightGraphSVG.querySelector('.weight-graph-hover-label-group');
          if (prev) prev.remove();
          labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          labelGroup.setAttribute('class', 'weight-graph-hover-label-group');

          // Create text element first to measure its size
          const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          labelText.setAttribute('x', x);
          labelText.setAttribute('y', y - 22);
          labelText.setAttribute('text-anchor', 'middle');
          labelText.setAttribute('font-size', '15');
          labelText.setAttribute('font-weight', 'bold');
          labelText.setAttribute('fill', '#222');
          labelText.setAttribute('class', 'weight-graph-hover-label');
          labelText.textContent = d.weight + ' kg';
          labelGroup.appendChild(labelText);
          weightGraphSVG.appendChild(labelGroup);

          // After appending, get bounding box for background
          const bbox = labelText.getBBox();
          const padding = 6;
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', bbox.x - padding);
          rect.setAttribute('y', bbox.y - padding);
          rect.setAttribute('width', bbox.width + 2 * padding);
          rect.setAttribute('height', bbox.height + 2 * padding);
          rect.setAttribute('rx', 6);
          rect.setAttribute('fill', '#fff');
          rect.setAttribute('stroke', '#3b82f6');
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('opacity', '0.95');
          // Insert rect before text
          labelGroup.insertBefore(rect, labelText);
        });
        dot.addEventListener('mouseleave', (e) => {
          if (labelGroup && labelGroup.parentNode) labelGroup.parentNode.removeChild(labelGroup);
        });
        weightGraphSVG.appendChild(dot);
      }
    });

    // Draw y-axis labels (weights)
    for (let yVal = yMin; yVal <= yMax; yVal += 5) {
      const y = yScale(yVal);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', margin.left - 8);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '13');
      label.setAttribute('fill', '#888');
      label.setAttribute('class', 'weight-graph-axis-label');
      label.textContent = yVal;
      weightGraphSVG.appendChild(label);
    }
    // Draw x-axis labels (months)
    monthCursor = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
    while (monthCursor <= endMonth) {
      const idx = graphData.findIndex(d => d.date.getFullYear() === monthCursor.getFullYear() && d.date.getMonth() === monthCursor.getMonth() && d.date.getDate() === 1);
      if (idx !== -1) {
        const x = xScale(idx);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', height - margin.bottom + 22);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '13');
        label.setAttribute('fill', '#888');
        label.setAttribute('class', 'weight-graph-axis-label');
        label.textContent = monthCursor.toLocaleString('default', { month: 'short' });
        weightGraphSVG.appendChild(label);
      }
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
  }

  // Responsive: observe SVG resize and re-render graph
  if (window.ResizeObserver && weightGraphSVG) {
    const ro = new ResizeObserver(() => {
      if (lastGraphData) renderWeightGraph(lastGraphData);
    });
    ro.observe(weightGraphSVG);
  }

  // Call renderWeightGraph whenever userData or weights change
  function updateAllUserData(user) {
    displayUserData(user);
    generateCalendar(user.weights);
    renderWeightGraph(user.weights);
  }

  // Patch fetchUserData to use updateAllUserData
  fetchUserData = async function() {
    if (!authToken) {
      showSignupSection();
      return;
    }
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        localStorage.removeItem('authToken');
        authToken = null;
        showSignupSection();
        return;
      }
      userData = await response.json();
      updateAllUserData(userData);
      showMainContent();
    } catch (error) {
      console.error('Error fetching user data:', error);
      showMessage('main-content', 'Failed to load user data.', true);
      localStorage.removeItem('authToken');
      authToken = null;
      showSignupSection();
    }
  };

  // Initial fetch of user data on page load
  fetchUserData();

  // Smooth scroll for nav links
  const navLinks = document.querySelectorAll('#main-nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').replace('#', '');
      const section = document.getElementById(targetId);
      if (section) {
        e.preventDefault();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Optionally update the hash in the URL
        history.replaceState(null, '', `#${targetId}`);
      }
    });
  });

  // Ensure login is the default page on first load
  function showDefaultPage() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
      // If already logged in, show main content
      showMainContent();
    } else {
      // Not logged in: always show login section as default
      showLoginSection();
      if (location.hash !== '#login-section') {
        location.hash = '#login-section';
      }
    }
  }

  // Run default page logic on load
  showDefaultPage();

  // Trigger default search in Google CSE for meal suggestions
  function triggerDefaultMealSearch() {
    if (window.google && window.google.search && window.google.search.cse) {
      const element = google.search.cse.element.getElement('gcse-search');
      if (element) {
        element.execute('high protein low calorie recipes under 400 calories');
      }
    }
  }

  // Wait for CSE to load, then trigger default search
  function tryTriggerMealSearch() {
    if (window.google && window.google.search && window.google.search.cse &&
        google.search.cse.element && google.search.cse.element.getElement('gcse-search')) {
      triggerDefaultMealSearch();
    } else {
      setTimeout(tryTriggerMealSearch, 500);
    }
  }

  // When main content is shown, trigger the default search
  const mainContent = document.getElementById('main-content');
  const observer = new MutationObserver(() => {
    if (mainContent.style.display !== 'none') {
      tryTriggerMealSearch();
    }
  });
  observer.observe(mainContent, { attributes: true, attributeFilter: ['style'] });
});
