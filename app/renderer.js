const api = window.consoleAPI;
const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const input = document.getElementById('command');
const openButton = document.getElementById('open');
let active = false, history = [], cursor = 0, fontSize = 15, opening = false, freshSession = false;
function append(text) {
  const follow = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 55;
  if (freshSession) { output.textContent = ''; freshSession = false; }
  output.append(document.createTextNode(text));
  if (follow) terminal.scrollTop = terminal.scrollHeight;
}
openButton.onclick = async () => {
  if (opening) return;
  opening = true;
  try {
    // Do not discard the previous transcript if the folder dialog is canceled.
    freshSession = true;
    const project = await api.openProject();
    if (!project) { freshSession = false; return; }
    active = true; history = []; cursor = 0;
    input.value = ''; input.hidden = false; input.disabled = false;
    openButton.disabled = true;
    document.title = `EzMapMaker — ${project.folder.split(/[\\/]/).pop()}`;
    input.focus();
  } catch (error) { freshSession = false; append(`\n${error.message}\n`); }
  finally { opening = false; }
};
input.addEventListener('keydown', async event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (!active || event.isComposing) return;
    const line = input.value; input.value = ''; input.disabled = true;
    try { await api.command(line); if (line.trim()) history.push(line); cursor = history.length; }
    catch (error) { append(`\n${error.message}\n`); }
    finally { if (active) { input.disabled = false; input.focus({preventScroll:true}); } }
    terminal.scrollTop = terminal.scrollHeight;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault(); cursor = Math.max(0, cursor - 1); input.value = history[cursor] || '';
  } else if (event.key === 'ArrowDown') {
    event.preventDefault(); cursor = Math.min(history.length, cursor + 1); input.value = history[cursor] || '';
  }
});
input.addEventListener('paste', event => {
  // Pasting cannot accidentally execute a series of commands.
  const text = event.clipboardData.getData('text');
  if (/[\r\n]/.test(text)) {
    event.preventDefault(); input.setRangeText(text.replace(/[\r\n]+/g, ' '), input.selectionStart, input.selectionEnd, 'end');
  }
});
terminal.addEventListener('click', () => {
  if (active && !window.getSelection().toString()) input.focus({preventScroll:true});
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && ['+', '=', '-', '0'].includes(event.key)) {
    event.preventDefault();
    fontSize = event.key === '0' ? 15 : Math.max(10, Math.min(28, fontSize + (event.key === '-' ? -1 : 1)));
    document.documentElement.style.setProperty('--console-font-size', `${fontSize}px`);
  }
});
api.onOutput(append);
api.onScreen(text => {
  const follow = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 55;
  const previous = output.textContent;
  if (text.startsWith(previous)) output.append(document.createTextNode(text.slice(previous.length)));
  else output.textContent = text;
  freshSession = false;
  if (follow) terminal.scrollTop = terminal.scrollHeight;
});
api.onEnded(() => { active = false; input.disabled = true; input.hidden = true; openButton.disabled = false; });

const darkMode = document.getElementById('dark-mode');
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  darkMode.setAttribute('aria-pressed', String(dark));
  darkMode.textContent = dark ? 'Light mode' : 'Dark mode';
}
let savedTheme;
try { savedTheme = localStorage.getItem('ezmapmaker-theme'); } catch {}
applyTheme(savedTheme === 'dark');
darkMode.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  applyTheme(dark);
  try { localStorage.setItem('ezmapmaker-theme', dark ? 'dark' : 'light'); } catch {}
});

const aboutDialog = document.getElementById('about-dialog');
const aboutButton = document.getElementById('about');
const copyStatus = document.getElementById('copy-status');
aboutButton.addEventListener('click', async () => {
  copyStatus.textContent = '';
  if (!aboutDialog.open) aboutDialog.showModal();
  try {
    const info = await api.appInfo();
    document.getElementById('about-version').textContent = `Version ${info.version}`;
    document.getElementById('citation').textContent = info.citation;
  } catch { copyStatus.textContent = 'Version information could not be loaded.'; }
});
document.getElementById('close-about').addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', event => {
  if (event.target !== aboutDialog) return;
  const box = aboutDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) aboutDialog.close();
});
document.getElementById('copy-citation').addEventListener('click', async () => {
  try { await api.copyCitation(); copyStatus.textContent = 'Citation copied.'; }
  catch { copyStatus.textContent = 'Could not copy. Select the citation and copy it manually.'; }
});

document.getElementById('mapmaker-source').addEventListener('click', async event => {
  event.preventDefault();
  try { await api.openMapmakerSource(); }
  catch { copyStatus.textContent = 'Could not open the link. Visit github.com/kentavv/mapmaker in your browser.'; }
});
