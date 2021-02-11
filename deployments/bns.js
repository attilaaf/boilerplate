 
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
  SigHash
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
 
const bnsPrivateKey = new bsv.PrivateKey('L3GDddYttRiqqRddsWoZHbYQgFF49VDgkm3wmGo1Ds7HqNzNE2QM')
const bnsPublicKey = bsv.PublicKey.fromPrivateKey(bnsPrivateKey)
const bnsKeyAddress = bnsPublicKey.toAddress();
const bnsKeyAddressHexRemovedPrefix = bnsKeyAddress.toHex().substring(2);
console.log('bnsKeys', bnsPublicKey, bnsKeyAddress.toString(), bnsKeyAddress.toHex(), bnsKeyAddressHexRemovedPrefix);
 
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
  const Token = buildContractClass(loadDesc('bns_desc.json'))
  const token = new Token();
  // Todo: Replace with optimized checkPreimage (will not affect functionality)
  // const asmVars = {'Tx.checkPreimageOpt_.sigHashType': sighashType.toString() } // '41'} // FORKID | ALL
  // token.replaceAsmVars(asmVars);
  // Initial NFT sneds to the public known address
  // Address: 1Fxf9d4M5uQTEK1ZNm8sGzx2gXotQWDeH6
  // Hash160: (00)a4187bd7b8a126716eeb9586eeb1261d5861d24c
  // Private key Wif: L3GDddYttRiqqRddsWoZHbYQgFF49VDgkm3wmGo1Ds7HqNzNE2QM
  // Public Key: 02b58b9cdf8c9e86c78d27fbce337867d72aa08488eaaf889026b5913d8e9aef21
  const saNFT = '510140018058020a095579008763615979537956798555798520ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d622102773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d1792919212108dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a20021606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf0002100f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60615679557955795579557955795b795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a756157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179517a75517a7561527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a75517a75517a75517a75517a75517a75616961597961007901687f7700005279517f75007f77007901fd8763615379537f75517f77007901007e81517a7561537a75527a527a5379535479937f75537f77527a75517a67007901fe8763615379557f75517f77007901007e81517a7561537a75527a527a5379555479937f75557f77527a75517a67007901ff8763615379597f75517f77007901007e81517a7561537a75527a527a5379595479937f75597f77527a75517a67615379517f75007f77007901007e81517a7561537a75527a527a5379515479937f75517f77527a75517a6868685179517a75517a75517a75517a7561517a7561007952797f77007901247f755e79a9527901397f7501257f7787695f795f79ac690079000124808763615c79007901687f7501447f77517a7561517a75685279547952947f75026a247e51797e01147e5e797e615d79616100790079827751795179012c947f7551790134947f77517a75517a7561007901007e81517a7561517a756156798003fd43097e51797e5d7982007c8087916300790800000000000000005f797e7e517a750079756800795c79587980041976a9147e5e797e0288ac7e7e517a750079750079aa615f79007982775179517958947f7551790128947f77517a75517a756187777777777777777777777777777777777777675579518763615879537956798555798520ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d622102773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d1792919212108dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a20021606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf0002100f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60615679557955795579557955795b795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a756157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179517a75517a7561527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a75517a75517a75517a75517a75517a7561695a79a961597961007901687f7700005279517f75007f77007901fd8763615379537f75517f77007901007e81517a7561537a75527a527a5379535479937f75537f77527a75517a67007901fe8763615379557f75517f77007901007e81517a7561537a75527a527a5379555479937f75557f77527a75517a67007901ff8763615379597f75517f77007901007e81517a7561537a75527a527a5379595479937f75597f77527a75517a67615379517f75007f77007901007e81517a7561537a75527a527a5379515479937f75517f77527a75517a6868685179517a75517a75517a75517a7561517a756152797f7701397f7501257f7787695b795b79ac69615879616100790079827751795179012c947f7551790134947f77517a75517a7561007901007e81517a7561517a7561527980041976a9147e5a797e0288ac7e5779537980041976a9147e59797e0288ac7e7eaa615979007982775179517958947f7551790128947f77517a75517a756187777777777777777777777777670068686a2400000000000000000000000000000000000000000000000000000000000000000000000014';
  // bnsKeyAddressHexRemovedPrefix: a4187bd7b8a126716eeb9586eeb1261d5861d24c

  const sha256dSANFT = Hash.sha256sha256(Buffer.from(saNFT, 'hex'));
  console.log('sha256dSANFT', sha256dSANFT.toString('hex'));
  await sleeper(2);
  // -----------------------------------------------------
  // Step 1: Deploy with initial owner and satoshis value of 2650 (Lower than this may hit dust limit)
 
  // Add the output letters 
  const letters = [
    '5f',
    '2e'
  ];
      
  const nftSatoshiValue = 3000;
  const FEE = 3000;
  const lockingTx = await createLockingTx(privateKey1.toAddress(), nftSatoshiValue, FEE);
  const initialState =  ' OP_RETURN 00';
  const initialLockingScript = bsv.Script.fromASM(token.lockingScript.toASM() + initialState);
  console.log('initLockingScript ASM and HEX', initialLockingScript, initialLockingScript.toHex());
  lockingTx.outputs[0].setScript(initialLockingScript);
  lockingTx.sign(privateKey1)
  const publicKey1Hash160 = bsv.crypto.Hash.sha256ripemd160(publicKey1.toBuffer());
  const lockingTxid = await sendTx(lockingTx)
  console.log('Step 1 complete. Deployment Tx: ', lockingTxid)
  // ----------------------------------------------------- 
  
  // Step 2: Extend from genesis
 
  let transferTx = null;
  const step2ExtendLockingScripts = [];
  const dividedSats = 6000;
  const totalExtendOutputs = 2;
  {
    const prevLockingScript = initialLockingScript;
    console.log('Preparing first extension...');
    await sleeper(5);
    let tx = new bsv.Transaction()
    const utxo = await fetchUtxoLargeThan(privateKey1.toAddress(), 30000);
    
    // Spend the deploy to create the first extension 
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

    // Create an output for the CLAIM output
    const claimNFTSatoshis = 3000;
    const claimNFT = bsv.Script.fromHex(saNFT + bnsKeyAddressHexRemovedPrefix); // Do not claim
    tx.addOutput(new bsv.Transaction.Output({
      script: claimNFT,
      satoshis: claimNFTSatoshis
    }));
 
    for (const letter of letters) {
      const tmpLocking = bsv.Script.fromASM(token.codePart.toASM() + ' ' + letter);
      step2ExtendLockingScripts.push(tmpLocking);
      tx.addOutput(new bsv.Transaction.Output({
        script: tmpLocking,
        satoshis: dividedSats / totalExtendOutputs // Devided by number of outputs
      }));
    }
 
    // Add Change
    changeSatoshis = (utxo.satoshis - FEE - (dividedSats));
    const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey1)
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
    token.replaceAsmVars(asmVars);
    let preimage = null;
    const isOpt = false;
    if (isOpt) {
      for (i = 0; ; i++) {
        // malleate tx and thus sighash to satisfy constraint
        tx.nLockTime = i;
        const preimage_ = getPreimage(tx, prevLockingScript.toASM(), nftSatoshiValue, 0, sighashType);
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

    const unlockingScript = token.extend(
      preimage,
      new Bytes(saNFT), 
      3000, 
      new Bytes('00'),  // Do not claim
      dividedSats,
      new Ripemd160(toHex(publicKey1Hash160)),
      changeSatoshis
    ).toScript();
    tx.inputs[0].setScript(unlockingScript)
    unlockP2PKHInput(privateKey1, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
    console.log('About to broadcast...', tx.toString());
    transferTx = await sendTx(tx, true);
    console.log('Step 2 complete. Extend Tx: ', transferTx)

  }

  // Step 3: Extend from _ (1st output)
  let step3LockingScripts = [];
  let extend2Tx = null;
  {
    const prevLockingScript = step2ExtendLockingScripts[0]; // extend from _
    console.log('Preparing next extension...');
    await sleeper(6);
    let tx = new bsv.Transaction()
    const utxo = await fetchUtxoLargeThan(privateKey1.toAddress(), 30000);
    
    // Spend the deploy to create the first extension 
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: transferTx,
      outputIndex: 1,
      script: ''
    }), prevLockingScript, dividedSats / totalExtendOutputs);
    // Add funding input
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: utxo.txId,
      outputIndex: utxo.outputIndex,
      script: ''
    }), utxo.script, utxo.satoshis);

    // Create an output for the CLAIM output
    const claimNFTSatoshis = 3000;
    const claimNFT = bsv.Script.fromHex(saNFT + bnsKeyAddressHexRemovedPrefix); // Do not claim
    tx.addOutput(new bsv.Transaction.Output({
      script: claimNFT,
      satoshis: claimNFTSatoshis
    }));
 
    for (const letter of letters) {
      const tmpLocking = bsv.Script.fromASM(token.codePart.toASM() + ' ' + letter);
      step3LockingScripts.push(tmpLocking);
      tx.addOutput(new bsv.Transaction.Output({
        script: tmpLocking,
        satoshis: dividedSats / totalExtendOutputs // Devided by number of outputs
      }));
    }
 
    // Add Change
    changeSatoshis = (utxo.satoshis - FEE - (dividedSats));
    const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey1)
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
    token.replaceAsmVars(asmVars);
    let preimage = null;
    const isOpt = false;
    if (isOpt) {
      for (i = 0; ; i++) {
        // malleate tx and thus sighash to satisfy constraint
        tx.nLockTime = i;
        const preimage_ = getPreimage(tx, prevLockingScript.toASM(), nftSatoshiValue, 0, sighashType);
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
 
    const unlockingScript = token.extend(
      preimage,
      new Bytes(saNFT), 
      3000, 
      new Bytes('00'),  // Do not claim
      dividedSats,
      new Ripemd160(toHex(publicKey1Hash160)),
      changeSatoshis
    ).toScript();
    tx.inputs[0].setScript(unlockingScript)
    unlockP2PKHInput(privateKey1, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
    console.log('About to broadcast...', tx.toString());
    extend2Tx = await sendTx(tx, true);
    console.log('Step 3 complete. Extend Tx: ', extend2Tx)

  }

  // Release the NFT's at level 2
  {
    console.log('About to start releasing extensions at level 2....');

    let lockingCounter = 1;
    for (const letter of letters) {
      console.log('Releasing letter: ', letter);
      const lockingScriptIndex = lockingCounter - 1;
      await sleeper(6);
      // Release all Outputs     
      tx = new bsv.Transaction()
      // const utxo = await fetchUtxoLargeThan(privateKey1.toAddress(), 30000);
      // Spend the deploy to create the first extension 
      tx.addInput(new bsv.Transaction.Input({
        prevTxId: extend2Tx,
        outputIndex: lockingCounter,
        script: ''
      }), step3LockingScripts[lockingScriptIndex], dividedSats / totalExtendOutputs);
      // Create donation OP_RETURN
      tx.addOutput(new bsv.Transaction.Output({
        script: bsv.Script.fromHex('006a'),
        satoshis: 0
      }));
      let preimage = null;
      const isOpt = false;
      if (isOpt) {
        for (let i = 0; ; i++) {
          // malleate tx and thus sighash to satisfy constraint
          tx.nLockTime = i;
          const preimage_ = getPreimage(tx, step3LockingScripts[lockingScriptIndex].toASM(), dividedSats / totalExtendOutputs, 0, sighashType);
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
        preimage = getPreimage(tx, step3LockingScripts[lockingScriptIndex].toASM(), dividedSats / totalExtendOutputs, 0, sighashType)
      }
      
      const sig = signTx(tx, privateKey1, step3LockingScripts[lockingScriptIndex].toASM(), dividedSats / totalExtendOutputs, 0, sighashType);
      console.log('preimage', preimage);
      const releaseScript = token.release(
        new Sig(toHex(sig)),
        new PubKey(toHex(publicKey1)),
        preimage,
      ).toScript();
      tx.inputs[0].setScript(releaseScript)
      console.log('About to broadcast...', tx.toString());
      let release_tx = await sendTx(tx, true);
      console.log(`Step 4(${lockingScriptIndex}) complete. Release ${letters[lockingScriptIndex]} Tx: `, release_tx);
      lockingCounter++;
    }

    
  }
/*
  // -----------------------------------------------------
  // Step 3: Melt NFT
  {
    await sleeper(6);
    console.log('Preparing melt...');
    const tx = new bsv.Transaction();
    const utxo = await fetchUtxoLargeThan(privateKey1.toAddress(), 20000);
    // Add input is the NFT
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: transferTx,
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

    const changeOutputScriptRedeem = bsv.Script.buildPublicKeyHashOut(publicKey1)
    tx.addOutput(new bsv.Transaction.Output({
      script: changeOutputScriptRedeem,
      satoshis: nftSatoshiValue
    }))

    const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey1)
    tx.addOutput(new bsv.Transaction.Output({
      script: changeOutputScript,
      satoshis: changeSatoshis
    }))
    const preimage = getPreimage(tx, newLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    const sig = signTx(tx, privateKey1, newLockingScript.toASM(), nftSatoshiValue, 0, sighashType)
    // console.log('preimagehex', preimage.toJSON(), 'preimagejson', preimage.toString(), 'signature', toHex(sig));
    const pkh = bsv.crypto.Hash.sha256ripemd160(publicKey1.toBuffer())
    const changeAddress = toHex(pkh) // Needs to be unprefixed address
    const recpkh = bsv.crypto.Hash.sha256ripemd160(publicKey1.toBuffer());
    const recAddress = toHex(recpkh);

    const unlockingScript = token.melt(
      new Sig(toHex(sig)),
      new PubKey(toHex(publicKey1)),
      new Ripemd160(recAddress),
      preimage,
      new Ripemd160(changeAddress),
      changeSatoshis).toScript();

    tx.inputs[0].setScript(unlockingScript)
    unlockP2PKHInput(privateKey1, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
    console.log('About to broadcast...', tx.toString());
    let meltTx = await sendTx(tx)
    console.log('Step 3 complete. Melt Tx: ', meltTx)
    console.log('assetId (melted): ', assetId);
  }*/
  console.log('Success.')
} catch (error) {
  console.log('Failure.', error)
}

})()

