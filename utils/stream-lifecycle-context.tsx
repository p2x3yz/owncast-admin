/*
Stream Lifecycle Provider
For lack of a better name, this is a provider to get Viewers, Connected Clients, Users, Stream info, Hardware, and Chat. (basically things that have their own getter APIs) Tha can be accessed by multiple pages or components.
(Chat which will get its own context when websockets are implemented).
*/

import React, { useState, useEffect, useContext } from 'react';
import {fetchData,
  FETCH_INTERVAL,

  VIEWERS_OVER_TIME,
  CONNECTED_CLIENTS,
  HARDWARE_STATS,
  LOGS_ALL,
  LOGS_WARN,
  CHAT_HISTORY,
} from './apis';
import { ServerStatusContext } from './server-status-context';

type SetterMethod = (data: any) => void;

async function getAndSetData(apiUrl: string, setDataCallback: SetterMethod) {
  try {
    const result = await fetchData(apiUrl);
    setDataCallback(result);
  } catch (error) {
    console.log({apiUrl, error});
  }
}

export interface HardwareStatus {
  cpu: [], // Array<TimedValue>(),
  memory: [], // Array<TimedValue>(),
  disk: [], // Array<TimedValue>(),
  message: '',
}


export const StreamLifecycleContext = React.createContext({
  chatMessages: [],
  viewersOverTime: [],
  connectedClients: [],
  hardwareStatus: null,
  logsAll: [],
  logsWarnings: [],
});

const StreamLifecycleProvider = ({ children }) => {
  const context = useContext(ServerStatusContext);
  const { online } = context || {};
  const [chatMessages, setChatMessages] = useState([]);
  const [viewersOverTime, setViewerOverTime] = useState([]);
  const [connectedClients, setConnectedClients] = useState([]);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>();
  const [logsAll, setLogsAll] = useState([]);
  const [logsWarnings, setLogsWarnings] = useState([]);

  let updateDataIntervalId = null;

  const getAllTheThings = () => {
    getAndSetData(VIEWERS_OVER_TIME, setViewerOverTime);
    getAndSetData(CONNECTED_CLIENTS, setConnectedClients);
    getAndSetData(HARDWARE_STATS, setHardwareStatus);
    getAndSetData(LOGS_ALL, setLogsAll);
    getAndSetData(LOGS_WARN, setLogsWarnings);
    getAndSetData(CHAT_HISTORY, setChatMessages);
  }

  const clearDataInterval = () => {
    clearInterval(updateDataIntervalId);
    updateDataIntervalId = null;
  }

  // get the things the first time
  useEffect(() => {
    getAllTheThings();
  }, []);

  // if online, also get the things on a interval
  useEffect(() => {
    if (online) {
      updateDataIntervalId = setInterval(getAllTheThings, FETCH_INTERVAL);
      // returned function will be called on component unmount
      return () => {
        clearDataInterval()
      };
    } else {
      if (updateDataIntervalId) {
        clearDataInterval()
      }
    }
  }, [online]);



  const providerValue = {
    chatMessages,
    viewersOverTime,
    connectedClients,
    hardwareStatus,
    logsAll,
    logsWarnings,
  };
  return (
    <StreamLifecycleContext.Provider value={providerValue}>{children}</StreamLifecycleContext.Provider>
  );
};

export default StreamLifecycleProvider;
