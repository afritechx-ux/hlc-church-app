
import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';
import * as d3 from 'd3-shape';
import * as scale from 'd3-scale';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const CHART_WIDTH = width - 40; // Full width minus padding

interface DataPoint {
    label: string;
    value: number;
}

interface GivingChartProps {
    data: DataPoint[];
    color?: string;
}

export default function GivingChart({ data, color = '#6366f1' }: GivingChartProps) {
    if (!data || data.length === 0) return null;

    // Scales
    const xScale = scale.scalePoint()
        .domain(data.map(d => d.label))
        .range([10, CHART_WIDTH - 10]);

    const maxVal = Math.max(...data.map(d => d.value));
    const yScale = scale.scaleLinear()
        .domain([0, maxVal * 1.2]) // Add headroom
        .range([CHART_HEIGHT, 10]);

    // Line generator
    const lineGenerator = d3.line<DataPoint>()
        .x(d => xScale(d.label) || 0)
        .y(d => yScale(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    const path = lineGenerator(data);

    // Area generator for gradient
    const areaGenerator = d3.area<DataPoint>()
        .x(d => xScale(d.label) || 0)
        .y0(CHART_HEIGHT)
        .y1(d => yScale(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    const areaPath = areaGenerator(data);

    return (
        <View style={styles.container}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
                <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.5" />
                        <Stop offset="1" stopColor={color} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>

                {/* Grid Lines (Optional) */}
                {[0, 0.5, 1].map((t) => {
                    const y = yScale(maxVal * t);
                    return (
                        <Path
                            key={t}
                            d={`M 10 ${y} L ${CHART_WIDTH - 10} ${y}`}
                            stroke="rgba(0,0,0,0.05)"
                            strokeDasharray="4, 4"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Area (Gradient Fill) */}
                <Path d={areaPath || ''} fill="url(#gradient)" />

                {/* Main Line */}
                <Path d={path || ''} stroke={color} strokeWidth={3} fill="none" />

                {/* Data Points */}
                {data.map((d, i) => (
                    <Circle
                        key={i}
                        cx={xScale(d.label)}
                        cy={yScale(d.value)}
                        r={4}
                        fill="#fff"
                        stroke={color}
                        strokeWidth={2}
                    />
                ))}
            </Svg>

            {/* X-Axis Labels */}
            <View style={styles.labelsContainer}>
                {data.map((d, i) => (
                    <View key={i} style={{ width: CHART_WIDTH / data.length, alignItems: 'center' }}>
                        {/* Only show label if it fits, e.g. every other one or short labels */}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    labelsContainer: {
        flexDirection: 'row',
        width: CHART_WIDTH,
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
    },
});
