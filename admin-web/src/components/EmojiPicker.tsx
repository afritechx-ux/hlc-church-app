'use client';

import { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    className?: string;
}

const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😊', '😄', '😁', '🥰', '😍', '🤗', '😎', '🤩', '😇', '🙂', '😌', '🥳', '🤣', '😂', '😅'],
    'Gestures': ['👍', '👏', '🙏', '🤝', '👋', '✋', '🤚', '👌', '✌️', '🤞', '🤟', '🤘', '💪', '🙌', '👐', '🫶'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💗', '💖', '💘', '💝', '💓', '💞', '💟'],
    'Celebration': ['🎉', '🎊', '🎈', '🎁', '🎂', '🎄', '✨', '🌟', '⭐', '🔥', '💫', '🎯', '🏆', '🥇', '🎗️', '🪅'],
    'Religion': ['✝️', '⛪', '🕊️', '📿', '🙏', '👼', '✡️', '☪️', '🕉️', '☯️', '🛐', '📖', '⚱️', '🌿', '💒', '🔔'],
    'Nature': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌴', '🌲', '🦋', '🦅', '🌈', '☀️', '🌙', '💧', '🔆', '🍀'],
    'Objects': ['📱', '💻', '📧', '📞', '⏰', '📅', '✏️', '📝', '📌', '🔗', '🎵', '🎶', '🔔', '💡', '📸', '🎬'],
};

export default function EmojiPicker({ onSelect, className = '' }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Smileys');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleEmojiClick = (emoji: string) => {
        onSelect(emoji);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Add emoji"
            >
                <Smile className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
            </button>

            {isOpen && (
                <div
                    className="absolute bottom-full left-0 mb-2 w-80 rounded-xl shadow-xl border z-50"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--border)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                            Pick an Emoji
                        </span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <X className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === category
                                        ? 'bg-indigo-500 text-white'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                style={{
                                    color: activeCategory === category ? 'white' : 'var(--foreground)',
                                }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => handleEmojiClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
