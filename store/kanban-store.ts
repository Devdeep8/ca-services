import { create } from 'zustand'

interface Task {
  id: string
  title: string
  description?: string
  columnId: string
  position: number
  priority: string
  assigneeId?: string
  estimatedHours?: number
  actualHours: number
  dueDate?: Date
}

interface Column {
  id: string
  name: string
  color: string
  position: number
  tasks: Task[]
}

interface KanbanState {
  columns: Column[]
  activeId: string | null
  setColumns: (columns: Column[]) => void
  setActiveId: (id: string | null) => void
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newPosition: number) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  addTask: (task: Task) => void
  removeTask: (taskId: string) => void
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: [],
  activeId: null,
  setColumns: (columns) => set({ columns }),
  setActiveId: (activeId) => set({ activeId }),
  moveTask: (taskId, fromColumnId, toColumnId, newPosition) => {
    set((state) => {
      const newColumns = [...state.columns]
      const fromColumn = newColumns.find(col => col.id === fromColumnId)
      const toColumn = newColumns.find(col => col.id === toColumnId)
      
      if (!fromColumn || !toColumn) return state

      const taskIndex = fromColumn.tasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) return state

      const [task] = fromColumn.tasks.splice(taskIndex, 1)
      task.columnId = toColumnId
      task.position = newPosition

      // Update positions for tasks in both columns
      fromColumn.tasks.forEach((t, index) => {
        t.position = index
      })

      toColumn.tasks.splice(newPosition, 0, task)
      toColumn.tasks.forEach((t, index) => {
        t.position = index
      })

      return { columns: newColumns }
    })
  },
  updateTask: (taskId, updates) => {
    set((state) => {
      const newColumns = state.columns.map(column => ({
        ...column,
        tasks: column.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }))
      return { columns: newColumns }
    })
  },
  addTask: (task) => {
    set((state) => {
      const newColumns = state.columns.map(column => {
        if (column.id === task.columnId) {
          return {
            ...column,
            tasks: [...column.tasks, task]
          }
        }
        return column
      })
      return { columns: newColumns }
    })
  },
  removeTask: (taskId) => {
    set((state) => {
      const newColumns = state.columns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => task.id !== taskId)
      }))
      return { columns: newColumns }
    })
  }
})) 