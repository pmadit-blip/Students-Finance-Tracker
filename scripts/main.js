// main.js — entry point, wires all modules

import { init } from './state.js';
import {
  initNav, initForm, initSearch, initIO, initSettings, showSection, renderDashboard,
} from './ui.js';

// Bootstrap
init();
initNav();
initForm();
initSearch();
initIO();
initSettings();

// Show dashboard on load
showSection('dashboard');
