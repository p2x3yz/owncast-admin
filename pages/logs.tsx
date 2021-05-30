import React, { useContext } from 'react';
import LogTable from '../components/log-table';

import { StreamLifecycleContext } from '../utils/stream-lifecycle-context';

export default function Logs() {
  // get logs from context
  const streamLifecycle = useContext(StreamLifecycleContext);
  const { logsAll } = streamLifecycle || {};
  
  return <LogTable logs={logsAll} pageSize={20} />;
}
