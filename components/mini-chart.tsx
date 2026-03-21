import { View, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../theme/theme";

interface IMiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showFill?: boolean;
}

export function MiniLineChart({
  data,
  width = 200,
  height = 80,
  color,
  showFill = true,
}: IMiniChartProps) {
  const { colors } = useTheme();
  const lineColor = color ?? colors.gold;

  if (data.length < 2) return null;

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const padding = 4;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (val - minVal) / range) * (height - padding * 2),
  }));

  // Build smooth path using cubic bezier
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
    linePath += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Fill path
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {showFill && (
          <Path d={fillPath} fill="url(#fillGrad)" />
        )}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// --- Mini Bar Chart ---

interface IMiniBarChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  barColor?: string;
}

export function MiniBarChart({
  data,
  width = 200,
  height = 80,
  barColor,
}: IMiniBarChartProps) {
  const { colors } = useTheme();
  const fill = barColor ?? colors.blue;

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value)) || 1;
  const barWidth = (width - (data.length + 1) * 4) / data.length;
  const radius = Math.min(barWidth / 2, 4);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * (height - 8);
          const x = 4 + i * (barWidth + 4);
          const y = height - barHeight;

          return (
            <Path
              key={i}
              d={roundedRectPath(x, y, barWidth, barHeight, radius)}
              fill={fill}
              opacity={0.8}
            />
          );
        })}
      </Svg>
    </View>
  );
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const clampedR = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + clampedR} ${y}`,
    `L ${x + w - clampedR} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + clampedR}`,
    `L ${x + w} ${y + h}`,
    `L ${x} ${y + h}`,
    `L ${x} ${y + clampedR}`,
    `Q ${x} ${y} ${x + clampedR} ${y}`,
    "Z",
  ].join(" ");
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
