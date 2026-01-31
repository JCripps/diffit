import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { nightOwlDark, nightOwlLight } from './themes';

// Configure Monaco to use Vite's module workers
self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

// Register Night Owl themes
monaco.editor.defineTheme('night-owl-dark', nightOwlDark);
monaco.editor.defineTheme('night-owl-light', nightOwlLight);

export { monaco };
