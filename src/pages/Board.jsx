import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Plus, Calendar } from 'lucide-react';
import { INITIAL_TASKS } from '../data/mock';

const Board = () => {
    const [columns, setColumns] = useState(INITIAL_TASKS);

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Move in same column
        if (source.droppableId === destination.droppableId) {
            const list = Array.from(columns[source.droppableId]);
            const [removed] = list.splice(source.index, 1);
            list.splice(destination.index, 0, removed);
            setColumns({ ...columns, [source.droppableId]: list });
            return;
        }

        // Move to different column
        const sourceList = Array.from(columns[source.droppableId]);
        const destList = Array.from(columns[destination.droppableId]);
        const [removed] = sourceList.splice(source.index, 1);
        destList.splice(destination.index, 0, removed);

        setColumns({
            ...columns,
            [source.droppableId]: sourceList,
            [destination.droppableId]: destList,
        });
    };

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sprint Board</h1>
                    <p className="text-gray-500">Manage tasks for the current sprint.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                        Filter
                    </button>
                    <button className="flex items-center gap-2 text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                    <Column id="todo" title="To Do" tasks={columns.todo} />
                    <Column id="inProgress" title="In Progress" tasks={columns.inProgress} />
                    <Column id="done" title="Done" tasks={columns.done} />
                </div>
            </DragDropContext>
        </div>
    );
};

const Column = ({ id, title, tasks }) => (
    <div className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
        <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                {title}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{tasks.length}</span>
            </h3>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
        </div>

        <Droppable droppableId={id}>
            {(provided) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                >
                    {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-4 rounded-lg shadow-sm border-2 transition-all ${snapshot.isDragging ? 'border-blue-400 rotate-2 shadow-xl' : 'border-transparent hover:border-blue-100'
                                        }`}
                                    style={provided.draggableProps.style}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide
                        ${task.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                task.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}
                    `}>
                                            {task.priority}
                                        </span>
                                        <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={16} /></button>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-2">{task.title}</h4>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex -space-x-2">
                                            {[...Array(task.members.length)].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] text-gray-500">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                                            <Calendar size={12} />
                                            <span>Dec 12</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </div>
);

export default Board;
