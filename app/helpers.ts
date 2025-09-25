"use client";

import { UserDoc } from "./firebase/users/types";

export function getSession() {
  const localStorageUser = localStorage.getItem("user");
  return localStorageUser ? (JSON.parse(localStorageUser) as UserDoc) : null;
}
