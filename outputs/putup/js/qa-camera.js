'use strict';
/* Ayuda temporal para reproducir fallos del render desde cámaras y puntos exactos. */
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('qa') !== 'render') return;
  const number = (name, fallback) => Number.isFinite(Number(q.get(name))) ? Number(q.get(name)) : fallback;
  player = { x: number('x', 0), z: number('z', 1.5) };
  avatar.room = roomAt(player.x, player.z);
  view.angle = view.goal = number('angle', 0.62);
  view.dist = view.distGoal = number('dist', 14);
  view.tx = player.x;
  view.tz = player.z;
  wallMode = ['cut', 'low', 'up'].includes(q.get('walls')) ? q.get('walls') : 'cut';
  closeModal();
  updateWalls(1, cameraPos(), avatar.room, [player.x, player.z]);
  updateWallsButton();
  const sink = document.createElement('script');
  sink.id = 'qa-render-state';
  sink.type = 'application/json';
  document.body.appendChild(sink);
  setInterval(() => {
    const order = R.drawOrder, index = new Map(R.groups.map((g, i) => [g, i]));
    window.__qaRender = {
      camera: R.cam && R.cam.pos,
      sortBreaks: R.sortBreaks,
      groups: order.map((g, order) => ({
        index: index.get(g), order, box: g.box.slice(), screen: g.sb.slice(), depth: g.depth, faces: g.faces.length,
        behind: (g.behind || []).map(h => index.get(h)),
      })),
    };
    sink.textContent = JSON.stringify(window.__qaRender);
  }, 200);
})();
