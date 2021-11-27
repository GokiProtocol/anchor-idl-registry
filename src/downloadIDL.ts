import { Program, Provider, Wallet } from "@project-serum/anchor";
import type { Cluster } from "@solana/web3.js";
import { Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs/promises";

const downloadIDL = async (
  cluster: Cluster,
  address: string
): Promise<void> => {
  const dir = `${__dirname}/../data/${cluster}/${address}`;
  try {
    await fs.stat(`${dir}/idl.json`);
    console.warn(`${cluster} ${address} has already been fetched`);
    return;
  } catch (e) {
    //
  }

  // const connection = new Connection("https://api.devnet.solana.com");
  const connection = new Connection("https://gokal.rpcpool.com");
  const provider = new Provider(
    connection,
    new Wallet(Keypair.generate()),
    Provider.defaultOptions()
  );
  const idl = await Program.fetchIdl(address, provider);
  if (!idl) {
    console.warn(`IDL not on-chain for ${cluster} ${address}.`);
    return;
  }
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(`${dir}/idl.json`, JSON.stringify(idl, null, 2));
};

const PROGRAMS = [
  "22Y43yTVxuUkoRKdm9thyRhQ3SdgQS7c7kB6UNCiaczD",
  "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",

  // these don't exist
  "mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68",
  "QRDxhMw1P2NEfiw5mYXG79bwfgHTdasY2xNP76XSea9",
  "QREGBnEj9Sa5uR91AV8u3FxThgP5ZCvdZUW2bHAkfNc",
  "QoP6NfrQbaGnccXQrMLUkog2tQZ4C1RFgJcwDnT8Kmz",
  "GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
];

Promise.all(
  PROGRAMS.map(async (programID) => {
    return downloadIDL("mainnet-beta", programID);
  })
).catch((err) => {
  console.error(err);
  process.exit(1);
});
