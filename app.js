/**
 * DÉBRIEF TECHNIQUE · CÔTE OUEST — app.js (interface PWA)
 * Version 1.1.0 (lot 1) — à garder identique à APP_VERSION ci-dessous et à VERSION dans sw.js.
 */
(function () {
  'use strict';

  const APP_VERSION = '1.1.0';
  const CFG = window.APP_CONFIG || {};
  const LOGO = 'logo-blanc.png';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  /* =========================================================
     ÉTAT
     ========================================================= */
  const store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  const S = {
    token: store.get('co_token'),
    user: null,
    screen: 'boot',
    events: [],
    ev: null,
    tab: 'mc',
    day: null,
    draft: { texte: '', gravite: 'info', photos: [] },
    editId: null,
    keptPhotos: [],
    removePhotos: [],
    admin: null,
    adminTab: 'demandes',
    form: null,
    login: { step: 'email', email: store.get('co_email') || '', nom: '', error: '' },
    sending: false
  };

  /* =========================================================
     PICTOS
     ========================================================= */
  function svg(paths, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  const I = {
    back: svg('<path d="M15 18l-6-6 6-6"/>'),
    camera: svg('<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>'),
    gallery: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
    pen: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
    team: svg('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/>'),
    pin: svg('<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>'),
    locate: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    close: svg('<path d="M18 6L6 18M6 6l12 12"/>')
  };
  const GRAV = {
    info: { label: 'Info', short: 'Info', svg: svg('<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5v.01"/>', 2.2) },
    idee: { label: 'Bonne idée', short: 'Idée', svg: svg('<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0012 2z"/>', 2.2) },
    attention: { label: 'Attention', short: 'Attention', svg: svg('<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17v.01"/>', 2.2) },
    critique: { label: 'Critique', short: 'Critique', svg: svg('<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="M12 7.5v5M12 16.5v.01"/>', 2.2) }
  };

  /* =========================================================
     OUTILS
     ========================================================= */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel) { return document.querySelector(sel); }
  const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const JOURS_L = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function parseD(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function today() { return iso(new Date()); }
  function fmtShort(s) { const d = parseD(s); return JOURS[d.getDay()] + ' ' + d.getDate(); }
  function fmtLong(s) { const d = parseD(s); return JOURS_L[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; }
  function fmtRange(a, b) {
    if (!a) return '';
    const A = parseD(a), B = parseD(b || a);
    if (a === b) return A.getDate() + ' ' + MOIS[A.getMonth()] + ' ' + A.getFullYear();
    if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) return A.getDate() + ' → ' + B.getDate() + ' ' + MOIS[B.getMonth()] + ' ' + B.getFullYear();
    return A.getDate() + ' ' + MOIS[A.getMonth()] + ' → ' + B.getDate() + ' ' + MOIS[B.getMonth()] + ' ' + B.getFullYear();
  }
  function evState(e) {
    const t = today();
    if (t < e.dateDebut) return 'avenir';
    if (t > e.dateFin) return 'termine';
    return 'encours';
  }
  function mapsUrl(e) {
    if (e.lat && e.lng) return 'https://www.google.com/maps/search/?api=1&query=' + e.lat + ',' + e.lng;
    if (e.adresse || e.lieu) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.adresse || e.lieu);
    return '';
  }
  function firstName(u) { return String((u && u.nom) || '').split(' ')[0]; }
  function initials(u) { return String((u && u.nom) || '?').split(' ').map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase(); }

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3400);
  }

  /* ---------- appels serveur ---------- */
  function post(fn, args) {
    if (!CFG.API_URL || CFG.API_URL.indexOf('COLLEZ') >= 0) return Promise.reject(new Error('Adresse du serveur manquante dans config.js.'));
    return fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, token: S.token, args: args || {} }),
      redirect: 'follow'
    }).then(function (res) {
      if (!res.ok) throw new Error('Serveur indisponible (' + res.status + '). Réessayez.');
      return res.json();
    }, function () {
      throw new Error('Pas de connexion. Vérifiez le réseau et réessayez.');
    });
  }
  function call(fn, args) {
    return post(fn, args).then(function (r) {
      if (r.ok) return r.data;
      if (r.auth) signOut(true);
      throw new Error(r.error || 'Erreur serveur.');
    });
  }
  function fail(err) { toast((err && err.message) || String(err)); }

  /* =========================================================
     RENDU
     ========================================================= */
  function render() {
    const app = $('#app');
    if (S.screen === 'boot') app.innerHTML = '<div class="spinner" role="img" aria-label="Chargement"></div>';
    else if (S.screen === 'login') app.innerHTML = vLogin();
    else if (S.screen === 'home') app.innerHTML = vHome();
    else if (S.screen === 'event') app.innerHTML = vEvent();
    else if (S.screen === 'admin') app.innerHTML = vAdmin();
    const ta = $('#draft');
    if (ta) autoGrow(ta);
  }

  function logoImg() { return '<img class="logo" src="' + LOGO + '" alt="Côte Ouest">'; }

  function barBack(title, sub, extra) {
    return '<header class="bar">' +
      '<button class="icon-btn" data-a="back" aria-label="Retour">' + I.back + '</button>' +
      '<div class="grow"><div class="t1">' + esc(title) + '</div>' + (sub ? '<div class="t2">' + esc(sub) + '</div>' : '') + '</div>' +
      (extra || '') + '</header>';
  }

  /* ---------- connexion ---------- */
  function vLogin() {
    const L = S.login;
    let panel = '';
    if (L.step === 'email' || L.step === 'name') {
      panel =
        '<div><label class="lbl" for="login-email">Adresse e-mail</label>' +
        '<input class="field" id="login-email" type="email" autocomplete="email" inputmode="email" value="' + esc(L.email) + '" placeholder="vous@exemple.fr"></div>' +
        (L.step === 'name' ? '<div><label class="lbl" for="login-nom">Prénom et nom</label>' +
          '<input class="field" id="login-nom" autocomplete="name" value="' + esc(L.nom) + '">' +
          '<p class="hint">Première connexion : votre demande sera validée par le directeur technique.</p></div>' : '') +
        '<button class="btn primary block" data-a="login-send">' + (L.step === 'name' ? 'Demander l’accès' : 'Recevoir un code par e-mail') + '</button>';
    } else if (L.step === 'code') {
      panel =
        '<p style="margin:0">Code envoyé à <b>' + esc(L.email) + '</b>. Il est valable 10 minutes.</p>' +
        '<div><label class="lbl" for="login-code">Code à 6 chiffres</label>' +
        '<input class="field code" id="login-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></div>' +
        '<button class="btn primary block" data-a="login-verify">Se connecter</button>' +
        '<div class="row2"><button class="btn" data-a="login-back">Changer d’adresse</button><button class="btn" data-a="login-send">Renvoyer</button></div>';
    } else if (L.step === 'pending') {
      panel = '<p style="margin:0"><b>Demande transmise.</b></p><p style="margin:0">Le directeur technique va valider votre accès. Vous recevrez un e-mail à <b>' + esc(L.email) + '</b> dès que c’est fait.</p>' +
        '<button class="btn block" data-a="login-back">Retour</button>';
    } else if (L.step === 'refused') {
      panel = '<p style="margin:0">L’accès n’est pas autorisé pour <b>' + esc(L.email) + '</b>. Contactez le directeur technique.</p>' +
        '<button class="btn block" data-a="login-back">Retour</button>';
    }
    return '<div class="login">' + logoImg() +
      '<h1 class="titre">DÉBRIEF<br>TECHNIQUE</h1>' +
      '<div class="panel">' + (L.error ? '<div class="err" role="alert">' + esc(L.error) + '</div>' : '') + panel + '</div></div>';
  }

  /* ---------- accueil ---------- */
  function vHome() {
    const groups = { encours: [], avenir: [], termine: [] };
    S.events.forEach(function (e) { groups[evState(e)].push(e); });
    groups.avenir.reverse();
    function card(e, strong) {
      const st = evState(e);
      const badge = st === 'encours' ? '<span class="badge live">En cours</span>' : st === 'avenir' ? '<span class="badge">À venir</span>' : '<span class="badge dark">Terminé</span>';
      return '<div class="card-wrap"><button class="card' + (strong ? ' strong' : '') + '" data-a="open-event" data-id="' + esc(e.id) + '">' +
        '<div class="card-row"><div><div class="titre" style="font-size:17px">' + esc(e.nom.toUpperCase()) + '</div>' +
        '<div class="muted" style="font-size:13px;margin-top:4px">' + esc([e.lieu, fmtRange(e.dateDebut, e.dateFin)].filter(Boolean).join(', ')) + '</div></div>' + badge + '</div>' +
        '<div style="font-size:13px">' + e.nbNotes + ' note' + (e.nbNotes > 1 ? 's' : '') + ' en main courante</div></button>' +
        (e.canEdit ? '<button class="icon-btn edit-fab" data-a="edit-event" data-id="' + esc(e.id) + '" aria-label="Modifier ' + esc(e.nom) + '">' + I.pen + '</button>' : '') +
        '</div>';
    }
    let html = '';
    if (groups.encours.length) html += '<div class="section-label">En cours</div>' + groups.encours.map(function (e) { return card(e, true); }).join('');
    if (groups.avenir.length) html += '<div class="section-label">À venir</div>' + groups.avenir.map(function (e) { return card(e); }).join('');
    if (groups.termine.length) html += '<div class="section-label">Terminés</div>' + groups.termine.map(function (e) { return card(e); }).join('');
    if (!S.events.length) html = '<div class="empty">Aucun événement ne vous est encore affecté.<br>Le directeur technique vous ajoutera à l’équipe d’un projet.</div>';
    return '<header class="bar">' + logoImg() +
      '<div class="brand grow">DÉBRIEF<br>TECHNIQUE</div>' +
      '<button class="avatar" data-a="account" aria-label="Mon compte">' + esc(initials(S.user)) + '</button></header>' +
      '<main><div><div class="muted">Bonjour ' + esc(firstName(S.user)) + '</div>' +
      '<h1 class="titre" style="margin:2px 0 0;font-size:22px">MES ÉVÉNEMENTS</h1></div>' + html +
      (S.user.isAdmin ? '<button class="btn ghost block" data-a="open-admin" style="margin-top:12px">' + I.gear + 'Espace admin</button>' : '') +
      '</main>';
  }

  /* ---------- événement ---------- */
  function phaseFromRanges(date) {
    const r = (S.ev.event.phases || []).find(function (p) { return p.debut <= date && date <= p.fin; });
    return r ? r.phase : '';
  }

  function dayList() {
    const e = S.ev.event;
    const meta = {};
    S.ev.days.forEach(function (d) { meta[d.date] = d; });
    const out = [];
    const counters = {};
    const d = parseD(e.dateDebut);
    const end = parseD(e.dateFin);
    let n = 0;
    while (d <= end && n < 120) {
      const k = iso(d);
      const m = meta[k] || {};
      const phase = m.phase || phaseFromRanges(k);
      n++;
      let label = 'Jour ' + n;
      if (phase) {
        counters[phase] = (counters[phase] || 0) + 1;
        label = phase + ' J' + counters[phase];
      }
      out.push({ date: k, label: label, phase: phase, ownPhase: m.phase || '', effectif: m.effectif || '', short: fmtShort(k) });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function vEvent() {
    const e = S.ev.event;
    const tabs = [['mc', 'Main courante'], ['deb', 'Débrief']];
    if (S.ev.previous) tabs.push(['prev', 'Édition préc.']);
    const map = mapsUrl(e);
    const extra =
      (map ? '<a class="icon-btn" href="' + esc(map) + '" target="_blank" rel="noopener" aria-label="Ouvrir le lieu dans Google Maps">' + I.pin + '</a>' : '') +
      (e.canEdit ? '<button class="icon-btn" data-a="edit-event" data-id="' + esc(e.id) + '" aria-label="Modifier l’événement">' + I.pen + '</button>' : '');
    let html = barBack(e.nom.toUpperCase(), [e.lieu, fmtRange(e.dateDebut, e.dateFin)].filter(Boolean).join(', '), extra) +
      '<nav class="tabs" role="tablist">' + tabs.map(function (t) {
        return '<button role="tab" data-a="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</nav>';
    if (S.tab === 'mc') html += vMainCourante();
    else if (S.tab === 'deb') html += '<main><div class="card"><p style="margin:0"><b>Le débrief final arrive à la prochaine étape.</b></p><p class="muted" style="margin:8px 0 0">En attendant, notez tout dans la main courante : ces notes serviront de base au débrief.</p></div></main>';
    else html += '<main><div class="card"><p style="margin:0"><b>' + esc(S.ev.previous.nom) + '</b></p><p class="muted" style="margin:8px 0 0">La lecture des bonnes idées et points de vigilance de l’édition précédente arrive avec le débrief.</p></div></main>';
    return html;
  }

  function vMainCourante() {
    const days = dayList();
    const cur = days.find(function (d) { return d.date === S.day; }) || days[0];
    const t = today();
    const strip = '<div class="days">' + days.map(function (d) {
      return '<button class="day' + (d.date === t ? ' today' : '') + '" data-a="day" data-date="' + d.date + '" aria-pressed="' + (d.date === cur.date) + '">' +
        '<small>' + esc(d.short) + (d.date === t ? ' · aujourd’hui' : '') + '</small><b>' + esc(d.label) + '</b></button>';
    }).join('') + '</div>';

    const entries = S.ev.entries.filter(function (x) { return x.date === cur.date; })
      .sort(function (a, b) { return b.heure.localeCompare(a.heure); });

    const head = '<div class="day-head"><div class="grow"><div style="font-weight:700">' + esc(fmtLong(cur.date)) + (cur.phase ? ' · ' + esc(cur.label) : '') + '</div>' +
      '<div class="eff">' + (cur.effectif ? esc(cur.effectif) : 'Effectif non renseigné') + '</div></div>' +
      '<button class="icon-btn" data-a="edit-day" aria-label="Renseigner la phase et l’effectif du jour">' + I.team + '</button></div>';

    const list = entries.length ? entries.map(vEntry).join('') :
      '<div class="empty">Aucune note pour cette journée.<br>Écrivez ou dictez dans le champ du bas.</div>';

    return strip + '<main>' + head + list + '</main>' + vComposer();
  }

  function gravTag(g) {
    const G = GRAV[g] || GRAV.info;
    return '<span class="grav g-' + g + '">' + G.svg + G.label + '</span>';
  }

  function vEntry(x) {
    const thumbs = x.photos.length ? '<div class="thumbs">' + x.photos.map(function (p) {
      return '<button class="thumb" data-a="photo" data-id="' + esc(p.id) + '" aria-label="Agrandir la photo">' + (p.thumb ? '<img src="' + esc(p.thumb) + '" alt="">' : '') + '</button>';
    }).join('') + '</div>' : '';
    return '<article class="entry"><div class="meta"><span class="heure">' + esc(x.heure) + '</span>' + gravTag(x.gravite) + '</div>' +
      '<div class="body">' + (x.texte ? '<p>' + esc(x.texte) + '</p>' : '') + thumbs + (x.updated ? '<span class="edited">modifiée</span>' : '') + '</div>' +
      '<button class="icon-btn" data-a="edit-entry" data-id="' + esc(x.id) + '" aria-label="Modifier la note" style="color:#55554F;margin-top:-8px">' + I.pen + '</button></article>';
  }

  function vComposer() {
    const D = S.draft;
    const editing = S.editId ? S.ev.entries.find(function (x) { return x.id === S.editId; }) : null;
    const existing = S.keptPhotos.map(function (p) {
      return '<button class="thumb" data-a="rm-old-photo" data-id="' + esc(p.id) + '" aria-label="Retirer cette photo"><img src="' + esc(p.thumb) + '" alt=""><span class="x">×</span></button>';
    }).join('');
    const added = D.photos.map(function (p, i) {
      return '<button class="thumb" data-a="rm-new-photo" data-i="' + i + '" aria-label="Retirer cette photo"><img src="' + esc(p.thumb) + '" alt=""><span class="x">×</span></button>';
    }).join('');
    const nbPhotos = S.keptPhotos.length + D.photos.length;
    return '<div class="composer">' +
      (editing ? '<div class="edit-bar"><span>Modification de la note de ' + esc(editing.heure) + '</span><span><button data-a="delete-entry">Supprimer</button> <button data-a="cancel-edit">Annuler</button></span></div>' : '') +
      '<div class="grav-pick" role="group" aria-label="Type de note">' + ['info', 'idee', 'attention', 'critique'].map(function (g) {
        return '<button type="button" class="g-' + g + '" data-a="grav" data-g="' + g + '" aria-pressed="' + (D.gravite === g) + '" aria-label="' + GRAV[g].label + '">' + GRAV[g].svg + '<span>' + GRAV[g].short + '</span></button>';
      }).join('') + '</div>' +
      (nbPhotos ? '<div class="thumbs">' + existing + added + '</div>' : '') +
      '<textarea class="field" id="draft" rows="2" data-model="draft" aria-label="Note de main courante" placeholder="Noter quelque chose… (micro du clavier pour dicter)">' + esc(D.texte) + '</textarea>' +
      '<div class="tools">' +
      '<button type="button" class="photo-btn" data-a="take-photo" aria-label="Prendre une photo">' + I.camera + '</button>' +
      '<button type="button" class="photo-btn" data-a="pick-photo" aria-label="Choisir dans la galerie">' + I.gallery + '</button>' +
      '<input type="file" id="file-camera" accept="image/*" capture="environment" class="hidden">' +
      '<input type="file" id="file-gallery" accept="image/*" multiple class="hidden">' +
      '<span class="grow photo-count">' + (nbPhotos ? nbPhotos + ' photo' + (nbPhotos > 1 ? 's' : '') : '') + '</span>' +
      '<button type="button" class="send" data-a="save-entry"' + (S.sending ? ' disabled' : '') + '>' + (S.sending ? 'Envoi…' : (editing ? 'Enregistrer' : 'Ajouter')) + '</button>' +
      '</div></div>';
  }

  /* ---------- admin ---------- */
  function vAdmin() {
    const A = S.admin;
    if (!A) return barBack('ADMINISTRATION', '') + '<div class="spinner" role="img" aria-label="Chargement"></div>';
    const pending = A.users.filter(function (u) { return u.statut === 'attente'; });
    const tabs = [['demandes', 'Demandes' + (pending.length ? ' (' + pending.length + ')' : '')], ['users', 'Utilisateurs'], ['events', 'Événements']];
    let body = '';
    if (S.adminTab === 'demandes') {
      body = pending.length ? '<div class="card strong">' + pending.map(function (u) {
        return '<div class="user-row"><div><b>' + esc(u.nom) + '</b><div class="muted" style="font-size:13px">' + esc(u.email) + ', demande du ' + esc(String(u.created).slice(0, 10).split('-').reverse().join('/')) + '</div></div>' +
          '<div class="actions"><button class="btn primary" style="flex:1" data-a="user-status" data-email="' + esc(u.email) + '" data-v="actif">Valider</button>' +
          '<button class="btn" style="flex:1" data-a="user-status" data-email="' + esc(u.email) + '" data-v="refuse">Refuser</button></div></div>';
      }).join('') + '</div>' : '<div class="empty">Aucune demande en attente.</div>';
    } else if (S.adminTab === 'users') {
      const list = A.users.filter(function (u) { return u.statut !== 'attente'; }).sort(function (a, b) { return a.nom.localeCompare(b.nom); });
      body = '<p class="muted" style="margin:0;font-size:13px">Les adresses internes entrent automatiquement. Les externes passent par une demande.</p>' +
        '<div class="card">' + list.map(function (u) {
          return '<div class="user-row"><div style="display:flex;justify-content:space-between;gap:8px"><div style="min-width:0"><b>' + esc(u.nom) + '</b><div class="muted" style="font-size:13px;overflow-wrap:anywhere">' + esc(u.email) + '</div></div>' +
            '<span class="badge' + (u.type === 'interne' ? ' dark' : '') + '" style="align-self:flex-start">' + (u.type === 'interne' ? 'Interne' : 'Externe') + '</span></div>' +
            '<div class="actions"><select data-change="user-role" data-email="' + esc(u.email) + '" aria-label="Rôle de ' + esc(u.nom) + '">' +
            Object.keys(A.roles).map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + esc(A.roles[r]) + '</option>'; }).join('') + '</select>' +
            '<select data-change="user-status" data-email="' + esc(u.email) + '" aria-label="Statut de ' + esc(u.nom) + '">' +
            [['actif', 'Actif'], ['refuse', 'Bloqué']].map(function (s) { return '<option value="' + s[0] + '"' + (u.statut === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div></div>';
        }).join('') + '</div>';
    } else {
      body = '<button class="btn primary block" data-a="new-event">+ Créer un événement</button>' +
        (A.events.length ? A.events.map(function (e) {
          return '<button class="card" data-a="edit-event" data-id="' + esc(e.id) + '"><div class="card-row"><div><div class="titre" style="font-size:15px">' + esc(e.nom.toUpperCase()) + '</div>' +
            '<div class="muted" style="font-size:13px;margin-top:3px">' + esc([e.lieu, fmtRange(e.dateDebut, e.dateFin)].filter(Boolean).join(', ')) + '</div></div>' +
            '<span class="badge">' + e.equipe.length + ' pers.</span></div></button>';
        }).join('') : '<div class="empty">Aucun événement pour l’instant.</div>');
    }
    return barBack('ADMINISTRATION', 'Accès, utilisateurs, événements') +
      '<nav class="tabs" role="tablist">' + tabs.map(function (t) {
        return '<button role="tab" data-a="admin-tab" data-tab="' + t[0] + '" aria-selected="' + (S.adminTab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</nav><main>' + body + '</main>';
  }

  /* ---------- panneaux ---------- */
  function openSheet(html) {
    $('#sheet-root').innerHTML = '<div class="overlay" data-a="close-sheet-bg"><div class="sheet" role="dialog" aria-modal="true">' + html + '</div></div>';
  }
  function closeSheet() { S.form = null; $('#sheet-root').innerHTML = ''; }

  function sheetHead(title) {
    return '<div style="display:flex;align-items:center;gap:8px"><h2 class="titre grow">' + esc(title) + '</h2>' +
      '<button class="icon-btn" data-a="close-sheet" aria-label="Fermer">' + I.close + '</button></div>';
  }

  const ROLE_LABELS = { admin: 'Admin', dt: 'DT projet', regisseur: 'Régisseur', chef_projet: 'Chef de projet' };

  function sheetAccount() {
    const sv = S.user.serverVersion || '?';
    openSheet(sheetHead('Mon compte') +
      '<div><b>' + esc(S.user.nom) + '</b><div class="muted">' + esc(S.user.email) + '</div><div class="muted">' + esc(ROLE_LABELS[S.user.role] || '') + '</div></div>' +
      '<button class="btn block" data-a="logout">Se déconnecter de cet appareil</button>' +
      '<p class="hint" style="text-align:center">Interface v' + APP_VERSION + ' · Serveur v' + esc(sv) +
      (sv !== '?' && sv !== APP_VERSION ? '<br><b>Versions différentes : pensez à mettre à jour.</b>' : '') + '</p>');
  }

  function sheetDay() {
    const d = dayList().find(function (x) { return x.date === S.day; });
    openSheet(sheetHead(fmtLong(S.day)) +
      '<div><label class="lbl" for="day-phase">Phase</label><select class="field" id="day-phase"><option value="">' +
      (phaseFromRanges(S.day) ? 'Selon l’événement (' + esc(phaseFromRanges(S.day)) + ')' : 'Non renseignée') + '</option>' +
      S.ev.phases.map(function (p) { return '<option' + (d.ownPhase === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="lbl" for="eff">Effectif du jour</label>' +
      '<textarea class="field" id="eff" rows="2" placeholder="Ex. 1 régisseur, 5 techs, 3 bénévoles">' + esc(d.effectif) + '</textarea></div>' +
      '<button class="btn primary block" data-a="save-day">Enregistrer</button>');
  }

  /* ---------- formulaire d'événement ---------- */
  function openEventForm(id) {
    openSheet('<div class="spinner" role="img" aria-label="Chargement"></div>');
    call('formData', { id: id || '' }).then(function (fd) {
      const e = fd.event || { nom: '', lieu: '', client: '', dateDebut: '', dateFin: '', typologie: '', previousId: '', equipe: [], adresse: '', lat: '', lng: '', phases: [] };
      const ranges = {};
      (e.phases || []).forEach(function (p) { ranges[p.phase] = { debut: p.debut, fin: p.fin }; });
      const startMonth = (e.dateDebut || (e.phases[0] && e.phases[0].debut) || today()).slice(0, 7);
      S.form = {
        fd: fd, id: e.id || '', place: { adresse: e.adresse || '', lat: e.lat || '', lng: e.lng || '' }, sugg: [],
        ranges: ranges, active: fd.phases[0], pending: null, month: startMonth,
        evStart: e.dateDebut || '', evEnd: e.dateFin || '', equipe: (e.equipe || []).slice()
      };
      let html = sheetHead(e.id ? 'Modifier l’événement' : 'Nouvel événement') + '<div class="form-grid">' +
        '<div><label class="lbl" for="f-nom">Nom</label><input class="field" id="f-nom" value="' + esc(e.nom) + '" placeholder="Pagaille 2027"></div>' +
        '<div class="place-search"><label class="lbl" for="f-lieu">Lieu</label>' +
        '<input class="field" id="f-lieu" value="' + esc(e.lieu) + '" autocomplete="off" placeholder="Nom du lieu ou adresse" aria-describedby="place-info" aria-controls="lieu-sugg">' +
        '<ul class="sugg hidden" id="lieu-sugg" aria-label="Suggestions de lieux"></ul>' +
        '<div class="place-actions"><button type="button" class="btn small" data-a="geoloc">' + I.locate + 'Ma position</button></div>' +
        '<div id="place-info" style="margin-top:8px">' + placeInfoHtml() + '</div></div>' +
        '<div><label class="lbl" for="f-client">Client</label><input class="field" id="f-client" value="' + esc(e.client) + '"></div>' +
        '<div class="row2"><div><label class="lbl" for="f-debut">Début</label><input class="field" type="date" id="f-debut" value="' + esc(e.dateDebut) + '"></div>' +
        '<div><label class="lbl" for="f-fin">Fin</label><input class="field" type="date" id="f-fin" value="' + esc(e.dateFin) + '"></div></div>' +
        '<p class="hint" style="margin-top:-8px">Du premier jour de prépa ou de montage au dernier jour de démontage. Les dates s’élargissent seules si une phase dépasse.</p>' +
        '<fieldset><legend>Phases (facultatif)</legend><div id="cal">' + calHtml() + '</div></fieldset>' +
        '<div><label class="lbl" for="f-typo">Typologie</label><select class="field" id="f-typo"><option value="">Non renseignée</option>' +
        fd.typologies.map(function (t) { return '<option' + (e.typologie === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>';
      if (fd.isAdmin) {
        html +=
          '<div><label class="lbl" for="f-prev">Édition précédente</label><select class="field" id="f-prev"><option value="">Aucune</option>' +
          (fd.events || []).filter(function (x) { return x.id !== e.id; }).map(function (x) { return '<option value="' + esc(x.id) + '"' + (e.previousId === x.id ? ' selected' : '') + '>' + esc(x.nom) + '</option>'; }).join('') + '</select></div>' +
          '<div><label class="lbl" for="f-folder">Dossier Drive existant <span class="muted" style="font-weight:400">(facultatif)</span></label>' +
          '<input class="field" id="f-folder" placeholder="' + (e.id ? 'Lien d’un autre dossier, sinon inchangé' : 'Lien du dossier, sinon il est créé automatiquement') + '"></div>';
      }
      html += '<fieldset><legend>Équipe</legend><div id="team-block">' + teamHtml() + '</div>' + inviteHtml() + '</fieldset>';
      html += '<button class="btn primary block" data-a="save-event">' + (e.id ? 'Enregistrer' : 'Créer l’événement') + '</button></div>';
      openSheet(html);
    }).catch(function (err) { closeSheet(); fail(err); });
  }

  /* ---------- équipe et invitations ---------- */
  function teamHtml() {
    const F = S.form, fd = F.fd;
    if (fd.isAdmin) {
      const people = (fd.users || []).slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
      return '<div class="checks" id="f-team">' + people.map(function (u) {
        return '<label><input type="checkbox" value="' + esc(u.email) + '"' + (F.equipe.indexOf(u.email) >= 0 ? ' checked' : '') + '>' + esc(u.nom) +
          ' <span class="muted" style="font-size:12px">' + esc(fd.roles[u.role] || '') + (u.statut === 'attente' ? ', en attente' : '') + '</span></label>';
      }).join('') + '</div><p class="hint">Les admins voient tous les événements sans être cochés.</p>';
    }
    const team = fd.team || [];
    if (!team.length) return '<p class="hint" style="margin-top:0">Personne dans l’équipe pour l’instant.</p>';
    return '<ul class="team-list">' + team.map(function (m) {
      return '<li><b>' + esc(m.nom) + '</b> <span class="muted">' + esc(fd.roles[m.role] || '') + (m.statut === 'attente' ? ', accès en attente' : '') + '</span></li>';
    }).join('') + '</ul>';
  }

  function inviteHtml() {
    const F = S.form, fd = F.fd;
    if (!F.id) return '<p class="hint">Créez d’abord l’événement pour pouvoir inviter quelqu’un par e-mail.</p>';
    return '<div class="invite"><span class="lbl" style="margin-top:12px">Inviter un contributeur</span>' +
      '<input class="field" id="inv-email" type="email" inputmode="email" autocomplete="off" placeholder="adresse@exemple.fr" aria-label="E-mail de la personne à inviter">' +
      '<div class="row2"><input class="field" id="inv-nom" autocomplete="off" placeholder="Prénom Nom" aria-label="Prénom et nom (facultatif)">' +
      '<select class="field" id="inv-role" aria-label="Rôle">' + fd.inviteRoles.map(function (r) { return '<option value="' + r + '">' + esc(fd.roles[r]) + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="btn block" data-a="invite">Envoyer l’invitation</button>' +
      '<p class="hint">La personne reçoit un e-mail avec le lien direct du projet. Les adresses @coteouestfrance.com ont accès tout de suite ; les autres attendent la validation d’un admin.</p></div>';
  }

  function sendInvite(btn) {
    const F = S.form;
    const email = $('#inv-email').value.trim();
    if (!email) { toast('Saisissez l’adresse e-mail.'); return; }
    if (F.fd.isAdmin) {
      F.equipe = Array.prototype.map.call(document.querySelectorAll('#f-team input:checked'), function (i) { return i.value; });
    }
    btn.disabled = true;
    call('inviteContributor', { eventId: F.id, email: email, nom: $('#inv-nom').value, role: $('#inv-role').value }).then(function (r) {
      btn.disabled = false;
      if (!S.form) return;
      F.fd.team = r.team;
      if (r.users) F.fd.users = r.users;
      if (F.equipe.indexOf(r.email) < 0) F.equipe.push(r.email);
      $('#team-block').innerHTML = teamHtml();
      $('#inv-email').value = ''; $('#inv-nom').value = '';
      toast(r.dejaMembre ? 'Déjà dans l’équipe : e-mail renvoyé.' : r.statut === 'actif' ? 'Invitation envoyée.' : 'Invitation envoyée, accès en attente de validation.');
    }).catch(function (e) { btn.disabled = false; fail(e); });
  }

  /* ---------- calendrier des phases ---------- */
  const PHASE_CLASS = { 'Prépa': 'ph-prepa', 'Montage': 'ph-montage', 'Exploitation': 'ph-exploit', 'Démontage': 'ph-demont' };

  function phaseOfDate(date) {
    const F = S.form;
    const hit = F.fd.phases.find(function (p) { const r = F.ranges[p]; return r && r.debut <= date && date <= r.fin; });
    return hit || '';
  }

  function fmtDM(s) { const d = parseD(s); return d.getDate() + ' ' + MOIS[d.getMonth()]; }

  function calHtml() {
    const F = S.form;
    const ym = F.month.split('-').map(Number);
    const y = ym[0], m = ym[1];
    const first = new Date(y, m - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const nbDays = new Date(y, m, 0).getDate();
    const t = today();
    const chips = '<div class="cal-chips" role="group" aria-label="Phase à placer">' + F.fd.phases.map(function (p) {
      const r = F.ranges[p];
      return '<button type="button" class="cal-chip" data-a="cal-phase" data-p="' + esc(p) + '" aria-pressed="' + (F.active === p) + '">' +
        '<span class="dot ' + PHASE_CLASS[p] + '"></span>' + esc(p) + (r ? '<small>' + (r.debut === r.fin ? fmtDM(r.debut) : fmtDM(r.debut) + ' → ' + fmtDM(r.fin)) + '</small>' : '') + '</button>';
    }).join('') + '</div>';
    const help = '<p class="cal-help">' + (F.pending
      ? 'Début « ' + esc(F.active) + ' » : ' + fmtDM(F.pending) + '. Touchez maintenant le <b>dernier jour</b> (ou le même jour pour une seule journée).'
      : 'Touchez le <b>premier jour</b> de « ' + esc(F.active) + ' », puis le dernier.') +
      (F.ranges[F.active] ? ' <button type="button" class="link-btn" data-a="cal-clear">Effacer « ' + esc(F.active) + ' »</button>' : '') + '</p>';
    let cells = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (d) { return '<span class="cal-dow" aria-hidden="true">' + d + '</span>'; }).join('');
    for (let i = 0; i < offset; i++) cells += '<span></span>';
    for (let d = 1; d <= nbDays; d++) {
      const k = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const ph = phaseOfDate(k);
      const inEv = F.evStart && F.evEnd && k >= F.evStart && k <= F.evEnd;
      const cls = ['cal-day', ph ? PHASE_CLASS[ph] : '', inEv ? 'in-event' : '', F.pending === k ? 'pending' : '', k === t ? 'is-today' : ''].filter(Boolean).join(' ');
      cells += '<button type="button" class="' + cls + '" data-a="cal-day" data-date="' + k + '" aria-label="' + esc(fmtLong(k) + (ph ? ', ' + ph : '')) + '">' + d + '</button>';
    }
    const MOIS_L = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return chips + help +
      '<div class="cal-head"><button type="button" class="icon-btn" data-a="cal-month" data-step="-1" aria-label="Mois précédent">' + I.back + '</button>' +
      '<b>' + MOIS_L[m - 1] + ' ' + y + '</b>' +
      '<button type="button" class="icon-btn" data-a="cal-month" data-step="1" aria-label="Mois suivant" style="transform:scaleX(-1)">' + I.back + '</button></div>' +
      '<div class="cal-grid">' + cells + '</div>';
  }

  function refreshCal() { const el = $('#cal'); if (el) el.innerHTML = calHtml(); }

  function calPickDay(date) {
    const F = S.form;
    if (!F.pending) { F.pending = date; refreshCal(); return; }
    const a = F.pending < date ? F.pending : date, b = F.pending < date ? date : F.pending;
    F.ranges[F.active] = { debut: a, fin: b };
    F.pending = null;
    // Les dates de l'événement s'élargissent pour couvrir la phase.
    if (!F.evStart || a < F.evStart) { F.evStart = a; $('#f-debut').value = a; }
    if (!F.evEnd || b > F.evEnd) { F.evEnd = b; $('#f-fin').value = b; }
    // Passe à la phase suivante encore vide (dans l'ordre prépa → démontage).
    const order = F.fd.phases, from = order.indexOf(F.active);
    const next = order.slice(from + 1).concat(order.slice(0, from)).find(function (p) { return !F.ranges[p]; });
    if (next) F.active = next;
    refreshCal();
  }

  function placeInfoHtml() {
    const p = (S.form && S.form.place) || {};
    if (!p.adresse && !p.lat) return '';
    const url = mapsUrl({ lat: p.lat, lng: p.lng, adresse: p.adresse });
    return '<div class="place-info">' + I.pin.replace('<svg', '<svg width="18" height="18" style="flex-shrink:0;margin-top:1px"') +
      '<div class="grow">' + esc(p.adresse || (p.lat + ', ' + p.lng)) + (url ? '<br><a href="' + esc(url) + '" target="_blank" rel="noopener">Voir dans Google Maps</a>' : '') + '</div>' +
      '<button type="button" class="icon-btn" data-a="clear-place" aria-label="Effacer l’adresse" style="width:36px;height:36px">' + I.close + '</button></div>';
  }
  function refreshPlaceInfo() { const el = $('#place-info'); if (el) el.innerHTML = placeInfoHtml(); }

  // Suggestions de lieux : OpenStreetMap (Photon) pour les noms de lieux, Géoplateforme (IGN) pour les adresses.
  let placeTimer = null, placeSeq = 0;
  function searchPlaces(q) {
    const seq = ++placeSeq;
    const bias = CFG.MAP_BIAS || { lat: 44.84, lng: -0.58 };
    const ph = fetch('https://photon.komoot.io/api/?limit=4&lang=fr&lat=' + bias.lat + '&lon=' + bias.lng + '&q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        return (j.features || []).map(function (f) {
          const p = f.properties || {};
          const street = [p.housenumber, p.street].filter(Boolean).join(' ');
          const adresse = [p.name !== p.street ? street : '', [p.postcode, p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
          return { titre: p.name || street || p.city || '', detail: adresse || p.country || '', adresse: [p.name, adresse].filter(Boolean).join(', '), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
        });
      }).catch(function () { return []; });
    const ign = fetch('https://data.geopf.fr/geocodage/search?limit=4&q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        return (j.features || []).map(function (f) {
          const p = f.properties || {};
          return { titre: p.name || p.label, detail: [p.postcode, p.city].filter(Boolean).join(' '), adresse: p.label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
        });
      }).catch(function () { return []; });
    Promise.all([ph, ign]).then(function (res) {
      if (seq !== placeSeq || !S.form) return;
      const seen = {};
      const all = res[0].concat(res[1]).filter(function (s) {
        const k = (s.titre + '|' + s.detail).toLowerCase();
        if (!s.titre || seen[k]) return false;
        seen[k] = true; return true;
      }).slice(0, 7);
      S.form.sugg = all;
      const ul = $('#lieu-sugg');
      if (!ul) return;
      if (!all.length) { ul.classList.add('hidden'); ul.innerHTML = ''; return; }
      ul.innerHTML = all.map(function (s, i) {
        return '<li><button type="button" data-a="pick-place" data-i="' + i + '"><b>' + esc(s.titre) + '</b><span>' + esc(s.detail) + '</span></button></li>';
      }).join('');
      ul.classList.remove('hidden');
    });
  }

  function geolocate() {
    if (!navigator.geolocation) { toast('Localisation indisponible sur cet appareil.'); return; }
    toast('Recherche de votre position…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      const lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6);
      S.form.place = { adresse: '', lat: lat, lng: lng };
      refreshPlaceInfo();
      fetch('https://data.geopf.fr/geocodage/reverse?limit=1&lon=' + lng + '&lat=' + lat)
        .then(function (r) { return r.json(); })
        .then(function (j) {
          const f = (j.features || [])[0];
          if (f && S.form) { S.form.place.adresse = f.properties.label; refreshPlaceInfo(); }
        }).catch(function () {});
      toast('Position enregistrée');
    }, function () {
      toast('Position indisponible : autorisez la localisation pour cette appli.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  function saveEvent(btn) {
    const F = S.form;
    const fd = F.fd;
    const payload = {
      id: F.id,
      nom: $('#f-nom').value, lieu: $('#f-lieu').value, client: $('#f-client').value,
      dateDebut: $('#f-debut').value, dateFin: $('#f-fin').value, typologie: $('#f-typo').value,
      adresse: F.place.adresse, lat: F.place.lat, lng: F.place.lng,
      phases: fd.phases.filter(function (p) { return F.ranges[p]; }).map(function (p) { return { phase: p, debut: F.ranges[p].debut, fin: F.ranges[p].fin }; })
    };
    if (fd.isAdmin) {
      payload.previousId = $('#f-prev').value;
      payload.folderLink = $('#f-folder').value;
      payload.equipe = Array.prototype.map.call(document.querySelectorAll('#f-team input:checked'), function (i) { return i.value; });
    }
    btn.disabled = true;
    call('saveEvent', payload).then(function (r) {
      const wasNew = !payload.id;
      closeSheet();
      toast(wasNew ? 'Événement créé' : 'Événement enregistré');
      if (S.screen === 'admin') loadAdmin();
      else if (S.screen === 'event') openEvent(r.id, true);
      else loadHome();
    }).catch(function (e) { btn.disabled = false; fail(e); });
  }

  /* =========================================================
     ACTIONS
     ========================================================= */
  const ACT = {
    'back': function () {
      if (S.screen === 'event') { S.ev = null; loadHome(); }
      else if (S.screen === 'admin') loadHome();
    },
    'account': sheetAccount,
    'logout': function () { closeSheet(); signOut(false); },
    'close-sheet': closeSheet,
    'close-sheet-bg': function (el, ev) { if (ev.target === el) closeSheet(); },

    'login-send': loginSend,
    'login-verify': loginVerify,
    'login-back': function () { S.login.step = 'email'; S.login.error = ''; render(); },

    'open-event': function (el) { openEvent(el.dataset.id); },
    'open-admin': loadAdmin,
    'tab': function (el) { S.tab = el.dataset.tab; render(); },
    'day': function (el) { saveDraftLocal(); S.day = el.dataset.date; resetDraft(); render(); },
    'grav': function (el) { S.draft.gravite = el.dataset.g; render(); },
    'take-photo': function () { $('#file-camera').click(); },
    'pick-photo': function () { $('#file-gallery').click(); },
    'rm-new-photo': function (el) { S.draft.photos.splice(Number(el.dataset.i), 1); render(); },
    'rm-old-photo': function (el) {
      S.removePhotos.push(el.dataset.id);
      S.keptPhotos = S.keptPhotos.filter(function (p) { return p.id !== el.dataset.id; });
      render();
    },
    'save-entry': saveEntry,
    'edit-entry': function (el) {
      const x = S.ev.entries.find(function (e) { return e.id === el.dataset.id; });
      if (!x) return;
      S.editId = x.id;
      S.draft = { texte: x.texte, gravite: x.gravite, photos: [] };
      S.keptPhotos = x.photos.slice();
      S.removePhotos = [];
      render();
      const ta = $('#draft'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'nearest' }); }
    },
    'cancel-edit': function () { resetDraft(); render(); },
    'delete-entry': function () {
      if (!confirm('Supprimer définitivement cette note ?')) return;
      const id = S.editId;
      call('deleteEntry', { id: id }).then(function () {
        S.ev.entries = S.ev.entries.filter(function (x) { return x.id !== id; });
        resetDraft(); render(); toast('Note supprimée');
      }).catch(fail);
    },
    'photo': function (el) {
      $('#sheet-root').innerHTML = '<div class="photo-view"><div class="spinner"></div></div>';
      call('getPhoto', { id: el.dataset.id }).then(function (src) {
        $('#sheet-root').innerHTML = '<div class="photo-view"><img src="' + esc(src) + '" alt="Photo de la note"><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">' + I.close + '</button></div>';
      }).catch(function (e) { closeSheet(); fail(e); });
    },
    'edit-day': sheetDay,
    'save-day': function (el) {
      const phase = $('#day-phase').value, effectif = $('#eff').value;
      el.disabled = true;
      call('saveDay', { eventId: S.ev.event.id, date: S.day, phase: phase, effectif: effectif }).then(function (d) {
        S.ev.days = S.ev.days.filter(function (x) { return x.date !== d.date; }).concat([d]);
        closeSheet(); render(); toast('Journée enregistrée');
      }).catch(function (e) { el.disabled = false; fail(e); });
    },
    'cal-phase': function (el) { S.form.active = el.dataset.p; S.form.pending = null; refreshCal(); },
    'cal-day': function (el) { calPickDay(el.dataset.date); },
    'cal-month': function (el) {
      const p = S.form.month.split('-').map(Number);
      const d = new Date(p[0], p[1] - 1 + Number(el.dataset.step), 1);
      S.form.month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      refreshCal();
    },
    'cal-clear': function () { delete S.form.ranges[S.form.active]; S.form.pending = null; refreshCal(); },
    'invite': function (el) { sendInvite(el); },

    'edit-event': function (el) { openEventForm(el.dataset.id); },
    'new-event': function () { openEventForm(''); },
    'save-event': function (el) { saveEvent(el); },
    'geoloc': geolocate,
    'pick-place': function (el) {
      const s = S.form.sugg[Number(el.dataset.i)];
      if (!s) return;
      $('#f-lieu').value = s.titre;
      S.form.place = { adresse: s.adresse, lat: String(s.lat), lng: String(s.lng) };
      const ul = $('#lieu-sugg'); ul.classList.add('hidden'); ul.innerHTML = '';
      refreshPlaceInfo();
    },
    'clear-place': function () { S.form.place = { adresse: '', lat: '', lng: '' }; refreshPlaceInfo(); },

    'admin-tab': function (el) { S.adminTab = el.dataset.tab; render(); },
    'user-status': function (el) { setUser({ email: el.dataset.email, statut: el.dataset.v }); }
  };

  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-a]');
    if (!el) return;
    const fn = ACT[el.dataset.a];
    if (fn) fn(el, ev);
  });
  document.addEventListener('input', function (ev) {
    const el = ev.target;
    if (el.dataset && el.dataset.model === 'draft') { S.draft.texte = el.value; autoGrow(el); saveDraftLocal(); }
    if (el.id === 'f-lieu') {
      clearTimeout(placeTimer);
      const q = el.value.trim();
      if (q.length < 3) { const ul = $('#lieu-sugg'); if (ul) { ul.classList.add('hidden'); ul.innerHTML = ''; } return; }
      placeTimer = setTimeout(function () { searchPlaces(q); }, 350);
    }
  });
  document.addEventListener('change', function (ev) {
    const el = ev.target;
    if ((el.id === 'f-debut' || el.id === 'f-fin') && S.form) {
      S.form.evStart = $('#f-debut').value; S.form.evEnd = $('#f-fin').value;
      if (el.value && !S.form.pending) S.form.month = el.value.slice(0, 7);
      refreshCal();
      return;
    }
    if (el.id === 'file-camera' || el.id === 'file-gallery') { addPhotos(el.files); el.value = ''; return; }
    if (el.dataset && el.dataset.change === 'user-role') setUser({ email: el.dataset.email, role: el.value });
    if (el.dataset && el.dataset.change === 'user-status') setUser({ email: el.dataset.email, statut: el.value });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $('#sheet-root').innerHTML) { closeSheet(); return; }
    if (ev.key !== 'Enter') return;
    if (ev.target.id === 'login-email' || ev.target.id === 'login-nom') { ev.preventDefault(); loginSend(); }
    if (ev.target.id === 'login-code') { ev.preventDefault(); loginVerify(); }
  });

  function autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, window.innerHeight * 0.4) + 'px'; }

  /* ---------- connexion ---------- */
  function loginSend() {
    const L = S.login;
    const emailEl = $('#login-email'), nomEl = $('#login-nom');
    if (emailEl) L.email = emailEl.value.trim().toLowerCase();
    if (nomEl) L.nom = nomEl.value.trim();
    L.error = '';
    if (!L.email) { L.error = 'Saisissez votre adresse e-mail.'; return render(); }
    if (L.step === 'name' && !L.nom) { L.error = 'Saisissez votre prénom et votre nom.'; return render(); }
    store.set('co_email', L.email);
    post('requestCode', { email: L.email, nom: L.nom }).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      const st = r.data.status;
      if (st === 'sent') { L.step = 'code'; toast('Code envoyé'); }
      else if (st === 'need_name') L.step = 'name';
      else if (st === 'pending') L.step = 'pending';
      else if (st === 'refused') L.step = 'refused';
      else if (st === 'wait') L.error = 'Un code vient d’être envoyé. Patientez une minute avant d’en redemander un.';
      else L.error = 'Adresse e-mail invalide.';
      render();
      const c = $('#login-code'); if (c) c.focus();
    }).catch(function (e) { L.error = e.message; render(); });
  }

  function loginVerify() {
    const code = ($('#login-code') || {}).value || '';
    post('verifyCode', { email: S.login.email, code: code }).then(function (r) {
      if (!r.ok) throw new Error(r.error);
      const d = r.data;
      if (!d.ok) { S.login.error = d.error; return render(); }
      S.token = d.token; store.set('co_token', d.token);
      S.user = d.user;
      S.login.error = '';
      loadHome();
    }).catch(function (e) { S.login.error = e.message; render(); });
  }

  function signOut(expired) {
    if (S.token && !expired) post('logout', {}).catch(function () {});
    store.del('co_token');
    S.token = null; S.user = null; S.ev = null; S.admin = null; S.events = [];
    S.login = { step: 'email', email: store.get('co_email') || '', nom: '', error: expired ? 'Session expirée, reconnectez-vous.' : '' };
    S.screen = 'login';
    closeSheet();
    render();
  }

  /* ---------- chargements ---------- */
  function loadHome() {
    if (!S.events.length) { S.screen = 'boot'; render(); }
    call('listEvents').then(function (list) {
      S.events = list; S.screen = 'home'; render();
      const id = takeDeepLink();
      if (id) openEvent(id);
    }).catch(function (e) { if (S.user) { S.screen = 'home'; render(); } fail(e); });
  }

  function openEvent(id, keepDay) {
    const prevDay = S.day, prevTab = S.tab;
    if (!keepDay) { S.screen = 'boot'; render(); }
    call('getEvent', { id: id }).then(function (data) {
      S.ev = data;
      S.screen = 'event';
      const e = data.event, t = today();
      if (keepDay && prevDay && prevDay >= e.dateDebut && prevDay <= e.dateFin) { S.day = prevDay; S.tab = prevTab; }
      else { S.tab = 'mc'; S.day = t < e.dateDebut ? e.dateDebut : t > e.dateFin ? e.dateFin : t; }
      resetDraft();
      render();
    }).catch(function (e) { loadHome(); fail(e); });
  }

  function loadAdmin() {
    S.screen = 'admin'; S.admin = null; render();
    call('adminData').then(function (d) { S.admin = d; render(); }).catch(fail);
  }

  function setUser(args) {
    call('setUser', args).then(function (d) { S.admin = d; render(); toast('Enregistré'); }).catch(fail);
  }

  /* ---------- main courante ---------- */
  function draftKey() { return S.ev ? 'draft_' + S.ev.event.id + '_' + S.day : ''; }
  function saveDraftLocal() { if (S.ev && !S.editId) store.set(draftKey(), S.draft.texte); }
  function resetDraft() {
    S.editId = null; S.keptPhotos = []; S.removePhotos = [];
    S.draft = { texte: (S.ev && store.get(draftKey())) || '', gravite: 'info', photos: [] };
  }

  function saveEntry() {
    if (S.sending) return;
    const D = S.draft;
    if (!D.texte.trim() && !D.photos.length && !S.editId) { toast('La note est vide.'); return; }
    S.sending = true; render();
    const p = S.editId
      ? call('updateEntry', { id: S.editId, texte: D.texte, gravite: D.gravite, addPhotos: D.photos, removePhotos: S.removePhotos })
      : call('addEntry', { eventId: S.ev.event.id, date: S.day, texte: D.texte, gravite: D.gravite, photos: D.photos });
    p.then(function (entry) {
      const wasEdit = !!S.editId;
      S.ev.entries = S.ev.entries.filter(function (x) { return x.id !== entry.id; }).concat([entry]);
      if (!wasEdit) store.del(draftKey());
      S.sending = false;
      resetDraft();
      render();
      toast(wasEdit ? 'Note modifiée' : 'Note ajoutée');
    }).catch(function (e) { S.sending = false; render(); fail(e); });
  }

  function addPhotos(files) {
    const list = Array.prototype.slice.call(files || [], 0, 6);
    if (!list.length) return;
    toast('Préparation des photos…');
    Promise.all(list.map(function (f) {
      return Promise.all([resizeImage(f, 1600, 0.82), resizeImage(f, 240, 0.6)]).then(function (r) { return { data: r[0], thumb: r[1] }; });
    })).then(function (ps) {
      S.draft.photos = S.draft.photos.concat(ps).slice(0, 6);
      render();
    }).catch(function () { toast('Impossible de lire cette image.'); });
  }

  function resizeImage(file, max, q) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  /* =========================================================
     DÉMARRAGE
     ========================================================= */
  // Lien direct vers un projet (e-mails d'invitation) : …/#evt-IDENTIFIANT
  function readDeepLink() {
    const m = location.hash.match(/^#evt-([\w-]+)$/);
    if (m) {
      store.set('co_deeplink', m[1]);
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
  }
  function takeDeepLink() {
    const id = store.get('co_deeplink');
    if (id) store.del('co_deeplink');
    return id;
  }
  window.addEventListener('hashchange', function () { readDeepLink(); if (S.user) { const id = takeDeepLink(); if (id) openEvent(id); } });

  function boot() {
    readDeepLink();
    if (!S.token) { S.screen = 'login'; return render(); }
    S.screen = 'boot'; render();
    call('me').then(function (u) { S.user = u; loadHome(); }).catch(function (e) {
      if (S.screen === 'boot' && S.token) { S.screen = 'login'; S.login.error = e.message; render(); }
    });
  }
  boot();
})();
