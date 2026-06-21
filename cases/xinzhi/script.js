const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const navLinks = document.querySelectorAll(".case-nav a");
const sections = document.querySelectorAll("main section[id]");
const backTop = document.querySelector(".back-top");

const highlightSlides = [
  {
    title: "决策支持平台",
    src: "./assets/highlight-platform.mp4",
    poster: "./assets/highlight-platform.png",
    desc: "把数据分析转化为销售辅助后台。整合客户画像、区域销售与推荐结果，为业务员提供可视化决策依据。"
  },
  {
    title: "兰宝 AI 智能体助手",
    src: "./assets/highlight-lanbao.mp4",
    poster: "./assets/highlight-lanbao.png",
    desc: "把分析结果转译成销售建议。根据地区、季节、客户类型和历史采购行为，生成面料推荐建议与沟通话术。"
  },
  {
    title: "数字人辅助培训",
    src: "./assets/highlight-digital-human.mp4",
    poster: "./assets/highlight-digital-human.png",
    desc: "把销售经验沉淀为培训内容资产。结合数字人、3D 展示和培训内容，降低新人培养成本。"
  },
  {
    title: "项目创新",
    src: "./assets/highlight-innovation.png",
    desc: "多模型 + 平台 + 智能体协同。把客户识别、趋势预测与销售辅助连接成完整工作流。"
  }
];

const isVideo = (src = "") => /\.(mp4|webm)$/i.test(src.split("?")[0]);

const thumbMediaTemplate = (slide, index) => {
  const thumbSrc = slide.poster || slide.src;
  const label = `${String(index + 1).padStart(2, "0")} ${slide.title}`;

  if (isVideo(thumbSrc)) {
    return `<video src="${thumbSrc}#t=0.12" muted playsinline preload="metadata" aria-hidden="true"></video>`;
  }

  return `<img src="${thumbSrc}" alt="${label}" loading="lazy" decoding="async">`;
};

const markMissingMedia = (media) => {
  const slot = media.closest(".image-slot");
  slot?.classList.add("is-missing");
  slot?.classList.remove("is-media-ready");
};

const markReadyMedia = (media) => {
  const slot = media.closest(".image-slot");
  slot?.classList.remove("is-missing");
  slot?.classList.add("is-media-ready");
};

const bindMediaFallback = () => {
  document.querySelectorAll("[data-fallback]").forEach((media) => {
    media.addEventListener("error", () => markMissingMedia(media));
    media.addEventListener("load", () => markReadyMedia(media));
    media.addEventListener("loadeddata", () => markReadyMedia(media));

    if (media.tagName === "IMG" && media.src && media.complete && media.naturalWidth === 0) {
      markMissingMedia(media);
    }
  });
};

const setupHighlightSlider = () => {
  const slider = document.querySelector("[data-highlight-slider]");
  if (!slider) return;

  const frame = slider.querySelector(".highlight-media");
  const image = frame?.querySelector("img");
  const video = frame?.querySelector("video");
  const copy = slider.querySelector(".highlight-copy");
  const thumbs = slider.querySelector(".highlight-thumbs");
  const prev = slider.querySelector("[data-highlight-prev]");
  const next = slider.querySelector("[data-highlight-next]");
  let activeIndex = 0;

  const renderThumbs = () => {
    if (!thumbs) return;
    thumbs.innerHTML = highlightSlides.map((slide, index) => `
      <button class="highlight-thumb${index === activeIndex ? " is-active" : ""}" type="button" data-highlight-thumb="${index}" aria-label="查看${slide.title}">
        <figure>${thumbMediaTemplate(slide, index)}<span>${String(index + 1).padStart(2, "0")}</span></figure>
        <strong>${slide.title}</strong>
      </button>
    `).join("");

    thumbs.querySelectorAll("[data-highlight-thumb]").forEach((button) => {
      button.addEventListener("click", () => showSlide(Number(button.dataset.highlightThumb)));
      button.querySelector("img")?.addEventListener("error", () => button.classList.add("is-missing"));
      button.querySelector("video")?.addEventListener("error", () => button.classList.add("is-missing"));
    });
  };

  const updateThumbs = () => {
    thumbs?.querySelectorAll("[data-highlight-thumb]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.highlightThumb) === activeIndex);
    });
  };

  function showSlide(index) {
    activeIndex = (index + highlightSlides.length) % highlightSlides.length;
    const slide = highlightSlides[activeIndex];
    const isVideoSlide = isVideo(slide.src);

    frame?.classList.remove("is-missing", "is-media-ready");

    if (image) {
      image.hidden = isVideoSlide;
      if (!isVideoSlide) {
        image.src = slide.src;
        image.alt = slide.title;
      } else {
        image.removeAttribute("src");
      }
    }

    if (video) {
      video.pause();
      video.hidden = !isVideoSlide;
      if (isVideoSlide) {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        if (slide.poster) {
          video.poster = slide.poster;
        } else {
          video.removeAttribute("poster");
        }
        video.src = slide.src;
        video.load();
        if (!prefersReducedMotion) {
          video.play().catch(() => {});
        }
      } else {
        video.removeAttribute("src");
      }
    }

    video?.addEventListener("error", () => {
      if (!slide.poster || !image) return;
      video.hidden = true;
      video.removeAttribute("src");
      image.hidden = false;
      image.src = slide.poster;
      image.alt = slide.title;
    }, { once: true });

    if (copy) {
      copy.classList.add("is-switching");
      window.setTimeout(() => {
        copy.innerHTML = `
          <p class="caption-index">Highlight ${String(activeIndex + 1).padStart(2, "0")}</p>
          <h3>${slide.title}</h3>
          <p>${slide.desc}</p>
        `;
        copy.classList.remove("is-switching");
      }, prefersReducedMotion ? 0 : 120);
    }

    updateThumbs();
  }

  prev?.addEventListener("click", () => showSlide(activeIndex - 1));
  next?.addEventListener("click", () => showSlide(activeIndex + 1));

  renderThumbs();
  showSlide(0);
};

bindMediaFallback();
setupHighlightSlider();

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


initClickSpark(".btn, .case-nav a, .back-top, .highlight-arrow, .highlight-thumb");

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
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
