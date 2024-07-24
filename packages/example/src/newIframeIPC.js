import { appendMessage } from './appendMessage';

let clickIndex = 0;

export function newIframeIPC(namespace, IframeIPC) {
  const iframeIpc = new IframeIPC(namespace, {
    aes: 'abcdefg',
    transform: async (type, data) => {
      const result = type === 'encode' ? { myencode: data } : data.myencode;
      appendMessage(`  >>> ${type} result: ${JSON.stringify(result)}`);
      return result;
    }
  });

  const clickButton1 = iframeIpc.defServerAPI('clickButton1', function({ msg, index }) {
    appendMessage(`2. receive message: ${msg}`);
    return `return msg: ${msg}`;
  });

  const clickButton2 = iframeIpc.defServerAPIExt('clickButton2', async function({ handlers }, { msg, buttonClickFuncid, index }) {
    appendMessage(`2. receive message: ${msg}`);

    const tempApiRet = await handlers[buttonClickFuncid]({ msg: 'temmApi run args', index });
    appendMessage(`5. run tempApi ret: ${tempApiRet}`);

    return `return msg: ${msg} apiRet: ${tempApiRet}`;
  });


  return {
    iframeIpc,
    clickButton1: async function() {
      const index = clickIndex++;

      appendMessage(` ======= Stage ${index} ======= `);
      const msg = 'clickButton1 / ' + Math.random();
      appendMessage(`1. ${msg}`);
      const ret = await clickButton1({
        msg,
        index,
      });
      appendMessage(`3. click ret: ${ret}`);
      appendMessage(` ======= Stage ${index} ======= `);
    },

    clickButton2: async function() {
      const index = clickIndex++;

      appendMessage(` ======= Stage ${index} ======= `);
      const funcid = iframeIpc.defTempAPI(function(info, { msg }) {
        appendMessage(`3. receive tempApi message: ${msg}`);

        iframeIpc.undefTempAPI(funcid);
        appendMessage(`4. undefTempAPI succ, funcid: ${funcid}`);

        return `return tempApi msg: ${msg}`;
      });

      const msg = 'clickButton2 / ' + Math.random();
      appendMessage(`1. ${msg}`);
      const ret = await clickButton2({ funcids: [funcid] }, {
        msg: msg,
        buttonClickFuncid: funcid,
        index,
      });
      appendMessage(`6. ${ret}`);
      appendMessage(` ======= Stage ${index} ======= `);
    },
  };
}
