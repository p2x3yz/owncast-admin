import React, { useState, useEffect, useContext } from 'react';
import { Skeleton, Card, Statistic, Row, Col } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatDistanceToNow, formatRelative } from 'date-fns';
import { ServerStatusContext } from '../utils/server-status-context';
import LogTable from '../components/log-table';
import Offline from './offline-notice';

import { LOGS_WARN, fetchData, FETCH_INTERVAL } from '../utils/apis';
import { formatIPAddress, isEmptyObject } from '../utils/format';
import NewsFeed from '../components/news-feed';
import Dashboard from '../components/dashboard';

function streamDetailsFormatter(streamDetails) {
  return (
    <ul className="statistics-list">
      <li>
        {streamDetails.videoCodec || 'Unknown'} @ {streamDetails.videoBitrate || 'Unknown'} kbps
      </li>
      <li>{streamDetails.framerate || 'Unknown'} fps</li>
      <li>
        {streamDetails.width} x {streamDetails.height}
      </li>
    </ul>
  );
}

export default function Home() {
  const serverStatusData = useContext(ServerStatusContext);
  const { broadcaster, serverConfig: configData } = serverStatusData || {};
  const { remoteAddr, streamDetails } = broadcaster || {};

  const encoder = streamDetails?.encoder || 'Unknown encoder';

  const [logsData, setLogs] = useState([]);
  const getLogs = async () => {
    try {
      const result = await fetchData(LOGS_WARN);
      setLogs(result);
    } catch (error) {
      console.log('==== error', error);
    }
  };
  const getMoreStats = () => {
    getLogs();
  };

  useEffect(() => {
    getMoreStats();

    let intervalId = null;
    intervalId = setInterval(getMoreStats, FETCH_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (isEmptyObject(configData) || isEmptyObject(serverStatusData)) {
    return (
      <>
        <Skeleton active />
        <Skeleton active />
        <Skeleton active />
      </>
    );
  }

  if (!broadcaster) {
    return <Dashboard />;
    // return <Offline logs={logsData} config={configData} />;
  }

  // map out settings
  const videoQualitySettings = serverStatusData?.currentBroadcast?.outputSettings?.map(setting => {
    const { audioPassthrough, videoPassthrough, audioBitrate, videoBitrate, framerate } = setting;

    const audioSetting = audioPassthrough
      ? `${streamDetails.audioCodec || 'Unknown'}, ${streamDetails.audioBitrate} kbps`
      : `${audioBitrate || 'Unknown'} kbps`;

    const videoSetting = videoPassthrough
      ? `${streamDetails.videoBitrate || 'Unknown'} kbps, ${streamDetails.framerate} fps ${
          streamDetails.width
        } x ${streamDetails.height}`
      : `${videoBitrate || 'Unknown'} kbps, ${framerate} fps`;

    return (
      <div className="stream-details-item-container">
        <Statistic
          className="stream-details-item"
          title="Outbound Video Stream"
          value={videoSetting}
        />
        <Statistic
          className="stream-details-item"
          title="Outbound Audio Stream"
          value={audioSetting}
        />
      </div>
    );
  });

  // inbound
  const { viewerCount, sessionPeakViewerCount } = serverStatusData;

  const streamAudioDetailString = `${streamDetails.audioCodec}, ${
    streamDetails.audioBitrate || 'Unknown'
  } kbps`;

  const broadcastDate = new Date(broadcaster.time);

  return (
    <div className="home-container">
      <Dashboard />
      <br />
      <LogTable logs={logsData} pageSize={5} />
    </div>
  );
}
