'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';

interface LiveQRProps {
    occurrenceId: string;
}

export default function LiveQR({ occurrenceId }: LiveQRProps) {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchToken = async () => {
            try {
                const { data } = await api.get(`/attendance/qr-token/${occurrenceId}`);
                setToken(data.token); // Assuming backend returns { token: "..." }
                setError(null);
            } catch (err) {
                console.error('Failed to fetch QR token', err);
                setError('Failed to load QR code');
            }
        };

        fetchToken();
        intervalId = setInterval(fetchToken, 55000); // Refresh every 55s (token expires in 60s)

        return () => clearInterval(intervalId);
    }, [occurrenceId]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!token) {
        return <div>Loading QR...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Live Check-In</h3>
            <div className="rounded-xl border-4 border-gray-900 p-4">
                <QRCodeSVG value={token} size={256} level="H" />
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
    );
}
