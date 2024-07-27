let clickIndex = 0;

export function newIframeIPC(namespace, IframeIPC, appendMessage) {
  const iframeIpc = new IframeIPC(namespace, {
    aes: 'abcdefg',
    transform: async (type, data) => {
      const result = type === 'encode' ? { myencode: data } : data.myencode;
      appendMessage(`  >>> ${type} result: ${JSON.stringify(result)}`);
      return result;
    },
  });

  const runSimple = iframeIpc.defServerAPI('runSimple', async ({ msg, index }) => {
    appendMessage(`2. receive message: ${msg}`);
    return `return msg: ${msg}`;
  });

  const runWithCallback = iframeIpc.defServerAPIExt('runWithCallback', async ({ handlers }, { msg, buttonClickFuncid, index }) => {
    appendMessage(`2. receive message: ${msg}`);

    const tempApiRet = await handlers[buttonClickFuncid]({ msg: 'temmApi run args', index });
    appendMessage(`5. run tempApi ret: ${tempApiRet}`);

    return `return msg: ${msg} apiRet: ${tempApiRet}`;
  });


  return {
    iframeIpc,
    runSimple: async function() {
      const index = clickIndex++;

      appendMessage(` ======= Stage ${index} ======= `);
      const msg = 'click / ' + Math.random();
      appendMessage(`1. ${msg}`);
      const ret = await runSimple({
        msg,
        index,
      });
      appendMessage(`3. click ret: ${ret}`);
      appendMessage(` ======= Stage ${index} ======= `);
    },

    runWithCallback: async function() {
      const index = clickIndex++;

      appendMessage(` ======= Stage ${index} ======= `);
      const funcid = iframeIpc.defTempAPI(async (info, { msg }) => {
        appendMessage(`3. receive tempApi message: ${msg}`);

        iframeIpc.undefTempAPI(funcid);
        appendMessage(`4. undefTempAPI succ, funcid: ${funcid}`);

        return `return tempApi msg: ${msg}`;
      });

      const msg = 'click / ' + Math.random();
      appendMessage(`1. ${msg}`);
      const ret = await runWithCallback({ funcids: [funcid] }, {
        msg: msg,
        buttonClickFuncid: funcid,
        index,
      });
      appendMessage(`6. ${ret}`);
      appendMessage(` ======= Stage ${index} ======= `);
    },
  };
}
