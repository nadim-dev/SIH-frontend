export const compressImage = (sourceFile, {
  maxSize = 1 * 1024 * 1024,
  maxDimension = 2000,
  quality = 0.85,
  minQuality = 0.55,
  qualityStep = 0.1,
} = {}) => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(sourceFile);

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

    const createBlob = (currentQuality) => canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Could not process the selected image."));
      if (blob.size <= maxSize || currentQuality <= minQuality) {
        resolve(new File([blob], sourceFile.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      } else createBlob(currentQuality - qualityStep);
    }, "image/jpeg", currentQuality);

    createBlob(quality);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("Please choose a valid image."));
  };
  image.src = objectUrl;
});
