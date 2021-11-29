import { Input, Spin, Button, Space, Modal, Typography } from 'antd';
import React, { useState, useContext } from 'react';
import { BaseType } from 'antd/lib/typography/Base';
import PropTypes from 'prop-types';
import { UPDATER_EXECUTE, INSTANCE_FORCE_QUIT, STATUS, fetchData } from '../utils/apis';
import { AlertMessageContext } from '../utils/alert-message-context';
import { AutoUpdateOptions } from '../types/auto-update-options';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

interface Props {
  closeModal: (e) => void;
  version: string;
  options: AutoUpdateOptions;
}
// eslint-disable-next-line no-shadow
enum UpgradeStatus {
  NONE,
  UPDATING,
  UPDATED,
  FAILED,
}

// eslint-disable-next-line no-shadow
enum RestartStatus {
  NONE,
  AUTO_RESTART_PENDING,
  AUTO_RESTART_CONFIRM,
  AUTO_RESTART_EXECUTING,
  AUTO_RESTART_MAYBE_COMPLETE,
  MANUAL_RESTART_PENDING,
}

function UpdateButton(props) {
  const { updateState, performUpdate, version } = props;

  if (updateState === UpgradeStatus.UPDATED) {
    return null;
  }

  return (
    <Button onClick={performUpdate} type="primary" loading={updateState === UpgradeStatus.UPDATING}>
      Begin Update to v{version}
    </Button>
  );
}

UpdateButton.propTypes = {
  updateState: PropTypes.number.isRequired,
  performUpdate: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
};

function UpdateConsole(props) {
  const { updateState, updateLog, getUpdateStatusText } = props;

  return (
    <Spin spinning={updateState === UpgradeStatus.UPDATING}>
      <TextArea
        autoSize={{ minRows: 7, maxRows: 10 }}
        value={updateLog}
        readOnly
        style={{ backgroundColor: 'rgb(38 38 48)', borderColor: 'rgb(150, 150, 150)' }}
      />
      <Text strong>{getUpdateStatusText()}</Text>
    </Spin>
  );
}

UpdateConsole.propTypes = {
  updateState: PropTypes.number.isRequired,
  updateLog: PropTypes.string.isRequired,
  getUpdateStatusText: PropTypes.func.isRequired,
};

function RestartButton(props) {
  const { restartStatus, restartButtonPressed } = props;

  const buttonText =
    restartStatus === RestartStatus.AUTO_RESTART_PENDING ? 'Tell Owncast to Quit' : `Yes I'm sure.`;

  const danger = restartStatus === RestartStatus.AUTO_RESTART_CONFIRM && true;
  return (
    <Button type="primary" size="middle" danger={danger} onClick={restartButtonPressed}>
      {buttonText}
    </Button>
  );
}

const RestartStatusEnumType = PropTypes.oneOf(Object.values(RestartStatus) as RestartStatus[]);
RestartButton.propTypes = {
  restartStatus: RestartStatusEnumType.isRequired,
  restartButtonPressed: PropTypes.func.isRequired,
};

function UpdateIntroduction(): React.ReactElement {
  return (
    <div>
      <Paragraph>This updater will attempt to update your copy of Owncast.</Paragraph>
      <Paragraph>
        Like any software update things can go wrong, so it's suggested you:
        <ul style={{ margin: '0.5em' }}>
          <li>Keep backups of your Owncast data.</li>
          <li>
            Perform this update when you have ample time, not when you are streaming or are about to
            stream.
          </li>
          <li>Have console access for troubleshooting or manually updating if required.</li>
          <li>Understand how to restart Owncast on your server.</li>
        </ul>
      </Paragraph>
      <Paragraph>
        <strong>Note:</strong> &nbsp; A restart of Owncast is required for the update to complete.
      </Paragraph>
    </div>
  );
}

export default function AutoUpdater(props: Props) {
  const { setMessage } = useContext(AlertMessageContext);
  const [updateLog, setUpdateLog] = useState('');
  const [updateState, setUpdateState] = useState(UpgradeStatus.NONE);
  const [restartStatus, setRestartStatus] = useState(RestartStatus.NONE);
  const [newVersionNumber, setNewVersionNumber] = useState('');

  const { closeModal, version, options } = props;

  function restartRequired() {
    setMessage('A restart of Owncast is required. Refresh the admin once Owncast is restarted.');
  }

  function downloadComplete() {
    const nextRestartStatus = options.canRestart
      ? RestartStatus.AUTO_RESTART_PENDING
      : RestartStatus.MANUAL_RESTART_PENDING;
    setUpdateState(UpgradeStatus.UPDATED);
    setRestartStatus(nextRestartStatus);
    restartRequired();
  }

  function downloadFailed() {
    setUpdateState(UpgradeStatus.FAILED);
  }

  async function performUpdate() {
    setUpdateState(UpgradeStatus.UPDATING);

    const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const ADMIN_STREAMKEY = process.env.NEXT_PUBLIC_ADMIN_STREAMKEY;

    const encoded = btoa(`${ADMIN_USERNAME}:${ADMIN_STREAMKEY}`);

    // eslint-disable-next-line no-undef
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Basic ${encoded}`,
      },
      mode: 'cors',
      credentials: 'include',
    };

    try {
      const response = await fetch(UPDATER_EXECUTE, requestOptions);
      const reader = response.body.getReader();

      // infinite loop while the body is downloading
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();

        if (done) {
          downloadComplete();
          break;
        }

        const line = new TextDecoder().decode(value);
        setUpdateLog(`${updateLog + line}\n`);

        if (line.includes('Unable to complete update')) {
          downloadFailed();
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function getUpdateStatusText(): string {
    switch (updateState) {
      case UpgradeStatus.UPDATING:
        return 'Downloading the updated version of Owncast...';
      case UpgradeStatus.UPDATED:
        return 'Download complete.';
      case UpgradeStatus.NONE:
        return 'Update Owncast';
      case UpgradeStatus.FAILED:
        return 'Update failed. You may want to update manually via the command line.';
      default:
        return '';
    }
  }

  function getRestartStatusText(): string {
    switch (restartStatus) {
      case RestartStatus.AUTO_RESTART_PENDING:
        return `A restart of Owncast is required to complete the update. The updater determined you're running Owncast as a system service so forcefully quitting Owncast should allow it to restart. This is a convenience, but it is recommended you understand how Owncast is running on your server and how to restart it manually if necessary.`;
      case RestartStatus.AUTO_RESTART_CONFIRM:
        return `Are you sure you want Owncast to forcefully exit so it automatically restarts? If this fails you will need to restart Owncast manually.`;
      case RestartStatus.MANUAL_RESTART_PENDING:
        return 'You must now manually restart Owncast for this update to take effect. It is not recommended you perform any other tasks or start any streams until you restart Owncast.';
      case RestartStatus.AUTO_RESTART_EXECUTING:
        return `Please wait. You may see errors in the admin while the service goes offline. If the service doesn't automatically come back up you may have to manually restart it.`;
      case RestartStatus.AUTO_RESTART_MAYBE_COMPLETE:
        return `Owncast is reporting version v${newVersionNumber}. Please refresh your browser and verify things are working and the version you expect is running. If something failed it is suggested you update Owncast manually via the command line.`;
      default:
        return '';
    }
  }

  async function checkOnlineStatus() {
    try {
      const response = await fetchData(STATUS);
      if (response.versionNumber) {
        setNewVersionNumber(response.versionNumber);
        setRestartStatus(RestartStatus.AUTO_RESTART_MAYBE_COMPLETE);
        setMessage('Owncast was updated. Please refresh your browser.');
      }
    } catch (e) {
      setRestartStatus(RestartStatus.AUTO_RESTART_EXECUTING);
      console.error(e);
    }
  }

  function startCheckOnlineStatus() {
    setInterval(() => {
      checkOnlineStatus();
    }, 3000);
  }

  function forceQuitOwncast() {
    setRestartStatus(RestartStatus.AUTO_RESTART_EXECUTING);

    try {
      fetchData(INSTANCE_FORCE_QUIT);
    } catch (e) {
      console.error(e);
    }

    startCheckOnlineStatus();
  }

  function restartButtonPressed() {
    switch (restartStatus) {
      case RestartStatus.AUTO_RESTART_PENDING:
        setRestartStatus(RestartStatus.AUTO_RESTART_CONFIRM);
        break;
      case RestartStatus.AUTO_RESTART_CONFIRM:
        forceQuitOwncast();
        break;
      default:
      // nothing
    }
  }

  let restartMessageTextType: BaseType = 'warning';
  if (
    restartStatus === RestartStatus.MANUAL_RESTART_PENDING ||
    restartStatus === RestartStatus.AUTO_RESTART_PENDING
  ) {
    restartMessageTextType = 'warning';
  } else if (restartStatus === RestartStatus.AUTO_RESTART_MAYBE_COMPLETE) {
    restartMessageTextType = 'success';
  } else if (restartStatus === RestartStatus.AUTO_RESTART_CONFIRM) {
    restartMessageTextType = 'danger';
  }

  return (
    <Modal title="Update Owncast" visible onCancel={closeModal} footer={null}>
      <Space direction="vertical">
        {updateState === UpgradeStatus.NONE && (
          <>
            <UpdateIntroduction />
            <UpdateButton
              updateState={updateState}
              performUpdate={performUpdate}
              version={version}
            />
          </>
        )}

        {updateState !== UpgradeStatus.NONE && (
          <UpdateConsole
            updateLog={updateLog}
            updateState={updateState}
            getUpdateStatusText={getUpdateStatusText}
          />
        )}

        <Spin spinning={restartStatus === RestartStatus.AUTO_RESTART_EXECUTING}>
          <Space direction="vertical">
            <Text type={restartMessageTextType}>{getRestartStatusText()}</Text>
            {(restartStatus === RestartStatus.AUTO_RESTART_PENDING ||
              restartStatus === RestartStatus.AUTO_RESTART_CONFIRM) && (
              <RestartButton restartButtonPressed={restartButtonPressed} />
            )}
          </Space>
        </Spin>
      </Space>
    </Modal>
  );
}
