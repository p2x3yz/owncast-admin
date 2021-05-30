

import React, { useRef, useContext, useEffect } from 'react';
import { Tooltip, Button } from 'antd';

import classNames from 'classnames';
import format from 'date-fns/format';
import { string } from 'prop-types';
import { RawMessage } from '../../types/chat';
import { StreamLifecycleContext } from '../../utils/stream-lifecycle-context';


interface MessagesProps {
  messages: RawMessage[];
}
interface MessageProps {
  message: RawMessage;
}


// individual message
function MessageItem({ message }: MessageProps) {
  const { author, body, timestamp, type, visible } = message;

  const classes = classNames({
    'chat-message': true,
    visible,
  });

  return (
    <div className={classes}>
      <div className="author">
        {author}
        <span className="timestamp">{format(new Date(timestamp), 'pp')}</span>
      </div>
      <div
          className="message-contents"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: body }}
        />
    </div>
  );
}



export default function ChatMessages() {
  // get messages from context
  const streamLifecycle = useContext(StreamLifecycleContext);
  const { chatMessages: messages } = streamLifecycle || {};

  const containerRef = useRef<HTMLDivElement>(null);

  // jump to bottom of the list when messages change
  useEffect(() => {
    containerRef?.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      left: 0,
      behavior: 'auto'
    });
  }, [messages.length]);
  
  if (!messages.length) {
    return (
      <div className="chat-messages">
        <span className="no-messages-notice">No chatter yet!</span>
      </div>
    );
  }
  return (
    <div className="chat-messages" ref={containerRef}>
      {messages.map(message => <MessageItem message={message} key={message.id} />)}
    </div>
  );
}
/*
user object
  displayName
  displayColor
  createdAt
  history:[]
  ...

  */