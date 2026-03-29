import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.5/index.js?module';

class FoxApp extends LitElement {
  static properties = {
    posts: { state: true },
    loading: { state: true },
    error: { state: true },
    filterAuthor: { state: true },
    openPostId: { state: true }
  };

  static styles = css`
    :host { display:block; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:16px; }
    .card { background:white; border:1px solid #eee; border-radius:8px; overflow:hidden; }
    .card img { display:block; width:100%; height:220px; object-fit:cover; }
    .meta { padding:10px; display:flex; gap:10px; align-items:center; }
    .author-photo { width:40px; height:40px; border-radius:50%; object-fit:cover; }
    .author-name { font-weight:600; }
    .like { margin-left:auto; cursor:pointer; }
    .full-view { background:#fff; padding:12px; border:1px solid #ddd; border-radius:8px; }
    .filters { margin-bottom:12px; display:flex; gap:8px; align-items:center; }
    .btn { background:#f3f3f3; border:1px solid #e6e6e6; padding:6px 10px; border-radius:6px; cursor:pointer; }
  `;

  constructor() {
    super();
    this.posts = [];
    this.loading = true;
    this.error = '';
    this.filterAuthor = null;
    this.openPostId = null;
    this.likes = JSON.parse(localStorage.getItem('foxgram-likes') || '{}');
    this._onPop = this._onPop.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this._onPop);
    this._readUrlAndLoad();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._onPop);
    super.disconnectedCallback();
  }

  _onPop() {
    const params = new URLSearchParams(window.location.search);
    this.filterAuthor = params.get('author');
    this.openPostId = params.get('post');
  }

  async _readUrlAndLoad() {
    const params = new URLSearchParams(window.location.search);
    this.filterAuthor = params.get('author');
    this.openPostId = params.get('post');
    await this._loadPosts();
  }

  async _loadPosts() {
    this.loading = true;
    try {
      const res = await fetch('/api/get-posts');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      this.posts = data.posts || [];
      this.error = '';
    } catch (e) {
      this.error = e.message || 'Failed to load posts';
      this.posts = [];
    } finally {
      this.loading = false;
    }
  }

  _authors() {
    const names = new Set();
    (this.posts || []).forEach(p => names.add(p.author.name));
    return Array.from(names);
  }

  _applyFilter(name) {
    this.filterAuthor = name || null;
    const params = new URLSearchParams(window.location.search);
    if (this.filterAuthor) params.set('author', this.filterAuthor);
    else params.delete('author');
    params.delete('post');
    const qs = params.toString();
    history.pushState({}, '', qs ? `?${qs}` : window.location.pathname);
  }

  _openPost(id) {
    this.openPostId = id;
    const params = new URLSearchParams(window.location.search);
    if (id) params.set('post', id);
    else params.delete('post');
    const qs = params.toString();
    history.pushState({}, '', qs ? `?${qs}` : window.location.pathname);
  }

  _toggleLike(id) {
    this.likes[id] = !this.likes[id];
    localStorage.setItem('foxgram-likes', JSON.stringify(this.likes));
    // force update
    this.requestUpdate();
  }

  render() {
    if (this.loading) return html`<div>Loading posts…</div>`;
    if (this.error) return html`<div style="color:crimson">Error: ${this.error}</div>`;

    const authors = this._authors();
    const visible = this.filterAuthor ? this.posts.filter(p => p.author.name === this.filterAuthor) : this.posts;

    return html`
      <div class="filters">
        <div>Filter:</div>
        <button class="btn" @click=${() => this._applyFilter(null)}>All</button>
        ${authors.map(a => html`<button class="btn" @click=${() => this._applyFilter(a)} ?disabled=${this.filterAuthor===a}>${a}</button>`)}
      </div>

      ${this.openPostId ? this._renderPostView(this.posts.find(p => p.id === this.openPostId)) : html`
        <div class="grid">
          ${visible.map(p => this._renderCard(p))}
        </div>
      `}
    `;
  }

  _renderCard(p) {
    return html`
      <article class="card">
        <img src="${p.image.thumb}" alt="${p.image.name}" @click=${() => this._openPost(p.id)}>
        <div class="meta">
          <img class="author-photo" src="${p.author.photo}" alt="${p.author.name}">
          <div>
            <div class="author-name">${p.author.name}</div>
            <div style="font-size:12px;color:#666">${p.image.name} • ${p.image.date_taken}</div>
          </div>
          <div class="like" @click=${(e)=>{ e.stopPropagation(); this._toggleLike(p.id); }}>
            ${this.likes[p.id] ? '❤️' : '🤍'}
          </div>
        </div>
      </article>
    `;
  }

  _renderPostView(p) {
    if (!p) return html`<div>Post not found</div>`;
    return html`
      <div class="full-view">
        <button class="btn" @click=${() => this._openPost(null)}>← Back</button>
        <h2 style="margin-top:8px">${p.image.name}</h2>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          <img class="author-photo" src="${p.author.photo}">
          <div>
            <div class="author-name">${p.author.name}</div>
            <div style="font-size:12px;color:#666">${p.author.channel} • since ${p.author.user_since}</div>
          </div>
          <div style="margin-left:auto; font-size:20px; cursor:pointer" @click=${() => this._toggleLike(p.id)}>${this.likes[p.id] ? '❤️' : '🤍'}</div>
        </div>
        <img src="${p.image.full}" alt="${p.image.name}" style="width:100%;max-height:70vh;object-fit:cover;border-radius:8px;">
        <p style="color:#666;margin-top:8px">Taken on ${p.image.date_taken}</p>
      </div>
    `;
  }
}

customElements.define('fox-app', FoxApp);
