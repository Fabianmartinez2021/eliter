/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverBody } from 'reactstrap';

const CLOSE_ANIMATION_MS = 180;

// Emojis modernos organizados por categoría (algunos con animación)
const EMOJI_CATEGORIES = [
    { name: 'Caras', emojis: ['😊', '🥰', '😍', '🤩', '😎', '🥳', '😇', '🤗', '😉', '🙂', '😅', '😂', '🤣', '😭', '🥺', '😤', '😴', '🤔', '🙃', '😋', '🥲', '😏', '🤭', '😶', '🤫', '🫠', '😮‍💨', '🙄', '😬', '🫡'] },
    { name: 'Gestos', emojis: ['👍', '👋', '🙌', '👏', '✌️', '🤞', '🤟', '🤝', '🙏', '💪', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💖', '💗', '💘', '💝', '😘', '🥰', '🤗', '🫶', '👊'] },
    { name: 'Objetos', emojis: ['📱', '💻', '⌨️', '🖱️', '💡', '🎉', '🎊', '🎁', '🏆', '⚽', '🎯', '🎮', '🎵', '🎶', '🔥', '⭐', '✨', '💫', '🌈', '☀️', '🌙', '🍕', '☕', '🍺', '🚀', '💎', '🎸', '🎧', '📸', '🪄'] },
    { name: 'Chat', emojis: ['💯', '✅', '❌', '❗', '❓', '🔥', '⭐', '🙏', '👍', '👎', '😅', '😂', '🥹', '🫡', '🤝', '💪', '👀', '✨', '💀', '👑', '🫂', '💬', '📣', '🎯', '🚀', '💡', '⚡', '🆒', '🆗', '🙌'] },
];

// Índices de emojis que tendrán animación (posición en cada categoría)
const ANIMATED_INDICES = new Set([0, 1, 2, 3, 4, 5, 8, 14, 15, 16, 20, 21, 22, 25, 26, 27]);

const PICKER_WIDTH = 320;
const PICKER_HEIGHT = 280;

function EmojiPicker({ isOpen, toggle, onSelect, targetId }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [closing, setClosing] = useState(false);
    const closeTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setClosing(false);
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    const handleEmojiClick = (emoji) => {
        if (closing) return;
        setClosing(true);
        onSelect(emoji);
        closeTimeoutRef.current = setTimeout(() => {
            toggle();
            closeTimeoutRef.current = null;
        }, CLOSE_ANIMATION_MS);
    };

    return (
        <Popover
            placement="top-end"
            isOpen={isOpen}
            target={targetId}
            toggle={toggle}
            container="body"
            style={{ maxWidth: 'none' }}
        >
            <PopoverBody
                className={`p-0 border-0 shadow-lg emoji-picker-modern ${closing ? 'emoji-picker-closing' : ''}`}
                style={{
                    width: PICKER_WIDTH,
                    minHeight: PICKER_HEIGHT,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#fff'
                }}
            >
                <style>{`
                    @keyframes emoji-bounce {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                    }
                    @keyframes emoji-pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                    @keyframes emoji-picker-close {
                        0% { opacity: 1; transform: scale(1); }
                        100% { opacity: 0; transform: scale(0.96); }
                    }
                    .emoji-picker-modern.emoji-picker-closing {
                        animation: emoji-picker-close ${CLOSE_ANIMATION_MS}ms ease-out forwards;
                    }
                    .emoji-picker-modern .emoji-animated {
                        animation: emoji-bounce 1.5s ease-in-out infinite;
                    }
                    .emoji-picker-modern .emoji-animated:nth-child(3n) {
                        animation-delay: 0.2s;
                    }
                    .emoji-picker-modern .emoji-animated:nth-child(3n+1) {
                        animation-delay: 0.4s;
                    }
                `}</style>
                {/* Tabs de categorías */}
                <div className="d-flex border-bottom px-2 py-1" style={{ background: '#f8f9fa' }}>
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat.name}
                            type="button"
                            className="btn btn-link btn-sm p-2 text-decoration-none"
                            onClick={() => setActiveCategory(idx)}
                            style={{
                                color: activeCategory === idx ? '#e74c3c' : '#6c757d',
                                fontWeight: activeCategory === idx ? 600 : 400,
                                fontSize: '1.1rem'
                            }}
                            title={cat.name}
                        >
                            {idx === 0 && '😊'}
                            {idx === 1 && '🙌'}
                            {idx === 2 && '📱'}
                            {idx === 3 && '💯'}
                        </button>
                    ))}
                </div>
                {/* Grid de emojis */}
                <div className="emoji-picker-grid p-2" style={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '2px'
                }}>
                    {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                        <button
                            key={`${activeCategory}-${i}`}
                            type="button"
                            className={`border-0 rounded p-2 bg-transparent ${ANIMATED_INDICES.has(i) ? 'emoji-animated' : ''}`}
                            style={{
                                fontSize: '1.4rem',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                lineHeight: 1
                            }}
                            onMouseEnter={(e) => {
                                const btn = e.currentTarget;
                                btn.style.background = 'rgba(231, 76, 60, 0.15)';
                                btn.style.transform = 'scale(1.2)';
                            }}
                            onMouseLeave={(e) => {
                                const btn = e.currentTarget;
                                btn.style.background = 'transparent';
                                btn.style.transform = '';
                            }}
                            onClick={() => handleEmojiClick(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverBody>
        </Popover>
    );
}

export default EmojiPicker;
