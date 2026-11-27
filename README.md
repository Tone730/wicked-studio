# Wicked Studio Creator Edition

A responsive, browser-based creative workspace for animated GIFs, video-to-GIF, motion graphics, sprite sheets, pixel art, typography, texture generation, and sound design.

## Requirements

- Node.js 20+
- npm

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build

```bash
npm run build
npm start
```

## AI image generation

The AI image endpoint uses Replicate. Configure `REPLICATE_API_TOKEN` as a server-side environment variable in your deployment platform. Never commit API tokens to this repository.

## Current status

This repository contains the current application source and bundled GIF encoder assets. The code has been transferred from the development project; a clean production build, end-to-end QA, and Cloudflare deployment still need to be completed.

## Main workspaces

- GIF Creator and video-to-GIF editor
- Motion Maker
- Sprite Sheet Slicer
- Pixel Art Studio
- Typography & Logo Studio
- Texture Studio
- Sound Design Studio
