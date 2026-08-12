import { Card } from '../ui/card';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const data = [
    { name: '0', Expenses: 0, Income: 0 },
    { name: '0.1', Expenses: 0, Income: 0 },
    { name: '0.2', Expenses: 0, Income: 0 },
    { name: '0.3', Expenses: 0, Income: 0 },
    { name: '0.4', Expenses: 0, Income: 0 },
    { name: '0.5', Expenses: 0, Income: 0 },
    { name: '0.6', Expenses: 0, Income: 0 },
    { name: '0.7', Expenses: 0, Income: 0 },
    { name: '0.8', Expenses: 0, Income: 0 },
    { name: '0.9', Expenses: 0, Income: 0 },
    { name: '1.0', Expenses: 0, Income: 0 },
];

export function StatisticsChart() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-full"
        >
            <Card className="p-6 h-full flex flex-col min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-dash-primary font-semibold text-lg">Statistics</h3>
                </div>

                <div className="flex-1 w-full relative -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                domain={[-0.4, 1.0]}
                                ticks={[-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="rect"
                                wrapperStyle={{ top: -40, right: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Expenses"
                                stroke="var(--color-dash-accent)"
                                strokeWidth={3}
                                activeDot={{ r: 6, fill: 'var(--color-dash-accent)', strokeWidth: 0 }}
                                dot={{ r: 4, fill: 'var(--color-dash-accent)', strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Income"
                                stroke="var(--color-dash-primary)"
                                strokeWidth={3}
                                activeDot={{ r: 6, fill: 'var(--color-dash-primary)', strokeWidth: 0 }}
                                dot={{ r: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </motion.div>
    );
}
