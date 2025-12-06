export const MOCK_STATS = [
    { label: 'Total Projects', value: '12', trend: '+20%', color: 'text-blue-600' },
    { label: 'Completed', value: '64', trend: '+12%', color: 'text-green-600' },
    { label: 'In Progress', value: '8', trend: '-5%', color: 'text-orange-600' },
    { label: 'Overdue', value: '2', trend: '+2%', color: 'text-red-600' },
];

export const MOCK_CHART_DATA = [
    { name: 'Mon', tasks: 4 },
    { name: 'Tue', tasks: 7 },
    { name: 'Wed', tasks: 5 },
    { name: 'Thu', tasks: 12 },
    { name: 'Fri', tasks: 9 },
    { name: 'Sat', tasks: 3 },
    { name: 'Sun', tasks: 2 },
];

export const INITIAL_TASKS = {
    todo: [
        { id: 't1', title: 'Design System', tag: 'Design', priority: 'High', members: [1, 2] },
        { id: 't2', title: 'Competitor Analysis', tag: 'Research', priority: 'Medium', members: [3] },
    ],
    inProgress: [
        { id: 't3', title: 'Setup React Router', tag: 'Dev', priority: 'High', members: [1] },
    ],
    done: [
        { id: 't4', title: 'Project Kickoff', tag: 'Meeting', priority: 'Low', members: [1, 2, 3] },
    ]
};
