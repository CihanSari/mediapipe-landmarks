import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([{ client: "Chrome" }]);
function testSupport(supportedDevices) {
  const deviceDetector = new DeviceDetector();
  const detectedDevice = deviceDetector.parse(navigator.userAgent);
  let isSupported = false;
  for (const device of supportedDevices) {
    if (device.client !== undefined) {
      const re = new RegExp(`^${device.client}$`);
      if (!re.test(detectedDevice.client.name)) {
        continue;
      }
    }
    if (device.os !== undefined) {
      const re = new RegExp(`^${device.os}$`);
      if (!re.test(detectedDevice.os.name)) {
        continue;
      }
    }
    isSupported = true;
    break;
  }
  if (!isSupported) {
    alert(
      `This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
        `is not well supported at this time, continue at your own risk.`
    );
  }
}
const controls = window;
const drawingUtils = window;
const mpFaceMesh = window;
const config = {
  locateFile: (file) => {
    return (
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@` +
      `${mpFaceMesh.VERSION}/${file}`
    );
  },
};
// Our input frames will come from here.
const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const controlsElement = document.getElementsByClassName("control-panel")[0];
const canvasCtx = canvasElement.getContext("2d");
/**
 * Solution options.
 */
const solutionOptions = {
  selfieMode: true,
  enableFaceGeometry: false,
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  nIterations: 3,
  downloadCanvas: true,
};
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector(".loading");
spinner.ontransitionend = () => {
  spinner.style.display = "none";
};
const faceMesh = new mpFaceMesh.FaceMesh(config);
faceMesh.setOptions(solutionOptions);
faceMesh.onResults(onResults);

class CreateLandmarks {
  sourceList = [];
  outputList = [];
  idx = 0;
  idxOutputCounter = 0;
  setNextImage;
  constructor() {
    {
      const self = this;
      document.getElementById("inp").onchange = function () {
        self.setFiles(this.files);
      };
    }
    const img = document.createElement("img");
    img.onload = function () {
      const aspect = this.height / this.width;
      let width, height;
      if (window.innerWidth > window.innerHeight) {
        height = window.innerHeight;
        width = height / aspect;
      } else {
        width = window.innerWidth;
        height = width * aspect;
      }
      canvasElement.width = width;
      canvasElement.height = height;
      faceMesh.send({ image: img });
    };
    this.setNextImage = () => {
      if (this.idx == this.sourceList.length) {
        // Exhausted
        this.downloadLandmarks();
      } else {
        img.src = this.sourceList[this.idx].url;
      }
    };
  }
  setFiles(files) {
    this.sourceList = [];
    this.outputList = [];
    for (let idxFile = 0; idxFile < files.length; idxFile += 1) {
      this.sourceList.push({
        fileName: files[idxFile].name,
        url: URL.createObjectURL(files[idxFile]),
      });
    }
    this.idx = 0;
    this.setNextImage();
  }

  setOutput(landmarks) {
    if (this.idxOutputCounter < solutionOptions.nIterations) {
      this.idxOutputCounter += 1;
      this.setNextImage();
    } else {
      this.outputList.push({
        fileName: this.sourceList[this.idx].fileName,
        landmarks,
        image: canvasElement.toDataURL("image/jpeg"),
      });
      this.idx += 1;
      this.idxOutputCounter = 0;
    }
  }

  downloadLandmarks() {
    this.outputList.forEach((output, idx) => {
      setTimeout(() => {
        const { fileName, landmarks, image } = output;
        const baseFileName = fileName.substring(0, fileName.lastIndexOf("."));
        const jsonFileName = baseFileName + ".json";
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(landmarks));
        const dlAnchorElem = document.getElementById("downloadAnchorElem");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", jsonFileName);
        dlAnchorElem.click();
        if (solutionOptions.downloadCanvas) {
          const imageFileName = baseFileName + "_out.jpg";
          dlAnchorElem.setAttribute("href", image);
          dlAnchorElem.setAttribute("download", imageFileName);
          dlAnchorElem.click();
        }
      }, idx * 250);
      document.getElementById("inp").value = "";
    });
  }
}

const createLandmarks = new CreateLandmarks();
function onResults(results) {
  // Hide the spinner.
  document.body.classList.add("loaded");
  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_RIGHT_EYE,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_RIGHT_EYEBROW,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_LEFT_EYE,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_LEFT_EYEBROW,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_FACE_OVAL,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpFaceMesh.FACEMESH_LIPS,
        { color: "#E0E0E0" }
      );
      if (solutionOptions.refineLandmarks) {
        drawingUtils.drawConnectors(
          canvasCtx,
          landmarks,
          mpFaceMesh.FACEMESH_RIGHT_IRIS,
          { color: "#FF3030" }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          landmarks,
          mpFaceMesh.FACEMESH_LEFT_IRIS,
          { color: "#30FF30" }
        );
      }
      // write landmarks
      createLandmarks.setOutput(landmarks);
      createLandmarks.setNextImage();
    }
  }
  canvasCtx.restore();
}
// Present a control panel through which the user can manipulate the solution
// options.
new controls.ControlPanel(controlsElement, solutionOptions)
  .add([
    new controls.StaticText({
      title: "MediaPipe face mesh for landmarks",
      text: "test",
    }),
    new controls.Toggle({
      title: "Download face mesh images",
      field: "downloadCanvas",
    }),
    new controls.Slider({
      title: "Number of iterations",
      field: "nIterations",
      range: [1, 20],
      step: 1,
    }),
    new controls.Slider({
      title: "Min Detection Confidence",
      field: "minDetectionConfidence",
      range: [0, 1],
      step: 0.01,
    }),
    new controls.Slider({
      title: "Min Tracking Confidence",
      field: "minTrackingConfidence",
      range: [0, 1],
      step: 0.01,
    }),
  ])
  .on((x) => {
    const options = x;
    videoElement.classList.toggle("selfie", options.selfieMode);
    faceMesh.setOptions(options);
  });

// Add control panel entry
const sourceSelector = document.getElementById("sourceSelector");
document.getElementsByClassName("control-panel")[1].appendChild(sourceSelector);
sourceSelector.style.display = "block";
