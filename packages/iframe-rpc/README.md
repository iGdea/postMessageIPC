iframe-rpc
==========

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![NPM License][license-image]][npm-url]

生成翻译函数

## Install
```
npm install iframe-rpc --save
```

## Usage

```typescript
import { IframeIPC } from 'iframe-rpc';

const iframeIpc = new IframeIPC('namespace', {
  dosomething(args) {
    return result;
  }
});

// top ifreame
iframeIpc.initFrameServer();

// client iframe
iframeIpc.callApi('dosomething', args).then((result) => console.log(result));
```


[npm-image]: https://img.shields.io/npm/v/iframe-rpc.svg
[downloads-image]: https://img.shields.io/npm/dm/iframe-rpc.svg
[npm-url]: https://www.npmjs.org/package/iframe-rpc
[license-image]: https://img.shields.io/npm/l/iframe-rpc.svg
