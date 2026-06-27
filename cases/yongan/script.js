const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const navLinks = [...document.querySelectorAll(".case-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const backTop = document.querySelector(".back-top");

const initGradientBlindsHero = () => {
  const canvas = document.querySelector(".gradient-blinds-bg");
  const hero = canvas?.closest(".case-hero");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !hero || !ctx || prefersReducedMotion) return;

  const colors = [
    [216, 182, 93],
    [224, 192, 138],
    [158, 214, 207],
    [141, 106, 53]
  ];
  const mouse = { x: 0.56, y: 0.38 };
  const smooth = { x: 0.56, y: 0.38 };
  let width = 0;
  let height = 0;
  let rafId = 0;
  let visible = false;

  const colorAt = (t) => {
    const wrapped = ((t % 1) + 1) % 1;
    const scaled = wrapped * (colors.length - 1);
    const index = Math.floor(scaled);
    const next = Math.min(index + 1, colors.length - 1);
    const mix = scaled - index;
    return colors[index].map((value, channel) => value + (colors[next][channel] - value) * mix);
  };

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

  const draw = (time = 0) => {
    if (!visible) return;

    smooth.x += (mouse.x - smooth.x) * 0.08;
    smooth.y += (mouse.y - smooth.y) * 0.08;
    ctx.clearRect(0, 0, width, height);

    const blindCount = Math.max(8, Math.min(16, Math.floor(width / 82)));
    const blindWidth = width / blindCount;
    const angleShift = Math.sin(time * 0.00018) * 0.12;
    const spotX = smooth.x * width;
    const spotY = smooth.y * height;
    const radius = Math.min(width, height) * 0.72;

    for (let i = 0; i < blindCount; i += 1) {
      const x = i * blindWidth;
      const color = colorAt(i / Math.max(1, blindCount - 1) + time * 0.000035);
      const gradient = ctx.createLinearGradient(x, 0, x + blindWidth * (1.2 + angleShift), height);
      const shade = i % 2 === 0 ? 0.07 : 0.035;
      gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.012 + shade})`);
      gradient.addColorStop(0.44, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.055 + shade})`);
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 1, 0, blindWidth + 2, height);

      ctx.fillStyle = "rgba(255, 244, 205, 0.012)";
      ctx.fillRect(x + blindWidth - 1, 0, 1, height);
    }

    const spotlight = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, radius);
    spotlight.addColorStop(0, "rgba(224, 192, 138, 0.14)");
    spotlight.addColorStop(0.28, "rgba(216, 182, 93, 0.07)");
    spotlight.addColorStop(1, "rgba(216, 182, 93, 0)");
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createLinearGradient(0, 0, width, height);
    haze.addColorStop(0, "rgba(5, 5, 5, 0.26)");
    haze.addColorStop(0.52, "rgba(158, 214, 207, 0.024)");
    haze.addColorStop(1, "rgba(216, 182, 93, 0.05)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    rafId = requestAnimationFrame(draw);
  };

  const start = () => {
    if (visible) return;
    visible = true;
    resize();
    rafId = requestAnimationFrame(draw);
  };

  const stop = () => {
    visible = false;
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

initGradientBlindsHero();

document.querySelectorAll("[data-fallback]").forEach((media) => {
  media.addEventListener("error", () => {
    const slot = media.closest(".image-slot");
    if (slot) slot.classList.add("is-missing");
    media.hidden = true;
  });
});

if (prefersReducedMotion) {
  document.querySelectorAll(".reveal-item").forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal-item").forEach((item) => revealObserver.observe(item));
}

const navObserver = new IntersectionObserver(
  (entries) => {
    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!active) return;

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${active.target.id}`);
    });
  },
  { rootMargin: "-42% 0px -48% 0px", threshold: [0.2, 0.5, 0.8] }
);

sections.forEach((section) => navObserver.observe(section));

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (!id || !id.startsWith("#")) return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });
});

function updateBackTop() {
  if (!backTop) return;
  backTop.classList.toggle("is-visible", window.scrollY > 520);
}

window.addEventListener("scroll", updateBackTop, { passive: true });
updateBackTop();

backTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

document.querySelectorAll("video[autoplay]").forEach((video) => {
  video.addEventListener("canplay", () => {
    video.play().catch(() => {
      // Autoplay can still be blocked in unusual browser settings; the video remains visible.
    });
  }, { once: true });
});

const sceneData = {
  yuesheng: {
    label: "月升·漫游",
    slides: [
      {
        type: "video",
        src: "./assets/yongan-scene-yuesheng-01.mp4",
        eyebrow: "MOONRISE TOUR · 01 / 02",
        title: "月升｜入口引导与稻田漫游",
        caption: "以入口动线、稻田步道与灯光艺术装置建立游客第一印象，引导游客进入“稻浪映月，时序成章”的夜游节奏，形成主题打卡与观赏引导。"
      },
      {
        type: "video",
        src: "./assets/yongan-scene-yuesheng-02.mp4",
        eyebrow: "MOONRISE TOUR · 02 / 02",
        title: "月升｜四季光影变换景观",
        caption: "以春夏秋冬的光影变化呈现稻田四季叙事，让游客在同一条漫游动线中感知不同季节的夜游氛围，强化月相叙事与场景记忆点。"
      }
    ]
  },
  yueman: {
    label: "月满·体验",
    slides: [
      {
        type: "video",
        src: "./assets/yongan-scene-yueman-01.mp4",
        eyebrow: "FULL MOON EXPERIENCE · 01 / 05",
        title: "月满｜核心互动与文化体验",
        caption: "围绕良渚文化、农耕场景与夜间消费，设置灯光秀、星空迷宫与夜间集市，承接游客参与、拍照、停留与消费需求。"
      },
      {
        type: "video",
        src: "./assets/yongan-scene-yueman-02.mp4",
        eyebrow: "FULL MOON EXPERIENCE · 02 / 05",
        title: "月满｜玉琮主题集市",
        caption: "以良渚玉琮元素转译“文明与美好”的文化感知，形成具有识别度的主题摊位与文创展示空间，让文化符号变成可逛、可拍、可购买的体验。"
      },
      {
        type: "image",
        src: "./assets/yongan-scene-yueman-03.webp",
        eyebrow: "FULL MOON EXPERIENCE · 03 / 05",
        title: "月满｜玉璧主题农产体验",
        caption: "围绕“太阳与丰收”的意象，将农产品展示、田园趣味与游客消费结合，把乡村农产转化为可体验、可传播的文旅内容。"
      },
      {
        type: "video",
        src: "./assets/yongan-scene-yueman-04.mp4",
        poster: "./assets/yongan-scene-yueman-04-poster.jpg",
        eyebrow: "FULL MOON EXPERIENCE · 04 / 05",
        title: "月满｜黑陶主题手工体验",
        caption: "以非遗工艺与手作体验为内容切口，让游客从观看转向参与，形成可互动、可带走、可记忆的文化体验。"
      },
      {
        type: "video",
        src: "./assets/yongan-scene-yueman-05.mp4",
        eyebrow: "FULL MOON EXPERIENCE · 05 / 05",
        title: "月满｜稻作主题农家风味",
        caption: "将稻作文明、本地风味与农产品展示结合，打造可试吃、可购买、可传播的乡村消费场景，延展游客消费与分享路径。"
      }
    ]
  },
  yueluo: {
    label: "月落·休憩",
    slides: [
      {
        type: "video",
        src: "./assets/yongan-scene-yueluo-01.mp4",
        eyebrow: "MOONSET REST · 01 / 01",
        title: "月落｜慢游停留与休憩收束",
        caption: "以亲水平台、滨水露营和露天电影承接夜游后半段体验，延长游客停留时间，完成从游览到休憩的空间收束。"
      }
    ]
  }
};

const sceneBrowser = document.querySelector("[data-scene-browser]");
const sceneImage = sceneBrowser?.querySelector(".scene-frame img");
const sceneVideo = sceneBrowser?.querySelector(".scene-frame video");
const sceneFrame = sceneBrowser?.querySelector(".scene-frame");
const sceneCaption = sceneBrowser?.querySelector(".scene-caption");
const sceneThumbs = sceneBrowser?.querySelector(".scene-thumbs");
const sceneButtons = [...document.querySelectorAll("[data-area]")];
const scenePrev = document.querySelector("[data-scene-prev]");
const sceneNext = document.querySelector("[data-scene-next]");

let currentArea = "yueman";
let currentSceneIndex = 0;
let scenesInView = false;

function renderSceneThumbs(area) {
  if (!sceneThumbs) return;
  const slides = sceneData[area].slides;
  sceneThumbs.innerHTML = slides
    .map(
      (slide, index) => `
        <button class="scene-thumb${index === currentSceneIndex ? " is-active" : ""}" type="button" data-scene-index="${index}" aria-label="查看${slide.title}">
          ${slide.type === "video"
            ? `<video src="${slide.src}"${slide.poster ? ` poster="${slide.poster}"` : ""} autoplay muted loop preload="metadata" playsinline aria-hidden="true"></video>`
            : `<img src="${slide.src}" alt="" loading="lazy" decoding="async">`}
        </button>
      `
    )
    .join("");

  sceneThumbs.querySelectorAll("video").forEach((video) => {
    video.play().catch(() => {
      // Thumbnail videos remain as still previews if autoplay is blocked.
    });
  });
}

function updateScene() {
  if (!sceneCaption) return;

  const area = sceneData[currentArea];
  const slide = area.slides[currentSceneIndex];
  const total = area.slides.length;

  const slot = sceneFrame?.closest(".image-slot");
  if (slot) slot.classList.remove("is-missing");

  if (sceneImage) {
    sceneImage.hidden = true;
    sceneImage.removeAttribute("src");
  }

  if (sceneVideo) {
    sceneVideo.hidden = true;
    sceneVideo.pause();
    sceneVideo.removeAttribute("src");
    sceneVideo.removeAttribute("poster");
    sceneVideo.load();
  }

  if (slide.type === "video" && sceneVideo) {
    sceneVideo.hidden = false;
    if (slide.poster) {
      sceneVideo.poster = slide.poster;
    }
    sceneVideo.src = slide.src;
    sceneVideo.load();
    sceneVideo.play().catch(() => {
      // Keep the active video visible even if autoplay is blocked.
    });
  } else if (sceneImage) {
    sceneImage.hidden = false;
    sceneImage.src = slide.src;
    sceneImage.alt = `${area.label} ${slide.title}`;
  }

  sceneCaption.innerHTML = `
    <p class="eyebrow">${slide.eyebrow}</p>
    <h3>${slide.title}</h3>
    <p>${slide.caption}</p>
  `;

  renderSceneThumbs(currentArea);
}

function setArea(area) {
  if (!sceneData[area]) return;
  currentArea = area;
  currentSceneIndex = 0;

  sceneButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.area === area);
  });

  updateScene();
}

function setScene(index) {
  const slides = sceneData[currentArea].slides;
  currentSceneIndex = (index + slides.length) % slides.length;
  updateScene();
}

sceneButtons.forEach((button) => {
  button.addEventListener("click", () => setArea(button.dataset.area));
});

scenePrev?.addEventListener("click", () => setScene(currentSceneIndex - 1));
sceneNext?.addEventListener("click", () => setScene(currentSceneIndex + 1));

sceneThumbs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scene-index]");
  if (!button) return;
  setScene(Number(button.dataset.sceneIndex));
});

if (sceneFrame) {
  let startX = 0;
  let startY = 0;
  let isPointerDown = false;

  sceneFrame.addEventListener("pointerdown", (event) => {
    isPointerDown = true;
    startX = event.clientX;
    startY = event.clientY;
  });

  sceneFrame.addEventListener("pointerup", (event) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    setScene(currentSceneIndex + (deltaX < 0 ? 1 : -1));
  });

  sceneFrame.addEventListener("pointercancel", () => {
    isPointerDown = false;
  });
}

const scenesSection = document.querySelector("#scenes");
if (scenesSection) {
  const scenesObserver = new IntersectionObserver(
    ([entry]) => {
      scenesInView = entry.isIntersecting;
    },
    { threshold: 0.35 }
  );
  scenesObserver.observe(scenesSection);
}

window.addEventListener("keydown", (event) => {
  if (!scenesInView) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

  if (event.key === "ArrowLeft") {
    setScene(currentSceneIndex - 1);
  }

  if (event.key === "ArrowRight") {
    setScene(currentSceneIndex + 1);
  }
});

updateScene();

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


initClickSpark(".btn, .case-nav a, .back-top, .scene-button, .scene-arrow, .scene-thumb, .play-button");
