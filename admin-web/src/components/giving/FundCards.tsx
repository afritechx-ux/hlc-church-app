import { motion } from 'framer-motion';
import { Target, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Fund {
    id: string;
    name: string;
    description?: string;
}

interface FundCardsProps {
    funds: Fund[];
    fundStats: { name: string; amount: number }[]; // From analytics
    onAdd: () => void;
    onEdit: (fund: Fund) => void;
    onDelete: (id: string) => void;
}

export default function FundCards({ funds, fundStats, onAdd, onEdit, onDelete }: FundCardsProps) {
    const getRaised = (name: string) => {
        const stat = fundStats.find(s => s.name === name);
        return stat ? stat.amount : 0;
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <button
                onClick={onAdd}
                className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors h-[200px]"
            >
                <Plus className="w-10 h-10 text-indigo-400 mb-2" />
                <span className="font-medium text-indigo-600">Create New Fund</span>
            </button>

            {funds.map((fund, i) => {
                const raised = getRaised(fund.name);
                return (
                    <motion.div
                        key={fund.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-6 flex flex-col justify-between h-[200px] relative overflow-hidden group"
                    >
                        <div className="absolute right-0 top-0 p-6 opacity-5">
                            <Target className="w-24 h-24" />
                        </div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--foreground)' }}>{fund.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{fund.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-2 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(fund); }}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                                    title="Edit Fund"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(fund.id); }}
                                    className="p-1.5 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                    title="Delete Fund"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 z-10">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Raised</p>
                            <div className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(raised)}
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }} // Just a visual filler as there's no goal property anymore
                                    className="h-full bg-indigo-500 opacity-20"
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
