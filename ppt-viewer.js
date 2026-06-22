const project = window.pptProject;
const frame = document.querySelector(".slide-frame");
const count = document.querySelector(".slide-count");
const caption = document.querySelector(".slide-caption");
const thumbs = document.querySelector(".thumb-strip");
const title = document.querySelector("[data-project-title]");
const company = document.querySelector("[data-project-company]");
const description = document.querySelector("[data-project-description]");
const tags = document.querySelector("[data-project-tags]");
const role = document.querySelector("[data-project-role]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeIndex = 0;
let touchStartX = 0;

const moreCaseNav = [
  { title: "察微见智", href: "ppt-chaweijianzhi.html" },
  { title: "创锋业务链路数字化展示", href: "ppt-chuangfeng.html" },
  { title: "芯有灵犀", href: "ppt-xinyoulingxi.html" },
  { title: "玖蕴智能协同方案", href: "ppt-jiuyun.html" },
  { title: "中科磁业工业科技方案可视化", href: "ppt-zhongke.html" }
];

const isVideoSource = (src = "") => /\.(mp4|webm)$/i.test(src);

const getSlideSource = (slide) => slide?.video || slide?.image || "";

const isVideoSlide = (slide) => slide?.type === "video" || Boolean(slide?.video) || isVideoSource(getSlideSource(slide));

if (project) {
  document.title = `${project.title}｜企业路演视觉作品`;
  if (title) title.textContent = project.title;
  if (company) company.textContent = project.company;
  if (description) description.textContent = project.description;
  if (tags) tags.innerHTML = (project.tags || []).map((tag) => `<span>${tag}</span>`).join("");
  if (role) role.textContent = project.role || "";
}

const renderSlide = (index) => {
  if (!project || !frame || !project.slides?.length) return;
  activeIndex = (index + project.slides.length) % project.slides.length;
  const current = project.slides[activeIndex];
  const source = getSlideSource(current);
  const useVideo = isVideoSlide(current);

  frame.classList.remove("is-missing");
  frame.innerHTML = `
    <div class="slide-placeholder"><span><strong>${project.title}</strong><small>${current.caption}</small></span></div>
  `;

  if (!source) {
    frame.classList.add("is-missing");
  } else if (useVideo) {
    const video = document.createElement("video");
    video.className = "ppt-slide-video";
    video.src = source;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("aria-label", current.caption || `${project.title} 视频页`);
    video.addEventListener("error", () => frame.classList.add("is-missing"), { once: true });
    video.addEventListener("loadedmetadata", () => {
      frame.classList.remove("is-missing");
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }, { once: true });
    frame.appendChild(video);
  } else {
    const image = document.createElement("img");
    image.src = source;
    image.alt = `${project.title} 第 ${activeIndex + 1} 页`;
    image.loading = "lazy";
    image.decoding = "async";
    image.dataset.slideImage = "";
    image.addEventListener("error", () => frame.classList.add("is-missing"), { once: true });
    image.addEventListener("load", () => frame.classList.remove("is-missing"), { once: true });
    frame.appendChild(image);
  }

  if (count) count.textContent = `第 ${activeIndex + 1} 页 / 共 ${project.slides.length} 页`;
  if (caption) caption.textContent = current.caption;

  thumbs?.querySelectorAll(".thumb-button").forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === activeIndex);
    if (buttonIndex === activeIndex) {
      button.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    }
  });
};

const renderThumbs = () => {
  if (!project || !thumbs || !project.slides?.length) return;
  thumbs.style.setProperty("--ppt-thumb-count", project.slides.length);
  thumbs.innerHTML = project.slides.map((slide, index) => `
    <button class="thumb-button" type="button" aria-label="查看第 ${index + 1} 页" data-thumb="${index}" data-label="第 ${index + 1} 页">
      <span>第 ${index + 1} 页</span>
    </button>
  `).join("");

  thumbs.querySelectorAll("[data-thumb]").forEach((button) => {
    button.addEventListener("click", () => renderSlide(Number(button.dataset.thumb)));
  });
};

const go = (direction) => {
  if (!project?.slides?.length) return;
  renderSlide(activeIndex + direction);
};

const initMoreCaseNav = () => {
  const infoPanel = document.querySelector(".ppt-info-panel");
  const actions = document.querySelector(".ppt-actions");
  if (!infoPanel && !actions) return;

  document.querySelector(".ppt-case-nav")?.remove();

  const currentFile = window.location.pathname.split("/").pop() || "ppt-chaweijianzhi.html";
  const currentIndex = moreCaseNav.findIndex((item) => item.href === currentFile);
  if (currentIndex < 0) return;

  const previous = moreCaseNav[(currentIndex - 1 + moreCaseNav.length) % moreCaseNav.length];
  const next = moreCaseNav[(currentIndex + 1) % moreCaseNav.length];
  const nav = document.createElement("nav");
  nav.className = "ppt-case-nav";
  nav.setAttribute("aria-label", "更多案例切换");
  nav.innerHTML = `
    <a class="ppt-case-nav-link ppt-case-prev" href="${previous.href}">
      <span>← 上一个案例</span>
      <strong>${previous.title}</strong>
    </a>
    <a class="ppt-case-nav-link ppt-case-next" href="${next.href}">
      <span>下一个案例 →</span>
      <strong>${next.title}</strong>
    </a>
  `;

  const roleBlock = infoPanel?.querySelector(".ppt-role");
  const panelActions = infoPanel?.querySelector(".ppt-actions");
  if (roleBlock) {
    roleBlock.insertAdjacentElement("beforebegin", nav);
  } else if (panelActions) {
    panelActions.insertAdjacentElement("beforebegin", nav);
  } else if (actions) {
    actions.insertAdjacentElement("beforebegin", nav);
  } else {
    infoPanel.appendChild(nav);
  }
};

document.querySelector("[data-prev]")?.addEventListener("click", () => go(-1));
document.querySelector("[data-next]")?.addEventListener("click", () => go(1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") go(-1);
  if (event.key === "ArrowRight") go(1);
});

frame?.addEventListener("touchstart", (event) => {
  touchStartX = event.touches?.[0]?.clientX ?? 0;
}, { passive: true });

frame?.addEventListener("touchend", (event) => {
  const endX = event.changedTouches?.[0]?.clientX ?? touchStartX;
  const delta = endX - touchStartX;
  if (Math.abs(delta) < 36) return;
  go(delta > 0 ? -1 : 1);
}, { passive: true });

if (project?.slides?.length) {
  renderThumbs();
  renderSlide(0);
}

initMoreCaseNav();
