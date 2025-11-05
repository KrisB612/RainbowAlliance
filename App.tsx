import React, { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { Column, Item } from './types';
import { INITIAL_COLUMNS } from './constants';
import { ColumnComponent } from './components/Column';
import { ItemCard } from './components/ItemCard';

const App: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [campaignTopic, setCampaignTopic] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const isContentDisabled = campaignTopic.trim() === '';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumn = (id: string): Column | undefined => {
    return columns.find(col => col.items.some(item => item.id === id) || col.id === id);
  };

  const handleAddItem = useCallback((columnId: string, content: string) => {
    if (!content.trim()) return;

    const itemsToAdd = content
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (itemsToAdd.length === 0) return;
    
    const newItems: Item[] = itemsToAdd.map((itemContent) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: itemContent,
    }));

    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId ? { ...col, items: [...col.items, ...newItems] } : col
      )
    );
  }, []);


  const handleDragStart = (event: DragStartEvent) => {
    if (isContentDisabled) return;
    const { active } = event;
    const item = columns.flatMap(col => col.items).find(item => item.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isContentDisabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeColumn = findColumn(active.id as string);
    const overColumn = findColumn(over.id as string);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;
    
    setColumns(prev => {
      const activeItems = activeColumn.items;
      const overItems = overColumn.items;
      
      const activeIndex = activeItems.findIndex(item => item.id === active.id);
      const overIndex = overItems.findIndex(item => item.id === over.id);

      let newIndex;
      if (over.id in prev.reduce((acc, col) => ({ ...acc, [col.id]: col }), {})) {
        newIndex = overItems.length;
      } else {
        newIndex = overIndex >= 0 ? overIndex : overItems.length;
      }
      
      const newColumns = prev.map(col => {
        if (col.id === activeColumn.id) {
          return { ...col, items: col.items.filter(item => item.id !== active.id) };
        }
        if (col.id === overColumn.id) {
          const activeItem = activeColumn.items[activeIndex];
          const newItems = [...col.items];
          newItems.splice(newIndex, 0, activeItem);
          return { ...col, items: newItems };
        }
        return col;
      });

      return newColumns;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isContentDisabled) return;
    const { active, over } = event;
    setActiveItem(null);

    if (!over || active.id === over.id) return;

    const originalColumn = findColumn(active.id as string);
    const destinationColumn = findColumn(over.id as string);
    
    if (!originalColumn || !destinationColumn) return;

    if (originalColumn.id === destinationColumn.id) {
        setColumns(prev => prev.map(col => {
            if (col.id === originalColumn.id) {
                const oldIndex = col.items.findIndex(item => item.id === active.id);
                const newIndex = col.items.findIndex(item => item.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    return { ...col, items: arrayMove(col.items, oldIndex, newIndex) };
                }
            }
            return col;
        }));
    }
  };
  
  const handleExportPdf = async () => {
    setIsExporting(true);
    const exportContainer = document.getElementById('export-container');
    if (!exportContainer) {
        setIsExporting(false);
        return;
    };

    try {
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            onclone: (clonedDoc) => {
                const container = clonedDoc.getElementById('export-container');
                if (container) {
                    container.style.backgroundColor = 'white';
                    clonedDoc.querySelectorAll('.text-white, .text-gray-100, .text-gray-300, .text-gray-400').forEach((el: any) => {
                        el.style.color = 'black';
                    });
                    clonedDoc.querySelectorAll('.bg-gray-800').forEach((el: any) => {
                        el.style.backgroundColor = '#f3f4f6'; // light gray
                        el.style.color = 'black';
                    });
                    clonedDoc.querySelectorAll('.bg-white\\/10, .bg-white\\/20').forEach((el: any) => {
                        el.style.backgroundColor = '#e5e7eb'; // medium gray
                    });
                    clonedDoc.querySelectorAll('.placeholder-gray-300').forEach((el: any) => {
                       el.placeholder.color = '#6b7280';
                    });
                     // Make sure topic text is black for PDF
                    const topicDisplay = clonedDoc.getElementById('pdf-topic-display');
                    if (topicDisplay) {
                        topicDisplay.style.color = 'black';
                    }
                }
            }
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('Rainbow-Alliance-Tier-List.pdf');

    } catch (error) {
        console.error("Error exporting PDF:", error);
    } finally {
        setIsExporting(false);
    }
  };


  const allItemIds = React.useMemo(() => columns.flatMap(col => col.items.map(item => item.id)), [columns]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-900 font-sans">
      <div id="export-container">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Rainbow Alliance Tier List</h1>
          <p className="text-gray-400 mt-2">จัดกลุ่มและประเมินสถานะแนวร่วมของคุณ</p>
          
          <div className="mt-6 max-w-2xl mx-auto p-4 rounded-lg bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 shadow-lg">
              <label htmlFor="campaign-topic" className="block text-lg font-bold text-gray-800">
                  หัวข้อ/ประเด็นขับเคลื่อน:
              </label>
              <input
                  id="campaign-topic"
                  type="text"
                  value={campaignTopic}
                  onChange={(e) => setCampaignTopic(e.target.value)}
                  placeholder="กรุณาระบุประเด็นที่ต้องการขับเคลื่อน..."
                  className="w-full mt-2 p-3 rounded-md bg-white/70 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {/* This hidden element is for PDF styling only */}
               <div id="pdf-topic-display" className="hidden print:block text-lg mt-2">
                    <strong className="font-semibold">หัวข้อ/ประเด็นขับเคลื่อน:</strong> {campaignTopic}
                </div>
          </div>
        </header>
        <div className="flex justify-center mb-6">
            <button 
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isExporting ? 'กำลังสร้าง PDF...' : 'บันทึกและ Export เป็น PDF'}
            </button>
        </div>
      </div>
      <main className={`flex flex-col items-center pb-4 gap-6 transition-opacity duration-300 ${isContentDisabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allItemIds}>
            {columns.map(column => (
              <ColumnComponent key={column.id} column={column} onAddItem={handleAddItem} isDisabled={isContentDisabled} />
            ))}
          </SortableContext>
          {typeof document !== 'undefined' && activeItem &&
            (
                <div style={{ position: 'fixed', top: -1000, left: -1000 }}>
                    <ItemCard item={activeItem} isOverlay />
                </div>
            )
          }
        </DndContext>
      </main>
    </div>
  );
};

export default App;