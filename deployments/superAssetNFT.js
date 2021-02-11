/**
 * This is an implementation and sample usage of SuperAsset NFT
 *
 */
const {
  buildContractClass,
  getPreimage,
  toHex,
  bsv,
  SigHashPreimage,
  Bytes,
  signTx,
  PubKey,
  Sig,
  Ripemd160,
  SigHash,
  Bool
} = require('scryptlib');
const {
  loadDesc,
  createLockingTx,
  sendTx,
  fetchUtxoLargeThan,
  unlockP2PKHInput,
  sighashType2Hex
} = require('../helper');

 

const sleeper = async(seconds) => {
  return new Promise((resolve) => {
     setTimeout(() => {
        resolve();
     }, seconds * 1000);
  })
}

(async () => {

// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys

// Generate your own private keys (Ex: https://console.matterpool.io/tools)
// And fund the addresses for them.
const privateKey1= new bsv.PrivateKey('xxx');
const publicKey1 = bsv.PublicKey.fromPrivateKey(privateKey1)
const publicKey1Address = publicKey1.toAddress();
const publicKey1AddressHexRemovedPrefix = publicKey1Address.toHex().substring(2);
console.log('privateKey1', publicKey1.toString('hex'), publicKey1Address.toString(), publicKey1Address.toHex(), publicKey1AddressHexRemovedPrefix);

const privateKey2 = new bsv.PrivateKey('xxx')
const publicKey2 = bsv.PublicKey.fromPrivateKey(privateKey2)
const publicKey2Address = publicKey2.toAddress();
const publicKey2AddressHexRemovedPrefix = publicKey2Address.toHex().substring(2);
console.log('privateKey2', publicKey2, publicKey2Address.toString(), publicKey2Address.toHex(), publicKey2AddressHexRemovedPrefix);
 
const Hash = bsv.crypto.Hash;

// BEGIN
// Step 1: Deploy contract
// Step 2: Transfer and update it
// Step 3: Melt it back to plain satoshi (p2pkh)
try {
  const Signature = bsv.crypto.Signature;
  // MSB of the sighash  due to lower S policy
  const MSB_THRESHOLD = 0x7E; // OpPushTx optimized
  const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
  // Instantiate a SuperAsset10 NFT asset from the compiled constract
  const Token = buildContractClass(loadDesc('SuperAssetNFT_desc.json'))
  const token = new Token();
  // Todo: Replace with optimized checkPreimage (will not affect functionality)
  // const asmVars = {'Tx.checkPreimageOpt_.sigHashType': sighashType.toString() } // '41'} // FORKID | ALL
  // token.replaceAsmVars(asmVars);

  // -----------------------------------------------------
  // Step 1: Deploy NFT with initial owner and satoshis value of 2650 (Lower than this may hit dust limit)
  let assetId = null;
  const nftSatoshiValue = 3000;
  const FEE = 1000;
  const lockingTx = await createLockingTx(privateKey1.toAddress(), nftSatoshiValue, FEE);
  const initialState =  ' OP_RETURN ' + '000000000000000000000000000000000000000000000000000000000000000000000000 ' + publicKey1AddressHexRemovedPrefix;
  const initialLockingScript = bsv.Script.fromASM(token.lockingScript.toASM() + initialState);
  lockingTx.outputs[0].setScript(initialLockingScript);
  lockingTx.sign(privateKey1)
  const publicKey1Hash160 = bsv.crypto.Hash.sha256ripemd160(publicKey1.toBuffer());
  const publicKey2Hash160 = bsv.crypto.Hash.sha256ripemd160(publicKey2.toBuffer())
  const lockingTxid = await sendTx(lockingTx)
  console.log('Step 1 complete. Deployment Tx: ', lockingTxid)
  // ----------------------------------------------------- 
  
  // Step 2: Update NFT with payload
  let newLockingScript = null;
  let transferTx = null;
  let unlockingScript;
  {
    const prevLockingScript = initialLockingScript;
    console.log('Preparing first transfer update...');
    await sleeper(5);
    assetId = Buffer.from(lockingTxid, 'hex').reverse().toString('hex') + '00000000'; // 0th output. Use full outpoint for identifier
    const payloadRawHex = Buffer.from(`hello:world`, 'utf8').toString('hex');
    const outputScriptPushDataPayload = '006a0b' + payloadRawHex;
    // outputScriptPushDataPayload
    // const outLen = Buffer.from(outputScriptPushDataPayload, 'hex').length.toString(16);
    // console.log('outLen', outLen);
    const newState = ' ' + assetId + ' ' + toHex(publicKey1Hash160); 
    newLockingScript = bsv.Script.fromASM(token.codePart.toASM() + newState);

    const tx = new bsv.Transaction()
    const utxo = await fetchUtxoLargeThan(privateKey2.toAddress(), 20000);
    // Add input is the NFT
    token.setDataPart(newState);
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: lockingTxid,
      outputIndex: 0,
      script: ''
    }), initialLockingScript, nftSatoshiValue);
    // Add funding input
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: utxo.txId,
      outputIndex: utxo.outputIndex,
      script: ''
    }), utxo.script, utxo.satoshis);
 
    changeSatoshis = utxo.satoshis - FEE;
    tx.addOutput(new bsv.Transaction.Output({
      script: newLockingScript,
      satoshis: nftSatoshiValue
    }));
    const outputVarIntLen = '0e'; // Buffer.from(outputScriptPushDataPayload, 'hex').length.toString(16);
    console.log('outputVarLen', outputVarIntLen);
    const s = bsv.Script.fromHex(outputScriptPushDataPayload);
    console.log('s', s);
    tx.addOutput(new bsv.Transaction.Output({
      script: s,
      satoshis: 0
    }));
    const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey2)
    tx.addOutput(new bsv.Transaction.Output({
      script: changeOutputScript,
      satoshis: changeSatoshis
    }));
 
    // use this if sigHashType needs to be customized, using Tx.checkPreimageOpt_(txPreimage)
     //console.log('sighashType', sighashType);
    const asmVars = {
      'Tx.checkPreimageOpt_.sigHashType': 
      sighashType2Hex(sighashType)
    };  
    console.log('replaceasmvars', asmVars);
    token.replaceAsmVars(asmVars);
    let preimage = null;
    const isOpt = false;
    if (isOpt) {
      
      for (i = 0; ; i++) {
        // malleate tx and thus sighash to satisfy constraint
        tx.nLockTime = i;
        const preimage_ = getPreimage(tx, token.lockingScript.toASM(), nftSatoshiValue, 0, sighashType);
        preimageHex = toHex(preimage_);
        preimage = preimage_;
        const h = Hash.sha256sha256(Buffer.from(preimageHex, 'hex'));
        const msb = h.readUInt8();
        if (msb < MSB_THRESHOLD) {
            // the resulting MSB of sighash must be less than the threshold
            break;
        }
      }
    } else {
      preimage = getPreimage(tx, prevLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    }
 
    const sig = signTx(tx, privateKey1, prevLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
  
    unlockingScript = token.transfer(
      new Sig(toHex(sig)),
      new PubKey(toHex(publicKey1)),
      new Ripemd160(toHex(publicKey1Hash160)),
      preimage,
      new Bool(false), // Not a melt
      // new SigHashPreimage(preimage),
      // 0b is the direct push
      new Bytes('0b' + payloadRawHex), // '0b' + pushDataPayload)),
      new Ripemd160(toHex(publicKey2Hash160)),
      changeSatoshis
    ).toScript();
 
    tx.inputs[0].setScript(unlockingScript);
    unlockP2PKHInput(privateKey2, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
    console.log('About to broadcast...', tx.toString());
    transferTx = await sendTx(tx, true);
    console.log('Step 2 complete. Transfer Tx: ', transferTx)
    console.log('assetId: ', assetId);
  }

  // Step 3: Update NFT with NO payload
  let transferTx2 = null;
  let newLockingScript2 = null;
  {
    const prevLockingScript = newLockingScript;
    console.log('Preparing second transfer update with no payload...');
    await sleeper(5);
    const newState = ' ' + assetId + ' ' + toHex(publicKey1Hash160); 
    newLockingScript2 = bsv.Script.fromASM(token.codePart.toASM() + newState);

    const tx = new bsv.Transaction()
    const utxo = await fetchUtxoLargeThan(privateKey2.toAddress(), 20000);
    // Add input is the NFT
    token.setDataPart(newState);
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: transferTx,
      outputIndex: 0,
      script: ''
    }), prevLockingScript, nftSatoshiValue);
    // Add funding input
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: utxo.txId,
      outputIndex: utxo.outputIndex,
      script: ''
    }), utxo.script, utxo.satoshis);
 
    changeSatoshis = utxo.satoshis - FEE;
    tx.addOutput(new bsv.Transaction.Output({
      script: newLockingScript,
      satoshis: nftSatoshiValue
    }));
    
    const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey2)
    tx.addOutput(new bsv.Transaction.Output({
      script: changeOutputScript,
      satoshis: changeSatoshis
    }));
  
    const asmVars = {
      'Tx.checkPreimageOpt_.sigHashType': 
      sighashType2Hex(sighashType)
    };  
 
    token.replaceAsmVars(asmVars);
    let preimage = null;
    const isOpt = false;
    if (isOpt) {
      
      for (i = 0; ; i++) {
        // malleate tx and thus sighash to satisfy constraint
        tx.nLockTime = i;
        const preimage_ = getPreimage(tx, token.lockingScript.toASM(), nftSatoshiValue, 0, sighashType);
        preimageHex = toHex(preimage_);
        preimage = preimage_;
        const h = Hash.sha256sha256(Buffer.from(preimageHex, 'hex'));
        const msb = h.readUInt8();
        if (msb < MSB_THRESHOLD) {
            // the resulting MSB of sighash must be less than the threshold
            break;
        }
      }
    } else {
      preimage = getPreimage(tx, prevLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    }
    const sig = signTx(tx, privateKey1, prevLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    unlockingScript = token.transfer(
      new Sig(toHex(sig)),
      new PubKey(toHex(publicKey1)),
      new Ripemd160(toHex(publicKey1Hash160)),
      preimage,
      new Bool(false), // Not a melt
      new Bytes('00'),  
      new Ripemd160(toHex(publicKey2Hash160)),
      changeSatoshis
    ).toScript();

    tx.inputs[0].setScript(unlockingScript)
    unlockP2PKHInput(privateKey2, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
    console.log('About to broadcast...', tx.toString());
    transferTx2 = await sendTx(tx, true);
    console.log('Step 3 complete. Transfer Tx2: ', transferTx2)
    console.log('assetId: ', assetId);
  }

  // -----------------------------------------------------
  // Step 4: Melt NFT
  {
    await sleeper(6);
    console.log('Preparing melt...');
    const tx = new bsv.Transaction();
    const utxo = await fetchUtxoLargeThan(privateKey2.toAddress(), 20000);
    // Add input is the NFT
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: transferTx2,
      outputIndex: 0,
      script: ''
    }), newLockingScript, nftSatoshiValue);
    // Add funding input
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: utxo.txId,
      outputIndex: utxo.outputIndex,
      script: ''
    }), utxo.script, utxo.satoshis);
    changeSatoshis = utxo.satoshis - FEE;

    const changeOutputScriptRedeem = bsv.Script.buildPublicKeyHashOut(publicKey2)
    tx.addOutput(new bsv.Transaction.Output({
      script: changeOutputScriptRedeem,
      satoshis: nftSatoshiValue
    }))

    const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey2)
    tx.addOutput(new bsv.Transaction.Output({
      script: changeOutputScript,
      satoshis: changeSatoshis
    }))
    const preimage = getPreimage(tx, newLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    const sig = signTx(tx, privateKey1, newLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    // console.log('preimagehex', preimage.toJSON(), 'preimagejson', preimage.toString(), 'signature', toHex(sig));
    const pkh = bsv.crypto.Hash.sha256ripemd160(publicKey2.toBuffer())
    const changeAddress = toHex(pkh) // Needs to be unprefixed address
    const recpkh = bsv.crypto.Hash.sha256ripemd160(publicKey2.toBuffer());
    const recAddress = toHex(recpkh);

    unlockingScript = token.transfer(
      new Sig(toHex(sig)),
      new PubKey(toHex(publicKey1)),
      new Ripemd160(recAddress),
      preimage,
      new Bool(true), // Melt
      new Bytes('00'), // No payload update.
      new Ripemd160(changeAddress),
      changeSatoshis).toScript();

    tx.inputs[0].setScript(unlockingScript)
    unlockP2PKHInput(privateKey2, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
    console.log('About to broadcast...', tx.toString());
    let meltTx = await sendTx(tx)
    console.log('Step 4 complete. Melt Tx: ', meltTx)
    console.log('assetId (melted): ', assetId);
  }
  console.log('Success.')
} catch (error) {
  console.log('Failure.', error)
}

})()

