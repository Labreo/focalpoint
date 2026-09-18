import { describe, it, expect } from "vitest";
import { WebGLShaderPipeline } from "../lib/webgl_shader_pipeline";

describe("WebGL Shader Pipeline", () => {
  it("initializes without throwing even if WebGL is unmocked in test environment", () => {
    const mockCanvas = {
      getContext: () => null,
      width: 1920,
      height: 1080
    } as unknown as HTMLCanvasElement;

    const pipeline = new WebGLShaderPipeline(mockCanvas);
    expect(pipeline).toBeDefined();

    // Invoking destroy handles null contexts cleanly
    expect(() => pipeline.destroy()).not.toThrow();
  });
});
