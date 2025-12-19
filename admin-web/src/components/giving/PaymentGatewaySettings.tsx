import { motion } from 'framer-motion';
import { CreditCard, Plus, Trash2, Power, Globe, Smartphone, Landmark, Pencil } from 'lucide-react';

interface ComponentProps {
    configs: any[];
    onToggle: (id: string, current: boolean) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
    onEdit: (config: any) => void;
}

export default function PaymentGatewaySettings({ configs, onToggle, onDelete, onAdd, onEdit }: ComponentProps) {
    return (
        <div className="space-y-8">
            {/* Online Gateways Section */}
            <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Globe className="w-5 h-5 text-indigo-500" /> Online Payment Gateways
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Paystack Card - Integrated */}
                    <div className="glass-card p-6 border-l-4 border-l-green-500 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">
                                    P
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Paystack</h4>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Connected</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const paystackConfig = configs.find(c => c.provider?.toLowerCase().includes('paystack') || c.type === 'CARD');
                                        onEdit(paystackConfig || {
                                            type: 'CARD',
                                            provider: 'Paystack',
                                            accountName: 'Paystack Integration',
                                            accountNumber: 'PK_...',
                                            description: 'Online Card Payments'
                                        });
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                                    title="Edit Configuration"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Power className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Accepts Cards, Mobile Money, and USSD automatically.
                        </p>
                        <div className="text-xs font-mono bg-gray-50 dark:bg-slate-900 p-2 rounded border border-gray-100 dark:border-gray-700 truncate">
                            Webhook: .../giving/webhook/paystack
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Channels Section */}
            <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Smartphone className="w-5 h-5 text-indigo-500" /> Manual Channels
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {configs.map((config) => (
                        <motion.div
                            key={config.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                                            {config.provider}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {config.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                                        {config.type === 'BANK_TRANSFER' ? <Landmark className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                        {config.type.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Account Name</p>
                                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{config.accountName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Account Number</p>
                                    <p className="font-mono bg-gray-50 dark:bg-slate-900 p-1.5 rounded text-sm" style={{ color: 'var(--foreground)' }}>
                                        {config.accountNumber}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => onToggle(config.id, config.isActive)}
                                    className={`flex-1 btn-secondary text-sm py-1.5 ${config.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                    {config.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => onEdit(config)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(config.id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    <button
                        onClick={onAdd}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all group min-h-[240px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-500 group-hover:text-indigo-600">Add Manual Channel</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
