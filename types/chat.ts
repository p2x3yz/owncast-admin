enum MessageType {
  CHAT = 'CHAT',
}
export interface RawMessage {
  author: string;
  body: string;
  id: string;
  key: string;
  name: string;
  timestamp: string;
  type: MessageType;
  visible: boolean;
}

// Stubs for user item. these could change.
export interface MessageUser {
  displayName: string;
  displayColor: string;
  createdAt: string; // timestamp
  history: any;
}


/*
user object
  displayName
  displayColor
  createdAt
  history:[]
  ...

  */