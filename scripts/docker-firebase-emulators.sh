#!/bin/sh

set -eu

set -- \
  emulators:start \
  --only auth,firestore \
  --project web-cart-53976 \
  --export-on-exit=/workspace/state/emulator-data

if [ -f /workspace/state/emulator-data/firebase-export-metadata.json ]; then
  set -- "$@" --import=/workspace/state/emulator-data
fi

firebase "$@" &
firebase_pid=$!

shutdown() {
  firebase emulators:export /workspace/state/emulator-data \
    --force \
    --project web-cart-53976
  kill -TERM "$firebase_pid"
  wait "$firebase_pid"
}

trap shutdown INT TERM

wait "$firebase_pid"
