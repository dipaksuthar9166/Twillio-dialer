import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import React, { useState, useEffect } from 'react';

// Helper to format duration (assuming it was defined elsewhere, including it for completeness)
const formatDuration = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0 || isNaN(totalSeconds)) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const Chart = ({ data, timeRange, type = 'line' }) => {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (!data) {
            setChartData([]);
            return;
        }

        // 💡 FIX 1: Check if 'data' is an Array (for Line Chart)
        if (type === 'line' && Array.isArray(data)) {
            const safelyMapItem = (item) => ({
                period: item.label,
                total: item.count || 0,
                completed: item.completed_count || 0,
                missed: item.missed_count || 0,
                unique: item.unique_count || 0
            });
            setChartData(data.map(safelyMapItem));
        } else if (type === 'donut' && typeof data === 'object') {
            // For Donut Chart, 'data' is already an object, no mapping needed for chartData state
            setChartData([]); // Keeping chartData array empty/irrelevant for donut to avoid confusion
        }

    }, [data, timeRange, type]); // Dependency on data, timeRange, and type prop


    // --- Chart Title Logic (unchanged) ---
    let chartTitle;
    let xAxisFormatter = (value) => value;
    switch (timeRange) {
        case 'weekly':
            chartTitle = 'Last 7 Days Trend';
            xAxisFormatter = (value) => value ? value.substring(5).replace('-', '/') : value;
            break;
        case 'monthly':
            chartTitle = 'Last 30 Days Trend';
            xAxisFormatter = (value) => {
                if (!value) return '';
                try {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } catch (e) {
                    return value.substring(5).replace('-', '/');
                }
            };
            break;
        case 'quarterly':
            chartTitle = 'Last 3 Months Trend';
            xAxisFormatter = (value) => {
                if (!value) return '';
                try {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                } catch (e) {
                    return value;
                }
            };
            break;
        default:
            chartTitle = 'Call Volume Trend';
            break;
    }

    // --- Pie/Donut Chart Logic (using data object directly) ---
    if (type === 'donut' && typeof data === 'object' && data.total > 0) {
        const completedCount = data.completed || 0;
        const missedCount = data.missed || 0;
        const total = data.total;

        const otherCount = Math.max(0, total - completedCount - missedCount);

        const pieChartData = [
            { name: 'Completed', value: completedCount, color: '#10b981' },
            { name: 'Missed/Failed', value: missedCount, color: '#ef4444' },
            { name: 'Other', value: otherCount, color: '#f59e0b' },
        ].filter(item => item.value > 0);

        if (pieChartData.length === 0) {
            return (
                <div className="text-center py-16 text-gray-500">
                    <p>No call status data to display.</p>
                </div>
            );
        }

        return (
            <div className="bg-white p-4 h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            labelLine={false}
                        // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} // Optional: show labels outside
                        >
                            {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} calls`, props.payload.name]} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center text-gray-600">
                    Total Calls: **{total}**
                </div>
            </div>
        );
    }


    // --- Line Chart Logic (Default) ---
    if (!chartData || chartData.length === 0) {
        return (
            <div className="bg-white p-4 shadow rounded-lg mt-6 text-center text-gray-500 min-h-[300px] flex items-center justify-center fade-in slide-up">
                <p>No call volume data available for the selected period.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 shadow rounded-lg mt-6 fade-in slide-up">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 slide-right">
                Call Volume Trend ({chartTitle})
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        dataKey="period"
                        stroke="#6b7280"
                        tickFormatter={xAxisFormatter}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        stroke="#6b7280"
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e0eeef', backgroundColor: '#ffffff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />

                    <Line type="monotone" dataKey="total" stroke="#2563eb" name="Total Calls" strokeWidth={2} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="missed" stroke="#ef4444" name="Missed" strokeWidth={2} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="unique" stroke="#f59e0b" name="Unique Count" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Chart;