let poseLandmarker = null;
let isReady = false;

async function initLandmarker() {
  try {
    const { PoseLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm');

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    isReady = true;
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
}

self.onmessage = async function(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      await initLandmarker();
      break;

    case 'detect':
      if (!isReady || !poseLandmarker) {
        self.postMessage({ type: 'error', error: 'Landmarker not ready' });
        return;
      }

      try {
        const { imageBitmap } = data;

        const startTime = performance.now();
        const result = poseLandmarker.detectForVideo(imageBitmap, startTime);
        const processingTime = performance.now() - startTime;

        if (result.landmarks && result.landmarks.length > 0) {
          self.postMessage({
            type: 'result',
            landmarks: result.landmarks[0],
            processingTime,
          });
        } else {
          self.postMessage({ type: 'no_pose' });
        }
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
      break;

    case 'destroy':
      if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
        isReady = false;
      }
      break;
  }
};
