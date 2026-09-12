import * as THREE from 'three';

// Цвета берём «как есть», без sRGB-конверсии: плоская минекрафтовая заливка.
// Модуль импортируется раньше всех, кто создаёт цвета.
THREE.ColorManagement.enabled = false;

/* ---------- пиксельные текстуры 16×16, как в Minecraft ---------- */
// Серые — умножаются на цвет блока, поэтому одной текстуры хватает на все цвета.

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function pixelTexture(paint) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = Math.round(Math.min(1, Math.max(0, paint(x, y))) * 255);
      const i = (y * 16 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter; // вблизи — чёткие пиксели
  tex.minFilter = THREE.NearestMipmapLinearFilter; // вдали — без ряби
  return tex;
}

const rnd = seeded(20260911);
const PLANK_SEAMS = [3, 11, 7, 14];
const PLANK_SHADES = [0.96, 0.87, 0.98, 0.9];

export const TEX = {
  // крапинки
  noise: pixelTexture(() => 0.85 + rnd() * 0.15 - (rnd() < 0.08 ? 0.08 : 0)),
  // крапинки + тёмный стык с соседним блоком
  block: pixelTexture((x, y) => (x === 0 || y === 0 ? 0.78 : 0.86 + rnd() * 0.14 - (rnd() < 0.06 ? 0.07 : 0))),
  // доски: четыре ряда, щели и стыки вразбежку
  planks: pixelTexture((x, y) => {
    const row = y >> 2;
    if (y % 4 === 3) return 0.66;
    if (x === PLANK_SEAMS[row]) return 0.74;
    return PLANK_SHADES[row] - rnd() * 0.06 - ((x + row * 5) % 7 === 0 ? 0.05 : 0);
  }),
  // вода: ровная рябь и светлые блики
  water: pixelTexture((x, y) => (y % 5 === 0 && (x + y * 3) % 8 < 3 ? 1 : 0.86 + rnd() * 0.06)),
};

// Натягивает пиксельную текстуру на грани боксов.
// У инстансов координаты мировые (повёрнутые блоки — в своих осях) — стыки текстуры
// совпадают со стыками блоков; у обычных мешей — локальные с учётом масштаба,
// чтобы текстура не «плыла» за кораблём.
// tile — сколько мировых единиц занимает одна текстура; offset сдвигает сетку.
// terrain — «шейдеры» для суши: травяная кромка на боках, мягкие края блоков, качается листва.
// water — прозрачная вода: отражает небо под углом, солнечная дорожка, бегущая рябь.

// Общие для всех шейдеров: время, направление на солнце, цвет неба у горизонта.
export const voxTime = { value: 0 };
export const voxSun = { value: new THREE.Vector3(0, 1, 0) };
export const voxSky = { value: new THREE.Color(0xc4e4f3) };
// Всё, что загораживает капитана от камеры, растворяется сеточкой (voxCutAt — его голова).
export const voxCutOn = { value: 0 };
export const voxCutAt = { value: new THREE.Vector3() };

const TERRAIN_VERTEX = `
  vVoxGrass = 0.0;
  vVoxTop = 0.0;
#if defined(USE_INSTANCING) && defined(USE_INSTANCING_COLOR)
  float voxW = length(instanceMatrix[0].xyz);
  float voxH = length(instanceMatrix[1].xyz);
  // у каждого блока чуть свой оттенок — большие стены не выглядят плоскими
  vVoxTint = 0.95 + 0.1 * fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  bool voxGreen = instanceColor.g > instanceColor.r * 1.15 && instanceColor.g > instanceColor.b * 1.15;
  // верхний блок травы (2×2×2): бока снизу земляные
  if (voxGreen && abs(voxH - 2.0) < 0.05 && abs(voxW - 2.0) < 0.05) {
    vVoxGrass = 1.0;
    vVoxTop = 0.5 - position.y;
  }
  // листья и цветы колышет ветер: верх блока ходит сильнее низа
  if (voxGreen && voxH < 1.5 && voxW < 2.5) {
    vec3 voxC = instanceMatrix[3].xyz;
    float voxSway = sin(voxTime * 1.8 + voxC.x * 0.35 + voxC.z * 0.27) * 0.14 * (position.y + 0.5);
    transformed.x += voxSway / voxW;
    transformed.z += voxSway * 0.6 / length(instanceMatrix[2].xyz);
  }
#endif`;

const TERRAIN_FRAGMENT = `
  if (vVoxGrass > 0.5 && voxN.y < 0.5) {
    // неровный край травы — по пиксельным столбикам, как у блока травы в Minecraft
    float voxEdge = 0.16 + (texture2D(voxTex, vec2(voxUv.x / voxTile, 0.37)).r - 0.78) * 1.3;
    if (vVoxTop > voxEdge) diffuseColor.rgb = vec3(0.545, 0.353, 0.169) * texture2D(voxTex, voxUv / voxTile).rgb;
  }
  // мягкое затенение к краям каждого блока — объём без лишней геометрии
  vec2 voxF = floor(fract(voxUv / voxTile) * 16.0) / 16.0 + 1.0 / 32.0;
  float voxE = min(min(voxF.x, 1.0 - voxF.x), min(voxF.y, 1.0 - voxF.y));
  diffuseColor.rgb *= mix(0.84, 1.0, smoothstep(0.0, 0.2, voxE)) * vVoxTint;`;

const CUT_FRAGMENT = `
uniform float voxCutOn;
uniform vec3 voxCutAt;
varying vec3 vVoxWorld;
const float VOX_BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
// точка между камерой и капитаном, рядом с линией взгляда? — выкидываем часть пикселей узором
bool voxCutAway() {
  vec3 ab = voxCutAt - cameraPosition;
  float len = length(ab);
  vec3 dir = ab / len;
  vec3 ap = vVoxWorld - cameraPosition;
  float along = dot(ap, dir);
  if (along < 0.5 || along > len - 1.4) return false;
  if (vVoxWorld.y < voxCutAt.y - 2.6) return false; // земля под ногами остаётся
  float k = smoothstep(3.6, 1.8, length(ap - dir * along));
  vec2 q = mod(floor(gl_FragCoord.xy), 4.0);
  return VOX_BAYER[int(q.x + q.y * 4.0)] / 16.0 < k * 0.8;
}
`;

const WATER_LIGHT = `
  vec3 voxV = normalize(vViewPosition);
  vec3 voxUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  // чем положе смотрим, тем больше в воде отражается небо
  float voxFres = pow(1.0 - clamp(dot(voxV, voxUp), 0.0, 1.0), 3.0);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, voxSky, voxFres * 0.6);
  gl_FragColor.a = mix(gl_FragColor.a, 1.0, voxFres);
  // солнечная дорожка — ступеньками, по-пиксельному
  vec3 voxL = normalize((viewMatrix * vec4(voxSun, 0.0)).xyz);
  float voxSpec = pow(max(dot(reflect(-voxL, voxUp), voxV), 0.0), 60.0);
  gl_FragColor.rgb += vec3(1.0, 0.94, 0.78) * floor(voxSpec * 4.0) * 0.22 * step(0.5, voxN.y);
`;

export function voxelize(material, { tex = TEX.noise, tile = 2, offset = [0, 0, 0], terrain = false, water = false } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.voxTex = { value: tex };
    shader.uniforms.voxTile = { value: tile };
    shader.uniforms.voxOffset = { value: new THREE.Vector3(...offset) };
    shader.uniforms.voxTime = voxTime;
    shader.uniforms.voxSun = voxSun;
    shader.uniforms.voxSky = voxSky;
    shader.uniforms.voxCutOn = voxCutOn;
    shader.uniforms.voxCutAt = voxCutAt;
    const defs = `${terrain ? '#define VOX_TERRAIN\n' : ''}${water ? '#define VOX_WATER\n' : ''}`;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `${defs}#include <common>\nuniform vec3 voxOffset;\nuniform float voxTime;\nvarying vec3 vVoxPos;\nvarying vec3 vVoxNrm;\nvarying float vVoxGrass;\nvarying float vVoxTop;\nvarying float vVoxTint;\nvarying vec3 vVoxWorld;`,
      )
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n  vVoxTint = 1.0;\n#ifdef VOX_TERRAIN\n${TERRAIN_VERTEX}\n#endif`)
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
#ifdef USE_INSTANCING
  mat3 voxRot = mat3(normalize(instanceMatrix[0].xyz), normalize(instanceMatrix[1].xyz), normalize(instanceMatrix[2].xyz));
  vVoxPos = transpose(voxRot) * (instanceMatrix * vec4(transformed, 1.0)).xyz + voxOffset;
#else
  vVoxPos = transformed * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)) + voxOffset;
#endif
#ifdef USE_INSTANCING
  vVoxWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
  vVoxWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif
  vVoxNrm = objectNormal;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `${defs}#include <common>\nuniform sampler2D voxTex;\nuniform float voxTile;\nuniform float voxTime;\nuniform vec3 voxSun;\nuniform vec3 voxSky;\nvarying vec3 vVoxPos;\nvarying vec3 vVoxNrm;\nvarying float vVoxGrass;\nvarying float vVoxTop;\nvarying float vVoxTint;\n${CUT_FRAGMENT}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
#ifndef VOX_WATER
  if (voxCutOn > 0.5 && voxCutAway()) discard;
#endif
  vec3 voxN = abs(vVoxNrm);
  vec2 voxUv = voxN.y > 0.5 ? vVoxPos.xz : (voxN.x > 0.5 ? vVoxPos.zy : vVoxPos.xy);
#ifdef VOX_WATER
  voxUv += floor(vec2(voxTime * 1.3, voxTime * 0.8)) * (voxTile / 16.0); // рябь бежит по пикселю
#endif
  diffuseColor.rgb *= texture2D(voxTex, voxUv / voxTile).rgb;
#ifdef VOX_TERRAIN
${TERRAIN_FRAGMENT}
#endif`,
      )
      .replace('#include <tonemapping_fragment>', `#ifdef VOX_WATER\n${WATER_LIGHT}\n#endif\n#include <tonemapping_fragment>`);
  };
  material.customProgramCacheKey = () => `voxel${terrain ? '-terrain' : ''}${water ? '-water' : ''}`;
  return material;
}

/* ---------- свечение ---------- */
// Пиксельный ореол: ступенчатые кольца, складываются со светом сцены.
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  glowTex = pixelTexture((x, y) => {
    const d = Math.hypot(x - 7.5, y - 7.5) / 8;
    return Math.max(0, Math.round((1 - d) * 4) / 4);
  });
  glowTex.wrapS = glowTex.wrapT = THREE.ClampToEdgeWrapping;
  glowTex.minFilter = THREE.NearestFilter;
  return glowTex;
}

export const glows = []; // все ореолы — ночью их можно сделать ярче

export function glow(parent, color, size, x = 0, y = 0, z = 0, strength = 0.5, fog = true) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color,
      opacity: strength,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog,
    }),
  );
  sprite.scale.set(size, size, 1);
  sprite.position.set(x, y, z);
  sprite.userData.strength = strength;
  parent.add(sprite);
  glows.push(sprite);
  return sprite;
}

// коричневое — значит дерево: доски на корабле, сундуках, шляпах
const hsl = {};
const probe = new THREE.Color();
function isWood(hex) {
  probe.setHex(hex).getHSL(hsl);
  return hsl.h > 0.03 && hsl.h < 0.13 && hsl.s > 0.2 && hsl.s < 0.75 && hsl.l > 0.12 && hsl.l < 0.48;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map();

export function lambert(color) {
  let m = materials.get(color);
  if (!m) {
    m = voxelize(new THREE.MeshLambertMaterial({ color }), { tex: isWood(color) ? TEX.planks : TEX.noise });
    materials.set(color, m);
  }
  return m;
}

// Один воксель: цвет (или готовый материал), размеры, центр. Геометрия общая на всех.
export function cube(parent, color, w, h, d, x = 0, y = 0, z = 0) {
  const material = typeof color === 'number' ? lambert(color) : color;
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = !material.isMeshBasicMaterial;
  parent.add(mesh);
  return mesh;
}
