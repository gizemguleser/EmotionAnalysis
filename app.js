// Imports
require("dotenv").config();
const express = require("express");
const uuid = require("uuid");
const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

// AWS Credentials
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

// Init Server
const app = express();
const port = process.env.PORT || 3000;

// Listen on port 3000
app.listen(port, () => console.info(`Listening on port ${port}`));

// Parse JSON Bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/js", express.static(__dirname + "public/js"));
app.use("/img", express.static(__dirname + "public/img"));

// Set Views
app.set("views", "./views");
app.set("view engine", "ejs");

// Index Page
app.get("/", (req, res) => {
  res.render("index");
});

// Details Page
app.get("/details", (req, res) => {
  res.render("details");
});

// Commercials Page
app.get("/commercials", (req, res) => {
  res.render("commercials");
});

// Init AWS S3
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// Post JSON Data to AWS S3
async function uploadJSON(folderName, filename, data) {
  try {
    await s3
      .putObject({
        Bucket: bucketName,
        Key: folderName + "/" + filename,
        Body: JSON.stringify(data),
        ContentType: "application/json; charset=utf-8",
      })
      .promise();
  } catch (err) {
    throw err;
  }
}

// Post Recorded Video To AWS S3
const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    key: function (req, file, cb) {
      // userUniqueID is folderName in S3
      cb(null, req.body.userUniqueID + "/" + file.originalname + ".webm");
    },
  }),
  limits: {
    // Max Video Size
    fileSize: 100000000, // 200000000 Bytes = 200 MB
  },
});

// Get User Details From Client
app.post("/userDetails", async function (req, res) {
  const userUniqueID = uuid.v4();

  // Send Data to AWS S3
  await uploadJSON(userUniqueID, "userDetails.json", req.body);

  // Send WebPage Url For Redirect Client
  return res.send("/commercials?d=" + userUniqueID);
});

// Get Video From Client
app.post("/upload", uploadS3.single("video"), async function (req, res) {
  // Get Second that the User Clicks on the Feeling Buttons.
  const emotions = JSON.parse(req.body.emotionTimes);
  const emotionFileName = req.file.originalname + "-EmotionTimes.json";

  // Send Emotion Times to AWS S3
  await uploadJSON(req.body.userUniqueID, emotionFileName, emotions);
  return res.status(200).send("Video Uploaded");
});

// Get Survey From Client
app.post("/survey", async function (req, res) {
  await uploadJSON(req.body.userUniqueID, req.body.surveyName, req.body);
  return res.status(200).send("Survey Uploaded");
});
