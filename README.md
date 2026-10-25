# Form / Quick 3D Viewer

A local GLB review workspace built with Three.js.

## Run it

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173/> in a browser. Imported `.glb` files are copied into the project’s `models/` folder and shown in the library on later runs.

Drop a GLB anywhere in the window to import it and place it in the scene. Double-click a library item or use its `+` button to add another instance. Click a model to select it; use Delete to remove it from the scene. Models with animation clips get an animation picker and play button.
