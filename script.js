const app = document.getElementById('app');
const svgImages = document.querySelectorAll('.svg-image');


const squares = Array.from(svgImages).map(svg => {
  return {
    lat: parseFloat(svg.getAttribute('data-lat')),
    lng: parseFloat(svg.getAttribute('data-lng')),
    id: svg.getAttribute('id')
  };
});

let isPopupOpen = false;
let userLat;
let userLng;

// Function to show popup for location error
function showLocationErrorPopup() {
  const popupContainer = document.getElementById('popupContainer');
  popupContainer.innerHTML = `
    <div class="popup">
      Ik heb geen toegang tot je locatie, <br> Dat heb ik wel nodig.
    </div>`;
  popupContainer.style.display = 'block';
}

// Function to hide popup
function hidePopup() {
  document.getElementById('popupContainer').style.display = 'none';
  isPopupOpen = false;
}

// Function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to show popup with arrow pointing towards the object
function showPopupWithArrow(angle) {
  const popupContainer = document.getElementById('popupContainer');
  popupContainer.innerHTML = `
    <div class="popup" style="padding: 120px;">
      <div class="arrow" style="transform: rotate(${angle}deg); "></div>
      <button id="closeButton" style="position: absolute; bottom: 10px; left: 10px; right: 10px; border: none; background-color: hsla(29,100%,50%,1); color: #fff; border-radius: 5px; padding: 10px; font-family: borna; font-size: 15px;">Close</button>
    </div>`;
  popupContainer.style.display = 'block';

  isPopupOpen = true;

  // Add event listener to the close button
  const closeButton = document.getElementById('closeButton');
  closeButton.addEventListener('click', function handleCloseButtonClick() {
    hidePopup();
    closeButton.removeEventListener('click', handleCloseButtonClick);
  });
}

// Function to update object sizes and handle arrow display
function updateSizes() {
  navigator.geolocation.getCurrentPosition(position => {
    if (!isPopupOpen) { // Only update when popup is closed
      hidePopup();
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      squares.forEach(square => {
        const squareElement = document.getElementById(square.id);
        if (squareElement) {
          const distance = calculateDistance(userLat, userLng, square.lat, square.lng);

          // Adjust the size based on the distance
          let size;
          if (distance <= 10) {
            size = 400; // Max size at 10 meters
          } else if (distance >= 200) {
            size = 30; // Min size at 200 meters
          } else {
            // Linearly interpolate size between 10 and 200 meters
            size = 400 - (distance - 10) * (370 / 190); // Adjust this value as needed
          }

          // Apply the size to the element
          squareElement.style.width = `${size}px`;
          squareElement.style.height = `${size}px`;

          // Apply pulsing animation only when the user is within 30 meters
          if (distance <= 30) {
            squareElement.classList.add('pulsing');
          } else {
            squareElement.classList.remove('pulsing');
          }

          // Add click event listener to show arrow pointing towards the object
          squareElement.addEventListener('click', () => {
            const angle = Math.atan2(square.lat - userLat, square.lng - userLng) * (180 / Math.PI);
            showPopupWithArrow(angle);
          });
        }
      });
    }
  }, error => {
    console.error('Error finding your location:', error.message);
    showLocationErrorPopup();
    // Reset square sizes to their minimum
    squares.forEach(square => {
      const squareElement = document.getElementById(square.id);
      if (squareElement) {
        squareElement.style.width = '30px';
        squareElement.style.height = '30px';
        squareElement.classList.remove('pulsing'); // Remove pulsing animation
      }
    });
  });
}

// Function to continuously update arrow direction
function updateArrowDirection() {
  setInterval(() => {
    squares.forEach(square => {
      const squareElement = document.getElementById(square.id);
      if (squareElement && isPopupOpen) {
        const angle = Math.atan2(square.lat - userLat, square.lng - userLng) * (180 / Math.PI);
        const arrowElement = squareElement.querySelector('.arrow');
        if (arrowElement) {
          arrowElement.style.transform = `rotate(${angle}deg)`;
        }
      }
    });
  }, 200);
}

window.onload = () => {
  updateSizes();
  updateArrowDirection();
};
setInterval(updateSizes, 500); // Update location of the visitor every second.
