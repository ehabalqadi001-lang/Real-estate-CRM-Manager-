"use client";
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Building2, User, DollarSign } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n'

interface KanbanDeal {
  id: string
  title: string
  status: string
  client_name: string
  developer_name: string
  amount: number
}

export default function SalesKanban({ initialDeals }: { initialDeals: KanbanDeal[] }) {
  const { t, numLocale } = useI18n()
  const [deals, setDeals] = useState(initialDeals);

  const COLUMNS = [
    { id: 'Lead',       title: t('عميل محتمل', 'Lead'),       color: 'border-slate-300 bg-slate-50' },
    { id: 'Viewing',    title: t('معاينة', 'Viewing'),         color: 'border-blue-300 bg-blue-50' },
    { id: 'Offer',      title: t('تقديم عرض', 'Offer'),        color: 'border-amber-300 bg-amber-50' },
    { id: 'Contracted', title: t('تم التعاقد', 'Contracted'),  color: 'border-green-300 bg-green-50' },
    { id: 'Registered', title: t('شهر عقاري', 'Registered'),   color: 'border-purple-300 bg-purple-50' },
  ]

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const updatedDeals = deals.map(deal =>
      deal.id === draggableId ? { ...deal, status: destination.droppableId } : deal
    );
    setDeals(updatedDeals);

    const { error } = await supabase
      .from('deals')
      .update({ status: destination.droppableId })
      .eq('id', draggableId);

    if (error) {
      alert(t('حدث خطأ أثناء تحديث حالة الصفقة', 'An error occurred while updating the deal status'));
      setDeals(initialDeals);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        {COLUMNS.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-w-[300px] w-[300px] rounded-xl border-t-4 shadow-sm p-3 flex flex-col gap-3 ${column.color}`}
              >
                <div className="flex justify-between items-center font-bold text-slate-700">
                  <h3>{column.title}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs shadow-sm">
                    {deals.filter(d => d.status === column.id).length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {deals.filter(d => d.status === column.id).map((deal, index) => (
                    <Draggable key={deal.id} draggableId={deal.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-3 hover:shadow-md transition-shadow ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl' : ''}`}
                        >
                          <h4 className="font-bold text-sm text-slate-800 mb-2">{deal.title}</h4>

                          <div className="space-y-2 text-xs text-slate-500">
                            <div className="flex items-center gap-2"><User size={14} /> {deal.client_name}</div>
                            <div className="flex items-center gap-2"><Building2 size={14} /> {deal.developer_name}</div>
                            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-1 rounded">
                              <DollarSign size={14} /> {Number(deal.amount).toLocaleString(numLocale)} {t('ج.م', 'EGP')}
                            </div>
                          </div>

                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
