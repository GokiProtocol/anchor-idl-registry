import type { Idl } from "@project-serum/anchor";
import { Program, Provider, Wallet } from "@project-serum/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import axios from "axios";
import * as fs from "fs/promises";
import * as yaml from "js-yaml";
import { uniq } from "lodash";

const downloadIDL = async (address: string): Promise<Idl | null> => {
  // const connection = new Connection("https://api.devnet.solana.com");
  const connection = new Connection("https://gokal.rpcpool.com");
  const provider = new Provider(
    connection,
    new Wallet(Keypair.generate()),
    Provider.defaultOptions()
  );
  return await Program.fetchIdl(address, provider);
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

const downloadAll = async () => {
  const known = yaml.load(
    (await fs.readFile(`${__dirname}/../known.yml`)).toString()
  ) as Record<
    string,
    {
      url: string;
    }
  >;

  const knownProgramIDs = Object.keys(known);

  await Promise.all(
    uniq([...PROGRAMS, ...knownProgramIDs]).map(async (programID) => {
      const cluster = "mainnet-beta";
      const dir = `${__dirname}/../data/${cluster}/${programID}`;
      try {
        await fs.stat(`${dir}/idl.json`);
        console.warn(`${cluster} ${programID} has already been fetched`);
        return;
      } catch (e) {
        //
      }

      let idl: Idl | null | null;
      const knownIDL = known[programID];
      if (knownIDL) {
        const { data } = await axios.get<Idl>(knownIDL.url);
        idl = data;
      } else {
        idl = await downloadIDL(programID);
        if (!idl) {
          console.warn(`IDL not on-chain for ${cluster} ${programID}.`);
        }
      }
      if (!idl) {
        return null;
      }
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(`${dir}/idl.json`, JSON.stringify(idl, null, 2));
    })
  );
};

downloadAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
