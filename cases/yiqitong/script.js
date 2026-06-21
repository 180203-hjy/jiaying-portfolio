const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const APP_PROTOTYPE_URL = "./app/index.html";

const navLinks = document.querySelectorAll(".case-nav a");
const sections = document.querySelectorAll("main section[id]");
const backTop = document.querySelector(".back-top");

const initGridScanHero = () => {
  const canvas = document.querySelector(".grid-scan-bg");
  const hero = canvas?.closest(".case-hero");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !hero || !ctx || prefersReducedMotion) return;

  const mouse = { x: 0.58, y: 0.42 };
  const smooth = { x: 0.58, y: 0.42 };
  let width = 0;
  let height = 0;
  let rafId = 0;
  let isVisible = false;

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawPerspectiveGrid = () => {
    const horizon = height * 0.42;
    const centerX = width * (0.5 + (smooth.x - 0.5) * 0.08);
    const bottomY = height * 1.08;

    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(94, 159, 216, 0.16)";

    for (let i = -12; i <= 12; i += 1) {
      const x = centerX + i * width * 0.085;
      ctx.beginPath();
      ctx.moveTo(centerX + i * width * 0.012, horizon);
      ctx.lineTo(x, bottomY);
      ctx.stroke();
    }

    ctx.restore();
  };

  const draw = (time = 0) => {
    if (!isVisible) return;

    smooth.x += (mouse.x - smooth.x) * 0.08;
    smooth.y += (mouse.y - smooth.y) * 0.08;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(
      width * 0.7,
      height * 0.25,
      0,
      width * 0.7,
      height * 0.25,
      Math.max(width, height) * 0.75
    );
    bg.addColorStop(0, "rgba(94, 159, 216, 0.12)");
    bg.addColorStop(0.42, "rgba(201, 166, 107, 0.06)");
    bg.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    drawPerspectiveGrid();

    const sx = smooth.x * width;
    const sy = smooth.y * height;
    const spot = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.min(width, height) * 0.52);
    spot.addColorStop(0, "rgba(233, 207, 128, 0.13)");
    spot.addColorStop(0.34, "rgba(94, 159, 216, 0.06)");
    spot.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#e9cf80";
    for (let i = 0; i < 34; i += 1) {
      const x = (Math.sin(i * 41.17 + time * 0.0003) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 29.33 + time * 0.0002) * 0.5 + 0.5) * height;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    rafId = requestAnimationFrame(draw);
  };

  const start = () => {
    if (isVisible) return;
    isVisible = true;
    resize();
    rafId = requestAnimationFrame(draw);
  };

  const stop = () => {
    isVisible = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start();
    else stop();
  }, { threshold: 0.08 });

  observer.observe(hero);

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mouse.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    mouse.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  }, { passive: true });

  window.addEventListener("resize", resize, { passive: true });
};

initGridScanHero();

const coreSlides = [
  {
    title: "项目概述",
    subtitle: "“运-配-储-用”全链路智慧监管方案",
    image: "./assets/core-overview.png",
    caption: "以“运-配-储-用”为主线，整合气源运输、到点配送、储罐监管与终端使用场景，形成农村 LPG 全链路智慧监管方案。"
  },
  {
    title: "运",
    subtitle: "LPG智能运输与 AI 路径优化",
    image: "./assets/core-yun.mp4",
    caption: "展示运输智能调度、在途状态可视化管控与全时段安全监管。"
  },
  {
    title: "配",
    subtitle: "智能卸液与权限校验",
    image: "./assets/core-pei.mp4",
    caption: "展示智能卸液、身份鉴权、定位校验与自动联锁等管控流程。"
  },
  {
    title: "储",
    subtitle: "多传感融合与储罐监测预警",
    image: "./assets/core-chu.mp4",
    caption: "展示储罐状态监测、风险提前预警与全站点一网统管。"
  },
  {
    title: "用",
    subtitle: "AI智能体安安全程护航",
    image: "./assets/core-yong-anan.mp4",
    caption: "将“安安”放入终端用气环节，展示触发、决策、处置、监管的安全隐患处理流程。"
  }
];

const pitchSlides = [
  {
    title: "应用场景",
    image: "./assets/pitch-scene.png",
    caption: "展示云南烤烟、浙江炒茶等农村 LPG 高频作业场景，说明项目切入的真实业务环境。"
  },
  {
    title: "项目落地｜地校企协同验证",
    image: "./assets/pitch-landing.png",
    caption: "通过示范点、村落调研和三方协同材料，证明项目不是纯概念方案，而是有真实场景支撑。",
    cards: ["地方：真实用气场景、示范点、村落调研", "学校：导师、实验室、团队支持", "企业：技术协同、产业接口、合作验证路径"]
  },
  {
    title: "商业模式",
    image: "./assets/pitch-business.png",
    caption: "展示 B2G2C 合作路径，将技术算法输出方、乡镇管理方与终端用户连接起来。"
  },
  {
    title: "社会价值",
    image: "./assets/pitch-social-value.png",
    caption: "从农业生产、乡村管理与农民生活三个角度，总结项目在安全、经济、人才与环保层面的综合价值。"
  }
];

const deckData = {
  core: coreSlides,
  pitch: pitchSlides
};

const isVideoSource = (src = "") => /\.(mp4|webm|mov)$/i.test(src.split("?")[0]);

const primeVideoThumbnail = (thumbVideo) => {
  if (!thumbVideo) return;
  thumbVideo.muted = true;
  thumbVideo.playsInline = true;
  thumbVideo.preload = "auto";

  const revealThumb = () => {
    thumbVideo.classList.add("is-ready");
    thumbVideo.pause();
  };

  thumbVideo.addEventListener("loadedmetadata", () => {
    try {
      if (Number.isFinite(thumbVideo.duration) && thumbVideo.duration > 0.25) {
        thumbVideo.currentTime = 0.12;
      } else {
        revealThumb();
      }
    } catch {
      revealThumb();
    }
  }, { once: true });

  thumbVideo.addEventListener("seeked", revealThumb, { once: true });
  thumbVideo.addEventListener("loadeddata", revealThumb, { once: true });
  thumbVideo.load();
};

const markMissingMedia = (media) => {
  const slot = media.closest(".image-slot");
  slot?.classList.add("is-missing");
  slot?.classList.remove("is-media-ready", "is-ready");
};

const markReadyMedia = (media) => {
  const slot = media.closest(".image-slot");
  slot?.classList.remove("is-missing");
  slot?.classList.add("is-media-ready", "is-ready");
};

document.querySelectorAll("[data-fallback]").forEach((media) => {
  media.addEventListener("error", () => markMissingMedia(media));
  media.addEventListener("load", () => markReadyMedia(media));
  if (media.tagName === "IMG" && media.complete && media.naturalWidth === 0) {
    markMissingMedia(media);
  }
});

const renderDeckCaption = (captionEl, slide, index) => {
  const extraCards = slide.cards?.length
    ? `<div class="landing-cards">${slide.cards.map((card) => `<span>${card}</span>`).join("")}</div>`
    : "";

  captionEl.classList.add("is-switching");
  window.setTimeout(() => {
    captionEl.innerHTML = `
      <p class="caption-index">Slide ${String(index + 1).padStart(2, "0")}</p>
      <h3>${slide.title}</h3>
      ${slide.subtitle ? `<p><strong>${slide.subtitle}</strong></p>` : ""}
      <p>${slide.caption}</p>
      ${extraCards}
    `;
    captionEl.classList.remove("is-switching");
  }, prefersReducedMotion ? 0 : 120);
};

const setupDeck = (deck) => {
  const key = deck.dataset.deck;
  const slides = deckData[key] || [];
  const frame = deck.querySelector(".deck-frame");
  const image = frame?.querySelector("img");
  const video = frame?.querySelector("video");
  const placeholder = frame?.querySelector("span strong");
  const caption = deck.querySelector(".deck-caption");
  const thumbs = deck.querySelector(".deck-thumbs");
  const prev = deck.querySelector("[data-deck-prev]");
  const next = deck.querySelector("[data-deck-next]");
  if (!slides.length || !frame || !image || !caption || !thumbs) return;

  let index = 0;
  let touchStartX = 0;

  const pauseDeckVideo = () => {
    if (!video) return;
    video.pause();
  };

  const renderMedia = (slide) => {
    const src = slide.image;
    const shouldUseVideo = isVideoSource(src);
    frame.classList.remove("is-ready", "is-missing", "is-video");

    if (shouldUseVideo && video) {
      image.hidden = true;
      image.removeAttribute("src");
      video.hidden = false;
      video.classList.remove("is-ready");
      video.poster = slide.poster || "";
      if (video.dataset.loadedSrc !== src) {
        video.src = src;
        video.dataset.loadedSrc = src;
        video.load();
      }
      video.play().catch(() => {
        frame.classList.add("is-paused");
      });
      frame.classList.add("is-video");
      return;
    }

    pauseDeckVideo();
    if (video) {
      video.hidden = true;
      video.removeAttribute("src");
      video.dataset.loadedSrc = "";
      video.removeAttribute("poster");
    }
    image.hidden = false;
    image.src = src;
    image.alt = slide.title;
  };

  const render = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    const slide = slides[index];
    renderMedia(slide);
    if (placeholder) placeholder.textContent = slide.title;
    renderDeckCaption(caption, slide, index);

    thumbs.querySelectorAll(".deck-thumb").forEach((thumb, thumbIndex) => {
      thumb.classList.toggle("is-active", thumbIndex === index);
    });
  };

  thumbs.innerHTML = slides.map((slide, thumbIndex) => {
    const isVideo = isVideoSource(slide.image);
    const thumbSrc = slide.poster || (!isVideo ? slide.image : "");
    return `
    <button class="deck-thumb" type="button" aria-label="查看 ${slide.title}">
      ${isVideo
        ? `<video src="${slide.image}#t=0.12" muted playsinline preload="auto" aria-hidden="true"></video>`
        : `<img src="${thumbSrc}" alt="" loading="lazy" decoding="async">`}
    </button>
  `;
  }).join("");

  thumbs.querySelectorAll(".deck-thumb").forEach((thumb, thumbIndex) => {
    thumb.addEventListener("click", () => render(thumbIndex));
    thumb.querySelector("img")?.addEventListener("error", () => {
      thumb.classList.add("is-missing");
    });
    thumb.querySelector("video")?.addEventListener("error", () => {
      thumb.classList.add("is-missing");
    });
    primeVideoThumbnail(thumb.querySelector("video"));
  });

  video?.addEventListener("error", () => markMissingMedia(video));
  video?.addEventListener("loadeddata", () => markReadyMedia(video));

  prev?.addEventListener("click", () => render(index - 1));
  next?.addEventListener("click", () => render(index + 1));

  frame.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0]?.clientX || 0;
  }, { passive: true });

  frame.addEventListener("touchend", (event) => {
    const diff = touchStartX - (event.changedTouches[0]?.clientX || 0);
    if (Math.abs(diff) > 42) render(index + (diff > 0 ? 1 : -1));
  }, { passive: true });

  deck.deckNext = () => render(index + 1);
  deck.deckPrev = () => render(index - 1);
  render(0);
};

document.querySelectorAll(".deck-browser").forEach(setupDeck);

const initBorderGlow = () => {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll(".border-glow-card").forEach((card) => {
    const sensitivity = Number(card.dataset.edgeSensitivity || 34);

    const updateGlow = (event) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
      const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1) * 100;
      const opacity = Math.max(0, (edge - sensitivity) / (100 - sensitivity));

      card.style.setProperty("--glow-x", `${(x / rect.width) * 100}%`);
      card.style.setProperty("--glow-y", `${(y / rect.height) * 100}%`);
      card.style.setProperty("--edge-opacity", opacity.toFixed(3));
    };

    card.addEventListener("pointermove", updateGlow);
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--edge-opacity", "0");
    });
  });
};

initBorderGlow();

const initClickSpark = (selector) => {
  if (prefersReducedMotion) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const sparks = [];
  const config = {
    color: "#efe8ca",
    size: 12,
    radius: 17,
    count: 8,
    duration: 400
  };

  canvas.className = "click-spark-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "9999"
  });
  document.body.appendChild(canvas);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const easeOut = (t) => t * (2 - t);

  const draw = (timestamp) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      const elapsed = timestamp - spark.start;
      if (elapsed >= config.duration) {
        sparks.splice(i, 1);
        continue;
      }

      const progress = elapsed / config.duration;
      const eased = easeOut(progress);
      const distance = eased * config.radius;
      const lineLength = config.size * (1 - eased);
      const alpha = 1 - eased;
      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  requestAnimationFrame(draw);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(selector)) return;

    const now = performance.now();
    for (let i = 0; i < config.count; i += 1) {
      sparks.push({
        x: event.clientX,
        y: event.clientY,
        angle: (Math.PI * 2 * i) / config.count,
        start: now
      });
    }
  }, true);
};


initClickSpark(".btn, .case-nav a, .back-top, .deck-arrow, .deck-thumb");

window.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const visibleDeck = Array.from(document.querySelectorAll(".deck-browser")).find((deck) => {
    const rect = deck.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.25;
  });
  if (!visibleDeck) return;
  if (event.key === "ArrowLeft") visibleDeck.deckPrev?.();
  if (event.key === "ArrowRight") visibleDeck.deckNext?.();
});

const appFrame = document.querySelector("[data-app-frame]");
if (appFrame) {
  appFrame.src = APP_PROTOTYPE_URL;
  appFrame.addEventListener("error", () => {
    appFrame.closest(".phone-frame")?.classList.add("is-missing");
  });
  window.setTimeout(() => {
    try {
      if (!appFrame.contentWindow) appFrame.closest(".phone-frame")?.classList.add("is-missing");
    } catch {
      appFrame.closest(".phone-frame")?.classList.add("is-missing");
    }
  }, 1800);
}

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal-item").forEach((item) => revealObserver.observe(item));
} else {
  document.querySelectorAll(".reveal-item").forEach((item) => item.classList.add("is-visible"));
}

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });
});

window.addEventListener("scroll", () => {
  backTop?.classList.toggle("is-visible", window.scrollY > 600);
});

backTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});
