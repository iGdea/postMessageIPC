import { IframeIPC, type IPCOptions } from 'iframe-ipc';
import AES from 'crypto-js/aes';
import encUTF8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import { random } from 'crypto-js/lib-typedarrays';


export class IframeIPCs extends IframeIPC {
  constructor(namespace: string, options: IPCOptions & { aes: string | (() => string) }) {
    super(namespace, {
      ...options,

      async transform(type, args) {
        const aes: string = typeof options.aes === 'function' ? options.aes() : options.aes;

        if (type === 'encode') {
          const json = options.transform ? await options.transform('encode', args) : args;
          const iv = Hex.parse(random(16).toString());
          const result = AES.encrypt(JSON.stringify(json), aes, { iv });
          // console.log('encrypt', result);
          return { result: result.toString(), iv: iv.toString() };
        }

        const json = JSON.parse(AES.decrypt(args.result, aes, { iv: args.iv }).toString(encUTF8));
        // console.log('decrypt', json);
        return options.transform ? options.transform('decode', json) : json;
      }
    });
  }
}
