import React, { useState, useEffect } from 'react';
import { ListMusic, X, Trash2, Check } from 'lucide-react';
import { Playlist } from '../types/audio';
import { createPlaylist } from '../utils/playlistUtils';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistToEdit?: Playlist | null;
  onSave: (playlist: Playlist) => void;
  onDelete?: (id: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlistToEdit,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('from-red-600 to-rose-700');

  const colorOptions = [
    { label: 'Crimson Rose', value: 'from-red-600 to-rose-700' },
    { label: 'Dark Ruby', value: 'from-red-700 to-black' },
    { label: 'Ember Rose', value: 'from-rose-600 to-red-950' },
    { label: 'Flame Orange', value: 'from-red-600 to-orange-700' },
    { label: 'Obsidian Red', value: 'from-neutral-900 to-red-800' },
    { label: 'Neon Crimson', value: 'from-red-500 to-zinc-950' },
  ];

  useEffect(() => {
    if (playlistToEdit) {
      setName(playlistToEdit.name);
      setDescription(playlistToEdit.description || '');
      setSelectedColor(playlistToEdit.color || colorOptions[0].value);
    } else {
      setName('');
      setDescription('');
      setSelectedColor(colorOptions[0].value);
    }
  }, [playlistToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (playlistToEdit) {
      onSave({
        ...playlistToEdit,
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        updatedAt: Date.now(),
      });
    } else {
      const newPl = createPlaylist(name, description, selectedColor);
      onSave(newPl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pt-[max(env(safe-area-inset-top,0px),1.75rem)] pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-black border border-zinc-900 shadow-2xl p-5 sm:p-6 text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30">
              <ListMusic className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold">
              {playlistToEdit ? 'Edit Playlist' : 'Create New Playlist'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Playlist Name (English)</label>
            <input
              type="text"
              required
              placeholder="e.g. Rock Classics, Midnight Synth, Heavy Bass"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:outline-none text-sm text-zinc-100 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description (English, optional)</label>
            <textarea
              rows={2}
              placeholder="Add an optional description in English"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:outline-none text-sm text-zinc-100 placeholder-zinc-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Cover Theme Color</label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`h-8 rounded-lg bg-gradient-to-br ${c.value} relative flex items-center justify-center transition-transform ${
                    selectedColor === c.value ? 'ring-2 ring-red-500 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {selectedColor === c.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-zinc-900">
            {playlistToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(playlistToEdit.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-red-600/30 transition"
              >
                {playlistToEdit ? 'Save Changes' : 'Create Playlist'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
