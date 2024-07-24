import { IframeIPC, type IPCOptions } from 'iframe-ipc';
import AES from 'crypto-js/aes';
import encUTF8 from 'crypto-js/enc-utf8';

export class IframeIPCs extends IframeIPC {
  constructor(namespace: string, options: IPCOptions & { aes: string }) {
    super(namespace, {
      ...options,

      async transform(type, args) {
        if (type === 'encode') {
          const json = options.transform ? await options.transform('encode', args) : args;
          const result = AES.encrypt(JSON.stringify(json), options.aes).toString();
          // console.log('encrypt', result);
          return result;
        }

        const json = JSON.parse(AES.decrypt(args, options.aes).toString(encUTF8));
        // console.log('decrypt', json);
        return options.transform ? options.transform('decode', json) : json;
      }
    });
  }
}
