export const startCamera = async (): Promise<MediaStream | null> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        return stream;
    } catch (error) {
        console.error("Error accessing the camera: ", error);
        return null;
    }
};

export const stopCamera = (stream: MediaStream): void => {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
};