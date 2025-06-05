// (Flask code removed - this file should only contain JavaScript)

// Get DOM elements
const hamburger = document.getElementById('hamburger');
const sidebar = document.querySelector('.sidebar');
const profileIcon = document.getElementById('profileIcon');
const profileDropdownWrapper = profileIcon ? profileIcon.parentElement : null;

// Hamburger menu
if (hamburger && sidebar) {
  hamburger.addEventListener('click', (e) => {
    sidebar.classList.toggle('open');
    e.stopPropagation();
  });

  // Optional: close sidebar if user clicks outside of sidebar
  document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// Profile dropdown
if (profileIcon && profileDropdownWrapper) {
  profileIcon.addEventListener('click', function(e) {
    profileDropdownWrapper.classList.toggle('active');
    e.stopPropagation();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!profileDropdownWrapper.contains(e.target)) {
      profileDropdownWrapper.classList.remove('active');
    }
  });
}
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-dropdown-wrapper').forEach(wrapper => {
    const link = wrapper.querySelector('.nav-link');
    link.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.nav-dropdown-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('active');
      });
      wrapper.classList.toggle('active');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown-wrapper').forEach(w => w.classList.remove('active'));
  });
});

// Calendar rendering logic
document.addEventListener('DOMContentLoaded', function() {
  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', (e) => {
      sidebar.classList.toggle('open');
      e.stopPropagation();
    });
    document.addEventListener('click', (event) => {
      if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  

  

  // Nav dropdowns
  document.querySelectorAll('.nav-dropdown-wrapper').forEach(wrapper => {
    const link = wrapper.querySelector('.nav-link');
    link.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.nav-dropdown-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('active');
      });
      wrapper.classList.toggle('active');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown-wrapper').forEach(w => w.classList.remove('active'));
  });

  // Calendar logic
  let calendarYear, calendarMonth;
  function fetchAndRenderCalendar(year, month) {
    fetch(`http://127.0.0.1:5000/events?year=${year}&month=${month+1}`)
      .then(response => response.json())
      .then(data => {
        renderCalendar(data.events, year, month);
        updateCalendarControls(year, month);
      })
      .catch(error => {
        const eventsList = document.getElementById('events-list');
        if (eventsList) {
          eventsList.innerHTML = '<li>Could not load events.</li>';
        }
        console.error('Error fetching events:', error);
      });
  }

  function renderCalendar(events, year, month) {
    const eventsByDate = {};
    events.forEach(event => {
      if (!eventsByDate[event.start]) eventsByDate[event.start] = [];
      eventsByDate[event.start].push(event);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const calendar = document.createElement('table');
    calendar.className = 'calendar-table';

    // Header
    const headerRow = document.createElement('tr');
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    calendar.appendChild(headerRow);

    // Days
    let date = 1 - firstDay.getDay();
    while (date <= lastDay.getDate()) {
      const row = document.createElement('tr');
      for (let i = 0; i < 7; i++) {
        const cell = document.createElement('td');
        if (date > 0 && date <= lastDay.getDate()) {
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
          cell.innerHTML = `<div class="calendar-date">${date}</div>`;
          if (eventsByDate[dateStr]) {
            eventsByDate[dateStr].forEach(ev => {
              cell.innerHTML += `<div class="calendar-event">
                <a href="${ev.htmlLink}" target="_blank" rel="noopener noreferrer">
                  <strong>${ev.summary}</strong>
                </a>
              </div>`;
            });
          }
        }
        row.appendChild(cell);
        date++;
      }
      calendar.appendChild(row);
    }

    const eventsList = document.getElementById('events-list');
    if (eventsList) {
      eventsList.innerHTML = '';
      eventsList.appendChild(calendar);
    }
    const monthLabel = document.getElementById('calendar-month-label');
    if (monthLabel) {
      monthLabel.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
    }
  }

  function updateCalendarControls(year, month) {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const now = new Date();
    const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
    if (prevBtn) {
      prevBtn.style.visibility = isCurrentMonth ? 'hidden' : 'visible';
      prevBtn.disabled = isCurrentMonth;
    }
    if (nextBtn) {
      nextBtn.disabled = false;
    }
  }

  // Calendar controls
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth();
  fetchAndRenderCalendar(calendarYear, calendarMonth);

  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  if (prevBtn) {
    prevBtn.onclick = function() {
      if (calendarMonth > 0) {
        calendarMonth--;
      } else {
        calendarMonth = 11;
        calendarYear--;
      }
      const today = new Date();
      if (calendarYear < today.getFullYear() || (calendarYear === today.getFullYear() && calendarMonth < today.getMonth())) {
        calendarYear = today.getFullYear();
        calendarMonth = today.getMonth();
      }
      fetchAndRenderCalendar(calendarYear, calendarMonth);
    };
  }
  if (nextBtn) {
    nextBtn.onclick = function() {
      calendarMonth++;
      if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
      }
      fetchAndRenderCalendar(calendarYear, calendarMonth);
    };
  }

  // Recurring Google Calendar events
  function getIntegrationStatus(eventId, integration) {
    return localStorage.getItem(`integration_${eventId}_${integration}`) === 'true';
  }
  function setIntegrationStatus(eventId, integration, value) {
    localStorage.setItem(`integration_${eventId}_${integration}`, value ? 'true' : 'false');
  }

  fetch('http://127.0.0.1:5000/recurring-events')
    .then(response => response.json())
    .then(data => {
      const recurringList = document.getElementById('recurring-events-list');
recurringList.innerHTML = '';
if (data.events.length === 0) {
  recurringList.innerHTML = '<tr><td colspan="6" style="text-align:center;">No recurring meetings found.</td></tr>';
} else {
  data.events.forEach(event => {
    const wrikeStatus = getIntegrationStatus(event.id, 'wrike');
    const workdayStatus = getIntegrationStatus(event.id, 'workday');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${event.summary || 'No Title'}</strong></td>
      <td><span class="event-classification">${event.classification}</span></td>
      <td>${formatCadence(event)}</td>
      <td>${formatEventDateTime(event.start)}</td>
      <td>${event.location ? event.location : ''}</td>
      <td style="text-align:center;">
        <input type="checkbox" class="integration-toggle" data-integration="wrike" data-event-id="${event.id}" ${wrikeStatus ? 'checked' : ''}>
        <span class="integration-status">${wrikeStatus ? '✅' : '❌'}</span>
      </td>
      <td style="text-align:center;">
        <input type="checkbox" class="integration-toggle" data-integration="workday" data-event-id="${event.id}" ${workdayStatus ? 'checked' : ''}>
        <span class="integration-status">${workdayStatus ? '✅' : '❌'}</span>
      </td>
    `;
    recurringList.appendChild(tr);
  });
}

      // Attach event listeners after rendering
      document.querySelectorAll('.integration-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
          const integration = this.dataset.integration;
          const eventId = this.dataset.eventId;
          setIntegrationStatus(eventId, integration, this.checked);

          // Update status icon
          const statusSpan = this.parentElement.querySelector('.integration-status');
          statusSpan.textContent = this.checked ? '✅' : '❌';



          fetch('http://127.0.0.1:5000/set-integration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: eventId,
              integration: integration,
              enabled: this.checked
            })
          });
        });
      });
    });

  // Google Calendar connection status
  function updateCalendarStatus() {
    fetch('http://127.0.0.1:5000/status')
      .then(res => res.json())
      .then(data => {
        const status = document.getElementById('calendar-status');
        const btn = document.getElementById('toggle-calendar-btn');
        if (data.connected) {
          status.textContent = "Connected to Google Calendar";
          btn.textContent = "Disconnect";
          btn.onclick = () => {
            fetch('http://127.0.0.1:5000/disconnect', {method: 'POST'})
              .then(() => {
                status.textContent = "Disconnected";
                btn.textContent = "Connect";
                window.location.reload();
              });
          };
        } else {
          status.textContent = "Not connected to Google Calendar";
          btn.textContent = "Connect";
          btn.onclick = () => {
            fetch('http://127.0.0.1:5000/events')
              .then(() => window.location.reload());
          };
        }
      });
  }
  updateCalendarStatus();
});

// Recurring events rendering logic

// Any other features...
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function formatEventDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Options for US format with time zone abbreviation
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
}

function formatCadence(event) {
  // Google Calendar recurrence is usually in event.recurrence[0], e.g. "RRULE:FREQ=WEEKLY;BYDAY=TH"
  if (!event.recurrence || !event.recurrence.length) return '';
  const rule = event.recurrence[0];
  if (!rule.startsWith('RRULE:')) return '';
  const parts = rule.replace('RRULE:', '').split(';').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  let freq = parts.FREQ || '';
  let byday = parts.BYDAY || '';
  let byhour = '';
  let byminute = '';
  // Try to extract time from event.start
  if (event.start && event.start.length > 10) {
    const date = new Date(event.start);
    byhour = date.getHours();
    byminute = date.getMinutes();
  }
  // Map FREQ and BYDAY to readable text
  let freqText = '';
  if (freq === 'WEEKLY') {
    const days = {
      MO: 'Mondays', TU: 'Tuesdays', WE: 'Wednesdays', TH: 'Thursdays',
      FR: 'Fridays', SA: 'Saturdays', SU: 'Sundays'
    };
    let dayText = days[byday] || '';
    let timeText = byhour !== '' ? `at ${formatTime12hr(byhour, byminute)}` : '';
    freqText = `Weekly${dayText ? ' on ' + dayText : ''}${timeText ? ' ' + timeText : ''}`;
  } else if (freq === 'DAILY') {
    let timeText = byhour !== '' ? `at ${formatTime12hr(byhour, byminute)}` : '';
    freqText = `Daily${timeText ? ' ' + timeText : ''}`;
  } else if (freq === 'MONTHLY') {
    let timeText = byhour !== '' ? `at ${formatTime12hr(byhour, byminute)}` : '';
    freqText = `Monthly${timeText ? ' ' + timeText : ''}`;
  }
  return freqText;
}

function formatTime12hr(hour, minute) {
  const ampm = hour >= 12 ? 'pm' : 'am';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:${minute.toString().padStart(2, '0')}${ampm}`;
}// Add any additional JavaScript functionality here

  // ...all your other logic (calendar, nav, etc)...;

document.addEventListener('DOMContentLoaded', function() {
  // DARK MODE
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.onclick = function() {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }

  // PROFILE DROPDOWN
  const profileIcon = document.getElementById('profileIcon');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileIcon && profileDropdown) {
    profileIcon.onclick = function(e) {
      e.stopPropagation();
      profileDropdown.classList.toggle('active');
    };
    document.addEventListener('click', function() {
      profileDropdown.classList.remove('active');
    });
  }
});
