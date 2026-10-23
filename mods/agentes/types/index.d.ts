export type Agente = {
  id: string
  descripcion: string
  tipo: string
  estado: 'pending' | 'running' | 'waiting' | 'idle' | 'completed' | 'failed' | 'killed'
  inicio: number
  fin?: number
  herramientas: number
  ultima?: string
}

export type Tarea = {
  id: string
  titulo: string
  activa?: string
  estado: 'pending' | 'in_progress' | 'completed'
  dueno?: string
}

declare module 'claude-code' {
  interface PluginState {
    agentes: { agentes: Agente[]; tareas: Tarea[]; ahora: number }
  }
}
