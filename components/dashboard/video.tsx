

import React, { useRef, useEffect, useState } from 'react';
import { NEXT_PUBLIC_API_HOST } from '../../utils/apis';
import useWindowSize from '../../utils/hook-windowresize';

const LOCAL_EMBED_VIDEO_URL = `${NEXT_PUBLIC_API_HOST}/index-video-only.html`;

export default function VideoEmbed() {
  const containerRef = useRef<HTMLIFrameElement>(null);
  const { width: windowWidth} = useWindowSize();

  const [frameHeight, setFrameHeight] = useState(250);

  useEffect(() => {
    // set height of video frame to 16/9 ratio
    const frameWidth = containerRef?.current?.scrollWidth;
    setFrameHeight((frameWidth * 9) / 16);
  }, [windowWidth]) 

  return (
    <iframe scrolling="no" ref={containerRef} src={LOCAL_EMBED_VIDEO_URL} style={{ height: `${frameHeight}px` }}></iframe>
  );
}
