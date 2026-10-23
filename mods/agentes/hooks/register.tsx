import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Agente, Tarea } from '../types'

// Panel «Agentes»: los subagentes de la sesión y las tareas, con cómo va cada uno.
// Los agentes salen de $.agent.list() (se consulta cada segundo mientras alguno
// trabaja) y de las herramientas que llama cada uno; las tareas, de TaskCreate y
// TaskUpdate.

const PANE = 'agentes'
const agentes = atom({ plugin: 'agentes', key: 'agentes' } as const, [])
const tareas = atom({ plugin: 'agentes', key: 'tareas' } as const, [])
const ahora = atom({ plugin: 'agentes', key: 'ahora' } as const, 0)

const TERMINADO = new Set(['completed', 'failed', 'killed'])
const trabajando = (a: Agente) => !TERMINADO.has(a.estado)

async function refrescar($: EngineInterface) {
  const lista = await $.agent.list()
  const t = await $.clock.now()
  await update($, agentes, actuales => {
    const porId = new Map(actuales.map(a => [a.id, a]))
    for (const info of lista) {
      const previo = porId.get(info.id)
      const estado = info.status
      porId.set(info.id, {
        id: info.id,
        descripcion: info.description || previo?.descripcion || info.name || 'Agente',
        tipo: info.type,
        estado,
        inicio: previo?.inicio ?? t,
        fin: TERMINADO.has(estado) ? (previo?.fin ?? t) : undefined,
        herramientas: previo?.herramientas ?? 0,
        ultima: previo?.ultima,
      })
    }
    return [...porId.values()].slice(-30)
  })
  await update($, ahora, () => t)
}

function duracion(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

const ICONO: Record<Agente['estado'], string> = {
  pending: '○', running: '●', waiting: '◐', idle: '◌', completed: '✓', failed: '✗', killed: '■',
}
const ESTADO: Record<Agente['estado'], string> = {
  pending: 'en cola', running: 'trabajando', waiting: 'esperando', idle: 'en pausa',
  completed: 'terminado', failed: 'falló', killed: 'detenido',
}
const COLOR: Record<Agente['estado'], string> = {
  pending: 'yellow', running: 'cyan', waiting: 'yellow', idle: 'gray', completed: 'green', failed: 'red', killed: 'gray',
}

// ── Los Claudes: un bichito naranja por agente, con su accesorio según el tipo ──
type Pinta = { color: string; cosa: string; nombre: string }
const PINTAS: Record<string, Pinta> = {
  'general-purpose': { color: '#D97757', cosa: '🔨', nombre: 'Claude manitas' },
  'Explore': { color: '#6CB4EE', cosa: '🔎', nombre: 'Claude explorador' },
  'Plan': { color: '#7BC47F', cosa: '📝', nombre: 'Claude planificador' },
  'claude': { color: '#E8A0BF', cosa: '✨', nombre: 'Claude' },
}
const OTRAS: Pinta[] = [
  { color: '#C49BE8', cosa: '🧪', nombre: 'Claude científico' },
  { color: '#F2C14E', cosa: '🎨', nombre: 'Claude artista' },
  { color: '#5FD3C4', cosa: '🛠', nombre: 'Claude mecánico' },
]
function pinta(a: Agente): Pinta {
  if (PINTAS[a.tipo]) return PINTAS[a.tipo]!
  let h = 0
  for (const c of a.tipo || a.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return OTRAS[h % OTRAS.length]!
}
// cara del bichito según cómo va: ojos, boca y patitas (dos fotogramas al trabajar)
function cuerpo(estado: Agente['estado'], f: number): [string, string, string] {
  if (estado === 'completed') return [' ▐▀▄█▄▀▌ ', '▝▜█▄▄▄█▛▘', '  ▘▘ ▝▝  ']
  if (estado === 'failed' || estado === 'killed') return [' ▐▄▀█▀▄▌ ', '▝▜█▀▀▀█▛▘', '  ▘▘ ▝▝  ']
  if (estado === 'idle' || estado === 'pending') return [' ▐▄▄█▄▄▌ ', '▝▜█████▛▘', '  ▘▘ ▝▝  ']
  return f % 4 === 3
    ? [' ▐▄▄█▄▄▌ ', '▝▜█████▛▘', '  ▘▘ ▝▝  ']            // parpadea
    : f % 2
      ? [' ▐▛███▜▌ ', '▗▟█████▙▖', '   ▘▘▝▝  ']           // brazos arriba, paso
      : [' ▐▛███▜▌ ', '▝▜█████▛▘', '  ▘▘ ▝▝  ']
}
const VERBO: Record<string, string> = {
  Bash: 'tecleando comandos', Read: 'leyendo', Edit: 'escribiendo', Write: 'escribiendo', NotebookEdit: 'escribiendo',
  Grep: 'buscando', Glob: 'buscando archivos', WebFetch: 'navegando', WebSearch: 'investigando', Agent: 'llamando ayuda',
  TaskCreate: 'anotando tareas', TaskUpdate: 'tachando tareas',
}
function frase(a: Agente, f: number) {
  const puntos = '.'.repeat((f % 3) + 1)
  if (a.estado === 'completed') return '¡listo! ♡'
  if (a.estado === 'failed') return 'uy… algo falló'
  if (a.estado === 'killed') return 'me fui a dormir zzz'
  if (a.estado === 'pending') return 'calentando motores' + puntos
  if (a.estado === 'idle' || a.estado === 'waiting') return 'esperando' + puntos
  return (a.ultima ? VERBO[a.ultima] ?? `usando ${a.ultima}` : 'pensando') + puntos
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'agentes', description: 'Abre el panel con los agentes y las tareas de la sesión' })
    void $.ui.open({ id: PANE, title: 'Agentes' })
    // cada segundo, sólo mientras algún agente sigue trabajando
    $.clock.every(1000, () => {
      void (async () => {
        if ((await read($, agentes)).some(trabajando)) await refrescar($)
      })().catch(() => {})
    })
    return next(e)
  })

  on('command.run', { command: 'agentes' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Agentes' })
    return { text: 'Panel de agentes abierto.' }
  })

  on('tool.call', async ($, e, next) => {
    // herramienta llamada dentro de un subagente: cuenta para ese agente
    // (lo del panel nunca debe frenar una herramienta: cada anotación va con su .catch)
    if (e.agentId) {
      const id = e.agentId
      await (async () => {
        const t = await $.clock.now()
        await update($, agentes, lista => {
          const hay = lista.some(a => a.id === id)
          const base = hay ? lista : [...lista, { id, descripcion: 'Agente', tipo: '', estado: 'running' as const, inicio: t, herramientas: 0 }]
          return base.map(a => (a.id === id ? { ...a, herramientas: a.herramientas + 1, ultima: e.tool } : a))
        })
      })().catch(() => {})
    }

    if (e.tool === 'Agent') {
      $.clock.after(500, () => void refrescar($).catch(() => {}))
      const r = await next(e)
      const res = r.result as { agentId?: string; status?: string; totalToolUseCount?: number } | undefined
      if (res?.agentId) {
        await (async () => {
          await refrescar($)
          if (res.status === 'completed') {
            const t = await $.clock.now()
            await update($, agentes, lista => lista.map(a => a.id === res.agentId
              ? { ...a, estado: 'completed' as const, fin: a.fin ?? t, herramientas: Math.max(a.herramientas, res.totalToolUseCount ?? 0) }
              : a))
          }
        })().catch(() => {})
      }
      return r
    }

    if (e.tool === 'TaskCreate') {
      const r = await next(e)
      const tarea = (r.result as { task?: { id: string; subject: string } } | undefined)?.task
      if (tarea) {
        const nueva: Tarea = { id: tarea.id, titulo: tarea.subject || e.subject, activa: e.activeForm, estado: 'pending' }
        await update($, tareas, lista => [...lista.filter(x => x.id !== nueva.id), nueva].slice(-60)).catch(() => {})
      }
      return r
    }

    if (e.tool === 'TaskUpdate') {
      const r = await next(e)
      const ok = (r.result as { success?: boolean } | undefined)?.success
      if (ok) {
        await update($, tareas, lista => {
          if (e.status === 'deleted') return lista.filter(x => x.id !== e.taskId)
          return lista.map(x => x.id !== e.taskId ? x : {
            ...x,
            titulo: e.subject ?? x.titulo,
            activa: e.activeForm ?? x.activa,
            estado: e.status && e.status !== 'deleted' ? e.status : x.estado,
            dueno: e.owner ?? x.dueno,
          })
        }).catch(() => {})
      }
      return r
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const lista = await read($, agentes)
    const ts = await read($, tareas)
    const t = (await read($, ahora)) || (await $.clock.now())
    const f = Math.floor(t / 1000)
    const activos = lista.filter(trabajando).length
    const hechas = ts.filter(x => x.estado === 'completed').length
    const mama = activos
      ? `¡Mi equipo de ${activos} está trabajando!`
      : lista.length ? 'Todos terminaron. ¡Buen trabajo, equipo! ♡' : 'Hola, soy Claude. Aquí verás a mis ayudantes.'

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Box flexDirection="column">
            {cuerpo(activos ? 'running' : 'completed', f).map((l, i) => (
              <Text key={'c' + i} mono color="#D97757">{l}</Text>
            ))}
          </Box>
          <Box flexDirection="column" justifyContent="center">
            <Text bold>Claude</Text>
            <Text dimColor>{mama}</Text>
          </Box>
        </Box>

        {lista.length === 0 && <Box marginTop={1}><Text dimColor>Todavía no se ha lanzado ningún agente.</Text></Box>}
        {lista.slice().reverse().map(a => {
          const p = pinta(a)
          const apagado = a.estado === 'failed' || a.estado === 'killed'
          return (
            <Box key={a.id} flexDirection="row" gap={1} marginTop={1}>
              <Box flexDirection="column">
                {cuerpo(a.estado, f + a.id.length).map((l, i) => (
                  <Text key={a.id + i} mono color={apagado ? 'gray' : p.color}>{l}{i === 1 && trabajando(a) ? p.cosa : ''}</Text>
                ))}
              </Box>
              <Box flexDirection="column" flexShrink={1}>
                <Text>
                  <Text color={COLOR[a.estado]}>{ICONO[a.estado]} </Text>
                  <Text bold={trabajando(a)}>{a.descripcion}</Text>
                </Text>
                <Text color={p.color} italic>{p.nombre} · «{frase(a, f)}»</Text>
                <Text dimColor>
                  {ESTADO[a.estado]} · {duracion((a.fin ?? t) - a.inicio)}
                  {a.herramientas ? ` · ${a.herramientas} herramienta${a.herramientas === 1 ? '' : 's'}` : ''}
                </Text>
              </Box>
            </Box>
          )
        })}

        <Box marginTop={1}>
          <Text bold>Tareas{ts.length ? ` · ${hechas}/${ts.length} hechas` : ''}</Text>
        </Box>
        {ts.length === 0 && <Text dimColor>Sin tareas por ahora.</Text>}
        {ts.map(x => (
          <Text key={x.id} dimColor={x.estado === 'completed'}>
            <Text color={x.estado === 'completed' ? 'green' : x.estado === 'in_progress' ? 'cyan' : 'gray'}>
              {x.estado === 'completed' ? '☑' : x.estado === 'in_progress' ? '◐' : '☐'}{' '}
            </Text>
            {x.estado === 'in_progress' && x.activa ? x.activa : x.titulo}
            {x.dueno ? ` (${x.dueno})` : ''}
          </Text>
        ))}
      </Box>
    )
  })
}
