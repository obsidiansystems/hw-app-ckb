#!/usr/bin/env node

const path = require('path')
const os = require('os')
const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { Indexer, CellCollector } = require('@ckb-lumos/indexer')

const LUMOS_DB = process.env.LUMOS_DB || path.join(os.tmpdir(), 'lumos_db')
const CKB_URL = process.env.CKB_URL || 'http://localhost:8117'

const Transport = require("@ledgerhq/hw-transport-node-hid").default;

const LedgerCkb = require("hw-app-ckb").default;

const ckbPath = `44'/309'/0'/0/0`

const indexer = new Indexer(CKB_URL, LUMOS_DB)

const startSync = async () => {
  indexer.startForever()
  await new Promise((resolve) => setTimeout(resolve, 200000))
}


const bootstrap = async () => {
  const nodeUrl = process.env.NODE_URL || 'http://localhost:8117' // example node url

  const ckb = new CKB(nodeUrl) // instantiate the JS SDK with provided node url

  const { secp256k1Dep } = await ckb.loadDeps()

  let transport = await Transport.open();

  const lckb = new LedgerCkb(transport)
  
  const keydata = await lckb.getWalletPublicKey(ckbPath, true)
  const address = keydata.address
  const addresses = { testnetAddress: address }

  /**
   * to see the addresses
   */
  // console.log(JSON.stringify(addresses, null, 2))

  /**
   * calculate the lockHash by the address publicKeyHash
   * 1. the publicKeyHash of the address is required in the args field of lock script
   * 2. compose the lock script with the code hash(as a miner, we use blockAssemblerCodeHash here), and args
   * 3. calculate the hash of lock script via ckb.utils.scriptToHash method
   */

  const locks = [
    // "ckt1qyqgsv9xu8dkqt8c6dl4lkp9c6s3c8xd2w5s2099pz"
    {...secp256k1Dep, args: "0x8830a6e1db602cf8d37f5fd825c6a11c1ccd53a9"},
    // "ckt1qyq8ua6h3hjm49mteq6h2pyfrphe97jl6h4qdrp7d0"
    {...secp256k1Dep, args: "0x7e77578de5ba976bc835750489186f92fa5fd5ea"}
  ]

  const cells = await Promise.all(
    locks.map(lock => ckb.loadCells({ indexer, CellCollector, lock }))
  )

  const unspentCells = cells.flat()

  console.log(addresses.testnetAddress, 'addresses.testnetAddress')

  const rawTransaction = ckb.generateRawTransaction({
    fromAddress: addresses.testnetAddress,
    toAddress: 'ckt1qyqysrp642jfnq90jdet75xsg4nvau3jcxuqrpmukr',
    // capacity: BigInt(9200000000),
    capacity: BigInt(40000000000),
    fee: BigInt(100000),
    safeMode: true,
    cells: unspentCells,
    deps: ckb.config.secp256k1Dep,
  })

  console.log('rawTransaction', rawTransaction)

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

  const signature1 = await lckb.signTransaction(ckbPath, formatted, [formatted.witnesses[0]], formattedCtxd, "44'/309'/0'/1/0")
  const signature2 = await lckb.signTransaction("44'/309'/0'/0/1", formatted, [formatted.witnesses[1]], formattedCtxd, "44'/309'/0'/1/0")

  rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs( { lock: "0x"+signature1, inputType: '', outputType: '' });
  rawTransaction.witnesses[1] = ckb.utils.serializeWitnessArgs( { lock: "0x"+signature2, inputType: '', outputType: '' });
  console.log('rawTransaction.witnesses', rawTransaction.witnesses)
  const realTxHash = await ckb.rpc.sendTransaction(rawTransaction).catch(err=>err)

  /**
   * to see the real transaction hash
   */
  console.log(`The real transaction hash is: ${realTxHash}`)
}

(async () => {
  try {
    // await startSync()
    await bootstrap()
  } catch (error) {
    console.log(error)
  }
  process.exit(0)
})()
