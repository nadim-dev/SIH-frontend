import benchScaleImage from "../assets/bench_scale.png";

export const instrumentImages = {
  bench_scale: benchScaleImage,

  platform_scale:
    "/images/instruments/platform-scale.png",

  weighbridge:
    "/images/instruments/weighbridge.png",

  analytical_balance:
    "/images/instruments/analytical-balance.png"
};

export const getInstrumentImage = (instrumentType) => {
  const imageKeyByType = {
    "Bench Scale": "bench_scale",
    "Counter / Retail Scale": "bench_scale",
    "Platform Scale": "platform_scale",
    "Weighbridge / Vehicle Scale": "weighbridge",
    "Precision / Analytical Balance": "analytical_balance",
  };

  return instrumentImages[imageKeyByType[instrumentType]] || instrumentImages.bench_scale;
};
