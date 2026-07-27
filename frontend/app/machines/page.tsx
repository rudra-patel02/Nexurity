"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import FactoryScene from "@/components/3d/FactoryScene";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useMachineFeed, useMachineFeedReady } from "@/hooks/useMachineFeed";
import { useRouter } from "next/navigation";
import type { MachinePrediction, MachineStatus } from "@/types/machine";

type Machine = {
  _id: string;
  machineId: string;
  name: string;
  department: string;
  status: MachineStatus;
  health: number;
  temperature: number;
  aiPrediction?: MachinePrediction;
};

export default function MachinesPage() {
  const [search, setSearch] = useState("");
  const machines = useMachineFeed() as Machine[];
  const feedReady = useMachineFeedReady();
  const loading = !feedReady;
  const router = useRouter();

  const filteredMachines = useMemo(() => machines.filter((machine) => {
    const searchText = search.toLowerCase();

    return (
      machine.name?.toLowerCase().includes(searchText) ||
      machine.machineId?.toLowerCase().includes(searchText) ||
      machine.department?.toLowerCase().includes(searchText)
    );
  }), [machines, search]);

  return (
    <DashboardLayout>
      <div className="page-stack space-y-4 text-white surface-enter">
        <section className="premium-card rounded-2xl p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">
              Assets
            </p>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight md:text-3xl">
              Machine Management
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Search, inspect, and monitor connected industrial machines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/machines/add")}
            className="premium-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={18} />
            Add Machine
          </button>
          </div>
        </section>

        <label className="premium-input flex items-center rounded-xl px-4 py-2.5">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search machine, ID, or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ml-3 min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </label>

      <div className="premium-card rounded-2xl">
        <div className="w-full overflow-x-auto overscroll-x-contain pb-2">

        <table className="w-full min-w-[1340px] table-fixed text-sm">

          <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="w-[128px] whitespace-nowrap px-4 py-3 text-left">Machine ID</th>
              <th className="w-[210px] whitespace-nowrap px-4 py-3 text-left">Machine</th>
              <th className="w-[160px] whitespace-nowrap px-4 py-3 text-left">Department</th>
              <th className="w-[170px] whitespace-nowrap px-4 py-3 text-left">Status</th>
              <th className="w-[105px] whitespace-nowrap px-4 py-3 text-left">Health</th>
              <th className="w-[150px] whitespace-nowrap px-4 py-3 text-left">Temperature</th>
              <th className="w-[130px] whitespace-nowrap px-4 py-3 text-left">AI Risk</th>
              <th className="w-[180px] whitespace-nowrap px-4 py-3 text-left">Maintenance</th>
              <th className="w-[207px] whitespace-nowrap px-4 py-3 pr-8 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-cyan-300"
                >
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Loader2 size={18} className="animate-spin" />
                    Loading machines
                  </span>
                </td>
              </tr>
            ) : filteredMachines.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-slate-400"
                >
                  No machines match this view.
                </td>
              </tr>
            ) : (
              filteredMachines.map((machine) => (
                <tr
                  key={machine._id}
                  className="border-b border-slate-800/80 transition hover:bg-cyan-400/5"
                >
                  <td className="px-4 py-3 font-semibold text-cyan-100">{machine.machineId}</td>

                  <td className="px-4 py-3 font-semibold">{machine.name}</td>

                  <td className="px-4 py-3 text-slate-300">{machine.department}</td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`status-pill whitespace-nowrap ${
                        machine.status === "Running"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : machine.status === "Warning"
                          ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                          : machine.status === "Critical"
                          ? "border-red-400/30 bg-red-500/10 text-red-200"
                          : "border-slate-500/30 bg-slate-700/50 text-slate-300"
                      }`}
                    >
                      {machine.status}
                    </span>
                  </td>

                  <td
                    className={`px-4 py-3 font-bold ${
                      machine.health >= 90
                        ? "text-green-400"
                        : machine.health >= 60
                        ? "text-yellow-400"
                        : "text-red-500"
                    }`}
                  >
                    {Number(machine.health ?? 0).toFixed(1)}%
                  </td>

                  <td
                    className={`px-4 py-3 font-bold ${
                      Number(machine.temperature ?? 0) < 70
                        ? "text-green-400"
                        : Number(machine.temperature ?? 0) < 90
                        ? "text-yellow-400"
                        : "text-red-500"
                    }`}
                  >
                    {Number(machine.temperature ?? 0).toFixed(1)} C
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`status-pill whitespace-nowrap ${
                        machine.aiPrediction?.failureRisk === "High"
                          ? "border-red-400/30 bg-red-500/10 text-red-200"
                          : machine.aiPrediction?.failureRisk === "Medium"
                          ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      }`}
                    >
                      {machine.aiPrediction?.failureRisk ?? "Low"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {machine.aiPrediction?.maintenancePriority ?? "-"}
                      </div>

                      <div className="text-slate-400">
                        {machine.aiPrediction?.maintenanceInDays ?? "-"} days
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 pr-8">
                    <Link
                      href={`/machines/${machine.machineId}`}
                      className="premium-button inline-flex min-w-[72px] justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}

          </tbody>
        </table>
        </div>

      </div>

      <section className="premium-card flex h-[min(56vh,580px)] min-h-[520px] flex-col rounded-2xl p-4">
        <div className="mb-3 flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Digital Twin Factory</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live 3D view of the visible machine fleet.
            </p>
          </div>
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
            {filteredMachines.slice(0, 5).length} assets mapped
          </span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
          <FactoryScene
            machineData={filteredMachines}
            showSensorOverlays={false}
            showMachineLabels={false}
            minHeight={0}
            sceneScale={0.94}
          />
        </div>
      </section>

      </div>
    </DashboardLayout>
  );
}
