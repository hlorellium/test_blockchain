import * as crypto from 'crypto';
import { SourceMap } from 'module';
import { addListener } from 'process';
import { isTypeAliasDeclaration } from './node_modules/typescript/lib/typescript';

class Transaction {
  constructor(amount: number, payer: string, payee: string) {}

  toString() {
    return JSON.stringify(this);
  }
}

class Block {
  nonce = Math.round(Math.random() * 999999999);

  constructor(prevHash: string, transaction: Transaction, ts = Date.now()) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

class Chain {
  static instance = new Chain();

  chain: Block[];

  constructor() {
    this.chain = [new Block('', new Transaction(100, 'genesis', 'evangelion'))];
  }

  get lastBock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(transaction.toString());
    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }

  mine(nonce: number) {
    let solution = 1;
    console.log('⛏️ mining...');

    while (true) {
      const hash = crypto.createHash('MD5');
      hash.update((nonce + solution).toString()).end();
      const attempt = hash.digest('hex');

      if (attempt.substring(0, 4) === '0000') {
        console.log(`Solver: ${solution}`);
        return solution;
      }

      solution += 1;
    }
  }
}

class Wallet {
  publicKey: string;
  privateKey: string;

  constructor() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

    const sign = crypto.createSign('SHA256');
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

const evangelion = new Wallet();
const george = new Wallet();
const neon = new Wallet();

evangelion.sendMoney(50, george.publicKey);
george.sendMoney(20, neon.publicKey);
neon.sendMoney(10, george.publicKey);
