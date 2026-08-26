# ADR-005: 3D Avatar Creation Tools & Cross-Platform Pipeline

## Status
**Accepted**

## Context
As Seraphim Unbound expands across Web, Flutter mobile, and Unity HDRP desktop targets, players need customizable 3D avatars that can be created for free, loaded at runtime via URLs, and rigged for tactical incursion animations without manual modeling overhead.

## Decision
Adopt a hybrid **Ready Player Me + VRM / Mixamo** 3D avatar architecture:
1. **Primary Web/Mobile Format:** Ready Player Me (`.glb` / glTF 2.0) for zero-friction web customization and lightweight runtime loading via `<model-viewer>` and Flutter `model_viewer_plus`.
2. **Stylized Seraphim Characters:** VRoid Studio / VRM Consortium (`.vrm`) for anime-style Seraph avatars with spring-bone cloth and wing physics in Unity via `UniVRM`.
3. **Animation Library:** Adobe Mixamo for free automatic skeletal rigging and combat/movement/spellcast motion capture animation retargeting.
4. **Parametric Base Generation:** MakeHuman (FOSS) for anatomical base mesh generation and modular armor prototyping in Blender.
5. **Serialization:** Store operative `avatar_3d_url` in Google Sheets and extend `cards.json` with `visual_asset_3d` gear slot metadata.

## Consequences
### Positive
- **100% Free Tooling:** Zero licensing fees across all creation and animation tools.
- **Cross-Platform Parity:** One `.glb` or `.vrm` model renders seamlessly across Web, Flutter, and Unity.
- **Modular Gear Equipping:** Cards in `cards.json` directly attach 3D armor meshes to avatar skeletal bones.

### Negative / Trade-offs
- WebGL 3D rendering on low-end mobile browsers requires LOD (Level of Detail) optimization and texture compression.
