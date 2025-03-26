document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const moodOptions = document.querySelectorAll('.mood-option');
  const moodNote = document.getElementById('mood-note');
  const saveMoodBtn = document.getElementById('save-mood');
  const suggestionsList = document.querySelector('.suggestions-list');
  const emptyState = document.querySelector('.empty-state');
  const moodEntries = document.querySelector('.mood-entries');
  let selectedMood = null;
  let moodChart = null;

  // Mood selection
  moodOptions.forEach(option => {
      option.addEventListener('click', function() {
          moodOptions.forEach(opt => opt.classList.remove('selected'));
          this.classList.add('selected');
          selectedMood = parseInt(this.getAttribute('data-mood'));
      });
  });

  // Save mood entry
  saveMoodBtn.addEventListener('click', async function() {
      if (!selectedMood) {
          alert('Please select a mood first');
          return;
      }

      const moodData = {
          mood: selectedMood,
          note: moodNote.value,
          date: new Date().toISOString()
      };

      try {
          const response = await fetch('/api/moods', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(moodData)
          });

          if (response.ok) {
              const savedMood = await response.json();
              updateUI(savedMood);
              resetForm();
          } else {
              throw new Error('Failed to save mood');
          }
      } catch (error) {
          console.error('Error:', error);
          alert('Failed to save mood. Please try again.');
      }
  });

  // Update UI with new mood entry
  function updateUI(moodData) {
      // Add to suggestions
      emptyState.style.display = 'none';
      const suggestion = generateSuggestion(moodData.mood);
      suggestionsList.prepend(createSuggestionCard(suggestion));

      // Add to history
      moodEntries.prepend(createMoodEntry(moodData));

      // Update chart
      updateChart();
  }

  // Reset form after submission
  function resetForm() {
      moodOptions.forEach(opt => opt.classList.remove('selected'));
      moodNote.value = '';
      selectedMood = null;
  }

  // Generate suggestions based on mood
  function generateSuggestion(moodLevel) {
      const suggestions = {
          1: [
              { title: "Deep Breathing Exercise", content: "Try the 4-7-8 technique: Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Repeat 4 times." },
              { title: "Reach Out", content: "Contact a friend or family member you trust. You don't have to go through this alone." },
              { title: "Professional Help", content: "Consider reaching out to a mental health professional for support." }
          ],
          2: [
              { title: "Go for a Walk", content: "A 10-minute walk outside can help shift your perspective and boost endorphins." },
              { title: "Gratitude Journal", content: "Write down three things you're grateful for, no matter how small." },
              { title: "Music Therapy", content: "Listen to uplifting music that usually improves your mood." }
          ],
          3: [
              { title: "Creative Activity", content: "Engage in a creative activity like drawing, writing, or playing music." },
              { title: "Learn Something New", content: "Watch a tutorial or read about something you're curious about." },
              { title: "Organize Your Space", content: "Tidy up a small area of your environment for a sense of accomplishment." }
          ],
          4: [
              { title: "Share Your Energy", content: "Do something kind for someone else to spread your positive mood." },
              { title: "Physical Activity", content: "Channel your good energy into exercise or dancing." },
              { title: "Plan Something Fun", content: "Make plans for an activity you'll look forward to." }
          ],
          5: [
              { title: "Reflect on What's Working", content: "Journal about what's contributing to your excellent mood." },
              { title: "Savor the Moment", content: "Practice mindfulness to fully appreciate this positive state." },
              { title: "Set New Goals", content: "Use this positive energy to set or work toward personal goals." }
          ]
      };

      const moodSuggestions = suggestions[moodLevel];
      return moodSuggestions[Math.floor(Math.random() * moodSuggestions.length)];
  }

  // Create suggestion card element
  function createSuggestionCard(suggestion) {
      const card = document.createElement('div');
      card.className = 'suggestion-card';
      card.innerHTML = `
          <h4>${suggestion.title}</h4>
          <p>${suggestion.content}</p>
      `;
      return card;
  }

  // Create mood entry element
  function createMoodEntry(entry) {
      const moodIcons = {
          1: '<i class="fas fa-sad-tear"></i>',
          2: '<i class="fas fa-frown"></i>',
          3: '<i class="fas fa-meh"></i>',
          4: '<i class="fas fa-smile"></i>',
          5: '<i class="fas fa-grin-beam"></i>'
      };

      const date = new Date(entry.date).toLocaleString();
      
      const entryElement = document.createElement('div');
      entryElement.className = 'mood-entry';
      entryElement.innerHTML = `
          <div class="date">${date}</div>
          <div class="mood">${moodIcons[entry.mood]} Mood level: ${entry.mood}/5</div>
          ${entry.note ? `<div class="note">${entry.note}</div>` : ''}
      `;
      
      return entryElement;
  }

  // Initialize and update chart
  async function updateChart() {
      try {
          const response = await fetch('/api/moods');
          const moods = await response.json();
          
          const dates = moods.map(m => new Date(m.date).toLocaleDateString()).reverse();
          const moodLevels = moods.map(m => m.mood).reverse();
          
          const ctx = document.getElementById('mood-chart').getContext('2d');
          
          if (moodChart) {
              moodChart.destroy();
          }
          
          moodChart = new Chart(ctx, {
              type: 'line',
              data: {
                  labels: dates,
                  datasets: [{
                      label: 'Mood Level',
                      data: moodLevels,
                      borderColor: '#5e72e4',
                      backgroundColor: 'rgba(94, 114, 228, 0.1)',
                      borderWidth: 2,
                      tension: 0.1,
                      fill: true
                  }]
              },
              options: {
                  responsive: true,
                  scales: {
                      y: {
                          beginAtZero: false,
                          min: 1,
                          max: 5,
                          ticks: {
                              stepSize: 1
                          }
                      }
                  }
              }
          });
      } catch (error) {
          console.error('Error fetching mood data:', error);
      }
  }

  // Load initial data
  updateChart();
  loadRecentMoods();

  // Load recent mood entries
  async function loadRecentMoods() {
      try {
          const response = await fetch('/api/moods');
          const moods = await response.json();
          
          // Display last 5 moods in history
          const recentMoods = moods.slice(-5).reverse();
          recentMoods.forEach(mood => {
              moodEntries.appendChild(createMoodEntry(mood));
          });
          
          // Display last suggestion if available
          if (moods.length > 0) {
              emptyState.style.display = 'none';
              const lastMood = moods[moods.length - 1];
              const suggestion = generateSuggestion(lastMood.mood);
              suggestionsList.appendChild(createSuggestionCard(suggestion));
          }
      } catch (error) {
          console.error('Error loading recent moods:', error);
      }
  }
});