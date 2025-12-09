const fs = require('fs');
const https = require('https');

const files = [
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
    path: './public/models/tiny_face_detector_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
    path: './public/models/tiny_face_detector_model-shard1'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
    path: './public/models/face_landmark_68_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
    path: './public/models/face_landmark_68_model-shard1'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
    path: './public/models/face_recognition_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
    path: './public/models/face_recognition_model-shard1'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/age_gender_model-weights_manifest.json',
    path: './public/models/age_gender_model-weights_manifest.json'
  },
  {
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/age_gender_model-shard1',
    path: './public/models/age_gender_model-shard1'
  }
];

if (!fs.existsSync('./public/models')) {
  fs.mkdirSync('./public/models', { recursive: true });
}

function download(file) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(file.path);
    https.get(file.url, response => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log("Downloading face-api.js models...");
  for (const file of files) {
    console.log("Downloading:", file.path);
    await download(file);
  }
  console.log("✅ All models downloaded!");
})();
