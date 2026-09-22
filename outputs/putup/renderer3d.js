// Blender mesh batches; WebGL provides depth testing and per-pixel lighting.
(function(){
  const surface=document.createElement('canvas');surface.id='gpu-world';
  surface.style.cssText='position:absolute;inset:0;z-index:0;pointer-events:none';
  document.body.prepend(surface);
  const gl=surface.getContext('webgl',{alpha:false,antialias:true});
  if(!gl||!window.PUTUP_MODELS){surface.remove();return}
  const vertex=`attribute vec3 position;attribute vec3 normal;attribute vec3 color;
  uniform vec3 eye,right,up,forward,offset,pivot,tint;uniform vec2 scale;uniform float swing,yaw;
  varying vec3 vColor,vNormal;varying float distance;
  vec3 turn(vec3 p){float c=cos(swing),s=sin(swing);p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);c=cos(yaw);s=sin(yaw);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
  void main(){vec3 p=turn(position-pivot)+turn(pivot*vec3(1.,0.,1.))+vec3(0.,pivot.y,0.)+offset;
  vec3 d=p-eye;float z=dot(d,forward);gl_Position=vec4(dot(d,right)*scale.x,dot(d,up)*scale.y-z*.08,1.0013342*z-.2001334,z);
  vColor=color*tint;vNormal=turn(normal);distance=z;}`;
  const fragment=`precision mediump float;varying vec3 vColor,vNormal;varying float distance;
  void main(){vec3 n=normalize(vNormal);float light=.57+.37*max(dot(n,normalize(vec3(-.5,1.,.65))),0.)+.08*max(dot(n,normalize(vec3(.7,.3,-1.))),0.);
  vec3 c=vColor*light;float fog=smoothstep(25.,88.,distance)*.82;gl_FragColor=vec4(mix(c,vec3(.14,.20,.28),fog),1.);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const uniform={};for(const n of ['eye','right','up','forward','offset','pivot','tint','scale','swing','yaw'])uniform[n]=gl.getUniformLocation(program,n);
  const attr=['position','normal','color'].map(n=>gl.getAttribLocation(program,n));
  function batch(data){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return{buffer,count:data.length/9}}
  const meshes={};for(const [key,data] of Object.entries(window.PUTUP_MODELS))meshes[key]=batch(data);
  const dynamic=gl.createBuffer();let boxes=[],queued=[],activeCamera;
  function paint(b,offset=[0,0,0],yaw=0,pivot=[0,0,0],swing=0,tint=[1,1,1]){gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);attr.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12)});gl.uniform3fv(uniform.offset,offset);gl.uniform3fv(uniform.pivot,pivot);gl.uniform3fv(uniform.tint,tint);gl.uniform1f(uniform.yaw,yaw);gl.uniform1f(uniform.swing,swing);gl.drawArrays(gl.TRIANGLES,0,b.count)}
  const cubeFaces=[[[0,1,2,3],[0,0,-1]],[[4,7,6,5],[0,0,1]],[[0,4,5,1],[0,-1,0]],[[3,2,6,7],[0,1,0]],[[1,5,6,2],[1,0,0]],[[0,3,7,4],[-1,0,0]]];
  window.PUTUP_3D={
    begin(w,h){let ratio=Math.min(devicePixelRatio||1,1.5);if(surface.width!==Math.round(w*ratio)||surface.height!==Math.round(h*ratio)){surface.width=Math.round(w*ratio);surface.height=Math.round(h*ratio)}gl.viewport(0,0,surface.width,surface.height);gl.enable(gl.DEPTH_TEST);gl.clearColor(.14,.20,.28,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform2f(uniform.scale,Math.min(w,h)*2.2/w,Math.min(w,h)*2.2/h);boxes=[];queued=[]},
    camera(c){activeCamera=c},
    box(x,y,z,w,h,d,color){const rgb=color.match(/\w\w/g).map(v=>parseInt(v,16)/255);let p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(a=>[x+a[0]*w/2,y+a[1]*h/2,z+a[2]*d/2]);for(const [idx,n] of cubeFaces)for(const i of [0,1,2,0,2,3])boxes.push(...p[idx[i]],...n,...rgb)},
    mesh(name,offset,yaw,pivot,swing,tint){if(meshes[name])queued.push([meshes[name],offset,yaw,pivot,swing,tint])},
    end(){if(!activeCamera)return;for(const [name,value] of Object.entries({eye:activeCamera.pos,right:activeCamera.r,up:activeCamera.u,forward:activeCamera.f}))gl.uniform3fv(uniform[name],value);if(boxes.length){gl.bindBuffer(gl.ARRAY_BUFFER,dynamic);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(boxes),gl.DYNAMIC_DRAW);paint({buffer:dynamic,count:boxes.length/9})}queued.forEach(args=>paint(...args))},
    ready:true
  };
})();
