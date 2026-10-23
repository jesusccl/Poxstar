import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  component: 'Pane',
  requestId: 'agentes',
  props: { title: 'Agentes', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

test('el panel muestra las tareas y cómo van, en cada superficie', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  // lo que está debajo del plugin hace de herramienta
  on('tool.call', ($, e) => {
    if (e.tool === 'TaskCreate') return Promise.resolve({ result: { task: { id: '1', subject: e.subject } } })
    if (e.tool === 'TaskUpdate') return Promise.resolve({ result: { success: true, taskId: e.taskId, updatedFields: ['status'] } })
    return Promise.resolve({ result: {} })
  })

  await $.tool.call({ tool: 'TaskCreate', subject: 'Probar el juego', description: 'x', activeForm: 'Probando el juego' })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'agentes', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /Probar el juego/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Todavía no se ha lanzado ningún agente/ })).toBeDefined()
    await ui.unmount()
  }

  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'in_progress' })
  const ui = await $.ui.mount({ plugin: 'agentes', surface: 'desktop', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Probando el juego/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /0\/1 hechas/ })).toBeDefined()
  await ui.unmount()

  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed' })
  const fin = await $.ui.mount({ plugin: 'agentes', surface: 'terminal', ...PANE })
  expect(await fin.find({ type: 'Text', text: /1\/1 hechas/ })).toBeDefined()
  await fin.unmount()
})

test('las herramientas de un subagente cuentan para ese agente', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  on('tool.call', () => Promise.resolve({ result: {} }))
  // como las llamaría el subagente a1 (agentId es la marca de su bucle)
  const leer = { tool: 'Read' as const, file_path: '/tmp/x', agentId: 'a1' }
  const listar = { tool: 'Bash' as const, command: 'ls', agentId: 'a1' }
  await $.tool.call(leer)
  await $.tool.call(listar)
  const ui = await $.ui.mount({ plugin: 'agentes', surface: 'desktop', ...PANE })
  expect(await ui.find({ type: 'Text', text: /2 herramientas/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /tecleando comandos/ })).toBeDefined()
  await ui.unmount()
})
