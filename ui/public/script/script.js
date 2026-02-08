
(function () {
  function redirectToLogin(msg) {
    if (msg) alert(msg);
    window.location.href = '/login.html?error=login_required';
  }

  // wrapper for fetch that auto-redirects on 401/403
  async function apiFetch(url, options = {}, { on401Message, on403Message, redirect403To } = {}) {
    const res = await fetch(url, options);

    if (res.status === 401) {
      redirectToLogin(on401Message || 'Please log in.');
      // return a never-resolving promise to stop caller flow
      return new Promise(() => {});
    }

    if (res.status === 403) {
      if (on403Message) alert(on403Message);
      if (redirect403To) window.location.href = redirect403To;
      else window.location.href = '/main.html';
      return new Promise(() => {});
    }

    return res;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // token autofill (reset page)
    const tokenInput = document.getElementById('token');
    if (tokenInput) {
      tokenInput.value = new URLSearchParams(window.location.search).get('token') || '';
    }

    const favWrapper = document.querySelector('.wrapper-poster-liked');

    // who am i for comments owner check
    let myUserId = null;
    try {
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const me = await meRes.json();
        myUserId = me.id || null;
      }
    } catch {}

    function normalizeType(t) {
      if (t === 'tvSeries' || t === 'tv') return 'tv';
      return 'movie';
    }

    function watchUrl(id, type) {
      const t = normalizeType(type);
      return `/watch.html?id=${encodeURIComponent(id)}&type=${encodeURIComponent(t)}`;
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp')
        .replaceAll('<', '&lt')
        .replaceAll('>', '&gt')
        .replaceAll('"', '&quot')
        .replaceAll("'", '&#039');
    }

    // wrappers for poster
    const movieWrapper = document.querySelector('.wrapper-poster.movie');
    const seriesWrapper = document.querySelector('.wrapper-poster.show');

    // fetch likeditems if poster exists
    let likedItems = [];
    if (movieWrapper || seriesWrapper) {
      try {
        const res = await fetch('/api/liked');
        if (res.ok) likedItems = await res.json();
      } catch (err) {
        console.log('Error fetching liked items:', err);
      }
    }

    // create posters
    function createPoster(item, wrapper, type = 'movie') {
      const poster = document.createElement('div');
      poster.className = 'poster';

      poster.innerHTML = `
        <div class="poster-wrapper" data-id="${item._id}" data-type="${type}">
          <img src="${item.poster}" alt="${escapeHtml(item.title)}">
          <img class="fav" src="/others/non_like.png">
        </div>
      `;

      const posterWrapper = poster.querySelector('.poster-wrapper');
      const heart = posterWrapper.querySelector('.fav');

      // is liked?
      const isLiked = likedItems.some(l => l.itemId === item._id && l.type === type);
      if (isLiked) {
        heart.src = '/others/like.png';

        // add clone to favourites wrapper
        if (favWrapper) {
          const clone = posterWrapper.cloneNode(true);
          clone.querySelector('.fav').src = '/others/like.png';

          clone.addEventListener('click', (e) => {
            if (e.target.classList.contains('fav')) return;
            window.location.href = watchUrl(item._id, type);
          });

          favWrapper.appendChild(clone);
        }
      }

      // main => watch
      posterWrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav')) return;
        window.location.href = watchUrl(item._id, type);
      });

      poster.addEventListener('mouseenter', () => {
        poster.querySelector('img').style.opacity = '0.4';
      });
      poster.addEventListener('mouseleave', () => {
        poster.querySelector('img').style.opacity = '1';
      });

      wrapper.appendChild(poster);
    }

    // load movies
    if (movieWrapper) {
      try {
        const res = await apiFetch('/api/movies', {}, { on401Message: 'Please log in to view movies.' });
        const movies = await res.json().catch(() => []);
        movies.forEach(m => createPoster(m, movieWrapper, 'movie'));
      } catch (err) {
        console.log('Error loading movies:', err);
      }
    }

    // load tv series
    if (seriesWrapper) {
      try {
        const res = await apiFetch('/api/tv-series', {}, { on401Message: 'Please log in to view TV series.' });
        const series = await res.json().catch(() => []);
        series.forEach(s => createPoster(s, seriesWrapper, 'tvSeries'));
      } catch (err) {
        console.log('Error loading tv-series:', err);
      }
    }

    // watch page content
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const watchType = params.get('type'); // movie или tv

    if (id) {
      let item = null;

      async function tryLoad(url) {
        try {
          const res = await apiFetch(url, {}, { on401Message: 'Please log in to watch.' });
          if (res.ok) return await res.json();
        } catch {}
        return null;
      }

      if (watchType === 'movie') {
        item = await tryLoad(`/api/movies/watch?id=${encodeURIComponent(id)}`);
      } else if (watchType === 'tv') {
        item = await tryLoad(`/api/tvSeries/watch?id=${encodeURIComponent(id)}`);
      }

      // fallback
      if (!item) item = await tryLoad(`/api/movies/watch?id=${encodeURIComponent(id)}`);
      if (!item) item = await tryLoad(`/api/tvSeries/watch?id=${encodeURIComponent(id)}`);

      if (item) {
        const iframeEl = document.querySelector('.iframe');
        const titleEl = document.querySelector('.title');
        const genreEl = document.querySelector('.genre');
        const descEl = document.querySelector('.description');
        const durationEl = document.querySelector('.duration');

        if (iframeEl) iframeEl.src = item.iframe || '';
        if (titleEl) titleEl.textContent = "title: " + (item.title || '');
        if (genreEl) genreEl.textContent = "genre: " + (item.genre || '');
        if (descEl) descEl.textContent = "description: " + (item.description || '');
        if (durationEl) durationEl.textContent = "duration: " + (item.duration || '');

        if (item.season) {
          const sEl = document.querySelector('.s');
          if (sEl) sEl.textContent = item.season;
        }
        if (item.episode) {
          const eEl = document.querySelector('.e');
          if (eEl) eEl.textContent = item.episode;
        }

        // set heart on watch page
        try {
          const likedRes = await apiFetch('/api/liked', {}, { on401Message: 'Please log in.' });
          const likedArr = await likedRes.json().catch(() => []);
          const heart = document.querySelector('.fav');
          if (heart && likedArr.some(l => l.itemId === id)) {
            heart.src = '/others/like.png';
          }
        } catch {}

        // comments
        const commentInput = document.getElementById('comment');
        const display = document.getElementById('display-comments');

        async function loadComments() {
          if (!display) return;

          const t = (watchType === 'movie' || watchType === 'tv') ? watchType : null;
          if (!t) {
            display.innerHTML = '<i>Comments: missing type in URL. Open with &type=movie or &type=tv</i>';
            return;
          }

          const res = await apiFetch(
            `/api/comments?itemId=${encodeURIComponent(id)}&type=${encodeURIComponent(t)}`,
            {},
            { on401Message: 'Please log in to view comments.' }
          );

          const data = await res.json().catch(() => []);

          if (!res.ok) {
            display.innerHTML = `<i>Error loading comments</i>`;
            return;
          }

          const comments = Array.isArray(data) ? data : [];
          if (comments.length === 0) {
            display.innerHTML = '<i>No comments yet</i>';
            return;
          }

          display.innerHTML = comments.map(c => {
            const isMine = myUserId && c.userId === myUserId;
            const edited = c.editedAt ? ' <small>(edited)</small>' : '';

          return `
            <div class="one-comment d-flex justify-content-between align-items-start py-2" data-cid="${c._id}">
              
              <div class="comment-left">
                <div class="comment-head">
                  <b>${escapeHtml(c.userName || 'User')}</b>
                  <div class="comment-date">${formatDate(c.createdAt)}${edited}</div>
                </div>

                <div class="comment-text">
                  ${escapeHtml(c.text || '')}
                </div>
              </div>

              ${isMine ? `
                <div class="d-flex gap-2 comment-actions">
                  <button class="btn btn-sm btn-warning c-edit">Edit</button>
                  <button class="btn btn-sm btn-danger c-del">Delete</button>
                </div>
              ` : ''}

            </div>
          `;
          }).join('');
        }

        // add new comment 
        if (commentInput) {
          commentInput.addEventListener('keydown', async (e) => {
            if (e.key !== 'Enter') return;

            const text = commentInput.value.trim();
            if (!text) return;

            const t = (watchType === 'movie' || watchType === 'tv') ? watchType : null;
            if (!t) {
              alert('Missing type in URL. Use &type=movie or &type=tv');
              return;
            }

            const res = await apiFetch(
              '/api/comments',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: id, type: t, text })
              },
              { on401Message: 'Please log in to comment.' }
            );

            if (!res.ok) {
              alert('Error posting comment');
              return;
            }

            commentInput.value = '';
            loadComments();
          });
        }

        // edit/delete buttons 
        if (display) {
          display.addEventListener('click', async (e) => {
            const wrap = e.target.closest('.one-comment');
            if (!wrap) return;

            const cid = wrap.dataset.cid;
            if (!cid) return;

            const t = (watchType === 'movie' || watchType === 'tv') ? watchType : null;
            if (!t) return;

            // edit
            if (e.target.classList.contains('c-edit')) {
              const currentText = wrap.querySelector('.c-text')?.textContent || '';
              const newText = prompt('Edit your comment:', currentText);
              if (newText === null) return;

              const res = await apiFetch(
                `/api/comments/${encodeURIComponent(cid)}`,
                {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ itemId: id, type: t, text: newText })
                },
                {
                  on401Message: 'Please log in to edit comments.',
                  on403Message: 'You can edit only your own comments.',
                  redirect403To: '/main.html'
                }
              );

              if (!res.ok) {
                alert('Edit failed');
                return;
              }

              loadComments();
              return;
            }

            // delete
            if (e.target.classList.contains('c-del')) {
              if (!confirm('Delete this comment?')) return;

              const res = await apiFetch(
                `/api/comments/${encodeURIComponent(cid)}`,
                {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ itemId: id, type: t })
                },
                {
                  on401Message: 'Please log in to delete comments.',
                  on403Message: 'You can delete only your own comments.',
                  redirect403To: '/main.html'
                }
              );

              if (!res.ok) {
                alert('Delete failed');
                return;
              }

              loadComments();
            }
          });
        }
        // init load
        loadComments();
      }
    }

    // toggle like
    async function toggleLike(posterWrapper) {
      const id = posterWrapper.dataset.id;
      const type = posterWrapper.dataset.type || 'movie';

      const mainHeart = document.querySelector(`.wrapper-poster .poster-wrapper[data-id="${id}"] .fav`);
      const favWrapperPoster = document.querySelector(`.wrapper-poster-liked .poster-wrapper[data-id="${id}"]`);

      try {
        const res = await apiFetch(
          '/api/like',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type })
          },
          { on401Message: 'Please log in to like items.' }
        );

        if (!res.ok) {
          alert('Like failed');
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (data.liked) {
          if (mainHeart) mainHeart.src = '/others/like.png';

          if (!favWrapperPoster && favWrapper) {
            const clone = posterWrapper.cloneNode(true);
            clone.querySelector('.fav').src = '/others/like.png';

            clone.addEventListener('click', (e) => {
              if (e.target.classList.contains('fav')) return;
              window.location.href = watchUrl(id, type);
            });

            favWrapper.appendChild(clone);
          }
        } else {
          if (mainHeart) mainHeart.src = '/others/non_like.png';
          if (favWrapperPoster && favWrapperPoster.parentElement) {
            favWrapperPoster.parentElement.removeChild(favWrapperPoster);
          }
        }
      } catch (err) {
        console.log('Error toggling like:', err);
      }
    }

    // global listener for hearts
    document.body.addEventListener('click', (e) => {
      if (!e.target.classList.contains('fav')) return;
      e.stopPropagation();
      const poster = e.target.closest('.poster-wrapper');
      if (poster) toggleLike(poster);
    });

    // error box in auth page
    const errorBox = document.getElementById('error-msg');
    if (errorBox) {
      const err = new URLSearchParams(window.location.search).get('error');
      if (err === 'invalid') {
        errorBox.textContent = 'Invalid credentials';
        errorBox.classList.remove('d-none');
      } else if (err === 'exists') {
        errorBox.textContent = 'User already exists';
        errorBox.classList.remove('d-none');
      } else if (err === 'server') {
        errorBox.textContent = 'Server error, try again';
        errorBox.classList.remove('d-none');
      } else if (err === 'login_required') {
        errorBox.textContent = 'Please log in first';
        errorBox.classList.remove('d-none');
      }
    }

    // recoveryKey popup
    const rk2 = new URLSearchParams(window.location.search).get('recoveryKey');
    if (rk2) {
      const box = document.createElement('div');
      box.className = 'position-fixed top-50 start-50 translate-middle';
      box.style.zIndex = '9999';
      box.innerHTML = `
        <div style="
          background:#161515;
          color:#fff;
          padding:20px;
          border-radius:14px;
          box-shadow:0 15px 40px rgba(0,0,0,0.6);
          width:100%;
          max-width:420px;
          border:1px solid rgba(255,255,255,0.12);
        ">
          <h5 style="margin:0 0 10px 0;">Save your recovery key</h5>

          <input class="form-control my-2" value="${rk2}" readonly>

          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-warning w-100" id="rk-copy">Copy</button>
            <button class="btn btn-outline-light w-100" id="rk-close">OK</button>
          </div>
        </div>
      `;

      document.body.appendChild(box);

      document.getElementById('rk-copy').onclick = async () => {
        try {
          await navigator.clipboard.writeText(rk2);
          alert('Copied!');
        } catch {
          alert('Copy failed');
        }
      };

      document.getElementById('rk-close').onclick = () => box.remove();
    }
  });

  // logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fetch('/api/logout', { method: 'POST' }).then(() => {
        window.location.href = '/landing.html';
      });
    });
  }

  // show username if logged
  fetch('/api/me')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      const el = document.getElementById('username-display');
      if (el) el.innerText = data.name;
    })
    .catch(() => {
      const el = document.getElementById('username-display');
      if (el) window.location.href = '/login.html?error=login_required';
    });
})();
