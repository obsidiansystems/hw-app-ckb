#!/usr/bin/env node

const path = require('path')
const os = require('os')
const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { Indexer, CellCollector } = require('@ckb-lumos/indexer')

const LUMOS_DB = process.env.LUMOS_DB || path.join(os.tmpdir(), 'lumos_db')
const CKB_URL = process.env.CKB_URL || 'http://localhost:8114';

const Transport = require("@ledgerhq/hw-transport-node-hid").default;

const LedgerCkb = require("hw-app-ckb").default;

const ckbPath = `44'/309'/0'`;

const indexer = new Indexer(CKB_URL, LUMOS_DB)

const startSync = async () => {
  indexer.startForever()
  await new Promise((resolve) => setTimeout(resolve, 200000))
}

const stopSync = () => {
  indexer.stop()
}

const bootstrap = async () => {
  const nodeUrl = process.env.NODE_URL || CKB_URL // example node url
  const blockAssemblerCodeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8' // transcribe the block_assembler.code_hash in the ckb.toml from the ckb projec

  const ckb = new CKB(nodeUrl) // instantiate the JS SDK with provided node url

  const { secp256k1Dep } = await ckb.loadDeps()

  let transport = await Transport.open();

  const lckb = new LedgerCkb(transport);
  
  const keydata = await lckb.getWalletPublicKey(ckbPath, true)
  const address = keydata.address
  const addresses = { testnetAddress: address }
  const publicKeyHash = "0x" + keydata.lockArg

  /**
   * to see the addresses
   */
  console.log('addresses.testnetAddress', addresses.testnetAddress)
  console.log('publicKeyHash', publicKeyHash)
  console.log('addresses', addresses)

  /**
   * calculate the lockHash by the address publicKeyHash
   * 1. the publicKeyHash of the address is required in the args field of lock script
   * 2. compose the lock script with the code hash(as a miner, we use blockAssemblerCodeHash here), and args
   * 3. calculate the hash of lock script via ckb.utils.scriptToHash method
   */

  const lockScript = {
    hashType: "type",
    codeHash: blockAssemblerCodeHash,
    args: publicKeyHash,
  }

  // method to fetch all unspent cells by lock hash
  const locks = [
    { lockHash: ckb.utils.scriptToHash(lockScript) },
    //lockScript,
    //{...secp256k1Dep, args: publicKeyHash }
  ]
  console.log('locks', locks)

  const cells = await Promise.all(
    locks.map(lock => ckb.loadCells(lock /*{ indexer, CellCollector, lock }*/))
  )

  const unspentCells = cells.flat()
  console.log('unspentCells', unspentCells)

  const rawTransaction = ckb.generateRawTransaction({
    fromAddress: addresses.testnetAddress,
    toAddress: 'ckt1qyq9t9n5qj58wrnanafe6862t6wxeeaww3csvdfg44',
    // capacity: BigInt(9200000000),
    capacity: BigInt(40000000000),
    fee: BigInt(100000),
    safeMode: true,
    cells: unspentCells,
    deps: ckb.config.secp256k1Dep,
  })

  console.log('rawTransaction', rawTransaction)
  console.log('rawTransaction.inputs', rawTransaction.inputs)

  // const rawTransaction = ckb.generateDaoDepositTransaction({
  //   fromAddress: addresses.testnetAddress,
  //   capacity: BigInt(10400000000),
  //   fee: BigInt(100000),
  //   // cells: unspentCells
  // })

  rawTransaction.witnesses = rawTransaction.inputs.map(() => '0x')
  rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs({
    lock: '',
    inputType: '',
    outputType: ''
  })
  rawTransaction.witnesses[1] = ckb.utils.serializeWitnessArgs({
    lock: '',
    inputType: '',
    outputType: ''
  })


  // fetch all the context transactions
  ctxds = (await Promise.all(rawTransaction.inputs.map(a=>ckb.rpc.getTransaction(a.previousOutput.txHash)))).map(a=>a.transaction)

  const formatted = ckb.rpc.paramsFormatter.toRawTransaction(rawTransaction)
  const formattedCtxd = ctxds.map(ckb.rpc.paramsFormatter.toRawTransaction)
  //console.log(formatted);
  //console.log(formattedCtxd);

  const signature1 = await lckb.signTransaction(ckbPath, formatted, [formatted.witnesses[0]], formattedCtxd, "44'/309'/0'/1/0")
  const signature2 = await lckb.signTransaction("44'/309'/0'/0/1", formatted, [formatted.witnesses[1]], formattedCtxd, "44'/309'/0'/1/0")

  rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs( { lock: "0x"+signature1, inputType: '', outputType: '' });
  rawTransaction.witnesses[1] = ckb.utils.serializeWitnessArgs( { lock: "0x"+signature2, inputType: '', outputType: '' });
  //console.log('rawTransaction.witnesses', rawTransaction.witnesses)
  const realTxHash = await ckb.rpc.sendTransaction(rawTransaction).catch(err=>err)

  /**
   * to see the real transaction hash
   */
  console.log(`The real transaction hash is: ${realTxHash}`)
}

(async () => {
  try {
    stopSync()
    await bootstrap()
    startSync()
  } catch (error) {
    console.log(error)
  }
  process.exit(0)
})()
