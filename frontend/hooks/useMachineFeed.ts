"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

let machinesSnapshot: MachineData[] = [];
let hasLoadedSnapshot = false;
let loadPromise: Promise<void> | null = null;
let socketSubscribed = false;
let lastSnapshotSignature = "";
let emitFrame: number | null = null;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const scheduleEmitChange = () => {
  if (typeof window === "undefined") {
    emitChange();
    return;
  }

  if (emitFrame !== null) {
    return;
  }

  emitFrame = window.requestAnimationFrame(() => {
    emitFrame = null;
    emitChange();
  });
};

const getMachineSignature = (machine: MachineData) =>
  [
    machine._id,
    machine.machineId,
    machine.status,
    machine.health,
    machine.temperature,
    machine.power,
    machine.lastSeen,
    machine.lastHeartbeat,
    machine.lastLiveTelemetryAt,
  ].join(":");

const getSnapshotSignature = (machines: MachineData[]) =>
  `${machines.length}|${machines.map(getMachineSignature).join("|")}`;

const setMachinesSnapshot = (nextMachines: MachineData[]) => {
  const nextSignature = getSnapshotSignature(nextMachines);

  if (nextSignature === lastSnapshotSignature) {
    hasLoadedSnapshot = true;
    return;
  }

  machinesSnapshot = nextMachines;
  lastSnapshotSignature = nextSignature;
  hasLoadedSnapshot = true;
  scheduleEmitChange();
};

const loadMachines = (force = false) => {
  if (force || !loadPromise) {
    loadPromise = fetchMachines()
      .then(setMachinesSnapshot)
      .catch(() => setMachinesSnapshot([]))
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
};

export const refreshMachineFeed = () => loadMachines(true);

const handleMachineUpdate = (nextMachines: MachineData[]) => {
  setMachinesSnapshot(nextMachines);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  if (!socketSubscribed) {
    socket.on("machineUpdate", handleMachineUpdate);
    socketSubscribed = true;
  }

  if (!hasLoadedSnapshot) {
    void loadMachines();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && socketSubscribed) {
      socket.off("machineUpdate", handleMachineUpdate);
      socketSubscribed = false;
    }

    if (listeners.size === 0 && emitFrame !== null) {
      window.cancelAnimationFrame(emitFrame);
      emitFrame = null;
    }
  };
};

const getSnapshot = () => machinesSnapshot;
const getServerSnapshot = () => [];
const getLoadedSnapshot = () => hasLoadedSnapshot;
const getServerLoadedSnapshot = () => false;

export const useMachineFeed = () => {
  const machines = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!hasLoadedSnapshot) {
      void loadMachines();
    }
  }, [machines.length]);

  return machines;
};

export const useMachineFeedReady = () =>
  useSyncExternalStore(subscribe, getLoadedSnapshot, getServerLoadedSnapshot);
