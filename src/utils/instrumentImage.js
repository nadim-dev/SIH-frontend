import benchScaleImage from "../assets/bench_scale.png";
import platformScaleImage from "../assets/platform_scale.png"
import retailScaleImage from "../assets/retail_scale.png"
export const instrumentImages = {
  bench_scale: benchScaleImage,

  platform_scale:
    platformScaleImage,

  retail_scale:retailScaleImage,

  weighbridge:
    "/images/instruments/weighbridge.png",

  analytical_balance:
    "/images/instruments/analytical-balance.png"
};

export const getInstrumentImage = (instrumentType) => {
  const imageKeyByType = {
    "Bench Scale": "bench_scale",
    "Counter / Retail Scale": "retail_scale",
    "Platform Scale": "platform_scale",
    "Weighbridge / Vehicle Scale": "bench_scale",
    "Precision / Analytical Balance": "bench_scale",
  };

  return instrumentImages[imageKeyByType[instrumentType]] || instrumentImages.bench_scale;
};
