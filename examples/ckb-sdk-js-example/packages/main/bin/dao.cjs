#!/usr/bin/env node

const CKB = require("@nervosnetwork/ckb-sdk-core").default;

const CKB_URL = process.env.CKB_URL || 'http://localhost:8114';

const LedgerCkb = require("hw-app-ckb").default;

const ckbPath = `44'/309'/0'`;

// Whether to connect to a running instance of the Speculos simulator for
// ledger apps or a real physical ledger
const useSpeculos = false

let Transport = null
if ( useSpeculos ) {
  // For speculos:
  Transport = require("@ledgerhq/hw-transport-node-speculos").default;
} else {
  // For a real ledger:
  Transport = require("@ledgerhq/hw-transport-node-hid").default;
}
console.log(Transport)

const bootstrap = async () => {
  const ckb = new CKB(CKB_URL)

  let transport = null
  if ( useSpeculos ) {
    // To connect to a speculos instance:
    apduPort = 9999;
    transport = await Transport.open( { apduPort } );
  } else {
    transport = await Transport.open();
  }

  const lckb = new LedgerCkb(transport);

  const keydata = await lckb.getWalletPublicKey(ckbPath, true);
  console.log('keydata', keydata);

  const publicKeyHash = "0x" + keydata.lockArg;
  const address = keydata.address;
  const addresses = { testnetAddress: address };
  const loadCells = async () => {
    await ckb.loadDeps();
    const lockHash = ckb.generateLockHash(publicKeyHash);
    return await ckb.loadCells({
      lockHash,
      start: BigInt(0),
      end: BigInt(500000),
      save: true,
    });
  };

  const cells = await loadCells();

  const rawTransaction = ckb.generateDaoDepositTransaction({
    fromAddress: addresses.testnetAddress,
    capacity: BigInt(10400000000),
    fee: BigInt(100000),
    cells,
  });

  console.log('rawTransaction', rawTransaction);

  rawTransaction.witnesses = rawTransaction.inputs.map(() => "0x");
  rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs({
    lock: "",
    inputType: "",
    outputType: "",
  });

  console.log("rawTransaction:", JSON.stringify(rawTransaction));

  const ctxds = (
    await Promise.all(
      rawTransaction.inputs.map((a) =>
        ckb.rpc.getTransaction(a.previousOutput.txHash)
      )
    )
  ).map((a) => a.transaction);

  const formatted = ckb.rpc.paramsFormatter.toRawTransaction(rawTransaction);
  const formattedCtxd = ctxds.map(ckb.rpc.paramsFormatter.toRawTransaction);

  try {
    console.log('annotatedTransaction', JSON.stringify(lckb.buildAnnotatedTransaction(
      ckbPath,
      formatted,
      formatted.witnesses,
      formattedCtxd,
      ckbPath
    )));
    const signature = await lckb.signTransaction(
      ckbPath,
      formatted,
      formatted.witnesses,
      formattedCtxd,
      ckbPath
    );
    rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs({
      lock: "0x" + signature,
      inputType: "",
      outputType: "",
    });

    const realTxHash = await ckb.rpc
      .sendTransaction(rawTransaction)
      .catch((err) => err);

    /**
     * to see the real transaction hash
     */
    console.log(`The real transaction hash is: ${realTxHash}`);
  } catch (error) {
    console.log(error);
  }
};

try {
  bootstrap();
} catch (error) {
  console.log(error)
}
