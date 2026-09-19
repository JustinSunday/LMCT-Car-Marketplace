import React from "react";

export default function BarChart({ data, color = "#c9a66b", height = 180 }) {
  const width = 100; // percentage-based viewBox, scales to container
  const maxValue = Math.max(1, ...data.map((point) => point.value));
  const barGap = data.length > 0 ? width / data.length : width;
  const barWidth = Math.max(barGap * 0.55, 1);

  return (
    <div className="barChart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="barChartSvg"
      >
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * (height - 26);
          const x = index * barGap + (barGap - barWidth) / 2;
          const y = height - barHeight - 20;

          return (
            <g key={`${point.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, point.value > 0 ? 1.5 : 0)}
                fill={color}
                rx="0.6"
              />
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="barChartLabel"
              >
                {point.label}
              </text>
              {point.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 3}
                  textAnchor="middle"
                  className="barChartValue"
                >
                  {point.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
