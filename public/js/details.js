// Init JQuery
var script = document.createElement("script");
script.src = "https://code.jquery.com/jquery-3.4.1.min.js";
script.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(script);

const startBtn = document.getElementById("start-btn");
// Get Permission From the User to Use the Camera
window.onload = function () {
  init();
};

// Video Constraints
const constraints = (window.constraints = {
  audio: false,
  video: true,
});

// After the User Camera is turned on
function handleSuccess(stream) {
  // Show Start Button
  startBtn.style.display = "block";

  // Remove Camera Placeholder Text
  const cameraPlaceholder = document.getElementById("camera-txt");
  cameraPlaceholder.innerHTML = "";

  // Show Camera to User in WebPage
  const video = document.querySelector("video");
  video.srcObject = stream;

  // Make Stream Available to Browser Console
  window.stream = stream;
}

// If the User Camera gives an Error
function handleError(error) {
  // If the User does not Allow the use of Camera
  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    errorMsg("Kamera kullanımını reddettiniz lütfen sayfayı yenileyin.");
  } else {
    errorMsg(`Hata: ${error.name}`, error);
  }
}

// Show Error Message in Browser Console
function errorMsg(msg, error) {
  const errorElement = document.querySelector("#errorMsg");
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== "undefined") {
    console.error(error);
  }
}

// Init User Camera
async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (err) {
    handleError(err);
  }
}

// Send User Details to Server
function handleForm(e) {
  e.preventDefault();

  // Disable Submit Button For Prevent Multiple Submit
  document.querySelector(`button[type="submit"]`).disabled = true;

  // Get User Details From Form
  const gender = document.querySelector(`input[name="gender"]:checked`).value;
  const age = document.querySelector(`input[name="age"]`).value;

  const userDetails = {
    gender: gender,
    age: age,
  };

  // TODO
  $.ajax({
    type: "POST",
    url: "/userDetails",
    data: JSON.stringify(userDetails),
    processData: false,
    contentType: "application/json; charset=utf-8",
    success: function (url) {
      // Redirect User After Directory Created
      window.location.href = url;
    },
  });
}

document.getElementById("userDetails").addEventListener("submit", (e) => handleForm(e));
