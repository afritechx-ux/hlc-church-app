'use client';

import { useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function PublicCheckInPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    // Parse ID and Token
    const occurrenceId = params?.id as string;
    const token = searchParams.get('token');

    // Form State
    const [step, setStep] = useState<'FORM' | 'SUCCESS' | 'ERROR'>('FORM');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        category: 'MEMBER', // MEMBER | VISITOR
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (!token) throw new Error('Invalid QR Code (Missing Token)');

            await api.post('/attendance/public-check-in', {
                token,
                name: formData.name,
                phone: formData.phone,
                category: formData.category,
                notes: formData.notes
            });

            setStep('SUCCESS');
        } catch (err: any) {
            console.error(err);
            setStep('ERROR');
            setErrorMsg(err.response?.data?.message || 'Check-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Checked In!</h2>
                    <p className="text-gray-600">Thank you for joining us today.</p>
                </motion.div>
            </div>
        );
    }

    if (step === 'ERROR') {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Check-in Failed</h2>
                    <p className="text-gray-600 mb-6">{errorMsg}</p>
                    <button
                        onClick={() => setStep('FORM')}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-blue-600 p-6 text-center">
                    <h1 className="text-xl font-bold text-white">Service Check-in</h1>
                    <p className="text-blue-100 text-sm mt-1">Please fill in your details</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Category Selection */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, category: 'MEMBER' })}
                            className={`py-2 text-sm font-medium rounded-lg transition-all ${formData.category === 'MEMBER'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Member
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, category: 'VISITOR' })}
                            className={`py-2 text-sm font-medium rounded-lg transition-all ${formData.category === 'VISITOR'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Visitor
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="024..."
                            />
                        </div>

                        {formData.category === 'VISITOR' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for visit (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                                    placeholder="I was invited by..."
                                />
                            </motion.div>
                        )}

                        {formData.category === 'MEMBER' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Why assume manual check-in?</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                                    placeholder="My app isn't working / I don't have the app..."
                                />
                            </motion.div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Checking in...' : 'Check In'}
                    </button>
                    {!token && (
                        <p className="text-center text-red-500 text-xs mt-2">Invalid QR Link (No Token)</p>
                    )}
                </form>
            </div>
            <p className="mt-6 text-gray-400 text-sm">Higher Life Chapel • HLC</p>
        </div>
    );
}
