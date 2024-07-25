export enum MessageType {
  CALL = 'call',
  RETURN = 'return',
}

type NormalMessage<T> = {
  encode: false,
  message: T,
  api: string,
  type: MessageType,
  callid: string,
};

type EncodeMessage = {
  encode: true,
  buffer: any,
  api: string,
  type: MessageType,
  callid: string,
};

type Message<T> = NormalMessage<T> | EncodeMessage;

export type CallMessage<Args extends any[]> = Message<Args>;

export type ReturnData<Data, Error> = {
  iserr: boolean,
  data?: Data
  error?: Error,
};

export type ReturnMessage<Data, Error> = Message<ReturnData<Data, Error>>;


export function isCallMessage<T extends any[]>(data: any): data is CallMessage<T> {
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

export async function decodeMessage<T>(
  data: Message<T>,
  transform?: TransformHandler<any, T>,
  onlytransform?: boolean,
): Promise<T> {
  if (isEncodeMessage(data)) {
    if (!transform) throw new Error(`Miss transform For ${data.api}`);
    return transform('decode', data.buffer, data.api);
  }

  if (onlytransform) throw new Error(`Must transform For ${data.api}`);
  return data.message;
}

export async function encodeMessage<T>(
  data: Message<T>,
  transform: TransformHandler<T, any>,
): Promise<EncodeMessage> {
  if (isEncodeMessage(data)) return data;

  return {
    encode: true,
    buffer: await transform('encode', data.message, data.api),
    api: data.api,
    type: data.type,
    callid: data.callid,
  };
}

export type TransformHandler<Args, Result> = {
  (type: 'encode', args: Args, api: string): Result | Promise<Result>
  (type: 'decode', args: Result, api: string): Args | Promise<Args>
};
