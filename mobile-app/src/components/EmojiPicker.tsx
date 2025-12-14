import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';

const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷'],
    'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Celebration': ['🎉', '🎊', '🎈', '🎁', '🎂', '🎄', '🎃', '🎆', '🎇', '✨', '🌟', '⭐', '💫', '🔥', '💥', '🎵', '🎶', '🎤', '🎧'],
    'Religion': ['🙏', '⛪', '✝️', '☦️', '📿', '🕊️', '👼', '😇', '💒', '📖', '🕯️'],
    'Nature': ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌈', '🌸', '💐', '🌷', '🌹', '🌺', '🌻', '🌼', '🍀', '🌿', '🌱'],
    'Objects': ['📱', '💻', '📷', '🔔', '📬', '✉️', '📝', '📅', '🗓️', '⏰', '🎯', '🏆', '🥇', '🎖️', '🏅'],
};

interface EmojiPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
    const [selectedCategory, setSelectedCategory] = useState('Smileys');

    const handleEmojiSelect = (emoji: string) => {
        onSelect(emoji);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Emoji</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Category Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryTabs}
                    >
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setSelectedCategory(category)}
                                style={[
                                    styles.categoryTab,
                                    selectedCategory === category && styles.categoryTabActive,
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === category && styles.categoryTextActive,
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Emoji Grid */}
                    <ScrollView style={styles.emojiContainer}>
                        <View style={styles.emojiGrid}>
                            {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleEmojiSelect(emoji)}
                                    style={styles.emojiButton}
                                >
                                    <Text style={styles.emoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');
const EMOJI_SIZE = (width - 80) / 8;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '60%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    categoryTabs: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxHeight: 50,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    categoryTabActive: {
        backgroundColor: '#6366f1',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    emojiContainer: {
        paddingHorizontal: 16,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    emojiButton: {
        width: EMOJI_SIZE,
        height: EMOJI_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 28,
    },
});
