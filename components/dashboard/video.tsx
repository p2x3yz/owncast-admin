import React, { useRef, useEffect, useState, useContext } from 'react';
import { NEXT_PUBLIC_API_HOST } from '../../utils/apis';
import useWindowSize from '../../utils/hook-windowresize';
import { ServerStatusContext } from '../../utils/server-status-context';

const LOCAL_EMBED_VIDEO_URL = `${NEXT_PUBLIC_API_HOST}/index-video-only.html`;

export default function VideoEmbed() {
  const context = useContext(ServerStatusContext);
  const { online } = context || {};
  if (!online) {
    return null;
  }

  const containerRef = useRef<HTMLIFrameElement>(null);
  const { width: windowWidth } = useWindowSize();

  const [frameHeight, setFrameHeight] = useState(100);

  useEffect(() => {
    // set height of video frame to 16/9 ratio
    const frameWidth = containerRef?.current?.scrollWidth;
    setFrameHeight((frameWidth * 9) / 16);
  }, [windowWidth]);

  return (
    <iframe
      title="video preview"
      scrolling="no"
      ref={containerRef}
      src={LOCAL_EMBED_VIDEO_URL}
      style={{ height: `${frameHeight}px` }}
    />
  );
}
