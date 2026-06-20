"use client";

import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface Props {
  data: number[];
  color?: string;
  height?: number;
}

export default function Sparkline({ data, color = "#FF7B3F", height = 40 }: Props) {
  const values = data.length > 0 ? data : [0, 0];
  const chartData = values.map((v, i) => ({ i, v }));
  const gradId = `sg${color.replace(/[^a-zA-Z0-9]/g, "")}`;
  const last = values[values.length - 1] ?? 0;
  const prev = values[values.length - 2] ?? 0;
  const strokeColor = last >= prev ? color : "#EF4444";

  return (
    <div style={{ width: 88, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
