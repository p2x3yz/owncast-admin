/*
- chat
- chat input / message sender
- preview of video
- viewers/time chart
- users list
- "health"?

*/
import React, { useState, useEffect, useContext } from 'react';
import { Typography, Tooltip, Row, Col } from 'antd';
import classNames from 'classnames';
import { ColumnsType } from 'antd/es/table';
import format from 'date-fns/format';

import { CHAT_HISTORY, fetchData, FETCH_INTERVAL } from '../../utils/apis';
import { isEmptyObject } from '../../utils/format';

import ChatMessages from './chat';
import { ServerStatusContext } from '../../utils/server-status-context';
import Chart from '../chart';
import { StreamLifecycleContext } from '../../utils/stream-lifecycle-context';
import VideoEmbed from './video';

const { Title } = Typography;

export default function Dashboard() {
  const streamLifecycle = useContext(StreamLifecycleContext);
  const { viewersOverTime } = streamLifecycle || {};

  return (
    <div className="dashboard">
      <Title>You are Live!</Title>
      <Typography>Here's what's happening on your stream.</Typography>
      <Row gutter={[16, 16]} className="section">
        <Col className="messages-column" span={12} sm={24} md={24} lg={12}>
          <div className="video-embed-container">
            <VideoEmbed />
          </div>
          <div>
            <Chart title="Viewers" data={viewersOverTime} color="#2087E2" unit="" />
          </div>
          <div>health?</div>
          <div>viewers list?</div>
        </Col>
        <Col className="utils-column" span={12} xs={24} sm={24} md={24} lg={12}>
          <ChatMessages />
        </Col>
      </Row>

      {/* <div className="chat-sender"></div> */}
    </div>
  );
}
