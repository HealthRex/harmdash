'use client';

import dynamic from "next/dynamic";

const PlotComponent = dynamic(() => import("react-plotly.js"), {
  ssr: false
});

export default PlotComponent;
