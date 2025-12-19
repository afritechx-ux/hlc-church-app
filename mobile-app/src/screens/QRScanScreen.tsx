import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import client from '../api/client';
import { colors, spacing } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

export default function QRScanScreen({ navigation }: any) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned) return;
        setScanned(true);

        try {
            // Support both raw token and URL-based QR codes
            let token = data;
            if (data.startsWith('http') && data.includes('token=')) {
                token = data.split('token=')[1].split('&')[0];
            }

            await client.post('/attendance/qr-check-in', { token });
            Alert.alert('Success', 'Checked in successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Check-in Failed', error.response?.data?.message || 'Invalid QR Code', [
                { text: 'Try Again', onPress: () => setScanned(false) }
            ]);
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white', marginBottom: 20 }}>We need your permission to use the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={styles.overlay}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X color="#fff" size={24} />
                </TouchableOpacity>
                <View style={styles.scanFrame} />
                <Text style={styles.instructionText}>Scan the QR code to check in</Text>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.l,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: spacing.s,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: spacing.xl,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: spacing.s,
        borderRadius: 8,
    },
});
