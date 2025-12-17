'use client';

import { useState, useEffect } from 'react';
import { getPlayerUsername, setPlayerUsername } from '@/lib/utils/player';

export default function UserProfile() {
    const [username, setUsername] = useState<string>(() => {
      // 在初始化时直接获取用户名
      if (typeof window !== 'undefined') {
        return getPlayerUsername();
      }
      return '';
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(() => {
      if (typeof window !== 'undefined') {
        return getPlayerUsername();
      }
      return '';
    });
    const [error, setError] = useState('');

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
    };

    const handleSave = () => {
        try {
            if (editValue.trim().length < 3) {
                setError('用户名至少需要3个字符');
                return;
            }
            setPlayerUsername(editValue);
            setUsername(editValue);
            setIsEditing(false);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        }
    };

    const handleCancel = () => {
        setEditValue(username);
        setIsEditing(false);
        setError('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="fixed top-4 left-4 z-50">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-700">
                {!isEditing ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            <span className="text-white font-medium text-lg">{username}</span>
                        </div>
                        <button
                            onClick={handleEdit}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            title="编辑昵称"
                        >
                            ✏️
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                                placeholder="输入昵称"
                                maxLength={20}
                                autoFocus
                            />
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                ✓
                            </button>
                            <button
                                onClick={handleCancel}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-400 text-xs">{error}</p>
                        )}
                        <p className="text-gray-400 text-xs">按 Enter 保存，Esc 取消</p>
                    </div>
                )}
            </div>
        </div>
    );
}