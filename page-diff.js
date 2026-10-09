(() => {
  'use strict';
  const labels = { home: '创作工作台', writing: '文稿创作', audio: '音频工作室', library: '素材库' };
  const paths = {
    home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    writing: '<path d="M15 4l5 5M4 20l5-1L21 7a3.5 3.5 0 0 0-5-5L4 14z"/>',
    audio: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v3M8 23h8"/>',
    library: '<path d="M3 7h7l2-3h9v16H3z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m3 17 6-5 4 4 4-3 4 4"/>',
    video: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m10 8 6 4-6 4z"/>',
    publish: '<path d="m3 10 18-7-7 18-3-8zM11 13 21 3"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6M18 14a6 6 0 0 1 4 6"/>'
  };
  const icon = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths.home}</svg>`;
  const art = (id, style, cls = '') => `<img class="${cls}" src="assets/suite-${id}-${style}-v3.png" width="1536" height="1024" alt="${style === 'ink' ? '简笔画' : '超现实拼贴'}风格插画" decoding="async">`;
  const nav = (id, title, active) => `<button type="button" class="nav-item ${id === active ? 'active' : ''}" ${id === active ? 'aria-current="page"' : ''} ${labels[id] ? `data-page="${id}"` : 'data-preview'}>${icon(id)}${title}</button>`;
  const home = (style) => `<section class="hero"><div><div class="eyebrow">YOUR CREATIVE SPACE</div><h1>好想法，从这里开始。</h1><p>从一段文字到一支视频，<br>让每一份灵感，都有自己的表达。</p><button type="button" class="primary" data-page="writing">开始创作 <span aria-hidden="true">↗</span></button></div>${art('welcome', style, 'hero-art')}</section>
    <div class="section-head"><h2>今天，想创作什么？</h2><span class="muted">选择一种方式开始</span></div><div class="quick-grid">${[['writing','写一篇文稿','把想法变成好内容'],['image','生成图片','让想象有画面'],['audio','制作配音','让文字有声音'],['video','创作视频','把故事讲得生动']].map(([id,title,desc])=>`<button type="button" class="quick" ${labels[id]?`data-page="${id}"`:'data-preview'}>${icon(id)}<b>${title}</b><small>${desc}</small></button>`).join('')}</div>
    <div class="section-head"><h2>最近作品</h2><button type="button" class="text-button" data-page="library">查看全部 ↗</button></div><div class="table"><div class="table-row"><span>作品名称</span><span>状态</span><span>更新时间</span></div>${[['writing','秋日生活方式 · 品牌故事','草稿','10 分钟前'],['audio','新品介绍 · 温柔女声','已完成','今天 10:24'],['video','一杯咖啡的日常','已完成','昨天 16:08']].map(([id,name,status,time])=>`<div class="table-row"><span class="file-name">${icon(id)}${name}</span><span class="status">${status}</span><span>${time}</span></div>`).join('')}</div><div class="tip">✧ <span>小提示：把常用素材存进素材库，下次创作可以直接使用。</span></div>`;
  const writing = (style) => `<div class="content-head"><div><h1>文稿创作</h1><span class="muted">每一篇好内容，都从一个想法开始。</span></div><button type="button" class="secondary" data-preview>历史文稿</button></div><div class="tabs"><span class="selected">自由创作</span><span>品牌文案</span><span>口播文稿</span></div><div class="editor-layout"><div class="editor"><div class="editor-title">秋日生活方式 · 品牌故事</div><p>秋天的第一杯咖啡，<br>不必急着喝完。</p><p>给自己留一点空白，<br>在熟悉的日常里，找回生活的温度。</p><p class="placeholder">继续写下你的想法……</p></div><div class="inspiration">${art('writing',style)}<h2>让灵感，往前走一步。</h2><p>写下主题、想表达的感受，<br>一起把它打磨成完整的故事。</p><button type="button" class="secondary" data-preview>寻找写作灵感</button></div></div><div class="editor-foot"><span>草稿示例 · 43 字</span><button type="button" class="primary" data-preview>生成文稿 ↗</button></div>`;
  const empty = (style, page) => {
    const audio = page === 'audio';
    return `<div class="content-head"><div><h1>${labels[page]}</h1><span class="muted">${audio?'为你的故事，找到合适的声音。':'把散落的灵感，变成随时可用的创作素材。'}</span></div><button type="button" class="primary" data-preview>${audio?'＋ 新建配音':'＋ 上传素材'}</button></div><div class="tabs"><span class="selected">${audio?'我的配音':'全部素材'}</span><span>${audio?'收藏音色':'图片'}</span><span>${audio?'声音克隆':'视频'}</span>${audio?'':'<span>音频</span>'}</div><div class="empty-layout"><div>${art(audio?'audio':'library',style)}<h2>${audio?'让文字，有了声音。':'每一份灵感，都值得留下。'}</h2><p>${audio?'还没有配音作品。选择一个喜欢的音色，<br>让你的第一段文字被听见。':'这里还没有素材。上传图片、视频或音频，<br>为下一次创作准备好灵感。'}</p><button type="button" class="primary" data-preview>${audio?'制作第一段配音':'添加第一份素材'}</button></div></div><div class="setting-row">${(audio?[['自然表达','细腻停顿，让声音更有温度'],['多种音色','为不同内容找到合适的表达']]:[['随时取用','文稿、图片和视频创作共享素材'],['有序归档','用文件夹整理你的创作资源']]).map(([title,desc])=>`<div class="setting-card">${title}<small>${desc}</small></div>`).join('')}</div>`;
  };
  const products = [...document.querySelectorAll('.product')];
  const comparison = document.querySelector('.comparison');
  const scenePicker = document.querySelector('#scene');
  let currentPage = 'home';
  function render(page) {
    if (!Object.hasOwn(labels, page)) return;
    const focusedProduct = products.find(product => product.contains(document.activeElement));
    currentPage = page;
    scenePicker.value = page;
    for (const product of products) {
      const style = product.closest('[data-style]').dataset.style;
      product.innerHTML = `<aside class="sidebar"><div class="brand"><span class="brand-mark">a</span>AlphaFin</div><div class="workspace-label"><span>创</span>我的创作空间<small>⌄</small></div>${nav('home','工作台',page)}<div class="nav-label">创作</div>${nav('writing','文稿创作',page)}${nav('image','图片工作室',page)}${nav('audio','音频工作室',page)}${nav('video','视频工作室',page)}<div class="nav-label">管理</div>${nav('library','素材库',page)}${nav('publish','内容发布',page)}${nav('team','团队协作',page)}<div class="side-bottom"><div class="credit">本月可用额度<b>2,450 <small>点</small></b><div class="credit-bar"></div></div><div class="user"><span class="avatar">林</span><div>林晓<small>个人创作空间</small></div></div></div></aside><div class="app-area"><header class="app-top"><span>我的空间 <span aria-hidden="true">/</span> ${labels[page]}</span><div class="top-actions"><span class="badge">PRO</span><span>帮助中心</span><span>⌘ K</span></div></header><div class="content">${page==='home'?home(style):page==='writing'?writing(style):empty(style,page)}</div></div>`;
    }
    fit();
    focusedProduct?.querySelector('.nav-item[aria-current="page"]')?.focus({ preventScroll: true });
  }
  function fit() {
    for (const product of products) {
      const viewport = product.parentElement;
      if (!viewport.clientWidth) continue;
      const scale = viewport.clientWidth / 1060;
      product.style.transform = `scale(${scale})`;
      viewport.style.height = `${850 * scale}px`;
    }
  }
  const observer = new ResizeObserver(fit);
  for (const product of products) observer.observe(product.parentElement);
  let feedbackTimer;
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const mode = event.target.closest('[data-mode]');
    if (mode && mode.tagName === 'BUTTON') {
      comparison.dataset.mode = mode.dataset.mode;
      document.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button === mode)));
      fit();
      return;
    }
    const page = event.target.closest('[data-page]');
    if (page) { render(page.dataset.page); return; }
    if (event.target.closest('[data-preview]')) {
      const feedback = document.querySelector('#feedback');
      feedback.textContent = '这是页面风格预览，未执行生成、上传或发布。';
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 3500);
    }
  });
  scenePicker.addEventListener('change', () => render(scenePicker.value));
  render(currentPage);
})();
