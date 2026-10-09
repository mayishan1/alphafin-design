// Local-only component demos. No API, upload, publishing, billing or auth requests.
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const anchoredDialogs = new Set(['filter-dialog', 'actions-dialog', 'account-dialog']);
function positionPopover(dialog, anchor) {
  const rect = anchor.getBoundingClientRect();
  const width = dialog.offsetWidth, height = dialog.offsetHeight;
  dialog.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
  const top = rect.bottom + 6 + height <= window.innerHeight - 8 ? rect.bottom + 6 : rect.top - height - 6;
  dialog.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
}
function openDialog(id, anchor) {
  const target = document.getElementById(id);
  if (!(target instanceof HTMLDialogElement) || target.open) return;
  if (anchor && anchoredDialogs.has(id)) {
    target.classList.add('anchored-popover');
    Motion.openDialog(target);
    positionPopover(target, anchor);
    anchor.setAttribute('aria-expanded', 'true');
    target.addEventListener('close', () => anchor.setAttribute('aria-expanded', 'false'), {once: true});
  } else Motion.openDialog(target);
}
$$('[data-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.dialog, button)));
anchoredDialogs.forEach(id => {
  const dialog = document.getElementById(id);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) Motion.closeDialog(dialog);
  });
});
window.addEventListener('resize', () => $$('.anchored-popover[open]').forEach(dialog => dialog.close()));
window.addEventListener('scroll', event => {
  $$('.anchored-popover[open]').forEach(dialog => {
    if (!(event.target instanceof Node) || !dialog.contains(event.target)) Motion.closeDialog(dialog);
  });
}, true);
$$('[data-close]').forEach(button => button.addEventListener('click', () => Motion.closeDialog(button.closest('dialog'))));
function notify(message, tone = 'success', undo = false) {
  const region = $('#toast-region');
  const toast = document.createElement('div');
  toast.className = `catalog-toast ${tone === 'error' ? 'error' : ''}`;
  const dot = document.createElement('span');
  dot.className = 'toast-dot'; dot.textContent = tone === 'error' ? '!' : '✓'; dot.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span'); text.className = 'grow'; text.textContent = message;
  toast.append(dot, text);
  if (undo) {
    const button = document.createElement('button');
    button.className = 'af-btn quiet small'; button.textContent = '撤销';
    button.addEventListener('click', () => { text.textContent = '演示操作已撤销'; button.remove(); });
    toast.append(button);
  }
  const close = document.createElement('button');
  close.className = 'af-btn quiet icon'; close.textContent = '×'; close.setAttribute('aria-label', '关闭提示');
  close.addEventListener('click', async () => { await Motion.hide(toast); toast.remove(); }); toast.append(close);
  region.replaceChildren(toast);
}
$$('[data-notify]').forEach(button => button.addEventListener('click', () => notify(button.dataset.notify, button.dataset.tone, button.dataset.undo === 'true')));
$('#catalog-search').addEventListener('input', event => {
  const query = event.target.value.trim().toLocaleLowerCase();
  let count = 0;
  $$('.catalog-item').forEach(item => { item.hidden = !item.dataset.search.toLocaleLowerCase().includes(query); if (!item.hidden) count++; });
  $('#catalog-count').textContent = count ? `找到 ${count} 组组件样例` : '没有匹配的组件，试试「上传」「音频」或「Dialog」。';
});
$('#toggle-password').addEventListener('click', event => {
  const show = $('#demo-password').type === 'password';
  $('#demo-password').type = show ? 'text' : 'password';
  event.currentTarget.textContent = show ? '隐藏' : '显示'; event.currentTarget.setAttribute('aria-pressed', String(show));
});
[['post-title', 'title-count', 20], ['post-body', 'body-count', 700]].forEach(([id, output, limit]) => {
  document.getElementById(id).addEventListener('input', event => { document.getElementById(output).textContent = `${event.target.value.length} / ${limit}`; });
});
function syncOutputChecks() {
  const boxes = $$('.output-check'), count = boxes.filter(box => box.checked).length;
  $('#group-checkbox').checked = count === boxes.length;
  $('#group-checkbox').indeterminate = count > 0 && count < boxes.length;
}
$('#group-checkbox').addEventListener('change', event => { $$('.output-check').forEach(box => { box.checked = event.target.checked; }); syncOutputChecks(); });
$$('.output-check').forEach(box => box.addEventListener('change', syncOutputChecks)); syncOutputChecks();
let selectedResources = [];
function renderResourceChips() {
  $('#resource-selection').textContent = selectedResources.length ? `已选择 ${selectedResources.length} 项` : '选择资源';
  const chips = selectedResources.map(name => {
    const chip = document.createElement('span'); chip.className = 'chip';
    const text = document.createElement('span'); text.textContent = name;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `移除${name}`);
    remove.addEventListener('click', async () => { remove.disabled = true; await Motion.hide(chip); selectedResources = selectedResources.filter(value => value !== name); renderResourceChips(); $('#resource-selection').closest('button').focus(); });
    chip.append(text, remove); return chip;
  });
  $('#resource-chips').replaceChildren(...chips);
}
$('[data-dialog="resource-dialog"]').addEventListener('click', () => {
  $$('.resource-check').forEach(box => { box.checked = selectedResources.includes(box.value); });
  $('#resource-search').value = ''; filterResources(); $('#resource-search').focus();
});
function filterResources() {
  const query = $('#resource-search').value.trim(); let count = 0;
  $$('#resource-dialog .resource-row').forEach(row => { row.hidden = !row.textContent.includes(query); if (!row.hidden) count++; });
  $('#resource-empty').hidden = count !== 0;
}
$('#resource-search').addEventListener('input', filterResources);
$('#resource-confirm').addEventListener('click', () => { selectedResources = $$('.resource-check:checked').map(box => box.value); renderResourceChips(); Motion.closeDialog($('#resource-dialog')); });
$('#speed-range').addEventListener('input', event => { $('#speed-value').textContent = `${Number(event.target.value).toFixed(1)}×`; });
function clampCount(value) { return Math.min(20, Math.max(1, Number(value) || 1)); }
function updateCount(value) { const count = clampCount(value); $('#count-number').value = count; $('#count-minus').disabled = count === 1; $('#count-plus').disabled = count === 20; }
$('#count-minus').addEventListener('click', () => updateCount(Number($('#count-number').value) - 1));
$('#count-plus').addEventListener('click', () => updateCount(Number($('#count-number').value) + 1));
$('#count-number').addEventListener('input', event => { const value = Number(event.target.value); $('#count-minus').disabled = value <= 1; $('#count-plus').disabled = value >= 20; });
$('#count-number').addEventListener('change', event => updateCount(event.target.value)); updateCount(4);
// Calendar is custom; the browser's platform date popup is never used.
const dateParts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone:'Asia/Shanghai', year:'numeric', month:'numeric', day:'numeric' }).formatToParts(new Date()).map(part => [part.type, part.value]));
const today = new Date(Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day)));
let calendarMonth = new Date(today), chosenDate = new Date(today);
function dateKey(date) { return date.toISOString().slice(0, 10); }
function renderCalendar() {
  const y = calendarMonth.getUTCFullYear(), m = calendarMonth.getUTCMonth();
  $('#calendar-month').textContent = `${y} 年 ${m + 1} 月`;
  const nodes = ['日', '一', '二', '三', '四', '五', '六'].map(day => { const el = document.createElement('span'); el.className = 'weekday'; el.textContent = day; return el; });
  for (let index = 0; index < new Date(Date.UTC(y,m,1)).getUTCDay(); index++) nodes.push(document.createElement('span'));
  const days = new Date(Date.UTC(y,m+1,0)).getUTCDate();
  for (let day = 1; day <= days; day++) {
    const date = new Date(Date.UTC(y,m,day)), key = dateKey(date), button = document.createElement('button');
    button.type = 'button'; button.textContent = day; button.dataset.date = key;
    button.setAttribute('aria-label', `${y}年${m+1}月${day}日`); button.setAttribute('aria-pressed', String(key === dateKey(chosenDate)));
    button.addEventListener('click', () => { chosenDate = date; renderCalendar(); $(`#calendar-days [data-date="${key}"]`).focus(); }); nodes.push(button);
  }
  $('#calendar-days').replaceChildren(...nodes);
}
$('#month-prev').addEventListener('click', () => { calendarMonth = new Date(Date.UTC(calendarMonth.getUTCFullYear(),calendarMonth.getUTCMonth()-1,1)); renderCalendar(); });
$('#month-next').addEventListener('click', () => { calendarMonth = new Date(Date.UTC(calendarMonth.getUTCFullYear(),calendarMonth.getUTCMonth()+1,1)); renderCalendar(); });
$('#date-today').addEventListener('click', () => { calendarMonth = new Date(today); chosenDate = new Date(today); renderCalendar(); });
$('#date-confirm').addEventListener('click', () => {
  const hour = $('#schedule-hour').value, minute = $('#schedule-minute').value;
  if (hour === '' || minute === '' || !Number.isInteger(Number(hour)) || !Number.isInteger(Number(minute)) || Number(hour)<0 || Number(hour)>23 || Number(minute)<0 || Number(minute)>59) { $('#date-error').textContent = '请输入有效时间：小时 0–23，分钟 0–59。'; return; }
  $('#schedule-value').textContent = `${dateKey(chosenDate)} ${hour.padStart(2,'0')}:${minute.padStart(2,'0')}`;
  $('#date-error').textContent = '时间按 Asia/Shanghai 展示，仅为样式演示。'; Motion.closeDialog($('#date-dialog'));
}); renderCalendar();
$$('.demo-nav button').forEach(button => button.addEventListener('click', () => { $$('.demo-nav button').forEach(el => { el.classList.toggle('active', el===button); el.removeAttribute('aria-current'); }); button.setAttribute('aria-current','page'); }));
$$('[data-segment]').forEach(button => button.addEventListener('click', () => { $$('[data-segment]').forEach(el => { el.classList.toggle('active',el===button); el.setAttribute('aria-pressed',String(el===button)); }); $('#segment-result').textContent = `当前：${button.dataset.segment}视图`; }));
$$('.tree-demo button').forEach(button => button.addEventListener('click', () => { $$('.tree-demo button').forEach(el => { el.classList.toggle('active',el===button); el.setAttribute('aria-pressed',String(el===button)); }); $('#folder-selected').textContent = `当前文件夹：${button.childNodes[0].textContent.trim()}`; }));
const tasks = [
  {id:1,name:'产品介绍 · 第一版',state:'已完成',time:'今天 10:24'},
  {id:2,name:'品牌故事配音',state:'失败',time:'今天 10:18'},
  {id:3,name:'每周内容计划',state:'处理中',time:'今天 10:10'},
  {id:4,name:'新品发布视频',state:'草稿',time:'昨天 16:30'},
  {id:5,name:'活动预热图文',state:'已完成',time:'昨天 15:22'},
  {id:6,name:'产品说明补充',state:'失败',time:'昨天 14:05'},
  {id:7,name:'品牌短片',state:'已完成',time:'昨天 11:10'}
];
let tablePage = 1, tableFilter = '全部', ascending = false;
const tableSelection = new Set();
function tableData() {
  let rows = tasks.filter(task => (tableFilter==='全部' || task.state===tableFilter) && task.name.includes($('#table-search').value.trim()));
  if (ascending) rows = [...rows].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
  return rows;
}
function renderTable() {
  const data = tableData(), pages = Math.max(1, Math.ceil(data.length/4)); tablePage = Math.min(tablePage,pages);
  const current = data.slice((tablePage-1)*4,tablePage*4);
  const rows = current.map(task => {
    const tr = document.createElement('tr'); tr.dataset.selected = String(tableSelection.has(task.id));
    const checkCell = document.createElement('td'), check = document.createElement('input'); check.type='checkbox'; check.className='af-check'; check.checked=tableSelection.has(task.id); check.setAttribute('aria-label', `选择${task.name}`);
    check.addEventListener('change',()=>{ if(check.checked)tableSelection.add(task.id);else tableSelection.delete(task.id);renderTable(); const replacement = Array.from($('#task-rows').querySelectorAll('input')).find(el=>el.getAttribute('aria-label')===`选择${task.name}`); replacement?.focus(); }); checkCell.append(check);
    const name = document.createElement('td'); name.textContent=task.name;
    const status = document.createElement('td'), badge=document.createElement('span'); badge.className=`af-badge ${task.state==='已完成'?'success':task.state==='处理中'?'info':task.state==='失败'?'warning':''}`;badge.textContent=task.state;status.append(badge);
    const time=document.createElement('td');time.textContent=task.time;
    const action=document.createElement('td'), detail=document.createElement('button');detail.className='af-btn small';detail.textContent='查看';detail.addEventListener('click',()=>{$('#task-detail-name').textContent=task.name;$('#task-detail-state').textContent=task.state;openDialog('task-detail-dialog');});action.append(detail);
    tr.append(checkCell,name,status,time,action);return tr;
  });
  if (!rows.length) { const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='没有匹配的任务，请调整关键词或筛选条件。';td.style.padding='28px 12px';tr.append(td);rows.push(tr); }
  $('#task-rows').replaceChildren(...rows);
  $('#page-summary').textContent=`共 ${data.length} 项 · 已选 ${tableSelection.size} 项`;
  $('#page-number').textContent=`${tablePage} / ${pages}`;
  $('#page-prev').disabled=tablePage===1;$('#page-next').disabled=tablePage===pages;
  const checked=current.filter(task=>tableSelection.has(task.id)).length;
  $('#table-check-all').checked=current.length>0&&checked===current.length;$('#table-check-all').indeterminate=checked>0&&checked<current.length;$('#table-check-all').disabled=!current.length;
  $('#batch-bar').hidden=tableSelection.size===0;$('#batch-count').textContent=`已选择 ${tableSelection.size} 项`;
}
$('#table-search').addEventListener('input',()=>{tablePage=1;renderTable();});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{tableFilter=button.dataset.filter;tablePage=1;$$('[data-filter]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});renderTable();}));
$('#sort-name').addEventListener('click',()=>{ascending=!ascending;$('#sort-name').textContent=ascending?'任务名称 ↑':'任务名称 ↕';$('#sort-name').closest('th').setAttribute('aria-sort',ascending?'ascending':'none');renderTable();});
$('#table-check-all').addEventListener('change',event=>{tableData().slice((tablePage-1)*4,tablePage*4).forEach(task=>{if(event.target.checked)tableSelection.add(task.id);else tableSelection.delete(task.id);});renderTable();});
$('#page-prev').addEventListener('click',()=>{tablePage--;renderTable();});$('#page-next').addEventListener('click',()=>{tablePage++;renderTable();});
$('#clear-selection').addEventListener('click',()=>{tableSelection.clear();renderTable();$('#table-check-all').focus();});
$('#batch-preview').addEventListener('click',()=>notify(`已预览 ${tableSelection.size} 项的批量操作，没有修改业务数据`));renderTable();
$('#create-demo').addEventListener('submit',event=>{event.preventDefault();const input=$('#create-name');if(!input.value.trim()){$('#create-error').textContent='请输入任务名称';input.setAttribute('aria-invalid','true');input.focus();return;}input.removeAttribute('aria-invalid');$('#create-error').textContent='';Motion.closeDialog($('#create-dialog'));notify(`已保存演示任务「${input.value.trim()}」，未提交后台`);});
function setInline(open){Motion.reveal($('#inline-settings'),open);$('#inline-toggle').setAttribute('aria-expanded',String(open));}
$('#inline-toggle').addEventListener('click',()=>setInline($('#inline-toggle').getAttribute('aria-expanded')!=='true'));$('#inline-close').addEventListener('click',()=>{setInline(false);$('#inline-toggle').focus();});
$('#drawer-search').addEventListener('input',event=>{let count=0;$$('#drawer-resources .resource-row').forEach(row=>{row.hidden=!row.textContent.includes(event.target.value.trim());if(!row.hidden)count++;});$('#drawer-empty').hidden=count>0;});
$('#drawer-apply').addEventListener('click',()=>{const count=$$('#drawer-resources input:checked').length;Motion.closeDialog($('#library-drawer'));notify(`已应用 ${count} 项示例素材`);});
$$('.tip-wrap,.hover-person').forEach(el=>{el.addEventListener('keydown',event=>{if(event.key==='Escape')el.classList.add('dismissed');});el.addEventListener('pointerenter',()=>el.classList.remove('dismissed'));el.addEventListener('focusin',()=>el.classList.remove('dismissed'));});
$('#filter-reset').addEventListener('click',()=>$$('.filter-check').forEach(box=>{box.checked=false;}));
$('#filter-apply').addEventListener('click',()=>{const labels=$$('.filter-check:checked').map(box=>box.value);$('#filter-summary').textContent=`当前：${labels.join('、')||'全部内容'}`;Motion.closeDialog($('#filter-dialog'));});
let progressTimer;
function stopProgress(cancelled=false){clearInterval(progressTimer);progressTimer=undefined;$('#progress-start').disabled=false;$('#progress-cancel').disabled=true;$('#progress-start').textContent='重新演示';$('#demo-progress-label').textContent=cancelled?'已取消演示，未创建任务':'演示完成';}
$('#progress-start').addEventListener('click',()=>{clearInterval(progressTimer);let value=0;$('#demo-progress').value=0;$('#demo-progress-value').textContent='0%';$('#demo-progress-label').textContent='正在生成素材（本地计时演示）';$('#progress-start').disabled=true;$('#progress-start').textContent='处理中…';$('#progress-cancel').disabled=false;progressTimer=setInterval(()=>{value=Math.min(100,value+10);$('#demo-progress').value=value;$('#demo-progress-value').textContent=`${value}%`;if(value===100)stopProgress();},220);});
$('#progress-cancel').addEventListener('click',()=>{stopProgress(true);$('#progress-start').focus();});
const emptyStates={empty:['还没有作品','创建第一个任务，作品将在这里显示。','新建任务'],search:['没有匹配的结果','试试更短的关键词，或清除当前筛选条件。','清除筛选'],error:['内容加载失败','网络暂时不可用，已有内容不会丢失。','重试'],permission:['暂时没有访问权限','联系管理员为当前账号开通此功能。','查看权限说明']};
let emptyMode='empty';
$$('[data-empty]').forEach(button=>button.addEventListener('click',()=>{emptyMode=button.dataset.empty;const [title,body,action]=emptyStates[emptyMode];$('#empty-title').textContent=title;$('#empty-body').textContent=body;$('#empty-action').textContent=action;$$('[data-empty]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});}));
$('#empty-action').addEventListener('click',()=>{if(emptyMode==='empty')openDialog('create-dialog');else if(emptyMode==='permission')openDialog('auth-dialog');else notify(emptyMode==='error'?'已预览重试反馈，未请求服务器':'已预览清除筛选反馈');});
let uploads=[],nextUploadId=1;const uploadTimers=new Map();
function renderUploads(){const rows=uploads.map(file=>{const row=document.createElement('div');row.className='file-line';row.dataset.uploadId=String(file.id);const icon=document.createElement('span');icon.className='file-icon';icon.textContent=file.name.split('.').pop().slice(0,4).toUpperCase();const body=document.createElement('span');body.className='grow';const name=document.createElement('strong');name.textContent=file.name;const state=document.createElement('small');state.textContent=file.progress===100?'本地演示完成 · 未上传服务器':`模拟处理 ${file.progress}%`;body.append(name,state);const progress=document.createElement('progress');progress.className='af-progress';progress.max=100;progress.value=file.progress;progress.setAttribute('aria-label',`${file.name}模拟处理进度`);body.append(progress);const remove=document.createElement('button');remove.className='af-btn quiet icon';remove.textContent='×';remove.setAttribute('aria-label',`移除文件${file.name}`);remove.addEventListener('click',async()=>{remove.disabled=true;clearInterval(uploadTimers.get(file.id));uploadTimers.delete(file.id);await Motion.reveal(row,false);uploads=uploads.filter(item=>item.id!==file.id);renderUploads();$('#dropzone').focus();});row.append(icon,body,remove);return row;});$('#upload-files').replaceChildren(...rows);}
function addFiles(files){const errors=[];for(const file of Array.from(files)){if(file.size>10*1024*1024){errors.push(`${file.name} 超过10MB`);continue;}if(!/\.(png|jpe?g|pdf)$/i.test(file.name)){errors.push(`${file.name} 格式不支持`);continue;}const entry={id:nextUploadId++,name:file.name,progress:0};uploads.push(entry);const timer=setInterval(()=>{entry.progress=Math.min(100,entry.progress+25);if(entry.progress===100){clearInterval(timer);uploadTimers.delete(entry.id);}const row=$('#upload-files').querySelector(`[data-upload-id="${entry.id}"]`);if(row){row.querySelector('small').textContent=entry.progress===100?'本地演示完成 · 未上传服务器':`模拟处理 ${entry.progress}%`;row.querySelector('progress').value=entry.progress;}},240);uploadTimers.set(entry.id,timer);}$('#upload-error').textContent=errors.join('；');renderUploads();}
$('#dropzone').addEventListener('click',()=>$('#catalog-file').click());
$('#catalog-file').addEventListener('change',event=>{addFiles(event.target.files);event.target.value='';});
['dragenter','dragover'].forEach(type=>$('#dropzone').addEventListener(type,event=>{event.preventDefault();$('#dropzone').classList.add('dragover');}));
$('#dropzone').addEventListener('dragleave',()=>$('#dropzone').classList.remove('dragover'));
$('#dropzone').addEventListener('drop',event=>{event.preventDefault();$('#dropzone').classList.remove('dragover');addFiles(event.dataTransfer.files);});
$('#sample-upload-button').addEventListener('click',()=>addFiles([{name:'品牌说明.pdf',size:2400000}]));
$$('.selectable-assets .asset-tile').forEach(button=>button.addEventListener('click',()=>{button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));$('#asset-count').textContent=`已选 ${$$('.selectable-assets [aria-pressed=true]').length} 项`;}));
let demoAudio, audioUrl;
function makeDemoAudio(){const rate=16000,seconds=4,samples=rate*seconds,buffer=new ArrayBuffer(44+samples*2),view=new DataView(buffer);const str=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};str(0,'RIFF');view.setUint32(4,36+samples*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples*2,true);for(let i=0;i<samples;i++){const t=i/rate,phase=t%1,fade=Math.max(0,1-phase*2),frequency=[261.63,329.63,392,523.25][Math.floor(t)];view.setInt16(44+i*2,Math.sin(2*Math.PI*frequency*t)*fade*fade*6000,true);}audioUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));demoAudio=new Audio(audioUrl);demoAudio.volume=Number($('#audio-volume').value);demoAudio.addEventListener('timeupdate',()=>{$('#audio-seek').value=demoAudio.currentTime;$('#audio-time').textContent=`0:0${Math.floor(demoAudio.currentTime)} / 0:04`;});demoAudio.addEventListener('ended',()=>{$('#audio-play').textContent='▶';$('#audio-play').setAttribute('aria-label','播放演示提示音');$('#audio-status').textContent='演示提示音播放完成';});}
$('#audio-play').addEventListener('click',async()=>{if(!demoAudio)makeDemoAudio();if(demoAudio.paused){if(demoAudio.ended)demoAudio.currentTime=0;try{await demoAudio.play();$('#audio-play').textContent='Ⅱ';$('#audio-play').setAttribute('aria-label','暂停演示提示音');$('#audio-status').textContent='正在播放本地演示提示音';}catch{$('#audio-status').textContent='浏览器阻止了播放，请再次点击播放。';}}else{demoAudio.pause();$('#audio-play').textContent='▶';$('#audio-play').setAttribute('aria-label','播放演示提示音');$('#audio-status').textContent='已暂停';}});
$('#audio-seek').addEventListener('input',event=>{if(!demoAudio)makeDemoAudio();demoAudio.currentTime=Number(event.target.value);});$('#audio-volume').addEventListener('input',event=>{if(demoAudio)demoAudio.volume=Number(event.target.value);});
window.addEventListener('pagehide',()=>{demoAudio?.pause();if(audioUrl)URL.revokeObjectURL(audioUrl);clearInterval(progressTimer);uploadTimers.forEach(clearInterval);});
$$('[data-canvas]').forEach(button=>button.addEventListener('click',()=>{$('#video-canvas').className=`video-canvas ${button.dataset.canvas}`;$$('[data-canvas]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});}));
const shotDrafts={1:'柔和自然光下的产品特写',2:'镜头推进，展示产品材质与细节',3:'品牌标志居中，画面留白'};let currentShot='1';
$$('[data-shot]').forEach(button=>button.addEventListener('click',()=>{shotDrafts[currentShot]=$('#shot-prompt').value;currentShot=button.dataset.shot;$('#shot-prompt').value=shotDrafts[currentShot];$('#shot-title').textContent=`第 ${currentShot} 镜提示词`;$('#video-caption').textContent=`第 ${currentShot} 段 · 场景示例`;$('#shot-state').textContent='就绪 · 5.0 秒';$$('[data-shot]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});}));
$('#shot-save').addEventListener('click',()=>{shotDrafts[currentShot]=$('#shot-prompt').value;$('#shot-state').textContent='已保存本页草稿 · 未生成媒体';});
$$('.persona-choice').forEach(button=>button.addEventListener('click',()=>{$$('.persona-choice').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});}));
$('#retry-task').addEventListener('click',()=>{$('#retry-copy').textContent='正在重试（演示）…';$('#retry-task').disabled=true;setTimeout(()=>{$('#retry-copy').textContent='重试演示完成，未请求真实服务';$('#retry-task').disabled=false;notify('重试状态已演示');},800);});
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();const text=$('#chat-input').value.trim();if(!text)return;const user=document.createElement('div');user.className='chat-message user';user.textContent=text;const reply=document.createElement('div');reply.className='chat-message assistant';reply.textContent='消息已在本页显示。这是交互演示，未发送给模型。';$('#chat-log').append(user,reply);$('#chat-input').value='';reply.scrollIntoView({block:'nearest'});});
$('#publish-receipt').addEventListener('click',async()=>{await Motion.closeDialog($('#publish-dialog'));openDialog('receipt-dialog');});
$('#signin-demo').addEventListener('submit',event=>{event.preventDefault();const email=$('#signin-email'),password=$('#signin-password');email.removeAttribute('aria-invalid');password.removeAttribute('aria-invalid');if(!email.value.trim()||!email.validity.valid){email.setAttribute('aria-invalid','true');$('#signin-error').textContent='请输入有效的示例邮箱';email.focus();return;}if(!password.value){password.setAttribute('aria-invalid','true');$('#signin-error').textContent='请输入示例密码';password.focus();return;}$('#signin-error').textContent='';password.value='';notify('表单校验通过，没有发起登录请求');});

$('#reduce-motion').addEventListener('change', event => {
  document.documentElement.dataset.motion = event.target.checked ? 'reduced' : 'full';
  syncMotionPreference();
  $('#motion-status').textContent = Motion.reduced ? '已减少动态效果，状态切换即时完成。' : '标准动画已开启。';
});
let motionReplay = 0;
$('#motion-replay').addEventListener('click', async () => {
  const run = ++motionReplay;
  const card = $('#motion-demo-card');
  if (Motion.reduced) { card.hidden = false; $('#motion-status').textContent = '减少动态效果已生效；直接展示最终状态。'; return; }
  $('#motion-status').textContent = '淡出 → 轻移进入';
  await Motion.hide(card);
  if (run !== motionReplay) return;
  await Motion.enter(card);
  if (run === motionReplay) $('#motion-status').textContent = '演示完成。实际组件使用同一组动画节奏。';
});

// Specialized full-site patterns. Each interaction stays within the specimen.
function fullFeedback(element, message) {
  const target = element.closest('.full-sample')?.querySelector('.full-local-feedback');
  if (target) { target.textContent = message; Motion.enter(target); }
}
$$('[data-local-save]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); fullFeedback(button, button.dataset.localSave); }));
$$('[data-scenario]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.full-sample');
  card.querySelectorAll('[data-scenario]').forEach(item => item.setAttribute('aria-pressed',String(item===button)));
  const output = card.querySelector('.full-state-output');
  output.textContent = button.dataset.scenario;
  output.dataset.tone = /失败|失效|不足|不一致|不可用|错误/.test(button.textContent) ? 'error' : /成功|完成/.test(button.textContent) ? 'success' : 'info';
  Motion.enter(output);
}));
$$('[data-toggle-label]').forEach(button => { const original = button.textContent;button.addEventListener('click',()=>{const selected=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(selected));button.textContent=selected?button.dataset.toggleLabel:original;}); });
$$('[data-reset-text]').forEach(button => button.addEventListener('click',()=>{button.closest('.full-sample').querySelector('textarea').value=button.dataset.resetText;fullFeedback(button,'已恢复示例文稿。');}));
$$('[data-add-list]').forEach(form=>form.addEventListener('submit',event=>{
  event.preventDefault();const input=form.querySelector('input');const value=input.value.trim();
  if(!value){input.setAttribute('aria-invalid','true');fullFeedback(form,'请填写名称后添加。');input.focus();return;}
  input.removeAttribute('aria-invalid');const list=document.getElementById(form.dataset.addList);
  const row=document.createElement('div');row.className='file-line';const name=document.createElement('strong');name.className='grow';name.textContent=value;
  const remove=document.createElement('button');remove.type='button';remove.className='af-btn small';remove.textContent='移除';remove.setAttribute('aria-label',`移除${value}`);
  remove.addEventListener('click',async()=>{remove.disabled=true;await Motion.reveal(row,false);row.remove();input.focus();});row.append(name,remove);list.append(row);Motion.enter(row);input.value='';fullFeedback(form,'已添加到本页示例列表。');
}));
$$('[data-chart]').forEach(button=>button.addEventListener('click',()=>{
  const monthly=button.dataset.chart==='30';$('#metric-value').textContent=monthly?'48,920':'12,840';
  $('#chart-line').setAttribute('points',monthly?'20,125 110,110 200,75 290,92 380,48 470,54 580,18':'20,120 110,90 200,98 290,55 380,72 470,35 580,20');
  $('#chart-data').textContent=monthly?'30 日分段示例：420、510、680、610、880、850、1040 次观看。':'7 日示例：120、180、164、250、216、290、320 次观看。';
  $$('[data-chart]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));Motion.enter($('#chart-line'));
}));
$$('[data-wizard]').forEach(button=>button.addEventListener('click',()=>{
  const card=button.closest('.full-sample'),steps=Array.from(card.querySelectorAll('[data-step]'));let index=steps.findIndex(step=>step.classList.contains('current'));
  index=Math.max(0,Math.min(steps.length-1,index+Number(button.dataset.wizard)));steps.forEach((step,i)=>{step.classList.toggle('current',i===index);if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});
  fullFeedback(button,`当前步骤：${steps[index].textContent.replace(/^\d+/,'')}。这是步骤状态演示，已填写内容保留。`);
}));
function syncSortButtons(){const list=$$('#outline-pages li');list.forEach((item,index)=>{item.querySelector('[data-move="-1"]').disabled=index===0;item.querySelector('[data-move="1"]').disabled=index===list.length-1;});}
$$('[data-move]').forEach(button=>button.addEventListener('click',()=>{const row=button.closest('li');const direction=Number(button.dataset.move);const sibling=direction<0?row.previousElementSibling:row.nextElementSibling;if(!sibling)return;if(direction<0)sibling.before(row);else sibling.after(row);syncSortButtons();Motion.enter(row);fullFeedback(button,'页面顺序已调整，正文内容保持。');const target=row.querySelector(`[data-move="${-direction}"]`);target.focus();}));syncSortButtons();
let editableRowId=1;
function createEditableRow(value=''){
 const row=document.createElement('tr');const id=++editableRowId;
 for(let i=0;i<5;i++)row.append(document.createElement('td'));
 const check=document.createElement('input');check.type='checkbox';check.className='af-check';check.setAttribute('aria-label',`选择第${id}行`);row.children[0].append(check);
 const input=document.createElement('input');input.className='af-field';input.value=value;input.placeholder='输入图片描述';input.setAttribute('aria-label',`第${id}行图片描述`);row.children[1].append(input);
 row.children[2].textContent='3:4 · PNG';row.children[3].textContent='草稿';
 const copy=document.createElement('button');copy.type='button';copy.className='af-btn small';copy.dataset.duplicateRow='';copy.textContent='复制行';const remove=document.createElement('button');remove.type='button';remove.className='af-btn small';remove.dataset.removeRow='';remove.textContent='移除行';row.children[4].append(copy,remove);return row;
}
$('#add-edit-row').addEventListener('click',()=>{const row=createEditableRow();$('#editable-rows').append(row);row.querySelector('.af-field').focus();});
$('#editable-rows').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const row=button.closest('tr');if(button.hasAttribute('data-duplicate-row')){const copy=createEditableRow(row.querySelector('.af-field').value);row.after(copy);copy.querySelector('.af-field').focus();}else if(button.hasAttribute('data-remove-row')){row.remove();$('#add-edit-row').focus();}});
let recordTimer,recordSeconds=0;
function stopRecord(){clearInterval(recordTimer);recordTimer=undefined;$('#record-start').disabled=false;$('#record-stop').disabled=true;$('#record-dot').classList.remove('recording');$('#record-label').textContent='已停止 · 未录制实际音频';}
$('#record-start').addEventListener('click',()=>{clearInterval(recordTimer);recordSeconds=0;$('#record-time').textContent='00:00';$('#record-start').disabled=true;$('#record-stop').disabled=false;$('#record-dot').classList.add('recording');$('#record-label').textContent='录音计时演示中';recordTimer=setInterval(()=>{recordSeconds++;$('#record-time').textContent=`${String(Math.floor(recordSeconds/60)).padStart(2,'0')}:${String(recordSeconds%60).padStart(2,'0')}`;if(recordSeconds===60)stopRecord();},1000);});
$('#record-stop').addEventListener('click',stopRecord);window.addEventListener('pagehide',()=>clearInterval(recordTimer));
$('#pack-title').addEventListener('input',event=>{const lines=event.target.value.split('\n');$('#pack-title-preview').textContent=lines.slice(0,2).join('\n');event.target.setAttribute('aria-invalid',String(lines.length>2));fullFeedback(event.target,lines.length>2?'主标题超过2行，预览仅显示前两行，请缩短。':'标题预览已更新。');});
$('#watermark-text').addEventListener('input',event=>$('#watermark-preview').textContent=event.target.value);
$('#watermark-color').addEventListener('input',event=>$('#watermark-preview').style.color=event.target.value);
$('#bgm-volume').addEventListener('input',event=>$('#bgm-level').textContent=`${event.target.value}%`);$('#bgm-enabled').addEventListener('change',event=>$('#bgm-volume').disabled=!event.target.checked);
let blocks=[5,5,5],activeBlock=0;const blockHistory=[];
function renderBlocks(){const buttons=blocks.map((duration,index)=>{const button=document.createElement('button');button.type='button';button.dataset.block=String(index);button.classList.toggle('active',index===activeBlock);button.setAttribute('aria-pressed',String(index===activeBlock));button.textContent=`镜头 ${index+1} · ${duration} 秒`;button.style.flexGrow=String(duration);return button;});$('#full-timeline').replaceChildren(...buttons);$('#block-info').textContent=`已选择镜头 ${activeBlock+1} · ${blocks[activeBlock]} 秒；总时长 ${blocks.reduce((a,b)=>a+b,0)} 秒。重新生成后生效。`;$('#split-block').disabled=blocks[activeBlock]<2;$('#merge-block').disabled=activeBlock===blocks.length-1;$('#undo-block').disabled=!blockHistory.length;}
$('#full-timeline').addEventListener('click',event=>{const button=event.target.closest('[data-block]');if(!button)return;activeBlock=Number(button.dataset.block);renderBlocks();$('#full-timeline').children[activeBlock].focus();});
$('#full-zoom').addEventListener('input',event=>$('#full-timeline').style.width=`${Number(event.target.value)*100}%`);
$('#split-block').addEventListener('click',()=>{if(blocks[activeBlock]<2)return;blockHistory.push({blocks:[...blocks],activeBlock});const half=Number((blocks[activeBlock]/2).toFixed(3));blocks.splice(activeBlock,1,half,blocks[activeBlock]-half);renderBlocks();});
$('#merge-block').addEventListener('click',()=>{if(activeBlock>=blocks.length-1)return;blockHistory.push({blocks:[...blocks],activeBlock});blocks.splice(activeBlock,2,blocks[activeBlock]+blocks[activeBlock+1]);renderBlocks();});
$('#undo-block').addEventListener('click',()=>{const state=blockHistory.pop();if(!state)return;blocks=state.blocks;activeBlock=state.activeBlock;renderBlocks();});renderBlocks();
$('#retry-shot').addEventListener('click',()=>{$('#shot-recovery-status').textContent='3 / 3 镜就绪 · 仅模拟状态变化，没有生成素材。';$('#compose-shots').disabled=false;$('#retry-shot').textContent='再次演示单镜重试';});
$('#compose-shots').addEventListener('click',event=>fullFeedback(event.currentTarget,'重新合成确认状态已预览；原成片保持，没有创建任务。'));
$('#publish-final-check').addEventListener('change',event=>$('#publish-final-button').disabled=!event.target.checked);
$('#binding-check').addEventListener('change',event=>$('#binding-button').disabled=!event.target.checked);
// All source files are indexed locally; no source or credentials are fetched by the page.
const siteCoverage=JSON.parse($('#coverage-data').textContent);let coveragePage=0,coverageFilter='all';
function renderCoverage(){
 const query=$('#coverage-search').value.trim().toLocaleLowerCase();const data=siteCoverage.records.filter(record=>(coverageFilter==='all'||coverageFilter==='routes'&&record.route||coverageFilter==='nonvisual'&&record.kind==='nonvisual')&&`${record.file} ${record.route||''} ${record.labels.join(' ')}`.toLocaleLowerCase().includes(query));
 const pageCount=Math.max(1,Math.ceil(data.length/12));coveragePage=Math.min(coveragePage,pageCount-1);
 const items=data.slice(coveragePage*12,coveragePage*12+12).map(record=>{
  const card=document.createElement('article');card.className='coverage-file';const heading=document.createElement('h3');heading.textContent=record.file;card.append(heading);
  if(record.route){const route=document.createElement('p');route.className='coverage-route';route.textContent=`页面路由：${record.route}`;card.append(route);}
  const links=document.createElement('div');links.className='row';record.samples.forEach(id=>{const sample=siteCoverage.samples.find(s=>s.id===id);if(!sample)return;const button=document.createElement('button');button.className='af-btn';button.type='button';button.textContent=sample.title;button.addEventListener('click',()=>{activate(sample.group);const target=document.getElementById(`sample-${id}`)||document.getElementById(sample.group);target.scrollIntoView({block:'start'});if(target.hasAttribute('tabindex'))target.focus({preventScroll:true});});links.append(button);});
  if(record.kind==='nonvisual'){const note=document.createElement('p');note.className='af-help';note.textContent='Provider / 状态容器，无独立视觉界面。';links.append(note);}card.append(links);
  if(record.labels.length){const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent=`查看原组件字段索引 · ${record.labels.length} 项`;text.textContent=record.labels.join(' · ');details.append(summary,text);card.append(details);}return card;
 });
 if(!items.length){const empty=document.createElement('p');empty.className='notice';empty.textContent='没有匹配的源码或字段，请调整关键词。';items.push(empty);}
 $('#coverage-rows').replaceChildren(...items);$('#coverage-summary').textContent=`${data.length} 个文件 · 第 ${coveragePage+1} / ${pageCount} 页`;$('#coverage-prev').disabled=coveragePage===0;$('#coverage-next').disabled=coveragePage===pageCount-1;
}
$('#coverage-search').addEventListener('input',()=>{coveragePage=0;renderCoverage();});
$$('[data-coverage-filter]').forEach(button=>button.addEventListener('click',()=>{coverageFilter=button.dataset.coverageFilter;coveragePage=0;$$('[data-coverage-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));renderCoverage();}));
$('#coverage-prev').addEventListener('click',()=>{coveragePage--;renderCoverage();});$('#coverage-next').addEventListener('click',()=>{coveragePage++;renderCoverage();});renderCoverage();
// Source-specific gaps found during the final coverage audit.
$$('input[name="audio-mode-demo"]').forEach(input=>input.addEventListener('change',()=>Motion.reveal($('#dialogue-secondary'),input.value==='dialogue')));
function syncPlacement(){const current=$('input[name="placement-mode"]:checked').value==='current';const selected=$('#placement-item').checked;$('#placement-item').disabled=!current;['placement-copy','placement-move','placement-remove'].forEach(id=>document.getElementById(id).disabled=!current||!selected);$('#placement-note').textContent=current?'勾选素材后，可在当前目录复制或移动引用。':'汇总视图只读；切回当前目录后可操作引用。';}
$$('input[name="placement-mode"]').forEach(input=>input.addEventListener('change',syncPlacement));$('#placement-item').addEventListener('change',syncPlacement);syncPlacement();
['placement-copy','placement-move'].forEach(id=>document.getElementById(id).addEventListener('click',event=>{const destination=$('#placement-destination [aria-selected=true] [data-option-label]').textContent;fullFeedback(event.currentTarget,`${id==='placement-copy'?'复制素材':'移动引用'}到「${destination}」的确认状态已预览，原素材未更改。`);}));
let vectorChunks=1;$('#more-vector-chunks').addEventListener('click',event=>{const text=document.createElement('blockquote');text.textContent=`片段 ${++vectorChunks} · 示例向量索引摘要。`;$('#vector-chunks').append(text);Motion.enter(text);if(vectorChunks===3){event.currentTarget.textContent='已显示全部片段';event.currentTarget.disabled=true;}});
$('#whitelist-demo').addEventListener('change',event=>$('#whitelist-state').textContent=event.target.checked?'已开通 · 仅演示，未授予真实权限':'未开通 · 仅演示');
$('#save-publish-binding').addEventListener('click',()=>{const value=$('#persona-publish-account [aria-selected=true] [data-option-label]').textContent;$('#publish-binding-state').textContent=`当前：${value} · 已启用（本地样例）`;$('#disable-publish-binding').disabled=false;});
$('#disable-publish-binding').addEventListener('click',event=>{$('#publish-binding-state').textContent='当前发布绑定已停用（本地样例），原选择保留。';event.currentTarget.disabled=true;});
function updateWatermark(){
 const mark=$('#watermark-preview'),enabled=$('#watermark-enabled').checked;mark.hidden=!enabled;$('#watermark-settings').hidden=!enabled;
 const position=$('input[name="水印位置"]:checked').value;mark.style.left=position.includes('左')?'12px':position==='居中'?'50%':'auto';mark.style.right=position.includes('右')?'12px':'auto';mark.style.top=position.includes('上')?'12px':position==='居中'?'50%':'auto';mark.style.bottom=position.includes('下')?'12px':'auto';mark.style.transform=position==='居中'?'translate(-50%,-50%)':'none';mark.style.opacity=String(Number($('#watermark-opacity').value)/100);mark.style.fontSize=`${Number($('#watermark-size').value)/3}px`;
 $('#watermark-opacity-label').textContent=`${$('#watermark-opacity').value}%`;$('#watermark-size-label').textContent=$('#watermark-size').value;
 const color=$('#watermark-hex').value;const valid=/^#[0-9a-f]{6}$/i.test(color);$('#watermark-hex').setAttribute('aria-invalid',String(!valid));$('#watermark-error').textContent=enabled&&!$('#watermark-text').value.trim()?'请输入水印文字':!valid?'颜色须为 #RRGGBB':'';if(valid){mark.style.color=color;$('#watermark-color').value=color;}
}
['watermark-enabled','watermark-opacity','watermark-size','watermark-hex','watermark-text'].forEach(id=>document.getElementById(id).addEventListener('input',updateWatermark));$$('input[name="水印位置"]').forEach(input=>input.addEventListener('change',updateWatermark));$('#watermark-color').addEventListener('input',event=>{$('#watermark-hex').value=event.target.value;updateWatermark();});updateWatermark();
function renderTrends(){const selected=$$('.trend-platform:checked').map(input=>input.value);$('#apply-trends').disabled=!selected.length;const columns=selected.map(platform=>{const section=document.createElement('section');section.className='full-trend-column';const title=document.createElement('h3');title.textContent=platform;section.append(title);['新','热','沸','爆'].forEach((tag,index)=>{const button=document.createElement('button');button.type='button';button.className='full-trend-row';const rank=document.createElement('span');rank.textContent=String(index+1);const text=document.createElement('span');text.className='grow';text.textContent=`示例话题 ${index+1}`;const badge=document.createElement('span');badge.className=`af-badge ${index===0?'info':'warning'}`;badge.textContent=tag;button.append(rank,text,badge);button.addEventListener('click',()=>fullFeedback($('#apply-trends'),`${platform} · 示例话题${index+1} 原文入口样式，未打开真实平台。`));section.append(button);});return section;});$('#trending-columns').replaceChildren(...columns);$('#trending-count').textContent=selected.length?`已展示 ${selected.length} 个榜单 · 所有话题均为样例`:'请至少选择一个榜单。';}
$$('.trend-platform').forEach(input=>input.addEventListener('change',()=>{$('#apply-trends').disabled=!$$('.trend-platform:checked').length;}));$('#apply-trends').addEventListener('click',renderTrends);renderTrends();
const chartDescriptions={line:'折线：观察时间变化。数值未知时使用 —，图表不伪造为 0。',bar:'柱状：比较账号或内容，示例 A120、B180、C250、D320。',pie:'占比：明确分类标签和百分比，示例 A50%、B30%、C20%。',scatter:'散点：观察时长与互动量分布，每个点代表一条示例内容。'};
$$('[data-chart-kind]').forEach(button=>button.addEventListener('click',()=>{$$('[data-chart-kind]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));$$('[data-chart-view]').forEach(view=>{const hidden=view.dataset.chartView!==button.dataset.chartKind;view.toggleAttribute('hidden',hidden);if(!hidden)Motion.enter(view);});$('#chart-kind-caption').textContent=chartDescriptions[button.dataset.chartKind];}));
let draggedOutline;
$('#outline-pages').addEventListener('dragstart',event=>{draggedOutline=event.target.closest('li');if(draggedOutline)event.dataTransfer.setData('text/plain',draggedOutline.textContent);});
$('#outline-pages').addEventListener('dragover',event=>{if(draggedOutline)event.preventDefault();});
$('#outline-pages').addEventListener('drop',event=>{event.preventDefault();const target=event.target.closest('li');if(draggedOutline&&target&&target!==draggedOutline){const rect=target.getBoundingClientRect();if(event.clientY<rect.top+rect.height/2)target.before(draggedOutline);else target.after(draggedOutline);syncSortButtons();fullFeedback(target,'页面顺序已调整，可继续编辑或用上下箭头调整。');}draggedOutline=undefined;});
$('#outline-pages').addEventListener('dragend',()=>{draggedOutline=undefined;});

// The library filters existing local assets; no generation or network writes.
(() => {
  const panel = document.getElementById('illustrations');
  if (!panel) return;
  const search = panel.querySelector('#illustration-search');
  const cards = [...panel.querySelectorAll('[data-illustration-group]')];
  const filters = [...panel.querySelectorAll('[data-illustration-filter]')];
  let group = 'all';
  function updateIllustrations() {
    const term = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matches = (group === 'all' || card.dataset.illustrationGroup === group) && card.dataset.illustrationSearch.toLocaleLowerCase().includes(term);
      card.hidden = !matches;
      if (matches) visible++;
    }
    panel.querySelector('#illustration-count').textContent = `显示 ${visible} / ${cards.length} 张插画`;
    panel.querySelector('.illustration-no-results').hidden = visible !== 0;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    group = button.dataset.illustrationFilter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    updateIllustrations();
  }));
  search.addEventListener('input', updateIllustrations);
  if (location.hash === '#illustrations') activate('illustrations');
})();
