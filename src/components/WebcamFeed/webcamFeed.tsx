import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as faceapi from "@vladmandic/face-api";
import useCamera from "../../hooks/useCamera";

interface DetectedFace {
  id: string;
  name?: string;
  age: number;
  gender: string;
  topExpression?: string;
  box: faceapi.Box;
}

const SMOOTHING_WINDOW = 8;
const smoothData: Record<string, { ages: number[]; genders: string[] }> = {};

const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const { isCameraActive, startCamera, stopCamera } = useCamera();
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading models...");

  const labeledFaceDescriptors = useRef<faceapi.LabeledFaceDescriptors[]>([]);
  const faceMatcher = useRef<faceapi.FaceMatcher | null>(null);

  /** ------------------------- INIT ------------------------- */
  useEffect(() => {
    const init = async () => {
      setLoadingMessage("Loading TensorFlow backend...");
      await tf.setBackend("webgl");
      await tf.ready();

      const MODEL_URL = process.env.PUBLIC_URL + "/models";

      setLoadingMessage("Loading face-api models...");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setLoadingMessage("Loading known faces...");
      await loadKnownFaces();
      setModelsLoaded(true);
      setLoadingMessage("");
    };

    async function loadKnownFaces() {
      const labels = ["christine", "James"];
      for (const label of labels) {
        try {
          const imgUrl = `${process.env.PUBLIC_URL}/known/${label}.jpg`;
          const img = await faceapi.fetchImage(imgUrl);

          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection?.descriptor) {
            labeledFaceDescriptors.current.push(
              new faceapi.LabeledFaceDescriptors(label, [detection.descriptor])
            );
          }
        } catch (err) {
          console.warn(`Error loading ${label}:`, err);
        }
      }

      faceMatcher.current = new faceapi.FaceMatcher(labeledFaceDescriptors.current, 0.5);
    }

    init();
  }, []);

  /** ------------------------- FACE DETECTION ------------------------- */
  const detectFaces = async (source: HTMLVideoElement | HTMLImageElement) => {
    if (!modelsLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const displaySize = {
      width: source instanceof HTMLVideoElement ? source.videoWidth : source.width,
      height: source instanceof HTMLVideoElement ? source.videoHeight : source.height,
    };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(source, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withAgeAndGender()
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const detectedFaces: DetectedFace[] = resized.map((det, i) => {
      const id = `face-${i}`;
      const age = det.age ?? 0;
      const gender = det.gender ?? "unknown";

      if (!smoothData[id]) smoothData[id] = { ages: [], genders: [] };
      smoothData[id].ages.push(age);
      smoothData[id].genders.push(gender);
      if (smoothData[id].ages.length > SMOOTHING_WINDOW) smoothData[id].ages.shift();
      if (smoothData[id].genders.length > SMOOTHING_WINDOW) smoothData[id].genders.shift();

      const avgAge = smoothData[id].ages.reduce((a, b) => a + b, 0) / smoothData[id].ages.length;
      const genderVotes = smoothData[id].genders.reduce<Record<string, number>>((acc, g) => {
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {});
      const smoothedGender = Object.entries(genderVotes).sort((a, b) => b[1] - a[1])[0][0];

      let name = "Unknown";
      if (det.descriptor && faceMatcher.current) {
        const bestMatch = faceMatcher.current.findBestMatch(det.descriptor);
        name = bestMatch.label;
      }

      let topExpression: string | undefined;
      if (det.expressions) {
        topExpression = Object.entries(det.expressions).sort(([, v1], [, v2]) => v2 - v1)[0][0];
      }

      const { x, y, width, height } = det.detection.box;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = "red";
      ctx.font = "16px Arial";
      ctx.fillText(
        `${name}, ${avgAge.toFixed(0)} yrs, ${smoothedGender}${topExpression ? `, ${topExpression}` : ""}`,
        x,
        y > 20 ? y - 5 : y + 15
      );

      return { id, name, age: avgAge, gender: smoothedGender, topExpression, box: det.detection.box };
    });

    setFaces(detectedFaces);
  };

  /** ------------------------- CAMERA HANDLERS ------------------------- */
  const handleStart = async () => {
    if (!videoRef.current) return;
    await startCamera(videoRef);

    videoRef.current.onloadedmetadata = () => {
      videoRef.current?.play();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (videoRef.current) detectFaces(videoRef.current);
      }, 300);
    };
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    stopCamera(videoRef);
    if (canvasRef.current) canvasRef.current.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setFaces([]);
  };

  /** ------------------------- IMAGE UPLOAD ------------------------- */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    const img = await faceapi.bufferToImage(event.target.files[0]);
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    await detectFaces(img);
  };

  useEffect(() => () => handleStop(), []);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", maxWidth: "640px" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%" }} />

      <div style={{ marginTop: "10px" }}>
        {!modelsLoaded ? (
          <button disabled>{loadingMessage || "Loading..."}</button>
        ) : (
          <>
            {!isCameraActive && <button onClick={handleStart}>Start Camera</button>}
            {isCameraActive && <button onClick={handleStop}>Stop Camera</button>}
            <button onClick={() => fileInputRef.current?.click()}>Upload Image</button>
          </>
        )}
        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
      </div>

      <div style={{ marginTop: "10px" }}>
        {faces.map((face) => (
          <div key={face.id} style={{ border: "1px solid red", padding: "5px", margin: "5px" }}>
            <p>Name: {face.name}</p>
            <p>Age: {face.age.toFixed(0)}</p>
            <p>Gender: {face.gender}</p>
            {face.topExpression && <p>Emotion: {face.topExpression}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebcamFeed;
