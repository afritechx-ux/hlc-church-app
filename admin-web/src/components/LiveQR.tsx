'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import { Printer, Share2, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LiveQRProps {
    occurrenceId: string;
}

export default function LiveQR({ occurrenceId }: LiveQRProps) {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sharing State
    const [showShareModal, setShowShareModal] = useState(false);
    const [staticToken, setStaticToken] = useState<string | null>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchToken = async () => {
            try {
                // Fetch dynamic token
                const { data } = await api.get(`/attendance/qr-token/${occurrenceId}`);
                setToken(data.token);
                setError(null);

                // Prefetch static token for sharing
                const staticRes = await api.get(`/attendance/static-qr-token/${occurrenceId}`);
                setStaticToken(staticRes.data.token);
            } catch (err) {
                console.error('Failed to fetch QR tokens', err);
                if (!token) setError('Failed to load QR code');
            }
        };

        fetchToken();
        intervalId = setInterval(fetchToken, 55000);

        return () => clearInterval(intervalId);
    }, [occurrenceId]);

    const handleShareClick = () => {
        setShowShareModal(true);
        // Token is likely already fetched. If not, useEffect handles retries or we could refetch here if null.
    };

    const getQrUrl = (t: string) => {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/public/check-in/${occurrenceId}?token=${t}`;
    };

    const handleCopyLink = () => {
        if (!staticToken) return;
        navigator.clipboard.writeText(getQrUrl(staticToken));
        toast.success('Link copied to clipboard');
    };

    const handlePrint = () => {
        if (!staticToken) return;

        // Get the SVG from the rendered DOM
        const svgElement = document.getElementById('static-qr-container')?.querySelector('svg');
        const svgString = svgElement ? svgElement.outerHTML : '';

        if (!svgString) {
            toast.error('Wait for QR to load');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Scan to Check-In</title>
                        <style>
                            body { 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center; 
                                height: 100vh; 
                                font-family: sans-serif; 
                                -webkit-print-color-adjust: exact;
                            }
                            h1 { font-size: 24px; margin-bottom: 20px; }
                            p { margin-top: 20px; color: #666; font-size: 14px; }
                            svg { width: 300px; height: 300px; }
                        </style>
                    </head>
                    <body>
                        <h1>Scan to Check-In</h1>
                        <div style="padding: 20px; border: 4px solid #000; border-radius: 20px;">
                            ${svgString}
                        </div>
                        <p>Higher Life Chapel • Scan with Camera or App</p>
                        <script>
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!token) {
        return <div>Loading QR...</div>;
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 shadow-sm border border-gray-200">
                <div className="flex justify-between w-full items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Live Check-In</h3>
                    <button
                        onClick={handleShareClick}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                        title="Share or Print"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
                {/* Fixed-size container to prevent layout shift */}
                <div
                    className="rounded-xl border-4 border-gray-900 p-4 bg-white"
                    style={{ width: 288, height: 288, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {token && (
                        <QRCodeSVG
                            value={getQrUrl(token)}
                            size={256}
                            level="H"
                        />
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Scan with the Higher Life Chapel App to check in
                </p>
                <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-green-600 font-medium">Live Updating</span>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-bold mb-4">Share QR Code</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            This code is valid for 24 hours. Ideal for printing or sharing.
                        </p>

                        {/* Fixed-size container to prevent layout shift */}
                        <div
                            id="static-qr-container"
                            className="flex justify-center items-center mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300"
                            style={{ width: 232, height: 232, margin: '0 auto 24px auto' }}
                        >
                            {staticToken ? (
                                <QRCodeSVG
                                    value={getQrUrl(staticToken)}
                                    size={200}
                                    level="M"
                                />
                            ) : (
                                <div className="flex items-center justify-center text-gray-400">Loading...</div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={!staticToken}
                                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button
                                onClick={handleCopyLink}
                                disabled={!staticToken}
                                className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                Copy Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
