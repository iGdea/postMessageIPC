export enum MessageType {
  CALL = 'call',
  RETURN = 'return',
}

type NormalMessage<T> = {
  encode: false,
  message: T,
  type: MessageType,
  callid: string,
};

type EncodeMessage = {
  encode: true,
  buffer: any,
  type: MessageType,
  callid: string,
};

type Message<T> = NormalMessage<T> | EncodeMessage;

type CallData<Args extends any[]> = {
  api: string,
  args: Args,
};

export type CallMessage<Args extends any[]> = Message<CallData<Args>>;

export type ReturnData<Data, Error> = {
  iserr: boolean,
  data?: Data
  error?: Error,
};

export type ReturnMessage<Data, Error> = Message<ReturnData<Data, Error>>;


export function isCallMessage(data: any): data is CallMessage<any> {
  return data
    && data.callid
    && data.type === MessageType.CALL;
}

export function isReturnMessage(data: any): data is ReturnMessage<any, any> {
  return data
    && data.callid
    && data.type === MessageType.RETURN;
}

function isEncodeMessage(data: any): data is EncodeMessage {
  return data
    && data.callid
    && data.encode;
}

export async function decodeMessage<T>(data: Message<T>, transform?: TransformHandler<any, T>): Promise<T> {
  if (isEncodeMessage(data)) {
    if (!transform) throw new Error('Miss transform For EncodeMessage');
    return transform('decode', data.buffer);
  }

  return data.message;
}

export async function encodeMessage<T>(data: Message<T>, transform: TransformHandler<T, any>): Promise<EncodeMessage> {
  if (isEncodeMessage(data)) return data;

  return {
    encode: true,
    buffer: await transform('encode', data.message),
    type: data.type,
    callid: data.callid,
  };
}

export type TransformHandler<Args, Result> = {
  (type: 'encode', args: Args): Result | Promise<Result>
  (type: 'decode', args: Result): Args | Promise<Args>
};
