// 📁 DESTINATION: src/app/lib/deviceParser.js
//
// Turns the raw User-Agent string we already store on every login
// attempt into a short, human-readable device summary, e.g.
// "Samsung SM-A125F · Android · Mobile Chrome" or "Windows · Chrome".
//
// Requires: npm install ua-parser-js

import { UAParser } from "ua-parser-js";

export function describeDevice(userAgent) {
  if (!userAgent) return "Unknown device";

  try {
    const { browser, os, device } = new UAParser(userAgent).getResult();

    const parts = [];
    if (device?.vendor || device?.model) {
      parts.push([device.vendor, device.model].filter(Boolean).join(" "));
    }
    if (os?.name) {
      parts.push(os.version ? `${os.name} ${os.version}` : os.name);
    }
    if (browser?.name) {
      parts.push(browser.name);
    }

    return parts.length ? parts.join(" · ") : "Unknown device";
  } catch {
    return "Unknown device";
  }
}