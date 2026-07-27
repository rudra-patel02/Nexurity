"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Thermometer,
  Zap,
} from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

function OverviewCards() {
  const machines = useMachineFeed();

  const metrics = useMemo(() => {
    const totalMachines = machines.length;
    let healthTotal = 0;
    let temperatureTotal = 0;
    let powerTotal = 0;
    let criticalAlerts = 0;

    machines.forEach((machine) => {
      healthTotal += machine.health || 0;
      temperatureTotal += machine.temperature || 0;
      powerTotal += machine.power || 0;

      if (machine.status === "Critical") {
        criticalAlerts += 1;
      }
    });

    const avgHealth =
      totalMachines > 0 ? (healthTotal / totalMachines).toFixed(1) : "0";
    const avgTemperature =
      totalMachines > 0 ? (temperatureTotal / totalMachines).toFixed(1) : "0";
    const energy = totalMachines > 0 ? powerTotal.toFixed(0) : "0";
    const avgHealthNumber = Number(avgHealth);
    const avgTemperatureNumber = Number(avgTemperature);
    const energyNumber = Number(energy);
    const criticalRatio =
      totalMachines > 0 ? Math.min((criticalAlerts / totalMachines) * 100, 100) : 0;

    return {
      avgHealth,
      avgHealthNumber,
      avgTemperature,
      avgTemperatureNumber,
      criticalAlerts,
      criticalRatio,
      energy,
      energyNumber,
      totalMachines,
    };
  }, [machines]);

  const cards = useMemo(() => [
    {
      accent: "from-cyan-300 to-blue-400",
      color: "text-cyan-300",
      icon: Cpu,
      progress: Math.min(metrics.totalMachines * 8, 100),
      sparkline: [42, 48, 54, 62, 68, 74],
      title: "Machines",
      trend: metrics.totalMachines > 0 ? "Fleet online" : "Awaiting assets",
      value: metrics.totalMachines,
    },
    {
      accent: "from-emerald-300 to-green-500",
      color: "text-emerald-300",
      icon: Activity,
      progress: metrics.avgHealthNumber,
      sparkline: [74, 78, 82, 81, 86, Math.max(metrics.avgHealthNumber, 12)],
      title: "Plant Health",
      trend: metrics.avgHealthNumber >= 80 ? "Stable operating band" : "Needs attention",
      value: `${metrics.avgHealth}%`,
    },
    {
      accent: "from-red-300 to-rose-500",
      color: "text-rose-300",
      icon: AlertTriangle,
      progress: metrics.criticalRatio,
      sparkline: [18, 14, 19, 12, 8, Math.max(metrics.criticalRatio, 5)],
      title: "Critical Alerts",
      trend: metrics.criticalAlerts === 0 ? "No critical faults" : "Escalation queue",
      value: metrics.criticalAlerts,
    },
    {
      accent: "from-amber-200 to-yellow-500",
      color: "text-amber-300",
      icon: Zap,
      progress: Math.min(metrics.energyNumber / 10, 100),
      sparkline: [34, 46, 42, 58, 51, Math.min(Math.max(metrics.energyNumber / 8, 18), 96)],
      title: "Energy",
      trend: "Load distribution",
      value: `${metrics.energy} kW`,
    },
    {
      accent: "from-orange-300 to-red-400",
      color: "text-orange-300",
      icon: Thermometer,
      progress: Math.min(metrics.avgTemperatureNumber * 1.4, 100),
      sparkline: [38, 42, 45, 47, 44, Math.min(Math.max(metrics.avgTemperatureNumber, 16), 92)],
      title: "Avg Temp",
      trend: metrics.avgTemperatureNumber > 70 ? "Thermal watch" : "Normal thermal range",
      value: `${metrics.avgTemperature} C`,
    },
    {
      accent: "from-violet-300 to-fuchsia-500",
      color: "text-violet-300",
      icon: Brain,
      progress: 96,
      sparkline: [72, 78, 84, 88, 92, 96],
      title: "AI Confidence",
      trend: "Model assurance",
      value: "96%",
    },
  ], [metrics]);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.42 }}
            whileHover={{ y: -4 }}
            className="premium-card metric-card surface-enter rounded-2xl p-6 transition-all duration-300 hover:border-cyan-300/30"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {card.title}
                </p>

                <h2 className={`mt-4 text-4xl font-black tracking-tight drop-shadow-[0_0_22px_rgba(34,211,238,0.12)] ${card.color}`}>
                  {card.value}
                </h2>
                <p className="mt-2 truncate text-sm font-medium text-slate-400">
                  {card.trend}
                </p>
              </div>

              <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 shadow-lg shadow-slate-950/30 ring-1 ring-white/20`}>
                <Icon size={26} className="shrink-0 text-slate-950" />
              </div>
            </div>
            <div className="mt-6 flex items-end gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/35 p-2">
              {card.sparkline.map((height, sparkIndex) => (
                <div
                  key={`${card.title}-${sparkIndex}`}
                  className="flex h-12 flex-1 items-end overflow-hidden rounded-full bg-slate-900/70"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(Math.max(height, 8), 100)}%` }}
                    transition={{ delay: index * 0.05 + sparkIndex * 0.035, duration: 0.45 }}
                    className={`w-full rounded-full bg-gradient-to-t ${card.accent} opacity-80`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.max(card.progress, 0), 100)}%` }}
                  transition={{ delay: index * 0.06 + 0.16, duration: 0.55 }}
                  className={`pulse-line h-full rounded-full bg-gradient-to-r ${card.accent}`}
                />
              </div>
              <span className="min-w-10 text-right text-xs font-bold text-slate-500">
                {Math.round(Math.min(Math.max(card.progress, 0), 100))}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default memo(OverviewCards);
