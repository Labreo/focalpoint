import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/face_mesh.binarypb',
        destination: '/mediapipe/face_mesh/face_mesh.binarypb',
      },
      {
        source: '/face_mesh_solution_packed_assets_loader.js',
        destination: '/mediapipe/face_mesh/face_mesh_solution_packed_assets_loader.js',
      },
      {
        source: '/face_mesh_solution_packed_assets.data',
        destination: '/mediapipe/face_mesh/face_mesh_solution_packed_assets.data',
      },
      {
        source: '/face_mesh_solution_simd_wasm_bin.js',
        destination: '/mediapipe/face_mesh/face_mesh_solution_simd_wasm_bin.js',
      },
      {
        source: '/face_mesh_solution_simd_wasm_bin.wasm',
        destination: '/mediapipe/face_mesh/face_mesh_solution_simd_wasm_bin.wasm',
      },
      {
        source: '/face_mesh_solution_wasm_bin.js',
        destination: '/mediapipe/face_mesh/face_mesh_solution_wasm_bin.js',
      },
      {
        source: '/face_mesh_solution_wasm_bin.wasm',
        destination: '/mediapipe/face_mesh/face_mesh_solution_wasm_bin.wasm',
      },
    ];
  },
};

export default nextConfig;
