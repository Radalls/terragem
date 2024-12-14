import { main as engineMain } from '@/engine/main';
import { main as renderMain } from '@/render/main';

import '@/render/styles/app.css';
import '@/render/styles/game.css';
import '@/render/styles/menu.css';
import '@/render/styles/ui.css';

renderMain();
engineMain();
