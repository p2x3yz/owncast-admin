import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Table, Typography, Button, Divider, Space } from 'antd';
import {
  fetchData,
  getGithubRelease,
  UPDATER_OPTIONS,
  upgradeVersionAvailable,
  STATUS,
} from '../utils/apis';
import { AutoUpdateOptions } from '../types/auto-update-options';

import AutoUpdater from '../components/auto-updater';

const { Title, Text } = Typography;

function AssetTable(assets) {
  const data = Object.values(assets) as object[];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, entry) => <a href={entry.browser_download_url}>{text}</a>,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: text => `${(text / 1024 / 1024).toFixed(2)} MB`,
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey={record => record.id}
      size="large"
      pagination={false}
    />
  );
}

export default function Upgrade() {
  const [newVersionNumber, setNewVersionNumber] = useState(null);
  const [autoUpdateOptions, setAutoUpdateOptions] = useState<AutoUpdateOptions>(null);

  async function checkForUpgrade() {
    try {
      const statusResult = await fetchData(STATUS);
      const { versionNumber } = statusResult;

      // Determine if an upgrade is available given the current version number.
      const result = '0.0.11'; // await upgradeVersionAvailable(versionNumber);
      // if (versionNumber !== result) {
      setNewVersionNumber(result);
      // }
    } catch (error) {
      console.error('==== error', error);
      setNewVersionNumber(null);
    }
  }

  async function getAutoUpdateOptions() {
    try {
      const response = await fetchData(UPDATER_OPTIONS);
      setAutoUpdateOptions(response);
    } catch (e) {
      console.error(e);
    }
  }

  const [release, setRelease] = useState(null);

  const [showUpdaterModal, setShowUpdaterModal] = useState(false);
  function enableUpdaterModal() {
    setShowUpdaterModal(true);
  }

  function disableUpdaterModal() {
    setShowUpdaterModal(false);
  }

  function EnableAutoUpdater() {
    return (
      autoUpdateOptions &&
      autoUpdateOptions.supportsUpdate &&
      newVersionNumber && (
        <Space direction="vertical">
          <Title level={2}>Update to v{newVersionNumber}</Title>
          Depending on your server configuration some or all of the update process may be
          accomplished via the web updater.
          <Button onClick={enableUpdaterModal}>Start Updater</Button>
          {showUpdaterModal && (
            <AutoUpdater
              closeModal={disableUpdaterModal}
              version={newVersionNumber}
              options={autoUpdateOptions}
            />
          )}
        </Space>
      )
    );
  }

  const getRelease = async () => {
    try {
      const result = await getGithubRelease();
      setRelease(result);
    } catch (error) {
      console.log('==== error', error);
    }
  };

  useEffect(() => {
    getRelease();
    getAutoUpdateOptions();
    checkForUpgrade();
  }, []);

  if (!release || !release.name) {
    return (
      <div>
        <Text type="warning">
          Error: Unable to fetch the new version. There may be an issue querying Github.
        </Text>
      </div>
    );
  }

  return (
    <div className="upgrade-page">
      <Title level={2}>
        <a href={release.html_url}>{release.name}</a>
      </Title>
      <Title level={5}>{new Date(release.created_at).toDateString()}</Title>
      <ReactMarkdown>{release.body}</ReactMarkdown>
      <EnableAutoUpdater />
      <Divider />
      <h3>Downloads</h3>
      <AssetTable {...release.assets} />
    </div>
  );
}
