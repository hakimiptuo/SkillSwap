
(() => {
  'use strict';

  // ==========================================
  // SKILLSWAP APPLICATION STATE
  // ==========================================

  const state = {
    me: null,
    csrf: '',
    view: new URLSearchParams(location.search).get('view') || 'dashboard',
    categories: [],
    skills: [],
    partnerId: null,
    requestTab: 'received',
    sessionTab: 'upcoming',
    onboardStep: 1,
    exploreSearch: '',
    exploreCategory: '',
    exploreLevel: '',
    adminUserQuery: '',
    adminUserStatus: 'all',
    adminExchangeQuery: '',
    adminExchangeStatus: 'all'
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const $ = (q) => document.querySelector(q);

  const h = (v) => String(v ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );

  const cap = (s) => String(s || '').replace(
    /\b\w/g,
    c => c.toUpperCase()
  );

  const date = (d) => new Date(d).toLocaleDateString(
    'en-MY',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  const datetime = (d) => new Date(d).toLocaleString(
    'en-MY',
    { dateStyle: 'medium', timeStyle: 'short' }
  );

  const initials = (s) => (s || '?')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map(x => x[0] || '')
    .join('')
    .toUpperCase();

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navStudent = [
    ['dashboard', '▦', 'Dashboard'],
    ['explore', '⌕', 'Explore Skills'],
    ['skills', '♧', 'My Skills'],
    ['matches', '↔', 'My Matches'],
    ['requests', '✉', 'Exchange Requests'],
    ['sessions', '▣', 'My Sessions'],
    ['notifications', '♧', 'Notifications'],
    ['profile', '♙', 'My Profile']
  ];

  const navAdmin = [
    ['admin-dashboard', '▦', 'Dashboard'],
    ['admin-users', '♙', 'Manage Users'],
    ['admin-categories', '▤', 'Skill Categories'],
    ['admin-exchanges', '↔', 'Monitor Exchanges'],
    ['admin-reports', '▥', 'Reports']
  ];

  const titles = Object.fromEntries(
    [...navStudent, ...navAdmin].map(
      ([id, , title]) => [id, title]
    )
  );

  titles.partner = 'Skill Partner';
  titles.schedule = 'Schedule a Session';
  titles.onboarding = 'Set Up Your Profile';
  titles['edit-profile'] = 'Edit Profile';

  // ==========================================
  // API AND CSRF PROTECTION
  // ==========================================

  async function refreshCsrf() {
    const response = await fetch('/api/csrf', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(
        'Unable to refresh the security token. Reload the page.'
      );
    }

    const data = await response.json();

    if (!data.csrf_token) {
      throw new Error(
        'Missing CSRF token. Reload the page.'
      );
    }

    state.csrf = data.csrf_token;
  }

  async function api(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method);

    const send = () => {
      const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
      };

      if (isWrite) {
        headers['Content-Type'] = 'application/json';
        headers['X-CSRF-Token'] = state.csrf;
      }

      return fetch('/api' + path, {
        credentials: 'same-origin',
        ...options,
        headers
      });
    };

    if (isWrite && !state.csrf) {
      await refreshCsrf();
    }

    let res = await send();

    let out = await res.json().catch(
      () => ({ error: 'Unexpected server response' })
    );

    if (
      isWrite &&
      [403, 422].includes(res.status) &&
      /invalid csrf token|authenticity token/i.test(out.error || '')
    ) {
      await refreshCsrf();

      res = await send();

      out = await res.json().catch(
        () => ({ error: 'Unexpected server response' })
      );
    }

    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Please login');
    }

    if (!res.ok) {
      throw new Error(
        out.error || `Request failed (${res.status})`
      );
    }

    return out;
  }

  const write = (path, method, body = {}) =>
    api(path, {
      method,
      body: JSON.stringify(body)
    });

  function toast(message) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = message;

    $('#toastHost').append(div);

    setTimeout(() => div.remove(), 3600);
  }

  function buttons(view, label, cls = 'btn primary') {
    return `
      <button
        type="button"
        class="${cls}"
        data-view="${view}">
        ${label}
      </button>
    `;
  }

  function heading(title, desc = '', action = '') {
    return `
      <div class="page-heading">
        <div>
          <h1>${h(title)}</h1>
          <p>${h(desc)}</p>
        </div>
        ${action}
      </div>
    `;
  }

  function empty(
    title,
    desc,
    view,
    btn = 'Explore Skills'
  ) {
    return `
      <div class="card info-empty">
        <div class="empty-icon">⌕</div>
        <h2>${h(title)}</h2>
        <p>${h(desc)}</p>
        ${view ? buttons(view, h(btn)) : ''}
      </div>
    `;
  }

  function avatar(name, size = '') {
    return `
      <span class="avatar ${size}">
        ${h(initials(name))}
      </span>
    `;
  }

  function pill(status) {
    let label = cap(status);

    if (status === 'mutual') {
      label = '↔ Mutual match';
    } else if (status === 'partial') {
      label = 'Partial match';
    }

    return `
      <span class="pill ${h(status)}">
        ${label}
      </span>
    `;
  }

  function skillNames(rows) {
    return rows.map(x => x.skill.name);
  }

  function tagCollection(rows, kind) {
    if (!rows.length) {
      return '<span class="muted small">None yet</span>';
    }

    return rows.map(x => `
      <span class="tag ${kind === 'learn' ? 'teal' : ''}">
        ${h(x.skill.name)}
      </span>
    `).join('');
  }

  function matchCard(entry) {
    const u = entry.user;
    const t = entry.skills.teach[0];
    const w = entry.skills.learn[0];

    const teach = t ? `
      <div class="skill-item">
        <div class="skill-label">CAN TEACH</div>
        <div class="skill-row">
          ${h(t.skill.name)}
          <span class="level">${h(t.proficiency)}</span>
        </div>
      </div>
    ` : '';

    const learn = w ? `
      <div class="skill-item">
        <div class="skill-label">WANTS TO LEARN</div>
        <div class="skill-row">
          ${h(w.skill.name)}
        </div>
      </div>
    ` : '';

    return `
      <div class="card match-card">
        <div class="profile-head">
          ${avatar(u.full_name)}
          <div>
            <strong>${h(u.full_name)}</strong>
            <small>${h(u.university || 'University student')}</small>
          </div>
        </div>

        <div style="margin-bottom:10px">
          ${pill(entry.match.type)}
        </div>

        ${teach}
        ${learn}

        <div class="match-actions">
          <button
            class="btn"
            data-action="partner"
            data-id="${u.id}">
            View Profile
          </button>

          <button
            class="btn primary"
            data-action="request"
            data-id="${u.id}">
            Request Exchange
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // NOTIFICATION BADGE
  // ==========================================

  async function setBadge() {
    if (state.me.role === 'admin') return;

    try {
      const out = await api('/notifications');

      const n = out.items.filter(x => !x.is_read).length;

      const b = $('#notiBadge');

      if (!b) return;

      b.hidden = !n;
      b.textContent = n;
    } catch (e) {
      // Interface remains usable.
    }
  }

  // ==========================================
  // NAVIGATION RENDERING
  // ==========================================

  function navRender() {
    const isAdmin = state.me.role === 'admin';
    const list = isAdmin ? navAdmin : navStudent;

    $('#workspaceName').textContent =
      isAdmin ? 'ADMIN WORKSPACE' : 'STUDENT WORKSPACE';

    $('#sideNav').innerHTML = list.map(
      ([id, icon, label]) => `
        <button
          class="nav-link ${state.view === id ? 'active' : ''}"
          data-view="${id}">
          <span class="nav-icon">${icon}</span>
          ${h(label)}
        </button>
      `
    ).join('');

    const bottomList = isAdmin
      ? navAdmin
      : [
          navStudent[0],
          navStudent[1],
          navStudent[3],
          navStudent[5],
          navStudent[7]
        ];

    $('#bottomNav').innerHTML = bottomList.map(
      ([id, icon, label]) => `
        <button
          class="${state.view === id ? 'active' : ''}"
          data-view="${id}">
          <span>${icon}</span>
          ${h(label)}
        </button>
      `
    ).join('');

    $('#topTitle').textContent =
      titles[state.view] || 'SkillSwap';

    $('#topUser').textContent = state.me.full_name;

    $('#topUniversity').textContent = isAdmin
      ? 'Administrator'
      : (state.me.university || 'Student');

    $('#topAvatar').textContent =
      initials(state.me.full_name);
  }

  async function navigate(view, extra = {}) {
    if (!state.me) return;

    const admin = view.startsWith('admin-');

    if (
      (state.me.role === 'admin') !== admin &&
      !['onboarding'].includes(view)
    ) {
      view = state.me.role === 'admin'
        ? 'admin-dashboard'
        : 'dashboard';
    }

    state.view = view;

    Object.assign(state, extra);

    history.pushState(
      { view },
      '',
      `/app?view=${encodeURIComponent(view)}`
    );

    await render();

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  async function render() {
    navRender();

    $('#content').innerHTML = `
      <div class="loading-skeleton">
        Loading your workspace…
      </div>
    `;

    try {
      let html = '';

      switch (state.view) {
        case 'dashboard':
          html = await pageDashboard();
          break;

        case 'explore':
          html = await pageExplore();
          break;

        case 'skills':
          html = await pageMySkills();
          break;

        case 'matches':
          html = await pageMatches();
          break;

        case 'partner':
          html = await pagePartner();
          break;

        case 'requests':
          html = await pageRequests();
          break;

        case 'sessions':
          html = await pageSessions();
          break;

        case 'schedule':
          html = await pageSchedule();
          break;

        case 'notifications':
          html = await pageNotifications();
          break;

        case 'profile':
          html = await pageProfile();
          break;

        case 'edit-profile':
          html = pageEditProfile();
          break;

        case 'onboarding':
          html = await pageOnboarding();
          break;

        case 'admin-dashboard':
          html = await pageAdminDashboard();
          break;

        case 'admin-users':
          html = await pageAdminUsers();
          break;

        case 'admin-categories':
          html = await pageAdminCategories();
          break;

        case 'admin-exchanges':
          html = await pageAdminExchanges();
          break;

        case 'admin-reports':
          html = await pageAdminReports();
          break;

        default:
          html = empty(
            'Screen not found',
            'Select a menu item.',
            'dashboard'
          );
      }

      $('#content').innerHTML = html;

      setBadge();

    } catch (err) {
      $('#content').innerHTML = empty(
        'Could not load this page',
        err.message,
        'dashboard',
        'Back to Dashboard'
      );
    }
  }

  // ==========================================
  // STUDENT DASHBOARD
  // ==========================================

  async function pageDashboard() {
    const [d, upcoming, notifications] = await Promise.all([
      api('/dashboard'),
      api('/sessions'),
      api('/notifications')
    ]);

    const next = upcoming.items
      .filter(x => x.status === 'scheduled')
      .sort(
        (a, b) =>
          new Date(a.starts_at) - new Date(b.starts_at)
      )[0];

    const nextCard = next ? `
      <div class="card up-next">
        <span class="eyebrow">UP NEXT</span>

        <h3 style="margin:17px 0 4px">
          ${h(next.exchange.learn_skill)}
        </h3>

        <p>
          With ${h(next.exchange.partner.full_name)}
          <br>${datetime(next.starts_at)}
          <br>${cap(next.method)}
        </p>

        <button
          class="btn full"
          data-view="sessions">
          View Session Details
        </button>
      </div>
    ` : `
      <div class="card up-next">
        <h3>Up next</h3>
        <p>No sessions scheduled yet.</p>
        ${buttons('requests', 'View accepted exchanges', 'btn')}
      </div>
    `;

    const stats = [
      ['▣', 'My Offered Skills', d.offered,
        'A little knowledge goes a long way'],

      ['↔', 'Mutual Matches', d.mutual,
        'Find students who fit both sides'],

      ['✉', 'Pending Requests', d.pending,
        'Invitations need a response'],

      ['▤', 'Upcoming Sessions', d.upcoming,
        'Learn something new together']
    ];

    return `
      <span class="eyebrow tagline">
        YOUR LEARNING JOURNEY
      </span>
    ` +
    heading(
      'Welcome back, ' +
      state.me.full_name.split(' ')[0] +
      '! 👋',
      'Ready to exchange your skills today?',
      buttons('explore', 'Explore Skills')
    ) + `

      <div class="hero">
        <div>
          <h2>Your next skill is one exchange away.</h2>
          <p>
            You bring your strengths.
            Someone brings the know-how.
          </p>

          ${buttons(
            'matches',
            'Discover my matches →',
            'btn'
          )}
        </div>

        <span class="hero-illustration">⇄</span>
      </div>

      <div class="stats-grid">
        ${stats.map(([icon, label, val, txt]) => `
          <div class="card stat-card">
            <div class="stat-icon">
              ${icon}
              <span class="small muted">${h(label)}</span>
            </div>

            <div class="stat-value">${val}</div>

            <div class="stat-caption">${h(txt)}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-header">
        <div>
          <h3>Recommended skill matches</h3>
          <p>A good exchange starts with shared curiosity.</p>
        </div>

        ${buttons(
          'matches',
          'View all matches →',
          'link-btn'
        )}
      </div>

      <div class="card-grid">
        ${d.recommendations.slice(0, 2).map(matchCard).join('')}
        ${nextCard}
      </div>

      <div class="dashboard-lower">
        <section>
          <div class="section-header">
            <h3>Recent activity</h3>
          </div>

          <div class="card activity-list">
            ${
              notifications.items.slice(0, 4).map(n => `
                <div class="activity-item">
                  ✦ <span>${h(n.title)}</span>
                </div>
              `).join('') ||
              '<p class="muted">No activity yet. Explore skills to get started.</p>'
            }
          </div>
        </section>

        <div class="card">
          <h3>Keep your momentum</h3>

          <p class="muted" style="margin:14px 0">
            Every exchange is a chance to learn and share.
          </p>

          ${buttons(
            'skills',
            'Manage My Skills',
            'btn full'
          )}
        </div>
      </div>
    `;
  }

  // ==========================================
  // EXPLORE SKILLS
  // ==========================================

  async function pageExplore() {
    const params = new URLSearchParams();

    if (state.exploreSearch) {
      params.set('q', state.exploreSearch);
    }

    if (state.exploreCategory) {
      params.set('category_id', state.exploreCategory);
    }

    if (state.exploreLevel) {
      params.set('level', state.exploreLevel);
    }

    const { items } = await api(
      '/explore?' + params.toString()
    );

    const catOptions = state.categories.map(x => `
      <option
        value="${x.id}"
        ${state.exploreCategory == x.id ? 'selected' : ''}>
        ${h(x.name)}
      </option>
    `).join('');

    return heading(
      'A campus full of possibility.',
      'Discover students who can teach you something new. Share something in return.'
    ) + `

      <form id="searchForm" class="filters card">
        <label class="big-search">
          What do you want to learn?

          <input
            name="q"
            value="${h(state.exploreSearch)}"
            placeholder="Search Python, Canva, photography…">
        </label>

        <label>
          Category

          <select name="category_id">
            <option value="">All categories</option>
            ${catOptions}
          </select>
        </label>

        <label>
          Skill level

          <select name="level">
            <option value="">Any level</option>

            ${
              ['Beginner', 'Intermediate', 'Advanced']
                .map(x => `
                  <option
                    ${state.exploreLevel === x ? 'selected' : ''}>
                    ${x}
                  </option>
                `).join('')
            }
          </select>
        </label>

        <button
          class="btn primary"
          type="submit">
          Search
        </button>
      </form>

      <div class="category-chips">
        <button
          data-action="category"
          data-id=""
          class="chip ${!state.exploreCategory ? 'active' : ''}">
          All skills
        </button>

        ${state.categories.map(c => `
          <button
            data-action="category"
            data-id="${c.id}"
            class="chip ${
              state.exploreCategory == c.id ? 'active' : ''
            }">
            ${h(c.name)}
          </button>
        `).join('')}
      </div>

      <div class="section-header">
        <div>
          <h3>Find your next learning partner</h3>
          <p>
            ${items.length}
            student${items.length === 1 ? '' : 's'} available
          </p>
        </div>
      </div>

      ${
        items.length
          ? `<div class="card-grid">
              ${items.map(matchCard).join('')}
            </div>`
          : empty(
              'No matches yet. Keep your curiosity.',
              'Try another skill or broaden your filters.',
              'explore',
              'Clear Search & Explore'
            )
      }
    `;
  }

  // ==========================================
  // MY SKILLS
  // ==========================================

  async function pageMySkills() {
    const { teach, learn } = await api('/my-skills');

    const makeSkill = (x) => `
      <div class="card my-skill-card">
        <div class="skill-card-header">
          <span>♧</span>

          <div class="mini-actions">
            <button
              title="Edit"
              data-action="edit-skill"
              data-id="${x.id}">
              ✎
            </button>

            <button
              title="Delete"
              data-action="delete-skill"
              data-id="${x.id}">
              ▤
            </button>
          </div>
        </div>

        <h3>${h(x.skill.name)}</h3>

        <p class="muted small">
          ${h(x.skill.category)}
        </p>

        ${x.proficiency ? `
          <div style="margin-top:11px">
            <span class="level">
              ${h(x.proficiency)}
            </span>
          </div>
        ` : ''}

        <p class="note">${h(x.description)}</p>
      </div>
    `;

    return heading(
      'A little knowledge. A lot to share.',
      'Build your skill collection and find more meaningful exchanges.',
      `
        <button
          class="btn primary"
          data-action="add-skill">
          + Add Skill
        </button>
      `
    ) + `

      <div class="banner">
        <strong>
          Your skills open doors for someone else.
        </strong>

        <span class="small">
          Keep your levels honest and your interests up to date.
        </span>
      </div>

      <section class="skill-collection">
        <div class="section-header">
          <h3>
            Skills I can teach
            <span class="level">
              ${teach.length} skills
            </span>
          </h3>
        </div>

        <div class="card-grid">
          ${
            teach.map(makeSkill).join('') ||
            '<p class="muted">You have not added any teaching skills yet.</p>'
          }
        </div>
      </section>

      <section class="skill-collection">
        <div class="section-header">
          <h3>Skills I want to learn</h3>

          <button
            class="link-btn"
            data-action="add-skill"
            data-kind="learn">
            + Add a learning goal
          </button>
        </div>

        <div class="card-grid">
          ${
            learn.map(makeSkill).join('') ||
            '<p class="muted">Add a skill you want to learn.</p>'
          }
        </div>
      </section>
    `;
  }

  // ==========================================
  // SKILL MATCHES
  // ==========================================

  async function pageMatches() {
    const { items } = await api('/matches');

    const mutual = items.filter(
      x => x.match.type === 'mutual'
    );

    const partial = items.filter(
      x => x.match.type === 'partial'
    );

    return heading(
      'Your skill matches',
      'Real skills. Real connections. A little give, a lot to gain.'
    ) + `

      <div class="banner">
        <strong>
          ↔ Mutual Match! You can teach each other.
        </strong>

        <span class="small">
          Matches pair what you teach with what someone
          wants to learn — in both directions.
        </span>
      </div>

      <div class="section-header">
        <h3>
          Mutual matches
          <span class="level">
            ${mutual.length} matches
          </span>
        </h3>
      </div>

      ${
        mutual.length
          ? `<div class="card-grid">
              ${mutual.map(matchCard).join('')}
            </div>`
          : empty(
              'No mutual matches yet',
              'Update the skills you offer or want to learn.',
              'skills',
              'Manage My Skills'
            )
      }

      <section class="skill-collection">
        <div class="section-header">
          <div>
            <h3>Partial matches</h3>
            <p>
              One side aligns.
              A two-way exchange is not guaranteed.
            </p>
          </div>
        </div>

        ${
          partial.map(x => `
            <div class="card info-line">
              ${avatar(x.user.full_name, 'mini')}

              <div style="flex:1">
                <strong>${h(x.user.full_name)}</strong>

                <p class="muted small">
                  Offers ${h(skillNames(x.skills.teach).join(', '))}
                  · Wants ${h(skillNames(x.skills.learn).join(', '))}
                </p>
              </div>

              ${pill('partial')}

              <button
                class="btn"
                data-action="partner"
                data-id="${x.user.id}">
                View Profile
              </button>
            </div>
          `).join('') ||
          '<p class="muted">No partial matches yet.</p>'
        }
      </section>
    `;
  }

  // ==========================================
  // SKILL PARTNER PROFILE
  // ==========================================

  async function pagePartner() {
    if (!state.partnerId) {
      return empty(
        'Choose a student',
        'Open a student profile from Explore Skills or My Matches.',
        'explore'
      );
    }

    const p = await api(
      '/partners/' + state.partnerId
    );

    return `
      <button class="link-btn" data-view="matches">
        ← Back to matches
      </button>

      <div style="height:15px"></div>

      <div class="card profile-top">
        ${avatar(p.user.full_name, 'large')}

        <div class="info">
          <h2>${h(p.user.full_name)}</h2>

          <p class="muted">
            ${h(p.user.university)}
            · ${h(p.user.programme)}
            · ${h(p.user.study_year)}
          </p>

          <p class="muted small">
            ${p.rating ? `${p.rating} ★` : 'No reviews yet'}
          </p>
        </div>

        <button
          class="btn primary"
          data-action="request"
          data-id="${p.user.id}">
          Send Exchange Request
        </button>
      </div>

      <div class="two-cols" style="margin-top:17px">
        <div>
          <div class="card">
            <h3>
              A little about ${h(p.user.full_name.split(' ')[0])}
            </h3>

            <p class="muted" style="margin-top:15px">
              ${h(
                p.user.bio ||
                'This student is ready to exchange skills.'
              )}
            </p>
          </div>

          <div class="card">
            <h3>Skills for an exchange</h3>

            <div class="skill-label" style="margin-top:18px">
              CAN TEACH
            </div>

            <div class="profile-tags">
              ${tagCollection(p.skills.teach, 'teach')}
            </div>

            <div class="skill-label" style="margin-top:22px">
              WANTS TO LEARN
            </div>

            <div class="profile-tags">
              ${tagCollection(p.skills.learn, 'learn')}
            </div>
          </div>

          <div class="card">
            <h3>What learning together feels like</h3>

            <div style="margin-top:18px">
              ${
                p.reviews.length
                  ? p.reviews.map(r => `
                      <p style="margin-bottom:15px">
                        ${'★'.repeat(r.rating)}
                        <br>
                        “${h(r.feedback)}”
                      </p>
                    `).join('')
                  : '<p class="muted">No reviews yet.</p>'
              }
            </div>
          </div>
        </div>

        <div>
          <div class="card" style="background:#f1edff">
            <h3>
              ${
                p.match.type === 'mutual'
                  ? '↔ You’re a mutual match!'
                  : p.match.type === 'partial'
                    ? 'Partial match'
                    : 'Discover a new skill'
              }
            </h3>

            <p style="margin-top:13px">
              ${
                p.match.type === 'mutual'
                  ? 'You can help each other using your selected skills.'
                  : p.match.type === 'partial'
                    ? 'One side aligns; the recipient can choose whether your offer interests them.'
                    : 'You can still explore this student’s skills.'
              }
            </p>

            <p class="small muted" style="margin-top:20px">
              Rule-based matching. No AI guesswork.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // EXCHANGE REQUESTS
  // ==========================================

  async function pageRequests() {
    const { items } = await api('/exchanges');
    const tab = state.requestTab;

    const filtered = items.filter(x =>
      tab === 'received'
        ? x.direction === 'received' && x.status === 'pending'
        : tab === 'sent'
          ? x.direction === 'sent'
          : x.status === 'accepted'
    );

    return heading(
      'Good things start with an exchange.',
      'Manage invitations, find your people and turn shared skills into shared progress.'
    ) + `

      <div class="list-tabs">
        ${
          [
            ['received', 'Received Requests'],
            ['sent', 'Sent Requests'],
            ['accepted', 'Accepted Exchanges']
          ].map(([id, label]) => `
            <button
              data-action="request-tab"
              data-tab="${id}"
              class="${tab === id ? 'active' : ''}">
              ${label}
            </button>
          `).join('')
        }
      </div>

      <div class="banner small">
        ${
          tab === 'received'
            ? 'A new perspective could be waiting in your inbox.'
            : tab === 'sent'
              ? 'Your invitations live here. You can cancel a request while it is pending.'
              : 'You’re ready to learn together. Schedule a session to get started.'
        }
      </div>

      ${
        filtered.length
          ? filtered.map(e => `
              <div class="card request-card">
                <div class="request-main">
                  <div class="profile-head">
                    ${avatar(e.partner.full_name, 'mini')}

                    <div>
                      <strong>${h(e.partner.full_name)}</strong>

                      <small>
                        ${date(e.created_at)}
                        · ${h(e.partner.university)}
                      </small>
                    </div>
                  </div>

                  <strong
                    class="small"
                    style="color:var(--purple)">
                    Offers ${h(e.offer_skill)}
                    ↔ Wants ${h(e.learn_skill)}
                  </strong>

                  <p>
                    “${h(
                      e.message ||
                      'Let’s exchange skills and learn together!'
                    )}”
                  </p>
                </div>

                ${pill(e.status)}

                <div class="request-actions">
                  ${
                    tab === 'received'
                      ? `
                        <button
                          class="btn primary"
                          data-action="exchange-update"
                          data-id="${e.id}"
                          data-status="accepted">
                          Accept
                        </button>

                        <button
                          class="btn danger"
                          data-action="exchange-update"
                          data-id="${e.id}"
                          data-status="rejected">
                          Reject
                        </button>
                      `
                      : tab === 'sent' && e.status === 'pending'
                        ? `
                          <button
                            class="btn danger"
                            data-action="exchange-update"
                            data-id="${e.id}"
                            data-status="cancelled">
                            Cancel
                          </button>
                        `
                        : tab === 'accepted'
                          ? `
                            <button
                              class="btn primary"
                              data-action="schedule"
                              data-id="${e.id}">
                              Schedule Session
                            </button>
                          `
                          : ''
                  }
                </div>
              </div>
            `).join('')
          : empty(
              'Nothing here yet',
              'Requests will appear when students start exchanging skills.',
              'explore',
              'Explore Skills'
            )
      }
    `;
  }

  // ==========================================
  // SCHEDULE LEARNING SESSION
  // ==========================================

  async function pageSchedule() {
    const id = state.exchangeId;

    if (!id) {
      return empty(
        'Select an accepted exchange',
        'Open accepted exchanges to schedule a session.',
        'requests',
        'View Requests'
      );
    }

    const { items } = await api('/exchanges');

    const e = items.find(x => x.id === id);

    if (!e || e.status !== 'accepted') {
      return empty(
        'Exchange unavailable',
        'Only accepted exchanges can be scheduled.',
        'requests',
        'View Requests'
      );
    }

    return `
      <button class="link-btn" data-view="requests">
        ← Back to accepted exchanges
      </button>

      <div style="height:19px"></div>
    ` +
    heading(
      'Make time to grow.',
      'A small session. A big step toward your next skill.'
    ) + `

      <div class="two-cols">
        <div class="card">
          <h3>Session details</h3>

          <div class="banner" style="margin-top:20px">
            YOU’RE EXCHANGING
            <br>
            <strong style="margin-top:7px">
              Learn ${h(e.learn_skill)}
              ↔ Teach ${h(e.offer_skill)}
            </strong>
          </div>

          <form id="scheduleForm">
            <input
              type="hidden"
              name="exchange_id"
              value="${e.id}">

            <div class="form-grid">
              <label class="wide">
                Session date
                <input type="date" name="date" required>
              </label>

              <label>
                Start time
                <input type="time" name="start" required>
              </label>

              <label>
                End time
                <input type="time" name="end" required>
              </label>

              <label class="wide">
                Meeting method

                <select name="method">
                  <option value="online">Online</option>
                  <option value="in-person">In Person</option>
                </select>
              </label>

              <label class="wide">
                Meeting link or location

                <input
                  name="meeting_detail"
                  required
                  placeholder="Google Meet link or campus meeting location">
              </label>

              <label class="wide">
                Notes (optional)

                <textarea
                  name="notes"
                  placeholder="Let’s start with a clear learning goal.">
                </textarea>
              </label>
            </div>

            <div class="form-actions">
              <button class="btn primary" type="submit">
                Confirm Session
              </button>
            </div>
          </form>
        </div>

        <div>
          <div class="card">
            <h3>Learning together</h3>

            <div class="profile-head" style="margin-top:21px">
              ${avatar(e.partner.full_name)}

              <div>
                <strong>${h(e.partner.full_name)}</strong>
                <small>${h(e.partner.university)}</small>
              </div>
            </div>

            <p class="muted">
              Agree on a goal before your session.
              A focused hour is a great place to start.
            </p>
          </div>

          <div class="card" style="background:#f1edff">
            <h3>A two-way learning experience</h3>

            <p class="muted" style="margin-top:13px">
              Plan time for both skills so you both leave
              with something new.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // MY SESSIONS
  // ==========================================

  async function pageSessions() {
    const { items } = await api('/sessions');

    const tab = state.sessionTab;

    const filtered = items.filter(s =>
      tab === 'upcoming'
        ? s.status === 'scheduled'
        : s.status === tab
    );

    return heading(
      'Make every exchange count.',
      'Your next lesson, shared achievement and learning milestone — all here.',
      buttons('requests', '+ Schedule Session', 'btn primary')
    ) + `

      <div class="list-tabs">
        ${
          ['upcoming', 'completed', 'cancelled'].map(t => `
            <button
              data-action="session-tab"
              data-tab="${t}"
              class="${tab === t ? 'active' : ''}">
              ${cap(t)}
            </button>
          `).join('')
        }
      </div>

      ${
        tab === 'completed'
          ? `
            <div class="banner">
              <strong>Look at how far you’ve come.</strong>
              <span class="small">
                Every completed exchange is a skill shared
                and a new connection made.
              </span>
            </div>
          `
          : ''
      }

      <div class="section-header">
        <h3>
          ${
            tab === 'upcoming'
              ? 'Coming up next'
              : tab === 'completed'
                ? 'Completed exchanges'
                : 'Cancelled sessions'
          }
        </h3>
      </div>

      ${
        filtered.length
          ? filtered.map(s => `
              <div class="card session-card">
                <div class="date-badge">
                  <small>
                    ${
                      new Date(s.starts_at)
                        .toLocaleString(
                          'en-MY',
                          { month: 'short' }
                        )
                        .toUpperCase()
                    }
                  </small>

                  <b>${new Date(s.starts_at).getDate()}</b>
                </div>

                <div class="session-info">
                  <strong>
                    ${h(s.exchange.learn_skill)}
                    × ${h(s.exchange.offer_skill)}
                  </strong>

                  <p>
                    with ${h(s.exchange.partner.full_name)}
                    · ${datetime(s.starts_at)}
                  </p>

                  <p>
                    ${cap(s.method)}
                    · ${h(s.meeting_detail)}
                  </p>
                </div>

                ${pill(s.status)}

                <div>
                  ${
                    s.status === 'scheduled'
                      ? `
                        <button
                          class="btn"
                          data-action="session-details"
                          data-id="${s.id}">
                          View Details
                        </button>
                      `
                      : s.status === 'completed'
                        ? `
                          <button
                            class="btn"
                            data-action="review"
                            data-id="${s.id}">
                            Leave a Review
                          </button>
                        `
                        : ''
                  }
                </div>
              </div>
            `).join('')
          : empty(
              `No ${tab} sessions`,
              'You’ll see your sessions here once an exchange is scheduled.',
              'requests',
              'View Exchange Requests'
            )
      }
    `;
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  async function pageNotifications() {
    const { items } = await api('/notifications');

    return heading(
      'You’re in the loop.',
      'Requests, reminders and little milestones from your learning community.',
      `
        <button class="btn" data-action="read-all">
          Mark All as Read
        </button>
      `
    ) + `

      <div class="section-header">
        <h3>All notifications</h3>

        <span class="muted small">
          ${items.filter(x => !x.is_read).length} unread
        </span>
      </div>

      ${
        items.length
          ? items.map(x => `
              <div
                class="card notification-card ${
                  x.is_read ? '' : 'unread'
                }"
                data-action="notification"
                data-id="${x.id}"
                data-target="${h(x.target)}">

                <span class="notification-icon">✉</span>

                <div class="notification-copy">
                  <strong>${h(x.title)}</strong>
                  <p>${h(x.message)}</p>
                  <small>${datetime(x.created_at)}</small>
                </div>

                ${
                  x.is_read
                    ? ''
                    : '<span class="pill mutual">New</span>'
                }

                <span>→</span>
              </div>
            `).join('')
          : empty(
              'No notifications yet',
              'You will be notified about exchange requests and session updates.',
              'explore'
            )
      }
    `;
  }

  // ==========================================
  // STUDENT PROFILE
  // ==========================================

  async function pageProfile() {
    const [skills, { items: sessions }, { items: reviews }] = await Promise.all([
      api('/my-skills'),
      api('/sessions'),
      api('/profile/reviews')
    ]);

    const completed = sessions.filter(
      s => s.status === 'completed'
    );

    return heading(
      'Your story. Your skills.',
      'This is how your learning community sees you.'
    ) + `

      <div class="card profile-top">
        ${avatar(state.me.full_name, 'large')}

        <div class="info">
          <h2>${h(state.me.full_name)}</h2>

          <p class="muted">
            ${h(state.me.university)}
            · ${h(state.me.programme)}
            · ${h(state.me.study_year)}
          </p>

          <p class="muted small">
            ${h(state.me.email)}
          </p>
        </div>

        ${buttons(
          'edit-profile',
          'Edit Profile',
          'btn'
        )}
      </div>

      <div class="two-cols" style="margin-top:16px">
        <div>
          <div class="card">
            <h3>A little about me</h3>

            <p style="margin-top:13px">
              ${h(
                state.me.bio ||
                'Tell your partners a little about yourself.'
              )}
            </p>
          </div>

          <div class="card">
            <h3>
              Skills I bring & skills I’m curious about
            </h3>

            <p class="skill-label" style="margin-top:18px">
              TEACH
            </p>

            <div class="profile-tags">
              ${tagCollection(skills.teach, 'teach')}
            </div>

            <p class="skill-label" style="margin-top:22px">
              LEARN
            </p>

            <div class="profile-tags">
              ${tagCollection(skills.learn, 'learn')}
            </div>
          </div>

          ${buttons(
            'sessions',
            'View Exchange History →',
            'btn'
          )}
        </div>

        <div>
          <div class="card">
            <div
              class="stat-value"
              style="color:var(--purple)">
              ${completed.length.toString().padStart(2, '0')}
            </div>

            <span class="small muted">
              Completed exchanges
            </span>

            <p class="muted" style="margin-top:24px">
              Growing, one exchange at a time.
            </p>
          </div>

          <div class="card">
            <h3>Kind words from partners</h3>

            <div style="display:grid;gap:12px;margin-top:15px">
              ${reviews.length
                ? reviews.map(review => `
                    <article style="border:1px solid var(--line);border-radius:12px;padding:14px;overflow-wrap:anywhere">
                      <strong>${h(review.reviewer_name)}</strong>
                      <p role="img" aria-label="${review.rating} out of 5 stars" style="color:var(--purple)">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                      </p>
                      <p style="margin-top:6px;white-space:pre-wrap">${h(review.feedback)}</p>
                      ${review.created_at ? `
                        <time class="small muted" datetime="${h(review.created_at)}">
                          ${new Date(review.created_at).toLocaleDateString()}
                        </time>
                      ` : ''}
                    </article>
                  `).join('')
                : '<p class="muted">No reviews yet. Complete a learning session and receive feedback from your learning partner.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function pageEditProfile() {
    const u = state.me;

    return heading(
      'Make yourself at home.',
      'Keep your profile up to date so the right partners can find you.'
    ) + `

      <div class="card" style="max-width:820px">
        <form id="profileForm">
          <div class="form-grid">
            <label>
              Full name

              <input
                name="full_name"
                required
                value="${h(u.full_name)}">
            </label>

            <label>
              University email

              <input
                disabled
                value="${h(u.email)}">
            </label>

            <label>
              University

              <input
                name="university"
                value="${h(u.university)}">
            </label>

            <label>
              Course or Programme

              <input
                name="programme"
                value="${h(u.programme)}">
            </label>

            <label>
              Year of Study

              <select name="study_year">
                ${
                  ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
                    .map(y => `
                      <option
                        ${u.study_year === y ? 'selected' : ''}
                        value="${h(y)}">
                        ${h(y || 'Select year')}
                      </option>
                    `).join('')
                }
              </select>
            </label>

            <label class="wide">
              Bio

              <textarea
                maxlength="200"
                name="bio">${h(u.bio)}</textarea>

              <span class="note">
                Your bio helps students find a personal connection.
                Keep it under 200 characters.
              </span>
            </label>
          </div>

          <div class="form-actions">
            <button
              class="btn"
              type="button"
              data-view="profile">
              Cancel
            </button>

            <button
              class="btn primary"
              type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // ==========================================
  // STUDENT ONBOARDING
  // ==========================================

  async function pageOnboarding() {
    const step = state.onboardStep;
    const skills = await api('/my-skills');

    const progress = `
      <div style="max-width:740px;margin:0 auto 25px;text-align:center">
        <h1>Good skills bring people together.</h1>

        <p class="muted">
          Let’s set up your profile and find your first exchange.
        </p>

        <div
          class="list-tabs"
          style="justify-content:space-between;margin-top:24px">

          ${
            ['Your profile', 'Skills to teach', 'Skills to learn']
              .map((s, i) => `
                <button
                  type="button"
                  class="${step === i + 1 ? 'active' : ''}">
                  ${i + 1}. ${s}
                </button>
              `).join('')
          }
        </div>
      </div>
    `;

    let body = '';

    if (step === 1) {
      body = `
        <h2>First, a little about you.</h2>

        <p class="muted">
          Help future learning partners get to know you.
        </p>

        <form
          id="onboardProfile"
          class="form-grid"
          style="margin-top:22px">

          <label>
            Full name

            <input
              name="full_name"
              value="${h(state.me.full_name)}"
              required>
          </label>

          <label>
            University

            <input
              name="university"
              value="${h(state.me.university)}"
              required>
          </label>

          <label>
            Course or Programme

            <input
              name="programme"
              value="${h(state.me.programme)}"
              required>
          </label>

          <label>
            Year of study

            <select name="study_year">
              ${
                ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
                  .map(x => `
                    <option
                      ${x === state.me.study_year ? 'selected' : ''}>
                      ${x}
                    </option>
                  `).join('')
              }
            </select>
          </label>

          <label class="wide">
            Short Bio

            <textarea
              name="bio"
              maxlength="200">${h(state.me.bio)}</textarea>
          </label>

          <div class="form-actions wide">
            <button type="submit" class="btn primary">
              Next →
            </button>
          </div>
        </form>
      `;
    } else {
      const kind = step === 2 ? 'teach' : 'learn';

      body = `
        <h2>
          ${
            kind === 'teach'
              ? 'What can you share?'
              : 'What sparks your curiosity?'
          }
        </h2>

        <p class="muted">
          ${
            kind === 'teach'
              ? "You don't need to be an expert to help someone start."
              : 'Choose skills you’d love to learn.'
          }
        </p>

        <div style="margin-top:22px">
          <p>
            <strong>
              ${
                kind === 'teach'
                  ? 'Your teaching skills'
                  : 'Your learning goals'
              }
            </strong>
          </p>

          <div class="profile-tags" style="margin:13px 0 23px">
            ${tagCollection(skills[kind], kind)}
          </div>

          <button
            class="btn"
            data-action="add-skill"
            data-kind="${kind}">
            + Add ${
              kind === 'teach'
                ? 'a teaching skill'
                : 'a learning goal'
            }
          </button>
        </div>

        <div class="form-actions">
          <button class="btn" data-action="onboard-back">
            Back
          </button>

          <button
            class="btn primary"
            data-action="onboard-next">
            ${
              step === 3
                ? 'Finish & find my matches →'
                : 'Next →'
            }
          </button>
        </div>
      `;
    }

    return progress + `
      <div
        class="card"
        style="max-width:740px;margin:auto;padding:35px">
        ${body}
      </div>
    `;
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  async function pageAdminDashboard() {
    const d = await api('/admin/overview');

    const stats = [
      ['Total Students', d.students],
      ['Total Skills', d.skills],
      ['Exchange Requests', d.exchanges],
      ['Completed Exchanges', d.completed]
    ];

    return heading(
      'A community growing together.',
      "Here's what’s happening across SkillSwap."
    ) + `

      <div class="stats-grid">
        ${stats.map(([name, val]) => `
          <div class="card stat-card">
            <span class="eyebrow">
              ${h(name)}
            </span>

            <div class="stat-value" style="margin-top:15px">
              ${val}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="two-cols">
        <div class="card">
          <h3>Exchange activity</h3>

          <div style="margin-top:20px">
            ${
              [
                ['Pending requests', d.pending],
                ['Completed sessions', d.completed],
                ['Total exchanges', d.exchanges]
              ].map(([a, b]) =>
                chartBar(
                  a,
                  b,
                  Math.max(1, d.exchanges)
                )
              ).join('')
            }
          </div>
        </div>

        <div class="card">
          <h3>Community overview</h3>

          <p class="muted" style="margin-top:17px">
            ${d.categories} skill categories
            are available for students.
          </p>

          <div style="margin-top:20px">
            ${buttons(
              'admin-reports',
              'View Reports',
              'btn primary full'
            )}
          </div>
        </div>
      </div>
    `;
  }

  function chartBar(label, value, max) {
    return `
      <div class="chart-row">
        <strong>${h(label)}</strong>

        <div class="chart-track">
          <div
            class="chart-fill"
            style="width:${
              Math.min(100, Math.round(100 * value / max))
            }%">
          </div>
        </div>

        <small>${value}</small>
      </div>
    `;
  }

  // ==========================================
  // ADMIN - MANAGE USERS
  // SEARCH, FILTER, VIEW DETAILS
  // ==========================================

  async function pageAdminUsers() {
    const params = new URLSearchParams();

    if (state.adminUserQuery.trim()) {
      params.set('q', state.adminUserQuery.trim());
    }

    if (state.adminUserStatus !== 'all') {
      params.set('status', state.adminUserStatus);
    }

    const queryString = params.toString();

    const response = await api(
      '/admin/users' +
      (queryString ? '?' + queryString : '')
    );

    const items = response.items;

    const options = [
      ['all', 'All statuses'],
      ['active', 'Active'],
      ['inactive', 'Inactive']
    ].map(([value, label]) => `
      <option
        value="${value}"
        ${state.adminUserStatus === value ? 'selected' : ''}>
        ${label}
      </option>
    `).join('');

    const rows = items.map(user => `
      <tr>
        <td>
          <strong>${h(user.full_name)}</strong>
          <small>${h(user.email)}</small>
        </td>

        <td>
          ${h(user.university || 'Not provided')}
        </td>

        <td>
          ${pill(user.active ? 'active' : 'inactive')}
        </td>

        <td>
          <div class="admin-user-actions">
            <button
              class="btn"
              type="button"
              data-action="admin-view-user"
              data-id="${user.id}">
              View Details
            </button>

            <button
              class="btn ${user.active ? 'danger' : ''}"
              type="button"
              data-action="admin-toggle-user"
              data-id="${user.id}"
              data-active="${user.active}">
              ${user.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return heading(
      'A safe space to share.',
      'Review student accounts and keep the learning community healthy.'
    ) + `

      <form
        id="adminUsersSearchForm"
        class="admin-user-filters"
        role="search">

        <label class="admin-search-label">
          Search Students

          <input
            type="search"
            name="q"
            maxlength="100"
            placeholder="Search name, email or university..."
            value="${h(state.adminUserQuery)}">
        </label>

        <label class="admin-status-label">
          Account Status

          <select name="status">
            ${options}
          </select>
        </label>

        <button type="submit" class="btn primary">
          Search
        </button>

        <button
          type="button"
          class="btn"
          data-action="admin-users-clear">
          Clear Filters
        </button>
      </form>

      <p class="admin-result-count">
        ${items.length} student(s) found
      </p>

      <div class="card admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>University</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows || `
                <tr>
                  <td colspan="4" class="admin-empty-row">
                    No students found.
                    Try another search or clear your filters.
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // ADMIN - STUDENT DETAILS MODAL
  // ==========================================

  async function showAdminUserDetails(id) {
    const response = await api(
      '/admin/users/' + id
    );

    const user = response.user;
    const skills = response.skills;
    const stats = response.stats;

    const lines = [
      ['Full Name', user.full_name],
      ['University Email', user.email],
      ['University', user.university || 'Not provided'],
      ['Programme', user.programme || 'Not provided'],
      ['Year of Study', user.study_year || 'Not provided'],
      ['Account Role', cap(user.role)],
      ['Account Status', user.active ? 'Active' : 'Inactive'],
      ['Profile Setup', user.onboarded ? 'Completed' : 'Incomplete'],
      [
        'Registered',
        user.created_at
          ? date(user.created_at)
          : 'Not provided'
      ]
    ];

    const skillTags = (rows) => {
      if (!rows || rows.length === 0) {
        return '<span class="muted small">None added</span>';
      }

      return rows.map(item => `
        <span class="tag">
          ${h(item.skill.name)}
          ${
            item.proficiency
              ? ' · ' + h(item.proficiency)
              : ''
          }
        </span>
      `).join('');
    };

    const host = $('#modalHost');

    host.hidden = false;

    host.innerHTML = `
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Student details">

        <button
          type="button"
          class="modal-close"
          data-action="modal-close"
          aria-label="Close">
          ×
        </button>

        <h2>Student Details</h2>

        <p>
          Information for ${h(user.full_name)}
        </p>

        <div class="admin-details">
          ${
            lines.map(([label, value]) => `
              <div class="admin-detail-line">
                <span>${h(label)}</span>
                <strong>${h(value)}</strong>
              </div>
            `).join('')
          }

          <div class="admin-detail-line">
            <span>Total Exchanges</span>
            <strong>${Number(stats.exchanges) || 0}</strong>
          </div>

          <div class="admin-detail-line">
            <span>Completed Sessions</span>
            <strong>
              ${Number(stats.completed_sessions) || 0}
            </strong>
          </div>

          <h3>Skills I Can Teach</h3>

          <div class="profile-tags">
            ${skillTags(skills.teach)}
          </div>

          <h3>Skills I Want to Learn</h3>

          <div class="profile-tags">
            ${skillTags(skills.learn)}
          </div>

          <h3>About Student</h3>

          <p>
            ${h(user.bio || 'No biography added.')}
          </p>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn primary"
            data-action="modal-close">
            Close
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // ADMIN - SKILL CATEGORIES
  // ==========================================

  async function pageAdminCategories() {
    const [
      { items: categories },
      { items: skills }
    ] = await Promise.all([
      api('/categories'),
      api('/skills')
    ]);

    return heading(
      'A place for every kind of skill.',
      'Organize discovery with clear, useful skill categories.',
      `
        <button class="btn primary" data-action="category-add">
          + Add Category
        </button>
      `
    ) + `

      <div class="card-grid">
        ${
          categories.map(c => `
            <div class="card">
              <div class="stat-icon">♧</div>

              <h3>${h(c.name)}</h3>

              <p
                class="muted small"
                style="margin:12px 0 20px">
                ${
                  skills.filter(
                    s => s.category_id === c.id
                  ).length
                } listed skills
              </p>

              <div class="match-actions">
                <button
                  class="btn"
                  data-action="category-edit"
                  data-id="${c.id}">
                  Edit
                </button>

                <button
                  class="btn danger"
                  data-action="category-delete"
                  data-id="${c.id}">
                  Delete
                </button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
  }

  // ==========================================
  // ADMIN - MONITOR EXCHANGES
  // ==========================================


async function pageAdminExchanges() {

  // Get exchange records from Rails JSON API
  const { items } = await api('/admin/exchanges');

  // Current filters
  const search = (
    state.adminExchangeQuery || ''
  ).trim().toLowerCase();

  const status = state.adminExchangeStatus || 'all';

  // Filter by student name, email, skill and status
  const filtered = items.filter(e => {

    const searchable = [
      e.sender?.full_name,
      e.receiver?.full_name,
      e.sender?.email,
      e.receiver?.email,
      e.offer_skill,
      e.learn_skill
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !search || searchable.includes(search);

    const matchesStatus =
      status === 'all' ||
      String(e.status || '').toLowerCase() === status;

    return matchesSearch && matchesStatus;
  });

  // Status dropdown
  const statusOptions = [
    ['all', 'All statuses'],
    ['pending', 'Pending'],
    ['accepted', 'Accepted'],
    ['rejected', 'Rejected'],
    ['cancelled', 'Cancelled']
  ].map(([value, label]) => `

    <option
      value="${value}"
      ${status === value ? 'selected' : ''}>
      ${label}
    </option>

  `).join('');

  // Exchange table rows
  const rows = filtered.map(e => `

    <tr>

      <td>
        ${h(e.offer_skill)}
        ↔
        ${h(e.learn_skill)}
      </td>

      <td>
        ${h(e.sender?.full_name)}
        &amp;
        ${h(e.receiver?.full_name)}
      </td>

      <td>
        ${date(e.created_at)}
      </td>

      <td>
        ${pill(e.status)}
      </td>

      <td>
        ${h(e.session_status || 'Not scheduled')}
      </td>

    </tr>

  `).join('');

  // Render Monitor Exchanges page
  return heading(
    'Keep a pulse on every exchange.',
    'Visibility into requests and sessions — without getting in the way of learning.'
  ) + `

    <!-- SEARCH AND FILTER SECTION -->

    <form
      id="adminExchangesSearchForm"
      class="admin-user-filters"
      role="search">

      <label class="admin-search-label">

        Search Exchanges

        <input
          type="search"
          name="q"
          maxlength="100"
          placeholder="Search student name or skill..."
          value="${h(state.adminExchangeQuery)}">

      </label>

      <label class="admin-status-label">

        Exchange Status

        <select name="status">
          ${statusOptions}
        </select>

      </label>

      <button
        type="submit"
        class="btn primary">

        Search

      </button>

      <button
        type="button"
        class="btn"
        data-action="admin-exchanges-clear">

        Clear Filters

      </button>

    </form>

    <!-- RESULT COUNT -->

    <p class="admin-result-count">
      ${filtered.length} of ${items.length} exchange(s) found
    </p>

    <!-- EXCHANGE TABLE -->

    <div class="card admin-table-wrapper">

      <table class="admin-table">

        <thead>
          <tr>
            <th>Exchange</th>
            <th>Partners</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Session</th>
          </tr>
        </thead>

        <tbody>

          ${rows || `

            <tr>
              <td
                colspan="5"
                class="admin-empty-row">

                No exchanges found.
                Try another search or clear your filters.

              </td>
            </tr>

          `}

        </tbody>

      </table>

    </div>

  `;
}


  // ==========================================
  // ADMIN - REPORTS
  // ==========================================

  async function pageAdminReports() {
    const d = await api('/admin/reports');

    const top = Math.max(
      1,
      ...d.popular_skills.map(x => x.count)
    );

    const stats = [
      ['Requests created', d.requests],
      ['Requests accepted', d.accepted],
      ['Sessions scheduled', d.scheduled],
      ['Exchanges completed', d.completed]
    ];

    return heading(
      'Shared skills. Measurable impact.',
      'Understand how students discover, connect and learn together.'
    ) + `

      <div class="stats-grid">
        ${stats.map(([label, value]) => `
          <div class="card stat-card">
            <div class="eyebrow">${label}</div>

            <div
              class="stat-value"
              style="margin-top:18px">
              ${value}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="two-cols">
        <div class="card">
          <h3>Most popular skills</h3>

          <p class="muted small">
            By number of students learning
          </p>

          <div style="margin-top:20px">
            ${
              d.popular_skills.map(x =>
                chartBar(
                  x.skill,
                  x.count,
                  top
                )
              ).join('') || '<p>No data yet.</p>'
            }
          </div>
        </div>

        <div class="card">
          <h3>Average session rating</h3>

          <div
            class="stat-value"
            style="color:var(--purple);margin-top:25px">
            ${d.average_rating ?? '—'} / 5
          </div>

          <p class="muted small">
            Based on feedback left after completed sessions.
          </p>
        </div>
      </div>
    `;
  }

  // ==========================================
  // MODAL FUNCTIONS
  // ==========================================

  function closeModal() {
    $('#modalHost').hidden = true;
    $('#modalHost').innerHTML = '';
  }

  function modal(title, desc, formInner, onSubmit) {
    const host = $('#modalHost');

    host.hidden = false;

    host.innerHTML = `
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="${h(title)}">

        <button
          class="modal-close"
          type="button"
          data-action="modal-close">
          ×
        </button>

        <h2>${h(title)}</h2>

        <p>${h(desc)}</p>

        <form id="modalForm">
          ${formInner}

          <div class="form-actions">
            <button
              type="button"
              class="btn"
              data-action="modal-close">
              Cancel
            </button>

            <button
              type="submit"
              class="btn primary">
              Save / Continue
            </button>
          </div>

          <div
            id="modalError"
            class="form-error"
            hidden>
          </div>
        </form>
      </div>
    `;

    $('#modalForm').addEventListener(
      'submit',
      async e => {
        e.preventDefault();

        const btn = $('#modalForm button[type=submit]');
        btn.disabled = true;

        try {
          await onSubmit(
            Object.fromEntries(
              new FormData(e.currentTarget).entries()
            )
          );

          closeModal();
          await render();

        } catch (err) {
          const errEl = $('#modalError');

          errEl.hidden = false;
          errEl.textContent = err.message;

          btn.disabled = false;
        }
      }
    );
  }

  // ==========================================
  // ADD / EDIT SKILL MODAL
  // ==========================================

  async function modalSkill(kind = 'teach', itemId = null) {
    const mine = await api('/my-skills');

    const existing = [
      ...mine.teach,
      ...mine.learn
    ].find(x => x.id === itemId);

    const options = state.skills.map(s => `
      <option
        ${
          existing && existing.skill.id === s.id
            ? 'selected'
            : ''
        }
        value="${s.id}">
        ${h(s.name)} (${h(s.category)})
      </option>
    `).join('');

    modal(
      existing
        ? 'Make your skill shine.'
        : 'Add a little more possibility.',

      'Choose a skill and tell the community where you’re at.',

      `
        <label>
          Skill Type

          <select
            name="kind"
            ${existing ? 'disabled' : ''}>

            <option
              value="teach"
              ${kind === 'teach' ? 'selected' : ''}>
              I can teach
            </option>

            <option
              value="learn"
              ${kind === 'learn' ? 'selected' : ''}>
              I want to learn
            </option>
          </select>
        </label>

        <label>
          Skill Name

          <select
            name="skill_id"
            ${existing ? 'disabled' : ''}>
            ${options}
          </select>
        </label>

        <label
          id="proficiencyLabel"
          style="${kind === 'learn' ? 'display:none' : ''}">

          Proficiency (teaching only)

          <select name="proficiency">
            ${
              ['Beginner', 'Intermediate', 'Advanced']
                .map(x => `
                  <option
                    ${
                      existing && x === existing.proficiency
                        ? 'selected'
                        : ''
                    }>
                    ${x}
                  </option>
                `).join('')
            }
          </select>
        </label>

        <label>
          Short Description

          <textarea
            name="description"
            maxlength="300">${h(existing?.description || '')}</textarea>
        </label>
      `,

      async d => {
        if (existing) {
          await write(
            '/my-skills/' + existing.id,
            'PATCH',
            {
              proficiency: d.proficiency,
              description: d.description
            }
          );
        } else {
          await write(
            '/my-skills',
            'POST',
            {
              skill_id: Number(d.skill_id),
              kind: d.kind,
              proficiency: d.proficiency,
              description: d.description
            }
          );
        }

        toast('Your skills have been updated!');
      }
    );

    const typeSelect = $('#modalForm select[name=kind]');

    if (typeSelect) {
      typeSelect.addEventListener(
        'change',
        e => {
          $('#proficiencyLabel').style.display =
            e.target.value === 'teach' ? '' : 'none';
        }
      );
    }
  }

  // ==========================================
  // EXCHANGE REQUEST MODAL
  // ==========================================

  async function modalExchange(uid) {
    const [p, mine] = await Promise.all([
      api('/partners/' + uid),
      api('/my-skills')
    ]);

    const myWanted = new Set(
      mine.learn.map(x => x.skill.id)
    );

    const offered = [...p.skills.teach].sort(
      (a, b) =>
        Number(myWanted.has(b.skill.id)) -
        Number(myWanted.has(a.skill.id))
    );

    if (!offered.length) {
      toast(
        'This partner has not listed a skill to teach yet.'
      );
      return;
    }

    if (!mine.teach.length) {
      toast(
        'Add a skill you can teach before requesting an exchange.'
      );
      return;
    }

    modal(
      'Start something good.',

      'Send ' +
      p.user.full_name +
      ' a skill exchange invitation.',

      `
        <label>
          Skill I Want to Learn

          <select name="learn_skill_id">
            ${offered.map(x => `
              <option value="${x.skill.id}">
                ${h(x.skill.name)}
              </option>
            `).join('')}
          </select>
        </label>

        <label>
          Skill I Can Offer

          <select name="offer_skill_id">
            ${mine.teach.map(x => `
              <option value="${x.skill.id}">
                ${h(x.skill.name)}
              </option>
            `).join('')}
          </select>
        </label>

        <label>
          Optional Message

          <textarea
            name="message"
            maxlength="500"
            placeholder="Hi! I would love to exchange skills with you.">
          </textarea>
        </label>
      `,

      async d => {
        await write('/exchanges', 'POST', {
          receiver_id: uid,
          learn_skill_id: Number(d.learn_skill_id),
          offer_skill_id: Number(d.offer_skill_id),
          message: d.message
        });

        toast('Your exchange request is on its way!');
      }
    );
  }

  // ==========================================
  // SESSION DETAILS MODAL
  // ==========================================

  async function modalSessionDetails(id) {
    const { items } = await api('/sessions');

    const s = items.find(x => x.id === id);

    if (!s) return;

    const canComplete =
      new Date(s.ends_at) < new Date() &&
      s.status === 'scheduled';

    modal(
      'Your next learning moment.',

      'Session details',

      `
        <div class="banner">
          <strong>
            ${h(s.exchange.learn_skill)}
            × ${h(s.exchange.offer_skill)}
          </strong>
        </div>

        <p>
          ${datetime(s.starts_at)}
          –
          ${
            new Date(s.ends_at).toLocaleTimeString(
              'en-MY',
              { timeStyle: 'short' }
            )
          }
        </p>

        <p>
          ${cap(s.method)}
          · ${h(s.meeting_detail)}
        </p>

        <p class="muted">
          ${h(s.notes)}
        </p>

        <input
          type="hidden"
          name="action"
          value="${canComplete ? 'completed' : 'none'}">
      `,

      async d => {
        if (d.action === 'completed') {
          await write(
            '/sessions/' + id,
            'PATCH',
            { status: 'completed' }
          );

          toast('Session marked complete!');
        } else {
          toast('Session details closed');
        }
      }
    );

    $('#modalForm button[type=submit]').textContent =
      canComplete
        ? 'Mark as Completed'
        : 'Close Details';
  }

  // ==========================================
  // REVIEW MODAL
  // ==========================================

  async function modalReview(id) {
    modal(
      'How did your exchange go?',

      'A little feedback helps the whole community grow.',

      `
        <label>
          Rating

          <select name="rating">
            ${[5, 4, 3, 2, 1].map(i => `
              <option value="${i}">
                ${'★'.repeat(i)} (${i}/5)
              </option>
            `).join('')}
          </select>
        </label>

        <label>
          Your Feedback

          <textarea
            name="feedback"
            maxlength="500"
            required
            placeholder="What did you enjoy or learn?">
          </textarea>
        </label>
      `,

      async d => {
        await write(
          '/sessions/' + id + '/reviews',
          'POST',
          {
            rating: Number(d.rating),
            feedback: d.feedback
          }
        );

        toast('Thanks for your review!');
      }
    );
  }

  // ==========================================
  // ADMIN CATEGORY MODAL
  // ==========================================

  function modalCategory(id = null) {
    const cat = state.categories.find(
      x => x.id === id
    );

    modal(
      cat
        ? 'Edit skill category'
        : 'Make room for a new skill.',

      'Organise discovery with clear, useful skill categories.',

      `
        <label>
          Category Name

          <input
            name="name"
            value="${h(cat?.name || '')}"
            required
            minlength="2"
            maxlength="75">
        </label>
      `,

      async d => {
        await write(
          cat
            ? '/admin/categories/' + id
            : '/admin/categories',

          cat ? 'PATCH' : 'POST',

          { name: d.name }
        );

        const out = await api('/categories');

        state.categories = out.items;

        toast('Category saved.');
      }
    );
  }

  // ==========================================
  // ALL BUTTON CLICK HANDLERS
  // ==========================================

  document.addEventListener('click', async e => {

    if (e.target.id === 'modalHost') {
      closeModal();
      return;
    }

    const node = e.target.closest(
      '[data-view],[data-action]'
    );

    if (!node) return;

    const view = node.dataset.view;
    const action = node.dataset.action;
    const id = Number(node.dataset.id);

    if (view) {
      await navigate(view);
      return;
    }

    try {
      switch (action) {

        case 'partner':
          state.partnerId = id;
          await navigate('partner');
          break;

        case 'request':
          await modalExchange(id);
          break;

        case 'category':
          state.exploreCategory = node.dataset.id;
          await render();
          break;

        case 'request-tab':
          state.requestTab = node.dataset.tab;
          await render();
          break;

        case 'session-tab':
          state.sessionTab = node.dataset.tab;
          await render();
          break;

        case 'add-skill':
          await modalSkill(node.dataset.kind || 'teach');
          break;

        case 'edit-skill':
          await modalSkill('teach', id);
          break;

        case 'delete-skill':
          if (confirm('Remove this skill from your profile?')) {
            await write(
              '/my-skills/' + id,
              'DELETE'
            );

            toast('Skill removed');
            await render();
          }
          break;

        case 'exchange-update':
          if (confirm(
            `Mark this request as ${node.dataset.status}?`
          )) {
            await write(
              '/exchanges/' + id,
              'PATCH',
              { status: node.dataset.status }
            );

            toast('Exchange request updated');
            await render();
          }
          break;

        case 'schedule':
          state.exchangeId = id;
          await navigate('schedule');
          break;

        case 'session-details':
          await modalSessionDetails(id);
          break;

        case 'review':
          await modalReview(id);
          break;

        case 'notification':
          await write(
            '/notifications/' + id,
            'PATCH'
          );

          await navigate(
            node.dataset.target || 'notifications'
          );
          break;

        case 'read-all':
          await write(
            '/notifications/read-all',
            'POST'
          );

          await render();
          break;

        case 'onboard-back':
          state.onboardStep = Math.max(
            1,
            state.onboardStep - 1
          );

          await render();
          break;

        case 'onboard-next':
          if (state.onboardStep < 3) {
            state.onboardStep++;
            await render();
          } else {
            await write(
              '/onboarding/complete',
              'POST'
            );

            state.me.onboarded = true;

            toast('Welcome to SkillSwap!');
            await navigate('matches');
          }
          break;

        // ADMIN: VIEW STUDENT DETAILS
        case 'admin-view-user':
          await showAdminUserDetails(id);
          break;

        case 'admin-exchanges-clear':

          state.adminExchangeQuery = '';
          state.adminExchangeStatus = 'all';

          await render();
          break;

        // ADMIN: CLEAR SEARCH AND FILTER
        case 'admin-users-clear':
          state.adminUserQuery = '';
          state.adminUserStatus = 'all';
          await render();
          break;

        // ADMIN: ACTIVATE / DEACTIVATE STUDENT
        case 'admin-toggle-user':
          if (confirm('Change this student account status?')) {
            await write(
              '/admin/users/' + id,
              'PATCH',
              {
                active: node.dataset.active !== 'true'
              }
            );

            toast('Student account updated');
            await render();
          }
          break;

        case 'category-add':
          modalCategory();
          break;

        case 'category-edit':
          modalCategory(id);
          break;

        case 'category-delete':
          if (confirm(
            'Delete this skill category? Only empty categories can be removed.'
          )) {
            await write(
              '/admin/categories/' + id,
              'DELETE'
            );

            state.categories = (
              await api('/categories')
            ).items;

            await render();
          }
          break;

        case 'modal-close':
          closeModal();
          break;
      }

    } catch (err) {
      toast(err.message);
    }
  });

  // ==========================================
  // ALL FORM SUBMIT HANDLERS
  // ==========================================

  document.addEventListener('submit', async e => {

    const allowedForms = [
      'searchForm',
      'scheduleForm',
      'profileForm',
      'onboardProfile',
      'adminUsersSearchForm',
      'globalSearchForm',
      'adminExchangesSearchForm'
    ];

    if (!allowedForms.includes(e.target.id)) return;

    e.preventDefault();

    const f = Object.fromEntries(
      new FormData(e.target).entries()
    );

    try {
      switch (e.target.id) {

      case 'adminExchangesSearchForm':

        state.adminExchangeQuery = (f.q || '').trim();

        state.adminExchangeStatus = f.status || 'all';

        await render();
        break;

        // ADMIN SEARCH AND FILTER
        case 'adminUsersSearchForm':
          state.adminUserQuery = (f.q || '').trim();
          state.adminUserStatus = f.status || 'all';
          await render();
          break;

        // GLOBAL SEARCH BAR
        case 'globalSearchForm': {
          const query = (f.q || '').trim();

          if (!query) break;

          if (state.me.role === 'admin') {
            state.adminUserQuery = query;
            state.adminUserStatus = 'all';

            await navigate('admin-users');
          } else {
            state.exploreSearch = query;
            state.exploreCategory = '';
            state.exploreLevel = '';

            await navigate('explore');
          }

          break;
        }

        // STUDENT EXPLORE SKILLS
        case 'searchForm':
          state.exploreSearch = (f.q || '').trim();
          state.exploreCategory = f.category_id || '';
          state.exploreLevel = f.level || '';

          await render();
          break;

        // STUDENT PROFILE
        case 'profileForm':
          state.me = (
            await write(
              '/profile',
              'PATCH',
              f
            )
          ).user;

          toast('Profile updated!');
          await navigate('profile');
          break;

        // STUDENT ONBOARDING
        case 'onboardProfile':
          state.me = (
            await write(
              '/profile',
              'PATCH',
              f
            )
          ).user;

          state.onboardStep = 2;

          await render();
          break;

        // SCHEDULE LEARNING SESSION
        case 'scheduleForm': {
          const start = new Date(
            `${f.date}T${f.start}`
          );

          const end = new Date(
            `${f.date}T${f.end}`
          );

          if (
            Number.isNaN(+start) ||
            Number.isNaN(+end) ||
            end <= start
          ) {
            throw new Error(
              'End time must be later than start time'
            );
          }

          await write(
            '/sessions',
            'POST',
            {
              exchange_id: Number(f.exchange_id),
              starts_at: start.toISOString(),
              ends_at: end.toISOString(),
              method: f.method,
              meeting_detail: f.meeting_detail,
              notes: f.notes
            }
          );

          toast('Session scheduled successfully!');

          state.sessionTab = 'upcoming';

          await navigate('sessions');
          break;
        }
      }

    } catch (err) {
      toast(err.message);
    }
  });

  // ==========================================
  // LOGOUT
  // ==========================================

  $('#logoutButton').addEventListener(
    'click',
    async () => {
      try {
        await write(
          '/auth/logout',
          'POST'
        );

        window.location.href = '/login';

      } catch (err) {
        toast(err.message);
      }
    }
  );

  // ==========================================
  // BROWSER BACK / FORWARD
  // ==========================================

  window.addEventListener(
    'popstate',
    async () => {
      state.view =
        new URLSearchParams(location.search)
          .get('view') || 'dashboard';

      await render();
    }
  );

  // ==========================================
  // INITIALIZE SKILLSWAP
  // ==========================================

  (async () => {
    try {
      state.csrf =
        document.querySelector(
          'meta[name="csrf-token"]'
        )?.content || '';

      if (!state.csrf) {
        await refreshCsrf();
      }

      state.me = (
        await api('/me')
      ).user;

      [
        state.categories,
        state.skills
      ] = await Promise.all([
        api('/categories').then(x => x.items),
        api('/skills').then(x => x.items)
      ]);

      if (
        state.me.role === 'admin' &&
        !state.view.startsWith('admin-')
      ) {
        state.view = 'admin-dashboard';
      }

      if (
        state.me.role === 'student' &&
        state.view.startsWith('admin-')
      ) {
        state.view = 'dashboard';
      }

      if (
        state.me.role === 'student' &&
        !state.me.onboarded &&
        state.view !== 'onboarding'
      ) {
        state.view = 'onboarding';
      }

      await render();

    } catch (err) {
      $('#content').textContent =
        'Unable to start SkillSwap: ' + err.message;
    }
  })();

})();
