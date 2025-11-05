
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from '../types';

interface ItemCardProps {
  item: Item;
  isOverlay?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isOverlay ? 'grabbing' : 'grab',
    zIndex: isDragging || isOverlay ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-gray-800 rounded-lg shadow-md text-white break-words"
    >
      {item.content}
    </div>
  );
};
