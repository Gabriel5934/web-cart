const { readFile } = require("node:fs/promises");
const { after, before, beforeEach, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const { doc, setDoc, updateDoc } = require("firebase/firestore");

const projectId = "demo-web-cart";
const phoneNumbers = {
  adminA: "+5511999990001",
  adminB: "+5511999990002",
  userA: "+5511999990003",
};
const schedule = {
  meetingsWeekDays: [3, 0],
  meetingsTimes: ["19:30", "10:00"],
  ministryWeekDays: [6],
  ministryTimes: ["09:00"],
  ministryMeetingPoints: [1],
};

let testEnvironment;

function authenticatedDb(uid, phoneNumber) {
  return testEnvironment
    .authenticatedContext(uid, { phone_number: phoneNumber })
    .firestore();
}

async function seedData() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "congregation", "congregation-a"), { name: "A", ...schedule }),
      setDoc(doc(db, "congregation", "congregation-b"), { name: "B", ...schedule }),
      setDoc(doc(db, "phone-book", phoneNumbers.adminA), {
        authUid: "admin-a",
        congregation: "congregation-a",
        displayName: "Admin A",
        firstName: "Admin",
        lastName: "A",
        phoneNumber: phoneNumbers.adminA,
        role: "admin",
      }),
      setDoc(doc(db, "phone-book", phoneNumbers.adminB), {
        authUid: "admin-b",
        congregation: "congregation-b",
        displayName: "Admin B",
        firstName: "Admin",
        lastName: "B",
        phoneNumber: phoneNumbers.adminB,
        role: "admin",
      }),
      setDoc(doc(db, "phone-book", phoneNumbers.userA), {
        authUid: "user-a",
        congregation: "congregation-a",
        displayName: "User A",
        firstName: "User",
        lastName: "A",
        phoneNumber: phoneNumbers.userA,
        role: "user",
      }),
    ]);
  });
}

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedData();
});

after(async () => {
  await testEnvironment.cleanup();
});

describe("updateCongregationSchedule", () => {
  test("allows an admin to update their congregation schedule", async () => {
    const db = authenticatedDb("admin-a", phoneNumbers.adminA);
    await assertSucceeds(
      updateDoc(doc(db, "congregation", "congregation-a"), schedule),
    );
  });

  test("denies an unauthenticated schedule update", async () => {
    const db = testEnvironment.unauthenticatedContext().firestore();
    await assertFails(
      updateDoc(doc(db, "congregation", "congregation-a"), schedule),
    );
  });

  test("denies a non-admin schedule update", async () => {
    const db = authenticatedDb("user-a", phoneNumbers.userA);
    await assertFails(
      updateDoc(doc(db, "congregation", "congregation-a"), schedule),
    );
  });

  test("denies an admin from another congregation", async () => {
    const db = authenticatedDb("admin-b", phoneNumbers.adminB);
    await assertFails(
      updateDoc(doc(db, "congregation", "congregation-a"), schedule),
    );
  });

  test("denies changes outside the schedule fields", async () => {
    const db = authenticatedDb("admin-a", phoneNumbers.adminA);
    await assertFails(
      updateDoc(doc(db, "congregation", "congregation-a"), { name: "Changed" }),
    );
  });
});

describe("updateCongregationAnnouncement", () => {
  const announcement = {
    title: "Aviso importante",
    message: "Reunião especial neste fim de semana.",
    startDate: "2026-08-12",
    endDate: "2026-08-16",
  };

  test("allows an admin to update their congregation announcement", async () => {
    const db = authenticatedDb("admin-a", phoneNumbers.adminA);
    await assertSucceeds(
      updateDoc(doc(db, "congregation", "congregation-a"), { announcement }),
    );
  });

  test("denies a non-admin announcement update", async () => {
    const db = authenticatedDb("user-a", phoneNumbers.userA);
    await assertFails(
      updateDoc(doc(db, "congregation", "congregation-a"), { announcement }),
    );
  });

  test("denies an admin updating another congregation's announcement", async () => {
    const db = authenticatedDb("admin-b", phoneNumbers.adminB);
    await assertFails(
      updateDoc(doc(db, "congregation", "congregation-a"), { announcement }),
    );
  });
});

describe("phone-book protected fields", () => {
  test("allows a user to create a profile in their chosen congregation", async () => {
    const phoneNumber = "+5511999990004";
    const db = authenticatedDb("new-user", phoneNumber);
    await assertSucceeds(
      setDoc(doc(db, "phone-book", phoneNumber), {
        authUid: "new-user",
        congregation: "congregation-a",
        displayName: "New User",
        firstName: "New",
        lastName: "User",
        phoneNumber,
        role: "user",
      }),
    );
  });

  test("denies creating a profile with an admin role", async () => {
    const phoneNumber = "+5511999990004";
    const db = authenticatedDb("new-user", phoneNumber);
    await assertFails(
      setDoc(doc(db, "phone-book", phoneNumber), {
        authUid: "new-user",
        congregation: "congregation-b",
        displayName: "New User",
        firstName: "New",
        lastName: "User",
        phoneNumber,
        role: "admin",
      }),
    );
  });

  test("denies a user changing their role", async () => {
    const db = authenticatedDb("user-a", phoneNumbers.userA);
    await assertFails(
      updateDoc(doc(db, "phone-book", phoneNumbers.userA), { role: "admin" }),
    );
  });

  test("allows an administrator to update a non-protected profile field", async () => {
    const db = authenticatedDb("admin-a", phoneNumbers.adminA);
    await assertSucceeds(
      updateDoc(doc(db, "phone-book", phoneNumbers.userA), {
        displayName: "Updated User",
      }),
    );
  });
});

test("rules tests execute assertions", () => {
  assert.ok(testEnvironment);
});
