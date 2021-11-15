// Init JQuery
var script = document.createElement("script");
script.src = "https://code.jquery.com/jquery-3.4.1.min.js";
script.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(script);

// Put variables in global scope to make them available to the browser console.
let mediaRecorder;
let isRecording = false;
let commercialLeft = 10; // Number of Commercial
let recordedVideoName;
const videoParts = [];
const emotionTimes = {};

const iframeMain = document.getElementById("commercial-iframe");

alert("Duyguyu hissettiğiniz zaman butona basınız.");

// Video Constraints
const constraints = (window.constraints = {
  audio: false,
  video: true,
});

// After the User Camera is turned on
function handleSuccess(stream) {
  // Show Camera to User in WebPage
  const video = document.querySelector("video");
  video.srcObject = stream;

  // Make Stream Available to Browser Console
  window.stream = stream;
}

// Init User Camera
async function init() {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  handleSuccess(stream);
}

// Start Recording the Video
function startRecord() {
  // If 'parts' has Previous Recorded Video
  // Clear for New Video
  clearSavedVideoParts();

  // Record
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start(1000);
  mediaRecorder.ondataavailable = function (e) {
    videoParts.push(e.data);
  };
}

function clearSavedVideoParts() {
  // Clear Array
  while (videoParts.length > 0) {
    videoParts.pop();
  }
}

// Save Recorded Video
function saveVideo() {
  stopRecording();
  postVideoToServer(getVideoData());
}

// Stop Recording
function stopRecording() {
  mediaRecorder.stop();
}

// Turn Off User Camera
function turnOffUserCamera() {
  stream.getTracks()[0].stop();
}

function getUserUniqueID() {
  // Get Name of User Directory From URL
  const urlParams = new URLSearchParams(window.location.search);
  const userUniqueID = urlParams.get("d");
  return userUniqueID;
}

// Store Recorded Video in FormData
function getVideoData() {
  // Combine Video Parts then
  // Put it in a Blob
  const blob = new Blob(videoParts, {
    type: "video/webm",
  });

  const formData = new FormData();
  // Append User Directory Path, Video will be Saved There
  formData.append("userUniqueID", getUserUniqueID());
  formData.append("video", blob, recordedVideoName);
  formData.append("emotionTimes", JSON.stringify(emotionTimes));

  return formData;
}

// Post Video To Server
function postVideoToServer(formData) {
  $.ajax({
    type: "POST",
    url: "/upload",
    data: formData,
    processData: false,
    contentType: false,
  }).done(function () {
    if (commercialLeft == 0) {
      uploadTxt.innerHTML =
        "Veriler Aktarıldı. Katılımınız için teşekkürler.<br>Sekmeyi Kapatabilirsiniz.";
    }
  });
}

// Post Survey To Server
function postSurveyToServer(surveyData) {
  $.ajax({
    type: "POST",
    url: "/survey",
    data: JSON.stringify(surveyData),
    processData: false,
    contentType: "application/json; charset=utf-8",
  });
}

// Commercials Youtube IDs
const suprisingIDs = {
  Ulker: "hbcSNatJTWo",
  Fiat: "uQm05ngHbpo",
  Ps3: "L0ET0gSewYM",
  Renault: "6rEyLw2AGvw",
};
const joyIDs = {
  EvianBaby: "ikuiByrF6rs",
  Camlica: "jJBjjtxpi80",
  Opet: "54HUz14LTFk",
  JohnWest: "gP92j-uEnps",
};
const scaryIDs = {
  Tire: "54U6BgYuJMY",
  DirtDevil: "aDaupp76r60",
  Audi: "02eJUk7Mbsg",
};
const disgustingIDs = {
  IceCream: "erh2ngRZxs0",
  Teeth: "OoiryG6dJXY",
  Parodontax: "OE1BSrMldsM",
  Koroplast: "sAunmHlH8ZU",
};
const emotionalIDs = {
  Turkcell: "Y5wW-AprkEE",
  SiseCam: "5uO_D169BfA",
  Bonus: "5bxAUXmpETg",
};

// Youtube Player Parameters
// https://developers.google.com/youtube/player_parameters
const videoParameters =
  "?enablejsapi=1&modestbranding=1&showinfo=0&rel=0&disablekb=1&iv_load_policy=3&fs=0&color=white&controls=0";

// User will Watch 2 Commercials for Every Category
function getCommercialCategory() {
  if (commercialLeft <= 2) return scaryIDs;
  if (commercialLeft <= 4) return disgustingIDs;
  if (commercialLeft <= 6) return joyIDs;
  if (commercialLeft <= 8) return emotionalIDs;
  if (commercialLeft <= 10) return suprisingIDs;
}

// Get Random Commercial's Youtube ID
function getRandomCommercialID(category) {
  // Get All Commercial Names in Given Category
  const commercialNames = Object.keys(category);
  // Select Random Commercial Name
  const randomCommercialName = commercialNames[Math.floor(Math.random() * commercialNames.length)];
  // Get Selected Commercial ID with its Name
  const randomCommercialID = category[randomCommercialName];
  // Delete Selected Commercial, the Same Commercial Will Not be Shown Again
  delete category[randomCommercialName];

  recordedVideoName = randomCommercialName;
  return randomCommercialID;
}

// Generate Video URL
function videoURL() {
  return (
    "https://www.youtube.com/embed/" +
    getRandomCommercialID(getCommercialCategory()) +
    videoParameters
  );
}

// First Random Commercial
iframeMain.src = videoURL();

// Show Next Commercial to User
function showNextVideo() {
  // Update Commercial Source With Random Generated URL
  player.getIframe().src = videoURL();
  onYouTubeIframeAPIReady();
}

// Youtube Player API
// https://developers.google.com/youtube/iframe_api_reference
var tag = document.createElement("script");
tag.id = "iframe-yt";
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player("commercial-iframe", {
    events: {
      onStateChange: onPlayerStateChange,
    },
  });
}

// Start/Stop Record With Commercial Status
function onPlayerStateChange(status) {
  if (status.data == 1 && !isRecording) {
    startRecord();
    isRecording = true;
    // Show Emotion Buttons When Commercial Start Playing
    emotionBtnsContainer.style.display = "flex";
    // Clear Emoiton Times Before New Commercial
    for (let key in emotionTimes) delete emotionTimes[key];
  }
  // Save Recorded Video After Commercial End
  else if (status.data == 0) {
    saveVideo();
    isRecording = false;
    commercialLeft--;
    // Hide Emotion Buttons
    emotionBtnsContainer.style.display = "none";
    // Show 'Have You Watched Before' Survey
    watchedSurvey.style.display = "block";
  }
}

function handleEmotionBtns(btn) {
  let emotion = btn.currentTarget.id;
  let currentTime = player.playerInfo.currentTime;

  // Check Emotion is Already In 'emotionTimes'
  if (emotion in emotionTimes) {
    let i = 1;
    // Modify Emotion Name to Prevent Conflict
    // Ex: scary1, scary2, scary3
    while (true) {
      if (emotion + i.toString() in emotionTimes) {
        i++;
        continue;
      }
      emotionTimes[emotion + i.toString()] = parseInt(currentTime);
      break;
    }
  } else {
    emotionTimes[btn.currentTarget.id] = parseInt(currentTime);
  }
}

function handleWatchedBtns(haveUserWatchedBefore) {
  watchedBefore[recordedVideoName] = haveUserWatchedBefore;
  // Hide 'Have You Watched Before' Survey
  watchedSurvey.style.display = "none";
  // Show next commercials if any
  if (commercialLeft != 0) showNextVideo();
  else {
    // Turn Off User Camera and Hide It
    turnOffUserCamera();
    document.getElementById("cameraContainer").style.display = "none";
    // Hide Commercial Iframe
    iframeMain.style.display = "none";
    // Show Survey
    userSurvey.style.display = "block";
    // Post 'watchedBefore' Data to Server
    postSurveyToServer(watchedBefore);
  }
}

function handleUserSurvey(e) {
  // Prevent Page Reload
  e.preventDefault();

  // Get User Answers From Survey
  const userAnswers = {
    userUniqueID: getUserUniqueID(),
    surveyName: "userSurvey.json",
  };
  for (idx = 1; idx < 9; idx++) {
    userAnswers[document.getElementById(`q${idx}`).innerHTML] = document.querySelector(
      `input[name="q${idx}"]:checked`
    ).value;
  }

  // Hide Survey After Post
  userSurvey.style.display = "none";

  // Show Info Text 'uploadtxt'
  uploadTxt.style.display = "block";

  postSurveyToServer(userAnswers);
}

// 'Have User Watched Commercial Before' Buttons
const watchedSurvey = document.getElementById("watchedSurvey");
document.getElementById("yes-btn").addEventListener("click", () => handleWatchedBtns(true));
document.getElementById("no-btn").addEventListener("click", () => handleWatchedBtns(false));

// Survey to Display After all Commercials are Over
const userSurvey = document.getElementById("userSurvey");
userSurvey.addEventListener("submit", (e) => handleUserSurvey(e));
const watchedBefore = {
  userUniqueID: getUserUniqueID(),
  surveyName: "watchedBefore.json",
};
const uploadTxt = document.getElementById("upload-txt");

const emotionBtnsContainer = document.getElementById("emotionBtns");
const emotionBtns = document.querySelectorAll(".emotion-btn");
// addEventListener for Every Emotion Buttons
for (let i = 0; i < emotionBtns.length; i++) {
  emotionBtns[i].addEventListener("click", (e) => handleEmotionBtns(e));
}

init();
