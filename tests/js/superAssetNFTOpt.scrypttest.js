const path = require('path');
const { expect } = require('chai');
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
    inputIndex,
    inputSatoshis,
 
    loadDesc,
    createLockingTx,
    sendTx,
    fetchUtxoLargeThan,
    unlockP2PKHInput,
    sighashType2Hex,
    compileContract,
 
    DataLen, dummyTxId, reversedDummyTxId
} = require("../../helper");

const Hash = bsv.crypto.Hash

function newTx() {
    const utxo = {
      txId: '1477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58452',
      outputIndex: 0,
      script: '',   // placeholder
      satoshis: 3000
    };
    return new bsv.Transaction().from(utxo);
}

  
const tx = newTx();

const Signature = bsv.crypto.Signature
const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID

// MSB of the sighash  due to lower S policy
const MSB_THRESHOLD = 0x7E

function generatePreimage(isOpt, tx, token, nftSatoshiValue, sighashType) {
    let preimage = null;
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
        preimage = getPreimage(tx, token.lockingScript.toASM(), nftSatoshiValue, 0, sighashType);
    }
    return preimage;
}

describe('Test contract SuperAssetNFT In Javascript', () => {
    let test, preimage, result

    const privateKey1 = new bsv.PrivateKey.fromRandom('testnet')
    const publicKey1 = bsv.PublicKey.fromPrivateKey(privateKey1)
    const publicKey1Address = publicKey1.toAddress();
    const publicKey1AddressHexRemovedPrefix = publicKey1Address.toHex().substring(2);
    const publicKey1Hash160 = bsv.crypto.Hash.sha256ripemd160(publicKey1.toBuffer());
 
    const privateKey2 = new bsv.PrivateKey.fromRandom('testnet')
    const publicKey2 = bsv.PublicKey.fromPrivateKey(privateKey2)
    const publicKey2Address = publicKey1.toAddress();
    const publicKey2AddressHexRemovedPrefix = publicKey2Address.toHex().substring(2);
    const publicKey2Hash160 = bsv.crypto.Hash.sha256ripemd160(publicKey2.toBuffer());
 
    before(() => {
        // const Test = buildContractClass(compileContract('optimalPushtx.scrypt'))
        const Test = buildContractClass(compileContract('SuperAssetNFTOpt.scrypt'))
        test = new Test();
        
        // // use this if sigHashType needs to be customized, using Tx.checkPreimageOpt_(txPreimage)
        const asmVars = {'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashType)}
        test.replaceAsmVars(asmVars)

        // set txContext for verification
        test.txContext = {
            tx,
            inputIndex: 0,
            inputSatoshis: 3000
        }
        // code part
        lockingScriptCodePart = test.codePart.toASM()
    });

    it('should return true', async () => {
        const assetId = '26e3df51e2f58c16e997f7e24c4223a6b34970527ea5c665d08cd49e51f7575a00000000';
        const receiverRipemd = publicKey1AddressHexRemovedPrefix;//'131135fb156fa4414714dbcf4cf9ac39a3f0e4a0';
        test.setDataPart(assetId + ' ' + receiverRipemd);
        let newLockingScript = bsv.Script.fromASM(test.codePart.toASM() + ' ' + assetId + ' ' + receiverRipemd);
        console.log('newLockingScript', newLockingScript.toHex());
        // const tx = new bsv.Transaction()
        // const utxo = await fetchUtxoLargeThan(privateKey2.toAddress(), 20000);
        const nftSatoshiValue = 3000;
        // Add the mock NFT input
        tx.addInput(new bsv.Transaction.Input({
            prevTxId: dummyTxId,
            outputIndex: 0,
            script: ''
        }), bsv.Script.fromASM(test.lockingScript.toASM()), nftSatoshiValue);
        /*
        // Add funding input
        // Not needed for a test 
        tx.addInput(new bsv.Transaction.Input({
            prevTxId: utxo.txId,
            outputIndex: utxo.outputIndex,
            script: ''
        }), utxo.script, utxo.satoshis);
        */
        const utxo = {
            satoshis: 44444
        };
        // Add the nft output
        tx.addOutput(new bsv.Transaction.Output({
            script: newLockingScript,
            satoshis: nftSatoshiValue
        }));
        const FEE = 1000;
        // Add change output
        changeSatoshis = utxo.satoshis - FEE;
        const changeOutputScript = bsv.Script.buildPublicKeyHashOut(publicKey2);
        tx.addOutput(new bsv.Transaction.Output({
            script: changeOutputScript,
            satoshis: changeSatoshis
        }));
        const preimage = generatePreimage(true, tx, test, nftSatoshiValue, sighashType);
        const sig = signTx(tx, privateKey1, test.lockingScript.toASM(), nftSatoshiValue, 0, sighashType);
        let unlockingScript = test.transfer(
            new Sig(toHex(sig)),
            new PubKey(toHex(publicKey1)),
            new Ripemd160(toHex(publicKey1Hash160)),
            preimage,
            new Bool(false), // Not a melt, but a transfer update
            new Bytes('00'), // No payload update
            new Ripemd160(toHex(publicKey2Hash160)),
            changeSatoshis
        )
        const result = unlockingScript.verify();
        console.log('result', result);
        expect(result.success, result.error).to.be.true
    });
});
