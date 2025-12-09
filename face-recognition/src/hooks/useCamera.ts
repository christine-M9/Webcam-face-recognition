import { useState } from 'react';

const useCamera = () => {
    const [isCameraActive, setIsCameraActive] = useState(false);

    const startCamera = async (videoRef: React.RefObject<HTMLVideoElement | null>) => {
        if (!videoRef.current) return;
        if (isCameraActive) return; // Prevent double start

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setIsCameraActive(true);
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    };

    const stopCamera = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
        if (!videoRef.current) return;

        const stream = videoRef.current.srcObject as MediaStream | null;

        // Stop all tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Clear video element
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoRef.current.currentTime = 0;

        setIsCameraActive(false);
    };

    return { isCameraActive, startCamera, stopCamera };
};

export default useCamera;
