# Wicked Studio open-source toolchain

This project is being expanded as a local-first creative editor. Prefer browser-native APIs and libraries that do not require accounts, API keys, paid credits, or a hosted processing service.

## Working now

- The Design & Compositing workspace at `/design` is implemented with native SVG and Canvas/browser APIs.
- It provides an editable artboard, image import, text and shape objects, freehand paths, layer selection/order/visibility, transforms, opacity, undo/redo, editable project JSON, and PNG export.
- The existing GIF, pixel-art, typography, texture, and sound workspaces remain separate entry points.

## Open-source projects to learn from

These are reference implementations, not code copied into this repository:

- [brainCUT](https://github.com/swimmingbrain/braincut): local-first multi-track editor architecture using Mediabunny, WebCodecs, PixiJS, Web Audio, IndexedDB and undoable document operations. Its repository describes an MIT license.
- [Viz](https://github.com/zrnge/viz): browser-local editing with FFmpeg.wasm, multi-track timeline, project import/export and no server-side media uploads. Verify the exact license and current maintenance status before reusing code.
- [ClipForge](https://github.com/cloudgrids/clipforge): MIT-licensed Next.js/React editor reference for timeline editing, transitions, waveform display and FFmpeg.wasm export.
- [FreeCut](https://github.com/walterlow/freecut): MIT-licensed local-first browser editor reference using WebCodecs, WebGPU and Mediabunny.

Do not copy source files, UI assets, templates, transition packs or branding without reviewing each repository's license and notices. Prefer integrating libraries through their documented APIs.

## Proposed library integrations

| Library / API | Planned use | License / constraint |
|---|---|---|
| [Mediabunny](https://github.com/Vanilagy/mediabunny) | Browser-native media probing, decoding, trimming, muxing and MP4/WebM export | MPL-2.0; preserve notices and publish modifications to MPL-covered files if distributed |
| [WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API) | Hardware-accelerated decode/encode where supported | Browser API; feature-detect and retain fallback paths |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Audio graph, mixing, fades, effects and offline rendering | Browser API; no API key |
| [WaveSurfer.js](https://github.com/katspaugh/wavesurfer.js) | Interactive audio waveform and region selection | BSD-3-Clause; include required notices |
| [Konva](https://github.com/konvajs/konva) | Optional richer canvas object transforms and hit testing | MIT; evaluate before replacing the native SVG editor |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | Optional local AI inference for background removal/upscaling/classification | MIT runtime; model weights have separate licenses and can be large |
| [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | Compatibility fallback for media formats not handled by WebCodecs/Mediabunny | Wrapper and core have distinct licenses; some cores are GPL. Do not bundle until the exact core build and obligations are reviewed |

## No-key API policy

Core editing must never depend on a remote API. User media should stay in the browser by default. AI features should use optional local models (for example ONNX Runtime Web with properly licensed model weights), and should explain device-memory/download requirements. Any optional remote provider must be clearly marked as requiring a user-supplied key and must not block normal editing.

## Compatibility and deployment notes

- Safari/iOS support is a first-class requirement. Do not assume SharedArrayBuffer, File System Access API, WebGPU or every WebCodecs codec is available.
- Feature-detect advanced browser APIs and offer a slower fallback where practical.
- Large video exports can exceed mobile memory. Use worker-based processing, streaming/segmented output where supported, and clear limits instead of freezing the page.
- Keep Cloudflare Workers as the app host only; heavy media processing should happen on the user's device, not inside the Worker.
- Every integration must be tested on the actual target browsers before being marked complete.
