import {
  blake2AsU8a,
  encodeAddress,
} from "https://esm.sh/@polkadot/util-crypto";
import {
  hexToU8a,
  stringToU8a,
  u8aConcat,
} from "https://esm.sh/@polkadot/util";

const input = Deno.args[0];
if (!input) {
  console.error("usage: deno run evmToSubstrate.ts <ETH_ADDRESS_HERE>");
  Deno.exit(1);
}
const addr = hexToU8a(input);
const data = stringToU8a("evm:");
const res = blake2AsU8a(u8aConcat(data, addr));
const output = encodeAddress(res, 42);
console.log({ input, output });
// run using:
// $ deno run evmToSubstrate.ts <ETH_ADDRESS_HERE>