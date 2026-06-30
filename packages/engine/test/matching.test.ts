import { ipToInt, parseCidr, parseIpRange, ipMatchesAddressValue, portMatchesServiceValue } from "../src/matching";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ok: ${message}`);
}

console.log("ipToInt:");
assert(ipToInt("0.0.0.0") === 0, "0.0.0.0 -> 0");
assert(ipToInt("255.255.255.255") === 0xffffffff, "255.255.255.255 -> max uint32");
assert(ipToInt("10.0.1.5") === 10 * 256 ** 3 + 0 * 256 ** 2 + 1 * 256 + 5, "10.0.1.5 -> correct value");

console.log("parseCidr boundaries:");
{
  const { start, end } = parseCidr("10.0.2.0/24");
  assert(start === ipToInt("10.0.2.0"), "/24 network address is start");
  assert(end === ipToInt("10.0.2.255"), "/24 broadcast address is end");
}
{
  const { start, end } = parseCidr("10.0.2.10/32");
  assert(start === end && start === ipToInt("10.0.2.10"), "/32 is a single address");
}
{
  const { start, end } = parseCidr("0.0.0.0/0");
  assert(start === 0 && end === 0xffffffff, "/0 covers entire address space");
}

console.log("parseIpRange:");
{
  const { start, end } = parseIpRange("10.0.1.10-10.0.1.20");
  assert(start === ipToInt("10.0.1.10") && end === ipToInt("10.0.1.20"), "range parses correctly");
}

console.log("ipMatchesAddressValue:");
assert(ipMatchesAddressValue("10.0.2.10", "subnet", "10.0.2.0/24") === true, "10.0.2.10 is inside 10.0.2.0/24");
assert(ipMatchesAddressValue("10.0.3.10", "subnet", "10.0.2.0/24") === false, "10.0.3.10 is outside 10.0.2.0/24");
assert(ipMatchesAddressValue("10.0.2.255", "subnet", "10.0.2.0/24") === true, "broadcast address is inside /24");
assert(ipMatchesAddressValue("10.0.3.0", "subnet", "10.0.2.0/24") === false, "one past broadcast is outside /24");
assert(ipMatchesAddressValue("203.0.113.50", "subnet", "all") === true, "'all' matches anything");
assert(ipMatchesAddressValue("10.0.1.15", "range", "10.0.1.10-10.0.1.20") === true, "inside range matches");
assert(ipMatchesAddressValue("10.0.1.21", "range", "10.0.1.10-10.0.1.20") === false, "just outside range does not match");

console.log("portMatchesServiceValue:");
assert(portMatchesServiceValue(443, "443") === true, "exact port match");
assert(portMatchesServiceValue(80, "443") === false, "different port does not match");
assert(portMatchesServiceValue(8080, "1024-65535") === true, "port inside range matches");
assert(portMatchesServiceValue(80, "1024-65535") === false, "port below range does not match");

console.log("\nAll matching.ts tests passed.");
