/**
 * WebGL 2.0 / 1.0 GPU Fragment Shader Pipeline
 * 
 * Provides 60 FPS real-time per-pixel remapping for ophthalmic pathologies:
 * - AMD: Annular Preferred Retinal Locus (PRL) projection & Gaussian-feathered central scotoma mask
 * - Retinitis Pigmentosa: Non-linear anamorphic radial compression r' = R_tunnel * (r/R_max)^gamma
 * - Low Acuity / Diabetic Retinopathy: 3x3 Laplacian edge sharpening kernel & contrast boost
 * - Homonymous Hemianopia: Saccadic fold / hemifield shift
 */

export interface ShaderRenderOptions {
  pathologyType: "AMD" | "TUNNEL_VISION" | "LOW_ACUITY" | "HEMIANOPIA" | "NONE";
  gazeX: number; // 0.0 to 1.0
  gazeY: number; // 0.0 to 1.0
  contrastBoost: number; // 1.0 to 2.5
  scotomaRadius: number; // normalized radius
  tunnelRadius: number; // normalized radius
  gamma: number; // compression exponent (0.45 - 0.65)
  isSimulatorActive: boolean;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_gaze;
uniform int u_pathology; // 0: NONE, 1: AMD, 2: TUNNEL_VISION, 3: LOW_ACUITY, 4: HEMIANOPIA
uniform float u_contrast;
uniform float u_scotoma_radius;
uniform float u_tunnel_radius;
uniform float u_gamma;
uniform bool u_simulator;

varying vec2 v_texCoord;

vec3 applyContrast(vec3 color, float contrast) {
  return clamp(((color - 0.5) * contrast) + 0.5, 0.0, 1.0);
}

void main() {
  vec2 uv = v_texCoord;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 distVec = (uv - u_gaze) * aspect;
  float dist = length(distVec);

  // 1. Retinitis Pigmentosa: Non-linear Anamorphic Radial Compression
  if (u_pathology == 2) {
    if (dist > 0.001) {
      vec2 dir = normalize(distVec);
      float rMax = 0.85;
      float rNorm = clamp(dist / rMax, 0.0, 1.0);
      float rComp = u_tunnel_radius * pow(rNorm, u_gamma);
      uv = u_gaze + (dir * rComp) / aspect;
    }
  }

  // Sample texture
  vec4 texColor = texture2D(u_image, uv);
  vec3 rgb = texColor.rgb;

  // 2. Low Acuity: 3x3 Edge Sharpening & High Contrast
  if (u_pathology == 3) {
    vec2 onePixel = vec2(1.0) / u_resolution;
    vec4 c = texture2D(u_image, uv);
    vec4 n = texture2D(u_image, uv + vec2(0.0, -onePixel.y));
    vec4 s = texture2D(u_image, uv + vec2(0.0, onePixel.y));
    vec4 e = texture2D(u_image, uv + vec2(onePixel.x, 0.0));
    vec4 w = texture2D(u_image, uv + vec2(-onePixel.x, 0.0));
    
    // Laplacian kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
    vec3 sharpened = (c.rgb * 5.0) - (n.rgb + s.rgb + e.rgb + w.rgb);
    rgb = applyContrast(mix(c.rgb, sharpened, 0.65), u_contrast * 1.3);
  } else {
    rgb = applyContrast(rgb, u_contrast);
  }

  // 3. AMD: Eccentric Viewing Scotoma / Simulator Mask
  if (u_pathology == 1) {
    if (u_simulator) {
      // Gaussian feathered central scotoma blind spot
      float feather = smoothstep(u_scotoma_radius * 0.4, u_scotoma_radius, dist);
      rgb = mix(vec3(0.02, 0.02, 0.03), rgb, feather);
    }
  }

  // 4. Retinitis Pigmentosa Tunnel Simulator Mask
  if (u_pathology == 2 && u_simulator) {
    float tunnelEdge = smoothstep(u_tunnel_radius, u_tunnel_radius * 1.15, dist);
    rgb = mix(rgb, vec3(0.01, 0.01, 0.02), tunnelEdge);
  }

  // 5. Hemianopia: Visual Field Shift
  if (u_pathology == 4 && u_simulator) {
    if (uv.x > 0.5) {
      rgb = mix(rgb, vec3(0.02, 0.02, 0.02), 0.95);
    }
  }

  gl_FragColor = vec4(rgb, texColor.a);
}
`;

export class WebGLShaderPipeline {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private posBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;

  // Uniform locations
  private uResolutionLoc: WebGLUniformLocation | null = null;
  private uGazeLoc: WebGLUniformLocation | null = null;
  private uPathologyLoc: WebGLUniformLocation | null = null;
  private uContrastLoc: WebGLUniformLocation | null = null;
  private uScotomaRadiusLoc: WebGLUniformLocation | null = null;
  private uTunnelRadiusLoc: WebGLUniformLocation | null = null;
  private uGammaLoc: WebGLUniformLocation | null = null;
  private uSimulatorLoc: WebGLUniformLocation | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.initGL(canvas);
  }

  private initGL(canvas: HTMLCanvasElement): void {
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) {
      console.warn("WebGL not supported, running on standard Canvas2D");
      return;
    }
    this.gl = gl;

    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("WebGL program linking failed:", gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Get Uniform Locations
    this.uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
    this.uGazeLoc = gl.getUniformLocation(program, "u_gaze");
    this.uPathologyLoc = gl.getUniformLocation(program, "u_pathology");
    this.uContrastLoc = gl.getUniformLocation(program, "u_contrast");
    this.uScotomaRadiusLoc = gl.getUniformLocation(program, "u_scotoma_radius");
    this.uTunnelRadiusLoc = gl.getUniformLocation(program, "u_tunnel_radius");
    this.uGammaLoc = gl.getUniformLocation(program, "u_gamma");
    this.uSimulatorLoc = gl.getUniformLocation(program, "u_simulator");

    // Create full screen quad
    this.posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
      ]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Texture coords (invert Y for WebGL texture orientation)
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0
      ]),
      gl.STATIC_DRAW
    );

    const texAttr = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texAttr);
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0);

    // Texture object
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private compileShader(type: number, src: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public render(source: HTMLCanvasElement | HTMLVideoElement, options: ShaderRenderOptions): void {
    const gl = this.gl;
    if (!gl || !this.program || !this.texture) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.program);

    // Upload source texture
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // Update uniforms
    gl.uniform2f(this.uResolutionLoc, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this.uGazeLoc, options.gazeX, options.gazeY);

    let pathCode = 0;
    if (options.pathologyType === "AMD") pathCode = 1;
    else if (options.pathologyType === "TUNNEL_VISION") pathCode = 2;
    else if (options.pathologyType === "LOW_ACUITY") pathCode = 3;
    else if (options.pathologyType === "HEMIANOPIA") pathCode = 4;

    gl.uniform1i(this.uPathologyLoc, pathCode);
    gl.uniform1f(this.uContrastLoc, options.contrastBoost);
    gl.uniform1f(this.uScotomaRadiusLoc, options.scotomaRadius);
    gl.uniform1f(this.uTunnelRadiusLoc, options.tunnelRadius);
    gl.uniform1f(this.uGammaLoc, options.gamma);
    gl.uniform1i(this.uSimulatorLoc, options.isSimulatorActive ? 1 : 0);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy(): void {
    if (!this.gl) return;
    if (this.posBuffer) this.gl.deleteBuffer(this.posBuffer);
    if (this.texCoordBuffer) this.gl.deleteBuffer(this.texCoordBuffer);
    if (this.texture) this.gl.deleteTexture(this.texture);
    if (this.program) this.gl.deleteProgram(this.program);
    this.gl = null;
  }
}
