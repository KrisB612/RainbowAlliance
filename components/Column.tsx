import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Item } from '../types';
import { ItemCard } from './ItemCard';

interface ColumnProps {
  column: Column;
  onAddItem: (columnId: string, content: string) => void;
  isDisabled: boolean;
}

export const ColumnComponent: React.FC<ColumnProps> = ({ column, onAddItem, isDisabled }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [newItemContent, setNewItemContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    onAddItem(column.id, newItemContent);
    setNewItemContent('');
  };
  
  const itemIds = React.useMemo(() => column.items.map(i => i.id), [column.items]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-shrink-0 w-full md:w-4/5 lg:w-3/4 max-w-5xl max-h-[calc(100vh-12rem)] rounded-xl shadow-lg ${column.color}`}
    >
      <div className="p-4 border-b border-white/20">
        <h2 className="text-lg font-bold text-white text-center">
          {column.title}
        </h2>
        <div className="mt-2 text-xs text-gray-100 space-y-1">
          <p><strong className="font-semibold">ความหมาย:</strong> {column.meaning}</p>
          <p><strong className="font-semibold">กลยุทธ์ที่ใช้:</strong> {column.strategy}</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {column.items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </SortableContext>
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/20">
        <fieldset disabled={isDisabled}>
            <input
              type="text"
              value={newItemContent}
              onChange={e => setNewItemContent(e.target.value)}
              placeholder={isDisabled ? "กรุณากรอกหัวข้อด้านบนก่อน..." : "เพิ่มรายการใหม่..."}
              className="w-full p-2 rounded-md bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
            />
            <button type="submit" className="w-full mt-2 p-2 rounded-md bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors disabled:bg-gray-500/50 disabled:cursor-not-allowed">
              เพิ่ม
            </button>
        </fieldset>
      </form>
    </div>
  );
};