import React from "react";
import { Composition } from "remotion";
import { PorcupineForest } from "./PorcupineForest";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PorcupineForest"
        component={PorcupineForest}
        durationInFrames={220}
        fps={30}
        width={1080}
        height={608}
      />
    </>
  );
};
