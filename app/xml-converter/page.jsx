'use client';

import { useState } from 'react';
import Papa from 'papaparse';

export default function XmlConverterPage() {
  const [xml, setXml] = useState("");

  const handleCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data.filter(r => Object.values(r).some(Boolean));
        const xmlContent = generateWitsmlXml(rows);
        setXml(xmlContent);
        downloadFile(xmlContent, "drilling-data.xml");
      }
    });
  };

  const downloadFile = (content, filename) => {
    const file = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-4">CSV → WITSML XML Converter</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleCSV}
        className="text-black"
      />

      {xml && (
        <pre className="mt-6 p-4 bg-black/40 rounded overflow-x-auto text-xs">
          {xml}
        </pre>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   WITSML XML GENERATOR (Option A: 1 ChannelSet, many Channels)
--------------------------------------------------------- */

function generateWitsmlXml(rows) {
  if (!rows.length) return "";

  const columns = Object.keys(rows[0]);
  const indexColumn = "DATE";
  const channelColumns = columns.filter(c => c !== indexColumn);

  // Build index array
  const indexValues = rows.map(r => r[indexColumn]);

  // Build channel arrays
  const channels = channelColumns.map(col => ({
    name: col,
    values: rows.map(r => r[col])
  }));

  // XML build
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;

  const namespaces = `
<Log xmlns="http://www.energistics.org/energyml/data/witsmlv2"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns:eml="http://www.energistics.org/energyml/data/commonv2">
`;

  const channelSetStart = `
  <ChannelSet>
    <Index>
      <IndexKind>date time</IndexKind>
      <Uom>s</Uom>
      <Direction>increasing</Direction>
      <Mnemonic>DATE</Mnemonic>
    </Index>
`;

  const indexData = `
    <Data>
      <Data>[${indexValues.map(v => `"${v}"`).join(", ")}]</Data>
    </Data>
`;

  const channelsXml = channels
    .map((ch) => {
      return `
    <Channel>
      <Mnemonic>${ch.name}</Mnemonic>
      <GlobalMnemonic>${ch.name}</GlobalMnemonic>
      <DataKind>double</DataKind>
      <Uom>${guessUom(ch.name)}</Uom>
      <ChannelPropertyKind uidRef="unknown"/>
      <Index uidRef="DATE"/>
      <Data>
        <Data>[${ch.values.map(v => sanitize(v)).join(", ")}]</Data>
      </Data>
    </Channel>
`;
    })
    .join("");

  const channelSetEnd = `
  </ChannelSet>
</Log>`;

  return (
    xmlHeader +
    namespaces +
    channelSetStart +
    channelsXml +
    channelSetEnd
  );
}

/* -------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function sanitize(v) {
  if (v === undefined || v === null || v === '' || v === -9999) return "null";
  return typeof v === "string" ? `"${v}"` : v;
}

function guessUom(name) {
  name = name.toLowerCase();

  if (name.includes("dmea") || name.includes("dver")) return "m";
  if (name.includes("rpm")) return "rpm";
  if (name.includes("tqa")) return "N.m";
  if (name.includes("wob") || name.includes("swob")) return "daN";
  if (name.includes("rop")) return "m/h";

  return "unitless";
}
