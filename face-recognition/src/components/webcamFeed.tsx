import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadFaceApiModels } from "../utils/loadModels";

const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadFaceApiModels();
  }, []);

  const startWebcam = async () => {
    setIsRunning(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    runDetection();
  };

  const stopWebcam = () => {
    setIsRunning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const runDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;

    const loop = async () => {
      if (!isRunning) return;

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withAgeAndGender();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      detections.forEach(det => {
        const { x, y, width, height } = det.detection.box;
        const age = det.age.toFixed(0);
        const gender = det.gender;

        // Draw bounding box
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw label
        ctx.font = "18px Arial";
        ctx.fillStyle = "yellow";
        ctx.fillText(`Age: ${age} | ${gender}`, x, y - 10);
      });

      requestAnimationFrame(loop);
    };

    loop();
  };

  return (
    <div className="text-center">
      <h2>Webcam Face Recognition</h2>

      <div style={{ position: "relative", display: "inline-block" }}>
        <video ref={videoRef} style={{ borderRadius: "8px" }} />
        <canvas 
          ref={canvasRef} 
          style={{ position: "absolute", top: 0, left: 0 }} 
        />
      </div>

      <div className="mt-3">
        {!isRunning ? (
          <button className="btn btn-primary" onClick={startWebcam}>
            Start Webcam
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopWebcam}>
            Stop Webcam
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamFeed;
