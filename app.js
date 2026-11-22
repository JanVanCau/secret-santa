(() => {
  const $ = (id) => document.getElementById(id);

  // ---------- Draw data ----------
  const data = JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(window.SANTA_DATA.split("").reverse().join("")), (c) => c.charCodeAt(0))
    )
  );
  const NAMES = Object.keys(data.pairs);
  const findName = (input) => {
    const clean = input.trim().toLowerCase();
    return NAMES.find((n) => n.toLowerCase() === clean);
  };

  // ---------- "Already looked" storage ----------
  const dbUrl = (window.SANTA_CONFIG?.databaseUrl || "").replace(/\/+$/, "");
  const localKey = (name) => `santa:${data.round}:${name}`;
  const remoteUrl = (name) =>
    `${dbUrl}/rounds/${data.round}/claimed/${encodeURIComponent(name)}.json`;

  const store = {
    async isClaimed(name) {
      let local = false;
      try { local = localStorage.getItem(localKey(name)) !== null; } catch {}
      if (local || !dbUrl) return local;
      const res = await fetch(remoteUrl(name), { cache: "no-store" });
      if (!res.ok) throw new Error(`Database error ${res.status}`);
      return (await res.json()) !== null;
    },
    async claim(name) {
      try { localStorage.setItem(localKey(name), String(Date.now())); } catch {}
      if (!dbUrl) return;
      const res = await fetch(remoteUrl(name), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Database error ${res.status}`);
    },
  };
  if (!dbUrl) {
    console.warn("[Secret Santa] Geen databaseUrl ingesteld in config.js — gebruikte namen worden enkel op dit toestel onthouden.");
  }

  // ---------- UI ----------
  const form = $("form"), input = $("name"), msg = $("msg"), go = $("go");

  const say = (text, kind = "error") => {
    msg.className = `msg ${kind}`;
    msg.textContent = text;
    form.classList.remove("shake");
    void form.offsetWidth;
    form.classList.add("shake");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = findName(input.value);
    if (!name) {
      say(`Hmm, "${input.value.trim()}" staat niet op de lijst van de Kerstman. Probeer: ${NAMES.join(", ")}.`);
      return;
    }
    go.disabled = true;
    try {
      if (await store.isClaimed(name)) {
        say(`🎅 Sorry ${name}, jouw naam is al gebruikt! De Kerstman verklapt het maar één keer.`, "warn");
        return;
      }
      await store.claim(name);
      reveal(name, data.pairs[name]);
    } catch (err) {
      console.error(err);
      say("De slee van de Kerstman kreeg wat turbulentie — controleer je verbinding en probeer opnieuw.");
    } finally {
      go.disabled = false;
    }
  });

  function reveal(name, receiver) {
    $("ask").classList.add("hidden");
    $("reveal").classList.remove("hidden");
    $("hello").textContent = `Vrolijk kerstfeest, ${name}! Je cadeau begint te wiebelen…`;
    $("who").textContent = receiver;

    const gift = $("gift");
    const stage = gift.parentElement;
    gift.classList.add("wobble");
    gift.addEventListener("animationend", function open(ev) {
      if (ev.target !== gift) return;
      gift.removeEventListener("animationend", open);
      gift.classList.add("open");
      stage.classList.add("opened");
      $("hello").textContent = `Vrolijk kerstfeest, ${name}! 🎄`;
      const r = gift.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + 20);
    });
  }

  // ---------- Snow ----------
  const snow = $("snow"), sctx = snow.getContext("2d");
  const conf = $("confetti"), cctx = conf.getContext("2d");
  let W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const c of [snow, conf]) {
      c.width = W * DPR; c.height = H * DPR;
      c.getContext("2d").setTransform(DPR, 0, 0, DPR, 0, 0);
    }
  }
  resize();
  addEventListener("resize", resize);

  const flakes = Array.from({ length: Math.round(Math.min(160, W / 6)) }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.6 + 0.6,
    s: Math.random() * 0.8 + 0.3,
    d: Math.random() * Math.PI * 2,
  }));

  // ---------- Confetti ----------
  const COLORS = ["#d62f45", "#f6c453", "#1f7a55", "#ffffff", "#ff8fa3", "#7fd1ae"];
  let pieces = [];
  function burst(x, y) {
    for (let i = 0; i < 180; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const v = Math.random() * 11 + 5;
      pieces.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: Math.random() * 8 + 5,
        h: Math.random() * 5 + 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        star: Math.random() < 0.18,
        life: 1,
      });
    }
  }

  function star(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r / 2.4 : r;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function frame() {
    sctx.clearRect(0, 0, W, H);
    sctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const f of flakes) {
      f.d += 0.01;
      f.y += f.s;
      f.x += Math.sin(f.d) * 0.4;
      if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
      sctx.globalAlpha = 0.35 + f.r / 5;
      sctx.beginPath();
      sctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      sctx.fill();
    }
    sctx.globalAlpha = 1;

    cctx.clearRect(0, 0, W, H);
    pieces = pieces.filter((p) => p.life > 0 && p.y < H + 40);
    for (const p of pieces) {
      p.vy += 0.22;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.004;
      cctx.save();
      cctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.fillStyle = p.c;
      if (p.star) star(cctx, p.w * 0.8);
      else cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
      cctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
