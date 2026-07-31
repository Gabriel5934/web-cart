import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjAn0oHBgfUKhOXnxMbigq6W64CT9m4J8",
  authDomain: "web-cart-53976.firebaseapp.com",
  projectId: "web-cart-53976",
};

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const useEmulator = args.has("--emulator");
const csvArgument = process.argv
  .slice(2)
  .find((argument) => !argument.startsWith("--"));
const csvPath = resolve(csvArgument ?? "members.csv");
const congregation =
  process.env.PHONE_BOOK_CONGREGATION ?? "jardim-esplanada";

if (args.has("--help")) {
  console.log(`Usage: npm run phone-book:import -- [members.csv] [options]

Options:
  --write       Write entries to Firestore (otherwise performs a dry run)
  --emulator    Use the Firestore emulator at 127.0.0.1:8085
  --help        Show this help

Environment:
  PHONE_BOOK_CONGREGATION  Congregation ID (default: jardim-esplanada)`);
  process.exit(0);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field");

  return rows;
}

function normalizePhoneNumber(value) {
  const digits = value.replace(/\D/g, "");
  const internationalDigits = digits.startsWith("55") ? digits : `55${digits}`;

  if (!/^55\d{10,11}$/.test(internationalDigits)) {
    throw new Error(`Invalid Brazilian phone number: "${value}"`);
  }

  return `+${internationalDigits}`;
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function toPhoneBookEntry(name, number) {
  const displayName = normalizeName(name);
  const [firstName, ...lastNameParts] = displayName.split(" ");

  if (!firstName || lastNameParts.length === 0) {
    throw new Error(`Expected a first and last name: "${name}"`);
  }

  return {
    authUid: "",
    congregation,
    role: "user",
    firstName,
    lastName: lastNameParts.join(" "),
    displayName,
    phoneNumber: normalizePhoneNumber(number),
  };
}

const contents = await readFile(csvPath, "utf8");
const [rawHeader, ...rawRows] = parseCsv(contents.replace(/^\uFEFF/, ""));

if (!rawHeader) throw new Error("CSV is empty");

const header = rawHeader.map((value) => value.trim().toLowerCase());
const nameIndex = header.indexOf("name");
const numberIndex = header.indexOf("number");

if (nameIndex === -1 || numberIndex === -1) {
  throw new Error('CSV must contain "name" and "number" columns');
}

const entries = rawRows.map((row, index) => {
  try {
    return toPhoneBookEntry(row[nameIndex] ?? "", row[numberIndex] ?? "");
  } catch (error) {
    throw new Error(`Row ${index + 2}: ${error.message}`, { cause: error });
  }
});

const duplicates = entries
  .filter(
    (entry, index) =>
      entries.findIndex(
        (candidate) => candidate.phoneNumber === entry.phoneNumber
      ) !== index
  )
  .map((entry) => entry.phoneNumber);

if (duplicates.length) {
  throw new Error(`Duplicate phone numbers: ${[...new Set(duplicates)].join(", ")}`);
}

console.table(
  entries.map(({ displayName, phoneNumber }) => ({ displayName, phoneNumber }))
);

if (!shouldWrite) {
  console.log(
    `Dry run: validated ${entries.length} entries. Add --write to import them.`
  );
  process.exit(0);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (useEmulator) {
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
}

const batch = writeBatch(db);
const existingDocuments = await Promise.all(
  entries.map((entry) => getDoc(doc(db, "phone-book", entry.phoneNumber)))
);

for (const [index, entry] of entries.entries()) {
  batch.set(
    doc(db, "phone-book", entry.phoneNumber),
    {
      ...entry,
      ...(existingDocuments[index].exists()
        ? {}
        : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

await batch.commit();
console.log(
  `Imported ${entries.length} entries into ${
    useEmulator ? "the local emulator" : firebaseConfig.projectId
  }/phone-book.`
);
