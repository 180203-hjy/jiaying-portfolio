const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav a");
const sections = document.querySelectorAll("main section[id]");
const backToTop = document.querySelector(".back-to-top");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox img");
const lightboxClose = document.querySelector(".lightbox-close");
const videoLightbox = document.querySelector(".video-lightbox");
const videoLightboxVideo = document.querySelector(".video-lightbox video");
const contactModal = document.querySelector(".contact-modal");
const contactPanels = document.querySelectorAll("[data-contact-panel]");
const scholarshipDrawer = document.querySelector(".scholarship-drawer");
const educationProofMedia = document.querySelector("[data-education-proof-media]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Keep heavy decorative effects opt-in. They were legacy visual layers that add
// WebGL/canvas/video scrub work on top of the scroll-driven sections.
const ENABLE_HEAVY_AMBIENT_EFFECTS = false;
const ENABLE_CLICK_SPARK_EFFECT = false;
const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.appendChild(toast);
let toastTimer;

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
};

const closeMobileNav = () => {
  nav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

const introSection = document.querySelector("#intro");
const homeSection = document.querySelector("#home");
const skillsSection = document.querySelector("#skills");
let portfolioGate = "intro";
let isProgrammaticScroll = false;
let gateScrollTimer;
let touchStartY = 0;
let gateInputListenersActive = false;
let syncGateInputListeners = () => {};
let suppressLightboxUntil = 0;
let lastIntroEnterAt = 0;

const setPortfolioGate = (nextGate) => {
  portfolioGate = nextGate;
  document.body.classList.toggle("is-gate-locked", nextGate !== "unlocked");
  document.body.classList.toggle("gate-intro", nextGate === "intro");
  document.body.classList.toggle("gate-unlocked", nextGate === "unlocked");
  if (nextGate !== "unlocked") {
    closeWorkflowPreviewShell();
  }
  syncGateInputListeners(nextGate);
};

const getGateForHash = (hash) => {
  if (hash === "#intro") return "intro";
  return "unlocked";
};

const bridgePhaseByHash = new Map([
  ["#home", 0.11],
  ["#skills", 0.5],
  ["#deliverables", 0.87]
]);

const scrollToBridgePhaseHash = (hash, behavior = "smooth") => {
  const phase = bridgePhaseByHash.get(hash);
  if (phase === undefined) {
    return false;
  }

  if (typeof window.__scrollToAigcBridgePhase === "function") {
    window.__scrollToAigcBridgePhase(phase, behavior);
    return true;
  }

  const bridge = document.querySelector("[data-aigc-bridge]");
  if (!bridge) return false;
  const bridgeTop = bridge.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(1, bridge.offsetHeight - window.innerHeight);
  window.scrollTo({
    top: Math.max(0, bridgeTop + scrollable * phase),
    behavior
  });
  return true;
};

const closeWorkflowPreviewShell = () => {
  const workflowPanel = document.querySelector("[data-workflow-preview-panel]");
  workflowPanel?.classList.remove("is-open");
  workflowPanel?.setAttribute("aria-hidden", "true");
  workflowPanel?.querySelectorAll("video").forEach((video) => video.pause());
  document.body.classList.remove("is-workflow-preview-open");
  document.querySelectorAll("[data-workflow-type].is-active").forEach((trigger) => trigger.classList.remove("is-active"));
  document.querySelectorAll("[data-workflow-tab].is-active").forEach((tab) => {
    tab.classList.remove("is-active");
    tab.removeAttribute("aria-current");
  });
};

const closeAllOverlaysBeforeEnter = () => {
  videoLightbox?.classList.remove("is-open");
  videoLightbox?.setAttribute("aria-hidden", "true");
  if (videoLightboxVideo) {
    videoLightboxVideo.pause();
    videoLightboxVideo.controls = false;
    videoLightboxVideo.removeAttribute("src");
    videoLightboxVideo.load();
  }

  lightbox?.classList.remove("is-open");
  lightbox?.setAttribute("aria-hidden", "true");
  if (lightboxImage) {
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
  }

  contactModal?.classList.remove("is-open");
  contactModal?.setAttribute("aria-hidden", "true");
  scholarshipDrawer?.classList.remove("is-open");
  scholarshipDrawer?.setAttribute("aria-hidden", "true");
  closeWorkflowPreviewShell();
};

const scrollToHomeOpeningPhase = (behavior = "smooth") => {
  const bridge = document.querySelector("[data-aigc-bridge]") || homeSection;
  if (!bridge) return false;

  if (typeof window.__scrollToAigcBridgePhase === "function") {
    window.__scrollToAigcBridgePhase(bridgePhaseByHash.get("#home") ?? 0.06, behavior);
    return true;
  }

  const bridgeTop = bridge.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(1, bridge.offsetHeight - window.innerHeight);
  window.scrollTo({
    top: Math.max(0, bridgeTop + scrollable * (bridgePhaseByHash.get("#home") ?? 0.06)),
    behavior: prefersReducedMotion ? "auto" : behavior
  });
  return true;
};

const enterPortfolioFromIntro = (event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
  const now = Date.now();
  if (now - lastIntroEnterAt < 250) return;
  lastIntroEnterAt = now;
  if (window.__debugBridge) {
    console.log("intro enter clicked");
    console.log("homeSection", homeSection);
  }

  clearTimeout(gateScrollTimer);
  isProgrammaticScroll = true;
  window.__enteringPortfolio = true;
  window.__suppressBridgeSnapUntil = Date.now() + 1400;
  suppressLightboxUntil = Date.now() + 1600;

  closeAllOverlaysBeforeEnter();
  setPortfolioGate("unlocked");
  document.body.classList.remove("is-gate-locked", "gate-intro");
  document.body.classList.add("gate-unlocked", "is-entering-portfolio");
  closeMobileNav();

  const behavior = prefersReducedMotion ? "auto" : "smooth";
  const scrollHome = () => {
    const didScrollHome = scrollToHomeOpeningPhase(behavior);
    if (!didScrollHome && homeSection) {
      const targetTop = homeSection.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, targetTop + 24),
        behavior
      });
    }
  };

  scrollHome();
  window.requestAnimationFrame(scrollHome);
  window.setTimeout(scrollHome, 120);
  window.setTimeout(scrollHome, 360);
  window.setTimeout(closeAllOverlaysBeforeEnter, 0);
  window.setTimeout(closeAllOverlaysBeforeEnter, 180);
  window.setTimeout(closeAllOverlaysBeforeEnter, 520);
  window.setTimeout(() => {
    document.body.classList.remove("is-entering-portfolio");
  }, 1400);

  if (window.location.hash !== "#home") {
    history.pushState(null, "", "#home");
  }

  window.requestAnimationFrame(() => {
    if (videoLightbox?.classList.contains("is-open")) {
      if (window.__debugBridge) console.log("videoLightbox open after intro enter");
      closeAllOverlaysBeforeEnter();
    }
  });

  gateScrollTimer = window.setTimeout(() => {
    isProgrammaticScroll = false;
    window.__enteringPortfolio = false;
  }, prefersReducedMotion ? 160 : 1500);
};

window.__enterPortfolioFromIntro = enterPortfolioFromIntro;

const lockToGate = () => {
  if (isProgrammaticScroll) return;

  if (portfolioGate === "intro" && introSection) {
    const introTop = introSection.offsetTop;
    if (Math.abs(window.scrollY - introTop) > 1) {
      window.scrollTo({ top: introTop, behavior: "auto" });
    }
  }
};

const scrollToSection = (section, nextGate, hash) => {
  if (!section) return;

  clearTimeout(gateScrollTimer);
  isProgrammaticScroll = true;
  setPortfolioGate(nextGate);
  if (hash !== "#deliverables") closeWorkflowPreviewShell();
  if (scrollToBridgePhaseHash(hash, prefersReducedMotion ? "auto" : "smooth")) {
    // The AIGC screens live inside one sticky section, so internal panels need
    // progress-based scrolling instead of scrollIntoView on absolute children.
  } else if (hash === "#home") {
    const targetTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  } else {
    section.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  if (hash && window.location.hash !== hash) {
    history.pushState(null, "", hash);
  }

  gateScrollTimer = setTimeout(() => {
    isProgrammaticScroll = false;
    lockToGate();
  }, prefersReducedMotion ? 80 : 950);
};

const handleGateWheel = (event) => {
  if (isProgrammaticScroll || portfolioGate === "unlocked") return;

  if (portfolioGate === "intro") {
    event.preventDefault();
    lockToGate();
  }
};

const handleGateTouchStart = (event) => {
  touchStartY = event.touches?.[0]?.clientY ?? 0;
};

const handleGateTouchMove = (event) => {
  if (isProgrammaticScroll || portfolioGate === "unlocked") return;

  const currentY = event.touches?.[0]?.clientY ?? touchStartY;
  const deltaY = touchStartY - currentY;

  if (portfolioGate === "intro") {
    event.preventDefault();
    lockToGate();
  }
};

const scrollKeys = new Set([" ", "Spacebar", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "End", "Home"]);

const handleGateKeydown = (event) => {
  if (portfolioGate === "unlocked" || !scrollKeys.has(event.key)) return;
  if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;

  event.preventDefault();
  lockToGate();
};

syncGateInputListeners = (gate = portfolioGate) => {
  const shouldLock = gate !== "unlocked";
  if (shouldLock && !gateInputListenersActive) {
    window.addEventListener("wheel", handleGateWheel, { passive: false });
    window.addEventListener("touchstart", handleGateTouchStart, { passive: true });
    window.addEventListener("touchmove", handleGateTouchMove, { passive: false });
    window.addEventListener("keydown", handleGateKeydown);
    gateInputListenersActive = true;
    return;
  }

  if (!shouldLock && gateInputListenersActive) {
    window.removeEventListener("wheel", handleGateWheel);
    window.removeEventListener("touchstart", handleGateTouchStart);
    window.removeEventListener("touchmove", handleGateTouchMove);
    window.removeEventListener("keydown", handleGateKeydown);
    gateInputListenersActive = false;
  }
};

const scrollToSelectedWorksComplete = () => {
  const reveal = document.querySelector("[data-selected-works-reveal]");
  if (!reveal) {
    scrollToHashTarget("#cases");
    return;
  }

  const revealTop = reveal.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(1, reveal.offsetHeight - window.innerHeight);
  window.scrollTo({
    top: revealTop + scrollable,
    behavior: "auto"
  });
};

const scrollToHashTarget = (hash, isReturnNavigation = false) => {
  if (hash === "#cases" && isReturnNavigation) {
    closeWorkflowPreviewShell();
    scrollToSelectedWorksComplete();
    return;
  }

  const target = hash ? document.querySelector(hash) : null;
  if (!target) return;
  if (hash !== "#deliverables") closeWorkflowPreviewShell();

  if (scrollToBridgePhaseHash(hash, "auto")) return;

  if (hash === "#home") {
    window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + window.scrollY),
      behavior: "auto"
    });
    return;
  }

  target.scrollIntoView({ behavior: "auto", block: "start" });
};

const getReturnHash = () => {
  const earlyTarget = document.documentElement.dataset.returnTarget;
  if (earlyTarget === "cases") return "#cases";
  if (earlyTarget === "more") return "#more";

  const params = new URLSearchParams(window.location.search);
  const returnTarget = params.get("return");
  if (returnTarget === "cases") return "#cases";
  if (returnTarget === "more") return "#more";
  return "";
};

const initialReturnHash = getReturnHash();
let cancelReturnStabilise = false;

if (initialReturnHash) {
  const cancelReturnLock = () => {
    cancelReturnStabilise = true;
  };
  window.addEventListener("wheel", cancelReturnLock, { passive: true, once: true });
  window.addEventListener("touchstart", cancelReturnLock, { passive: true, once: true });
  window.addEventListener("keydown", cancelReturnLock, { once: true });
}

const cleanReturnUrl = (hash) => {
  if (!window.location.search.includes("return=")) return;

  const cleanUrl = `${window.location.pathname}${hash || ""}`;
  history.replaceState(null, "", cleanUrl);
};

const withAutoScroll = (callback) => {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  try {
    callback();
  } finally {
    root.style.scrollBehavior = previousScrollBehavior;
  }
};

const stabiliseHashScroll = (hash, isReturnNavigation = false) => {
  if (!hash || hash === "#intro") return;

  const delays = isReturnNavigation
    ? [0, 40, 120]
    : [0, 120, 420, 900];

  delays.forEach((delay) => {
    window.setTimeout(() => {
      if (isReturnNavigation && cancelReturnStabilise) return;
      scrollToHashTarget(hash, isReturnNavigation);
    }, delay);
  });
};

const initialisePortfolioGate = () => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const returnHash = initialReturnHash;
  const hash = returnHash || window.location.hash;
  const target = hash ? document.querySelector(hash) : introSection;

  if (returnHash && target) {
    clearTimeout(gateScrollTimer);
    isProgrammaticScroll = false;
    window.__enteringPortfolio = false;
    closeAllOverlaysBeforeEnter();
    setPortfolioGate("unlocked");
    closeMobileNav();
    document.body.classList.remove("is-gate-locked", "gate-intro", "is-entering-portfolio");
    document.body.classList.add("gate-unlocked");
    document.querySelector(".intro-video")?.pause();
    withAutoScroll(() => scrollToHashTarget(returnHash, true));
    window.requestAnimationFrame(() => {
      withAutoScroll(() => scrollToHashTarget(returnHash, true));
      cleanReturnUrl(returnHash);
    });
    stabiliseHashScroll(returnHash, true);
    window.setTimeout(() => {
      document.documentElement.classList.remove("is-return-navigation");
      document.documentElement.removeAttribute("data-return-target");
    }, 500);
    return;
  }

  if (!hash || !target) {
    setPortfolioGate("intro");
    introSection?.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }

  const initialGate = getGateForHash(hash);
  setPortfolioGate(initialGate);
  stabiliseHashScroll(hash, Boolean(returnHash));
  cleanReturnUrl(hash);
};

initialisePortfolioGate();
window.addEventListener("load", () => stabiliseHashScroll(initialReturnHash || window.location.hash, Boolean(initialReturnHash)));
window.addEventListener("pageshow", () => stabiliseHashScroll(initialReturnHash || window.location.hash, Boolean(initialReturnHash)));
window.addEventListener("hashchange", () => {
  if (window.location.hash !== "#deliverables") closeWorkflowPreviewShell();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.matches(".intro-enter-btn, .hero-next-btn")) return;

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    scrollToSection(target, getGateForHash(hash), hash);
    closeMobileNav();
  });
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.(".intro-enter-btn");
  if (!button) return;
  enterPortfolioFromIntro(event);
}, true);

document.querySelectorAll(".intro-enter-btn").forEach((button) => {
  button.addEventListener("click", enterPortfolioFromIntro, { capture: true });
  button.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    enterPortfolioFromIntro(event);
  }, { capture: true });
  button.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    enterPortfolioFromIntro(event);
  });
});

document.querySelectorAll(".hero-next-btn").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const hash = button.getAttribute("href") || "#skills";
    const target = document.querySelector(hash) || skillsSection;
    scrollToSection(target, "unlocked", hash);
    closeMobileNav();
  });
});

if (!prefersReducedMotion && window.gsap) {
  window.gsap.from(".hero .eyebrow, .hero h1, .hero .role, .hero .value, .hero-tags span, .hero-actions .btn", {
    opacity: 0,
    y: 14,
    duration: 0.72,
    stagger: 0.075,
    ease: "power3.out"
  });

  window.gsap.from(".hero-side", {
    opacity: 0,
    y: 12,
    duration: 0.8,
    delay: 0.18,
    ease: "power3.out"
  });
}

const initHeroLightRays = () => {
  const container = document.querySelector(".hero-light-rays");
  if (!container || prefersReducedMotion) return;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return;

  container.appendChild(canvas);

  const hexToRgb = (hex) => {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return match
      ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255]
      : [1, 1, 1];
  };

  const getAnchorAndDir = (origin, width, height) => {
    const outside = 0.2;
    switch (origin) {
      case "top-left":
        return { anchor: [0, -outside * height], dir: [0, 1] };
      case "top-right":
        return { anchor: [width, -outside * height], dir: [0, 1] };
      case "right":
        return { anchor: [(1 + outside) * width, 0.5 * height], dir: [-1, 0] };
      case "left":
        return { anchor: [-outside * width, 0.5 * height], dir: [1, 0] };
      default:
        return { anchor: [0.5 * width, -outside * height], dir: [0, 1] };
    }
  };

  const vertexSource = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 rayPos;
    uniform vec2 rayDir;
    uniform vec3 raysColor;
    uniform float raysSpeed;
    uniform float lightSpread;
    uniform float rayLength;
    uniform float pulsating;
    uniform float fadeDistance;
    uniform float saturation;
    uniform vec2 mousePos;
    uniform float mouseInfluence;
    uniform float noiseAmount;
    uniform float distortion;

    varying vec2 vUv;

    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
      vec2 sourceToCoord = coord - raySource;
      vec2 dirNorm = normalize(sourceToCoord);
      float cosAngle = dot(dirNorm, rayRefDirection);
      float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
      float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
      float distance = length(sourceToCoord);
      float maxDistance = iResolution.x * rayLength;
      float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
      float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
      float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
      float baseStrength = clamp(
        (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
        (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
        0.0,
        1.0
      );
      return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
    }

    void main() {
      vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
      vec2 finalRayDir = rayDir;
      if (mouseInfluence > 0.0) {
        vec2 mouseScreenPos = mousePos * iResolution.xy;
        vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
        finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
      }

      vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
      vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
      vec4 color = rays1 * 0.5 + rays2 * 0.4;

      float n = noise(coord * 0.01 + iTime * 0.1);
      color.rgb *= (1.0 - noiseAmount + noiseAmount * n);

      float brightness = 1.0 - (coord.y / iResolution.y);
      color.r *= 0.1 + brightness * 0.8;
      color.g *= 0.3 + brightness * 0.6;
      color.b *= 0.5 + brightness * 0.5;

      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, saturation);
      color.rgb *= raysColor;
      gl_FragColor = color;
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Light rays shader compile failed:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Light rays program link failed:", gl.getProgramInfoLog(program));
    return;
  }

  const positionLocation = gl.getAttribLocation(program, "position");
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const uniforms = {
    iTime: gl.getUniformLocation(program, "iTime"),
    iResolution: gl.getUniformLocation(program, "iResolution"),
    rayPos: gl.getUniformLocation(program, "rayPos"),
    rayDir: gl.getUniformLocation(program, "rayDir"),
    raysColor: gl.getUniformLocation(program, "raysColor"),
    raysSpeed: gl.getUniformLocation(program, "raysSpeed"),
    lightSpread: gl.getUniformLocation(program, "lightSpread"),
    rayLength: gl.getUniformLocation(program, "rayLength"),
    pulsating: gl.getUniformLocation(program, "pulsating"),
    fadeDistance: gl.getUniformLocation(program, "fadeDistance"),
    saturation: gl.getUniformLocation(program, "saturation"),
    mousePos: gl.getUniformLocation(program, "mousePos"),
    mouseInfluence: gl.getUniformLocation(program, "mouseInfluence"),
    noiseAmount: gl.getUniformLocation(program, "noiseAmount"),
    distortion: gl.getUniformLocation(program, "distortion")
  };

  const settings = {
    raysOrigin: "top-center",
    raysColor: "#ffde77",
    raysSpeed: 1.05,
    lightSpread: 0.72,
    rayLength: 1.18,
    pulsating: 1,
    fadeDistance: 1.08,
    saturation: 1.05,
    mouseInfluence: 0.1,
    noiseAmount: 0.16,
    distortion: 0.045
  };
  const color = hexToRgb(settings.raysColor);
  const mouse = { x: 0.5, y: 0.5 };
  const smoothMouse = { x: 0.5, y: 0.5 };
  let width = 1;
  let height = 1;
  let frameId = 0;
  let visible = false;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width * dpr));
    height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const render = (time) => {
    if (!visible) return;

    smoothMouse.x = smoothMouse.x * 0.92 + mouse.x * 0.08;
    smoothMouse.y = smoothMouse.y * 0.92 + mouse.y * 0.08;
    const { anchor, dir } = getAnchorAndDir(settings.raysOrigin, width, height);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uniforms.iTime, time * 0.001);
    gl.uniform2f(uniforms.iResolution, width, height);
    gl.uniform2f(uniforms.rayPos, anchor[0], anchor[1]);
    gl.uniform2f(uniforms.rayDir, dir[0], dir[1]);
    gl.uniform3f(uniforms.raysColor, color[0], color[1], color[2]);
    gl.uniform1f(uniforms.raysSpeed, settings.raysSpeed);
    gl.uniform1f(uniforms.lightSpread, settings.lightSpread);
    gl.uniform1f(uniforms.rayLength, settings.rayLength);
    gl.uniform1f(uniforms.pulsating, settings.pulsating);
    gl.uniform1f(uniforms.fadeDistance, settings.fadeDistance);
    gl.uniform1f(uniforms.saturation, settings.saturation);
    gl.uniform2f(uniforms.mousePos, smoothMouse.x, smoothMouse.y);
    gl.uniform1f(uniforms.mouseInfluence, settings.mouseInfluence);
    gl.uniform1f(uniforms.noiseAmount, settings.noiseAmount);
    gl.uniform1f(uniforms.distortion, settings.distortion);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frameId = requestAnimationFrame(render);
  };

  const start = () => {
    if (visible) return;
    visible = true;
    resize();
    frameId = requestAnimationFrame(render);
  };

  const stop = () => {
    visible = false;
    cancelAnimationFrame(frameId);
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      start();
    } else {
      stop();
    }
  }, { threshold: 0.08 });

  observer.observe(container);

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mouse.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    mouse.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  }, { passive: true });
};

if (ENABLE_HEAVY_AMBIENT_EFFECTS) {
  initHeroLightRays();
}

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
  let sparkFrame = 0;
  const config = {
    color: "#efe8ca",
    size: 13,
    radius: 18,
    count: 8,
    duration: 420
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
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    if (sparks.length) {
      sparkFrame = requestAnimationFrame(draw);
    } else {
      sparkFrame = 0;
    }
  };

  const startSparkLoop = () => {
    if (sparkFrame) return;
    sparkFrame = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });

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
    startSparkLoop();
  }, true);
};


const initHeroTreeEffect = () => {
  const wrap = document.querySelector("[data-hero-skills-transition]");
  const hero = wrap?.querySelector(".hero-scroll-scene") || document.querySelector("#profile");
  const scene = wrap?.querySelector(".hero-transition-sticky-bg") || hero?.querySelector(".hero-scroll-sticky") || hero;
  const canvas = wrap?.querySelector(".hero-tree-particles") || hero?.querySelector(".hero-tree-particles");
  const variableTarget = wrap || hero;

  if (!variableTarget || !scene || !canvas || prefersReducedMotion) {
    variableTarget?.style.setProperty("--hero-tree-particle-opacity", "0");
    return;
  }

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const smooth = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };

  let frame = 0;
  let particleFrame = 0;
  let ctx = null;
  let width = 0;
  let height = 0;
  let particles = [];
  let progress = 0;
  let particleOpacity = 0;
  let isVisible = false;
  let wrapTop = 0;
  let scrollLength = 1;

  const measure = () => {
    const rect = wrap?.getBoundingClientRect?.() || hero.getBoundingClientRect();
    wrapTop = window.scrollY + rect.top;
    scrollLength = Math.max(1, (wrap?.offsetHeight || hero.offsetHeight) - window.innerHeight);

    const sceneRect = scene.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(sceneRect.width * dpr));
    height = Math.max(1, Math.round(sceneRect.height * dpr));
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");

    const count = Math.round(clamp(sceneRect.width / 11, 70, 135));
    const centerX = width * 0.52;
    const centerY = height * 0.42;
    particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.9) * Math.min(width, height) * 0.34;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.76,
        size: (0.75 + Math.random() * 2.15) * dpr,
        driftX: (Math.random() - 0.38) * width * 0.38,
        driftY: (0.18 + Math.random() * 0.44) * height,
        alpha: 0.22 + Math.random() * 0.54,
        hue: Math.random() > 0.45 ? 42 : 36,
        phase: Math.random() * Math.PI * 2
      };
    });
  };

  const update = () => {
    frame = 0;
    progress = clamp((window.scrollY - wrapTop) / scrollLength);
    const dissolve = smooth(progress);
    const particleIn = smooth(clamp((progress - 0.14) / 0.24));
    const particleOut = smooth(clamp((progress - 0.78) / 0.2));
    particleOpacity = particleIn * (1 - particleOut);

    variableTarget.style.setProperty("--hero-tree-opacity", Math.max(0.18, 0.72 - dissolve * 0.42).toFixed(3));
    variableTarget.style.setProperty("--hero-tree-scale", mix(1.04, 1.1, dissolve).toFixed(3));
    variableTarget.style.setProperty("--hero-tree-y", `${mix(0, 86, dissolve).toFixed(1)}px`);
    variableTarget.style.setProperty("--hero-tree-blur", `${mix(0, 7, dissolve).toFixed(1)}px`);
    variableTarget.style.setProperty("--hero-tree-particle-opacity", particleOpacity.toFixed(3));
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  const draw = (time = 0) => {
    particleFrame = 0;
    if (!isVisible || !ctx || !width || !height) return;

    ctx.clearRect(0, 0, width, height);

    if (particleOpacity > 0.01) {
      const fall = smooth(progress);
      particles.forEach((particle) => {
        const x = particle.x + particle.driftX * fall + Math.sin(time * 0.001 + particle.phase) * 9;
        const y = particle.y + particle.driftY * fall;
        const alpha = particle.alpha * particleOpacity * (1 - fall * 0.32);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${particle.hue}, 72%, 76%, ${alpha})`;
        ctx.arc(x, y, particle.size * (1 + fall * 0.35), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    particleFrame = window.requestAnimationFrame(draw);
  };

  const startParticles = () => {
    if (particleFrame) return;
    particleFrame = window.requestAnimationFrame(draw);
  };

  const stopParticles = () => {
    if (particleFrame) {
      window.cancelAnimationFrame(particleFrame);
      particleFrame = 0;
    }
    ctx?.clearRect(0, 0, width, height);
  };

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
    if (isVisible) {
      requestUpdate();
      startParticles();
    } else {
      stopParticles();
    }
  }, { rootMargin: "20% 0px", threshold: 0 });

  measure();
  update();
  observer.observe(wrap || hero);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    requestUpdate();
  }, { passive: true });
  window.addEventListener("load", () => {
    measure();
    requestUpdate();
  }, { once: true });
};

const initHeroVideoScrubTransition = () => {
  const wrap = document.querySelector("[data-hero-skills-transition]");
  const hero = wrap?.querySelector(".hero-scroll-scene");
  const skills = wrap?.querySelector(".skills-system-section");
  const video = wrap?.querySelector(".hero-tree-dissolve-video") || hero?.querySelector(".hero-tree-dissolve-video");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  if (!wrap || !hero || !skills || !video) return;

  const reset = () => {
    wrap.style.setProperty("--hero-video-opacity", "0");
    wrap.style.setProperty("--hero-content-opacity", "1");
    wrap.style.setProperty("--hero-content-y", "0px");
    wrap.style.setProperty("--skills-enter-opacity", "1");
    wrap.style.setProperty("--skills-enter-y", "0px");
    video.pause();
  };

  if (prefersReducedMotion || mobileQuery.matches) {
    reset();
    return;
  }

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (start, end, amount) => start + (end - start) * amount;
  const mapRange = (value, inMin, inMax, outMin = 0, outMax = 1) => {
    const amount = clamp((value - inMin) / Math.max(0.0001, inMax - inMin));
    return mix(outMin, outMax, amount);
  };
  const smooth = (value) => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  let frame = 0;
  let wrapTop = 0;
  let scrollLength = 1;
  let videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
  let videoAvailable = video.readyState >= 1 && videoDuration > 0;
  let easedVideoTime = 0;

  const measure = () => {
    const rect = wrap.getBoundingClientRect();
    wrapTop = window.scrollY + rect.top;
    scrollLength = Math.max(1, wrap.offsetHeight - window.innerHeight);
  };

  const markVideoUnavailable = () => {
    videoAvailable = false;
    wrap.style.setProperty("--hero-video-opacity", "0");
  };

  const syncVideoMetadata = () => {
    videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
    videoAvailable = videoDuration > 0;
    video.pause();
    requestUpdate();
  };

  const update = () => {
    frame = 0;

    const raw = clamp((window.scrollY - wrapTop) / scrollLength);

    const videoProgress = smooth(mapRange(raw, 0.1, 0.98));
    const videoOpacityIn = smooth(mapRange(raw, 0.1, 0.26));
    const videoOpacityOut = smooth(mapRange(raw, 0.94, 1));
    const contentFade = smooth(mapRange(raw, 0.3, 0.66));
    const skillsIn = smooth(mapRange(raw, 0.5, 0.88));

    if (videoAvailable && videoDuration > 0) {
      const targetTime = videoProgress * videoDuration;
      easedVideoTime += (targetTime - easedVideoTime) * 0.18;
      const nextTime = Math.min(videoDuration, Math.max(0, easedVideoTime));
      if (Math.abs(video.currentTime - nextTime) > 0.025) {
        try {
          video.currentTime = nextTime;
        } catch {
          markVideoUnavailable();
        }
      }
    }

    const videoOpacity = videoAvailable ? videoOpacityIn * (1 - videoOpacityOut) : 0;
    wrap.style.setProperty("--hero-video-opacity", videoOpacity.toFixed(3));
    wrap.style.setProperty("--hero-content-opacity", `${(1 - contentFade).toFixed(3)}`);
    wrap.style.setProperty("--hero-content-y", `${(-contentFade * 36).toFixed(1)}px`);
    wrap.style.setProperty("--skills-enter-opacity", skillsIn.toFixed(3));
    wrap.style.setProperty("--skills-enter-y", `${((1 - skillsIn) * 48).toFixed(1)}px`);
  };

  function requestUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  }

  measure();

  if (video.readyState >= 1) {
    syncVideoMetadata();
  } else {
    video.addEventListener("loadedmetadata", syncVideoMetadata, { once: true });
  }

  video.addEventListener("error", markVideoUnavailable);

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    requestUpdate();
  }, { passive: true });
  window.addEventListener("load", () => {
    measure();
    requestUpdate();
  }, { once: true });
};

const initSelectedWorksReveal = () => {
  const reveal = document.querySelector("[data-selected-works-reveal]");
  if (!reveal) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const shouldOpenComplete = initialReturnHash === "#cases";
  const card1 = reveal.querySelector(".work-card-1");
  const card2 = reveal.querySelector(".work-card-2");
  const card3 = reveal.querySelector(".work-card-3");
  let frame = 0;
  let spreadMax = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (start, end, amount) => start + (end - start) * amount;
  const mapRange = (value, inMin, inMax, outMin = 0, outMax = 1) => {
    const amount = clamp((value - inMin) / Math.max(0.0001, inMax - inMin));
    return mix(outMin, outMax, amount);
  };
  const smooth = (value) => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  const updateSpread = () => {
    const width = window.innerWidth;
    spreadMax = Math.min(Math.max(width * 0.23, 330), 390);
  };

  const setFinalState = () => {
    updateSpread();
    reveal.classList.add("is-complete");
    reveal.style.setProperty("--sw-heading-opacity", "1");
    reveal.style.setProperty("--sw-heading-y", "0px");
    reveal.style.setProperty("--sw-hero-scale", "0.86");
    reveal.style.setProperty("--sw-hero-opacity", "0");
    reveal.style.setProperty("--sw-card-opacity", "1");
    reveal.style.setProperty("--sw-card-scale", "1");
    reveal.style.setProperty("--sw-card-y", "0px");
    reveal.style.setProperty("--sw-card-spread", mobileQuery.matches ? "0px" : `${spreadMax}px`);
    reveal.style.setProperty("--sw-footnote-opacity", "1");
    reveal.style.setProperty("--sw-footnote-y", "0px");
    reveal.style.setProperty("--flip-1", "180deg");
    reveal.style.setProperty("--flip-2", "180deg");
    reveal.style.setProperty("--flip-3", "180deg");
    card1?.classList.add("is-flipped");
    card2?.classList.add("is-flipped");
    card3?.classList.add("is-flipped");
  };

  const update = () => {
    frame = 0;

    if (prefersReducedMotion || mobileQuery.matches) {
      setFinalState();
      return;
    }

    const rect = reveal.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp(-rect.top / scrollable);
    const shrink = smooth(mapRange(progress, 0.18, 0.38));
    const split = smooth(mapRange(progress, 0.38, 0.62));
    const heroFade = 1 - smooth(mapRange(progress, 0.46, 0.62));
    const footnote = smooth(mapRange(progress, 0.78, 0.9));
    reveal.style.setProperty("--sw-heading-opacity", shrink.toFixed(3));
    reveal.style.setProperty("--sw-heading-y", `${mix(24, 0, shrink).toFixed(2)}px`);
    reveal.style.setProperty("--sw-hero-scale", mix(1, 0.86, shrink).toFixed(3));
    reveal.style.setProperty("--sw-hero-opacity", heroFade.toFixed(3));
    reveal.style.setProperty("--sw-card-opacity", split.toFixed(3));
    reveal.style.setProperty("--sw-card-scale", mix(0.86, 1, split).toFixed(3));
    reveal.style.setProperty("--sw-card-y", `${mix(28, 0, split).toFixed(2)}px`);
    reveal.style.setProperty("--sw-card-spread", `${mix(0, spreadMax, split).toFixed(2)}px`);
    reveal.style.setProperty("--sw-footnote-opacity", footnote.toFixed(3));
    reveal.style.setProperty("--sw-footnote-y", `${mix(10, 0, footnote).toFixed(2)}px`);
    const flip1Progress = smooth(mapRange(progress, 0.66, 0.78));
    const flip2Progress = smooth(mapRange(progress, 0.67, 0.79));
    const flip3Progress = smooth(mapRange(progress, 0.68, 0.8));
    reveal.style.setProperty("--flip-1", `${(180 * flip1Progress).toFixed(2)}deg`);
    reveal.style.setProperty("--flip-2", `${(180 * flip2Progress).toFixed(2)}deg`);
    reveal.style.setProperty("--flip-3", `${(180 * flip3Progress).toFixed(2)}deg`);
    card1?.classList.toggle("is-flipped", flip1Progress > 0.55);
    card2?.classList.toggle("is-flipped", flip2Progress > 0.55);
    card3?.classList.toggle("is-flipped", flip3Progress > 0.55);
    reveal.classList.toggle("is-complete", progress >= 0.84);
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  updateSpread();
  if (shouldOpenComplete) {
    setFinalState();
  } else {
    update();
  }
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    updateSpread();
    requestUpdate();
  }, { passive: true });
  mobileQuery.addEventListener?.("change", requestUpdate);
};

const initAigcBridgeReveal = () => {
  const bridge = document.querySelector("[data-aigc-bridge]");
  if (!bridge) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const skillsPanel = bridge.querySelector("#skills");
  const deliverablesPanel = bridge.querySelector("#deliverables");
  const imageFrame = bridge.querySelector("[data-workflow-hero-carousel]") || bridge.querySelector(".aigc-bridge-image-frame");
  const problemCards = [1, 2, 3].map((index) => bridge.querySelector(`.travel-card-${index}`));
  let sectionTop = 0;
  let scrollable = 1;
  let frame = 0;
  let workflowMotionVisible = false;
  let bridgeSnapTimer = 0;
  let isBridgeSnapping = false;
  let suppressSnapUntil = 0;
  let lastScrollY = window.scrollY;
  let lastScrollDirection = 0;
  let problemDeltas = [
    { x: 128, y: 188 },
    { x: 0, y: 230 },
    { x: -128, y: 188 }
  ];
  const bridgePhases = [
    { key: "problems", progress: 0.06 },
    { key: "skills", progress: 0.5 },
    { key: "deliverables", progress: 0.87 }
  ];

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (start, end, amount) => start + (end - start) * amount;
  const mapRange = (value, inMin, inMax, outMin = 0, outMax = 1) => {
    const amount = clamp((value - inMin) / Math.max(0.0001, inMax - inMin));
    return mix(outMin, outMax, amount);
  };
  const smooth = (value) => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };
  const cssVarCache = new Map();
  const setVar = (name, value) => {
    if (cssVarCache.get(name) === value) return;
    cssVarCache.set(name, value);
    bridge.style.setProperty(name, value);
  };
  const setPx = (name, value) => setVar(name, `${value.toFixed(1)}px`);
  const setNumber = (name, value) => setVar(name, value.toFixed(3));
  const getProgress = () => clamp((window.scrollY - sectionTop) / scrollable);
  const getPhaseTargetY = (progress) => sectionTop + scrollable * progress;

  const setStaticState = () => {
    bridge.classList.add("is-static");
  };

  const getNearestPhase = (progress) => {
    // Direction-aware snap keeps the three screens feeling intentional: a
    // small downward move after a phase completes resolves forward instead of
    // falling back to the previous half-state.
    if (lastScrollDirection > 0) {
      if (progress > 0.62) return bridgePhases[2];
      if (progress > 0.38) return bridgePhases[1];
      return bridgePhases[0];
    }
    if (lastScrollDirection < 0) {
      if (progress < 0.30) return bridgePhases[0];
      if (progress < 0.78) return bridgePhases[1];
      return bridgePhases[2];
    }
    return bridgePhases.reduce((nearest, phase) => (
      Math.abs(progress - phase.progress) < Math.abs(progress - nearest.progress) ? phase : nearest
    ), bridgePhases[0]);
  };

  const isInBridgeRange = () => {
    const y = window.scrollY;
    return y >= sectionTop - 4 && y <= sectionTop + scrollable + 4;
  };

  const isBridgeInteractionActive = () => {
    if (Date.now() < suppressSnapUntil) return true;
    if (document.querySelector("[data-workflow-preview-panel].is-open, [data-workflow-preview-panel][aria-hidden='false']")) return true;
    if (document.querySelector(".lightbox.is-open, .video-lightbox.is-open, .contact-modal.is-open")) return true;
    return Boolean(bridge.querySelector(".workflow-hero-card-track:hover, .workflow-hero-controls:hover, [data-workflow-hotspots]:hover"));
  };

  const isInFreeScrollTransition = (progress) => (
    (progress > 0.16 && progress < 0.44) ||
    (progress > 0.62 && progress < 0.76)
  );

  const snapToBridgePhase = () => {
    if (prefersReducedMotion || mobileQuery.matches || isBridgeSnapping || isProgrammaticScroll) return;
    if (!isInBridgeRange() || isBridgeInteractionActive()) return;

    const progress = getProgress();
    if (isInFreeScrollTransition(progress)) return;
    const nearest = getNearestPhase(progress);
    if (Math.abs(progress - nearest.progress) < 0.04) return;

    const targetY = getPhaseTargetY(nearest.progress);
    if (window.__debugBridge) {
      console.table({
        sectionTop,
        scrollable,
        scrollY: window.scrollY,
        progress,
        nearestPhase: nearest.key,
        targetY
      });
    }

    isBridgeSnapping = true;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth"
    });
    window.setTimeout(() => {
      isBridgeSnapping = false;
    }, 760);
  };

  const scheduleBridgeSnap = () => {
    if (prefersReducedMotion || mobileQuery.matches || isBridgeSnapping || isProgrammaticScroll) return;
    if (!isInBridgeRange() || isBridgeInteractionActive()) return;
    if (isInFreeScrollTransition(getProgress())) return;
    window.clearTimeout(bridgeSnapTimer);
    bridgeSnapTimer = window.setTimeout(snapToBridgePhase, 420);
  };

  const scrollToBridgePhase = (phase, behavior = "smooth") => {
    measure();
    requestUpdate();
    window.clearTimeout(bridgeSnapTimer);
    isBridgeSnapping = true;
    window.scrollTo({
      top: Math.max(0, getPhaseTargetY(clamp(phase, 0, 1))),
      behavior: prefersReducedMotion ? "auto" : behavior
    });
    window.setTimeout(() => {
      isBridgeSnapping = false;
      requestUpdate();
    }, prefersReducedMotion || behavior === "auto" ? 90 : 680);
  };

  const measure = () => {
    sectionTop = bridge.offsetTop;
    scrollable = Math.max(1, bridge.offsetHeight - window.innerHeight);

    if (!imageFrame) return;

    const imageRect = imageFrame.getBoundingClientRect();
    const portalX = imageRect.left + imageRect.width / 2;
    const portalY = imageRect.top + imageRect.height / 2;

    if (!problemCards.some((card) => !card)) {
      problemDeltas = problemCards.map((card, index) => {
        if (!card) return problemDeltas[index] || { x: 0, y: 180 };
        const cardRect = card.getBoundingClientRect();
        return {
          x: portalX - (cardRect.left + cardRect.width / 2),
          y: portalY - (cardRect.top + cardRect.height / 2)
        };
      });
    }
  };

  const setProblemCard = (index, intro, absorb, targetX, targetY) => {
    // 三张卡片同时出现，并在第二屏图片出现时钻到图片中心后方。
    const pull = smooth(absorb);
    const vanish = smooth(mapRange(absorb, 0.74, 1));
    const side = index === 1 ? -1 : index === 3 ? 1 : 0;
    const curveY = Math.sin(pull * Math.PI) * -38;
    const curveX = side * Math.sin(pull * Math.PI) * 28;
    const opacity = intro * (1 - vanish);
    const baseY = mix(64, 0, intro);
    const scale = mix(mix(0.94, 1, intro), 0.22, pull);
    const rotate = side * mix(0, -6, pull);
    const trail = smooth(mapRange(absorb, 0.18, 0.68)) * (1 - vanish);

    setNumber(`--problem-card-${index}-opacity`, opacity);
    setPx(`--problem-card-${index}-x`, mix(0, targetX, pull) + curveX);
    setPx(`--problem-card-${index}-y`, mix(baseY, targetY, pull) + curveY);
    setNumber(`--problem-card-${index}-scale`, scale);
    setPx(`--problem-card-${index}-blur`, 0);
    setVar(`--problem-card-${index}-rotate`, `${rotate.toFixed(2)}deg`);
    setNumber(`--problem-card-${index}-trail-opacity`, trail);
    setVar(`--problem-card-${index}-z`, pull > 0.58 ? "3" : "10");
  };

  const update = () => {
    frame = 0;

    if (prefersReducedMotion || mobileQuery.matches) {
      setStaticState();
      return;
    }

    bridge.classList.remove("is-static");
    const raw = getProgress();

    const intro = smooth(mapRange(raw, 0.00, 0.17));
    const problemCardsIntro = smooth(mapRange(raw, 0.02, 0.19));
    const absorb = smooth(mapRange(raw, 0.22, 0.44));
    const problemFade = smooth(mapRange(raw, 0.31, 0.50));
    const imageIn = smooth(mapRange(raw, 0.28, 0.48));
    const imageHold = 1 - smooth(mapRange(raw, 0.68, 0.82));
    const imageOut = smooth(mapRange(raw, 0.68, 0.86));
    const deliverablesIn = smooth(mapRange(raw, 0.66, 0.80));
    const isDeliverablesPhase = raw >= 0.81;
    const portalGlow = absorb * (1 - deliverablesIn * 0.55);

    setNumber("--bridge-p", raw);
    setNumber("--problem-copy-opacity", intro * (1 - problemFade));
    setPx("--problem-copy-y", mix(36, 0, intro) - problemFade * 24);

    // 三张问题卡同时向第二屏中心躲入。
    setProblemCard(1, problemCardsIntro, absorb, problemDeltas[0]?.x ?? 128, problemDeltas[0]?.y ?? 188);
    setProblemCard(2, problemCardsIntro, absorb, problemDeltas[1]?.x ?? 0, problemDeltas[1]?.y ?? 230);
    setProblemCard(3, problemCardsIntro, absorb, problemDeltas[2]?.x ?? -128, problemDeltas[2]?.y ?? 188);

    const imageOpacity = imageIn * imageHold;
    const nextWorkflowMotionVisible = raw > 0.46 && imageOpacity > 0.62 && deliverablesIn < 0.36;
    const deliverablesInteractive = deliverablesIn > 0.55 || isDeliverablesPhase;
    const imageScale = mix(0.9, 1, imageIn) - imageOut * 0.10;
    const imageY = mix(76, 0, imageIn) + imageOut * 12;
    setNumber("--workflow-image-opacity", imageOpacity);
    setNumber("--workflow-image-scale", imageScale);
    setPx("--workflow-image-y", imageY);
    setPx("--workflow-image-blur", 0);
    setNumber("--aigc-portal-glow", Math.min(0.38, portalGlow));

    setNumber("--outputs-copy-opacity", isDeliverablesPhase ? 1 : deliverablesIn);
    setPx("--outputs-copy-y", isDeliverablesPhase ? 0 : mix(30, 0, deliverablesIn));
    setNumber("--deliverables-workflow-opacity", isDeliverablesPhase ? 1 : deliverablesIn);
    setPx("--deliverables-workflow-y", isDeliverablesPhase ? 0 : mix(26, 0, deliverablesIn));
    setNumber("--deliverables-workflow-scale", isDeliverablesPhase ? 1 : mix(0.98, 1, deliverablesIn));
    deliverablesPanel?.classList.toggle("is-deliverables-active", isDeliverablesPhase);
    if (skillsPanel) {
      skillsPanel.style.pointerEvents = deliverablesInteractive ? "none" : "auto";
      skillsPanel.style.zIndex = deliverablesInteractive ? "8" : "8";
    }
    if (deliverablesPanel) {
      deliverablesPanel.style.pointerEvents = deliverablesInteractive ? "auto" : "none";
      deliverablesPanel.style.zIndex = deliverablesInteractive ? "15" : "7";
    }
    if (window.__debugBridge) {
      console.table({
        scrollY: window.scrollY,
        sectionTop,
        scrollable,
        raw,
        deliverablesIn,
        workflowOpacity: getComputedStyle(bridge).getPropertyValue("--deliverables-workflow-opacity")
      });
    }

    if (nextWorkflowMotionVisible !== workflowMotionVisible) {
      workflowMotionVisible = nextWorkflowMotionVisible;
      bridge.dispatchEvent(new CustomEvent("workflowmotionvisibility", {
        detail: { visible: workflowMotionVisible }
      }));
    }
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  window.__scrollToAigcBridgePhase = scrollToBridgePhase;

  if (prefersReducedMotion || mobileQuery.matches) {
    setStaticState();
    return;
  }

  measure();
  update();

  const requestMeasureAndUpdate = () => {
    measure();
    requestUpdate();
  };

  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;
    lastScrollDirection = Math.sign(currentY - lastScrollY);
    lastScrollY = currentY;
    requestUpdate();
    scheduleBridgeSnap();
  }, { passive: true });
  window.addEventListener("resize", requestMeasureAndUpdate, { passive: true });
  window.addEventListener("orientationchange", requestMeasureAndUpdate, { passive: true });
  window.addEventListener("load", requestMeasureAndUpdate, { once: true });
  document.fonts?.ready?.then(requestMeasureAndUpdate).catch?.(() => {});
  bridge.querySelectorAll("img, video").forEach((media) => {
    media.addEventListener("load", requestMeasureAndUpdate, { once: true });
    media.addEventListener("loadedmetadata", requestMeasureAndUpdate, { once: true });
    media.addEventListener("loadeddata", requestMeasureAndUpdate, { once: true });
  });
  bridge.addEventListener("pointerdown", (event) => {
    if (event.target?.closest?.("[data-workflow-hero-carousel], [data-workflow-hotspots], [data-workflow-preview-panel]")) {
      suppressSnapUntil = Date.now() + 900;
    }
  }, true);
  bridge.addEventListener("click", (event) => {
    if (event.target?.closest?.("[data-workflow-hero-carousel], [data-workflow-hotspots], [data-workflow-preview-panel]")) {
      suppressSnapUntil = Date.now() + 900;
    }
  }, true);
  mobileQuery.addEventListener?.("change", () => {
    if (mobileQuery.matches) {
      setStaticState();
      return;
    }
    measure();
    requestUpdate();
  });
};

const initWorkflowHeroCarousel = () => {
  const carousel = document.querySelector("[data-workflow-hero-carousel]");
  if (!carousel) return;

  const bridge = carousel.closest("[data-aigc-bridge]");
  const bg = carousel.querySelector("[data-workflow-hero-bg]");
  const copy = carousel.querySelector("[data-workflow-hero-copy]");
  const numberEl = carousel.querySelector("[data-workflow-hero-number]");
  const titleEl = carousel.querySelector("[data-workflow-hero-title]");
  const descEl = carousel.querySelector("[data-workflow-hero-desc]");
  const tagsEl = carousel.querySelector("[data-workflow-hero-tags]");
  const track = carousel.querySelector("[data-workflow-card-track]");
  const counter = carousel.querySelector("[data-workflow-counter]");
  const prevButton = carousel.querySelector("[data-workflow-prev]");
  const nextButton = carousel.querySelector("[data-workflow-next]");
  const cards = [
    {
      id: 0,
      number: "01",
      title: "业务拆解",
      desc: "用 ChatGPT / Gemini 快速拆解产品信息，先明确客户场景、核心卖点与内容表达方向。",
      tags: "资料输入 / 卖点提炼 / 受众判断",
      scene: "需求资料 / 参数页 / 场景图 / 痛点分析",
      poster: "assets/workflow-step-01.webp",
      copyTheme: "dark-panel",
      readability: "bright-soft",
      objectPosition: "center center"
    },
    {
      id: 1,
      number: "02",
      title: "脚本重构",
      desc: "把零散技术信息交给 ChatGPT / Codex，重组为可用于 PPT、网页和路演的表达结构。",
      tags: "技术转译 / 页面结构 / 路演话术",
      scene: "Prompt / 结构提纲 / 展示话术",
      poster: "assets/workflow-step-02.webp",
      copyTheme: "dark-panel",
      readability: "mixed-contrast",
      objectPosition: "center center"
    },
    {
      id: 2,
      number: "03",
      title: "视觉生成",
      desc: "基于前面拆好的卖点与场景，用 Image-2 / Midjourney 生成海报、KV 和产品场景图。",
      tags: "卖点转视觉 / 多方案生成 / 风格筛选",
      scene: "海报方案 / KV / 多版本筛选",
      poster: "assets/workflow-step-03.webp",
      copyTheme: "dark-panel",
      readability: "dark-texture",
      objectPosition: "center center"
    },
    {
      id: 3,
      number: "04",
      title: "动态与 3D",
      desc: "将静态视觉继续延展为产品演示、镜头动画和 3D 展示画面，提升方案的现场表达力。",
      tags: "模型演示 / 镜头动画 / 视频资产",
      scene: "3D 模型 / 动态演示 / 时间轴",
      poster: "assets/workflow-step-04.webp",
      copyTheme: "dark-panel",
      readability: "dark-clean",
      objectPosition: "center center"
    },
    {
      id: 4,
      number: "05",
      title: "物料整合",
      desc: "把前面生成的文案、视觉和动态内容，整理成可用于汇报、销售和展示的完整交付包。",
      tags: "PPT / 网页 / 展示物料",
      scene: "PPT / 网页 / 方案册 / 物料整合",
      poster: "assets/workflow-step-05.webp",
      copyTheme: "dark-panel",
      readability: "bright-strong",
      objectPosition: "center center"
    }
  ];

  cards.forEach((card, index) => {
    if (index > 1 || !card.poster) return;
    const poster = new Image();
    poster.decoding = "async";
    poster.src = card.poster;
  });

  let activeIndex = 0;
  let inViewport = false;
  let bridgeAllowsPlayback = false;

  const createPanel = (card) => {
    const panel = document.createElement("div");
    panel.className = "workflow-hero-panel";
    panel.dataset.workflowPanel = String(card.id);
    panel.style.setProperty("--workflow-object-position", card.objectPosition || "center center");
    panel.innerHTML = `
      ${card.video ? `<video muted playsinline loop preload="auto" poster="${card.poster}">
        <source src="${card.video}" type="video/mp4">
      </video>` : ""}
      <img src="${card.poster}" alt="" loading="lazy">
      <div class="workflow-hero-fallback"><strong>${card.number} ${card.title}</strong><span>静态素材展示</span></div>
    `;
    return panel;
  };

  const renderHeroPanels = () => {
    if (!bg) return;
    bg.innerHTML = "";
    cards.forEach((card) => {
      const panel = createPanel(card);
      const markMissing = () => panel.classList.add("is-missing");
      const video = panel.querySelector("video");
      video?.addEventListener("loadeddata", () => {
        panel.classList.add("is-video-ready");
        panel.classList.remove("is-missing");
      });
      video?.addEventListener("canplay", () => {
        panel.classList.add("is-video-ready");
        panel.classList.remove("is-missing");
      });
      video?.addEventListener("error", () => {
        console.warn("Workflow video error:", video.error);
        markMissing();
      });
      panel.querySelectorAll("source").forEach((source) => {
        source.addEventListener("error", () => {
          console.warn("Workflow video source failed:", source.src);
          console.warn("Workflow video error:", video?.error);
          markMissing();
        });
      });
      bg.appendChild(panel);
    });
  };

  const getPanels = () => Array.from(carousel.querySelectorAll("[data-workflow-panel]"));

  const pauseAllVideos = () => {
    getPanels().forEach((panel) => panel.querySelector("video")?.pause());
    track?.querySelectorAll("video").forEach((video) => video.pause());
  };

  const playActiveVideo = () => {
    if (prefersReducedMotion || !inViewport || !bridgeAllowsPlayback) return;
    const panel = carousel.querySelector(`[data-workflow-panel="${activeIndex}"]`);
    if (!panel || panel.classList.contains("is-missing")) return;
    const video = panel.querySelector("video");
    if (!video) return;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    if (video.readyState === 0) {
      video.load();
    }
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn("Workflow video play failed:", error, video.currentSrc);
      });
    }
  };

  const renderCopy = () => {
    const card = cards[activeIndex];
    carousel.dataset.workflowTheme = card.copyTheme;
    carousel.dataset.workflowReadability = card.readability || "dark-texture";
    copy?.classList.add("is-switching");
    window.setTimeout(() => {
      copy?.classList.remove("theme-light-panel", "theme-dark-panel");
      copy?.classList.add(`theme-${card.copyTheme}`);
      if (numberEl) numberEl.textContent = card.number;
      if (titleEl) titleEl.textContent = card.title;
      if (descEl) descEl.textContent = card.desc;
      if (tagsEl) tagsEl.textContent = card.tags;
      if (counter) counter.textContent = `${card.number} / 05`;
      copy?.classList.remove("is-switching");
    }, 140);
  };

  const renderThumbTrack = () => {
    if (!track) return;
    track.classList.add("is-shifting");
    window.setTimeout(() => {
      track.innerHTML = "";
      cards.forEach((card, index) => {
        const button = document.createElement("button");
        button.className = "workflow-hero-thumb workflow-mini-card";
        button.type = "button";
        button.setAttribute("aria-label", `切换到${card.title}`);
        button.classList.toggle("is-active", index === activeIndex);
        button.setAttribute("aria-current", index === activeIndex ? "true" : "false");
        button.dataset.workflowThumb = String(index);
        button.innerHTML = `
          ${card.video ? `<video muted playsinline loop preload="metadata" poster="${card.poster}" aria-hidden="true">
            <source src="${card.video}" type="video/mp4">
          </video>` : ""}
          <img src="${card.poster}" alt="">
          <span class="workflow-mini-kicker">${card.number} / ${card.title}</span>
          <strong class="workflow-mini-title">${card.scene}</strong>
        `;
        const thumbVideo = button.querySelector("video");
        thumbVideo?.addEventListener("canplay", () => button.classList.add("is-video-ready"), { once: true });
        thumbVideo?.addEventListener("error", () => button.classList.add("is-video-missing"), { once: true });
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setActive(index);
        });
        track.appendChild(button);
      });
      requestAnimationFrame(() => {
        track.classList.remove("is-shifting");
        syncThumbVideos();
      });
    }, 120);
  };

  const syncThumbVideos = () => {
    if (!track) return;
    track.querySelectorAll("[data-workflow-thumb]").forEach((button) => {
      const isActive = Number(button.dataset.workflowThumb) === activeIndex;
      const video = button.querySelector("video");
      if (!video) return;
      if (!isActive || !bridgeAllowsPlayback || prefersReducedMotion) {
        video.pause();
        return;
      }
      if (video.readyState === 0) video.load();
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    });
  };

  const updatePanels = () => {
    getPanels().forEach((panel) => {
      const isActive = Number(panel.dataset.workflowPanel) === activeIndex;
      panel.classList.toggle("is-active", isActive);
      const video = panel.querySelector("video");
      if (isActive) {
        if (video && video.readyState === 0) {
          video.load();
        }
      } else {
        video?.pause();
      }
    });
  };

  const setActive = (nextIndex, shouldPlay = true) => {
    const normalized = (nextIndex + cards.length) % cards.length;
    if (normalized === activeIndex && bg?.children.length) {
      if (shouldPlay) playActiveVideo();
      return;
    }

    activeIndex = normalized;
    carousel.classList.add("is-transitioning");
    updatePanels();
    renderCopy();
    renderThumbTrack();
    pauseAllVideos();
    window.requestAnimationFrame(() => {
      if (shouldPlay) playActiveVideo();
      syncThumbVideos();
    });
    window.setTimeout(() => carousel.classList.remove("is-transitioning"), 520);
  };

  const pause = () => {
    pauseAllVideos();
  };

  const start = () => {
    if (prefersReducedMotion || !inViewport || !bridgeAllowsPlayback) return;
    playActiveVideo();
  };

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      inViewport = entries.some((entry) => entry.isIntersecting);
      if (inViewport && bridgeAllowsPlayback) {
        start();
      } else {
        pause();
      }
    }, { threshold: 0.2, rootMargin: "-8% 0px -8% 0px" })
    : null;

  observer?.observe(carousel);

  bridge?.addEventListener("workflowmotionvisibility", (event) => {
    bridgeAllowsPlayback = Boolean(event.detail?.visible);
    if (bridgeAllowsPlayback) {
      start();
      syncThumbVideos();
      return;
    }
    pause();
  });

  if (!observer) {
    inViewport = true;
  }

  prevButton?.addEventListener("click", () => setActive(activeIndex - 1));
  nextButton?.addEventListener("click", () => setActive(activeIndex + 1));

  renderHeroPanels();
  updatePanels();
  renderCopy();
  renderThumbTrack();

  if (prefersReducedMotion) {
    carousel.classList.add("is-reduced-motion");
    pause();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      return;
    }
    start();
  });
};


const initProfilePullUpTransition = () => {
  const profileWrap = document.querySelector(".profile-transition");
  if (!profileWrap || prefersReducedMotion) return;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (start, end, amount) => start + (end - start) * amount;
  const smooth = (value) => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  let frame = 0;

  const update = () => {
    frame = 0;
    const rect = profileWrap.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    // 把原滑动衔接移动到「交付能力」和「关于我」之间，避免中间先淡成黑场。
    const progress = smooth(clamp((vh - rect.top) / (vh * 0.78)));
    const settle = smooth(clamp((vh * 0.34 - rect.top) / (vh * 0.58)));
    profileWrap.style.setProperty("--profile-pull-y", `${mix(72, 0, progress).toFixed(1)}px`);
    profileWrap.style.setProperty("--profile-pull-opacity", "1");
    profileWrap.style.setProperty("--profile-content-y", `${mix(42, 0, settle).toFixed(1)}px`);
    profileWrap.style.setProperty("--profile-side-y", `${mix(48, 0, settle).toFixed(1)}px`);
    profileWrap.style.setProperty("--profile-side-scale", mix(0.97, 1, settle).toFixed(3));
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  window.addEventListener("load", requestUpdate, { once: true });
};

if (ENABLE_HEAVY_AMBIENT_EFFECTS) {
  initHeroTreeEffect();
  initHeroVideoScrubTransition();
}
initSelectedWorksReveal();
initWorkflowHeroCarousel();
initAigcBridgeReveal();
const restoreBridgeDeepLink = () => {
  if (!bridgePhaseByHash.has(window.location.hash)) return;
  window.setTimeout(() => {
    scrollToBridgePhaseHash(window.location.hash, "auto");
  }, 180);
};
restoreBridgeDeepLink();
window.addEventListener("load", restoreBridgeDeepLink);
window.addEventListener("pageshow", restoreBridgeDeepLink);
initProfilePullUpTransition();

if (ENABLE_CLICK_SPARK_EFFECT) {
  initClickSpark(".intro-enter-btn, .hero-actions .btn, .contact-pill, .case-toggle, .case-actions .btn, .more-ppt-link, .more-ppt-title, .more-ppt-cover, .more-ppt-arrow, .contact-resume-btn, .contact-hotspot, .contact-modal .btn, .back-to-top");
}

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("完整内容可在代表项目或案例节选中查看。");
  });
});

document.querySelectorAll(".case-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".case-card");
    const details = card?.querySelector(".case-details");
    if (!card || !details) return;

    const isExpanded = card.classList.contains("is-expanded");

    if (isExpanded) {
      card.classList.remove("is-expanded");
      button.setAttribute("aria-expanded", "false");
      button.textContent = "展开详情";

      const hideDetails = (event) => {
        if (event && event.propertyName !== "max-height") return;
        details.hidden = true;
        details.removeEventListener("transitionend", hideDetails);
      };

      if (prefersReducedMotion) {
        hideDetails();
      } else {
        details.addEventListener("transitionend", hideDetails);
      }
      return;
    }

    details.hidden = false;
    requestAnimationFrame(() => {
      card.classList.add("is-expanded");
      button.setAttribute("aria-expanded", "true");
      button.textContent = "收起详情";
    });
  });
});

const initMorePptCoverflow = () => {
  document.querySelectorAll("#more [data-ppt-carousel]").forEach((carousel) => {
    const viewport = carousel.querySelector(".more-ppt-viewport");
    const prev = carousel.querySelector("[data-ppt-prev]");
    const next = carousel.querySelector("[data-ppt-next]");
    const progress = carousel.querySelector(".more-ppt-progress span");
    const hint = carousel.querySelector(".more-ppt-hint");
    const items = Array.from(carousel.querySelectorAll(".more-ppt-item"));
    if (!viewport || !items.length) return;

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const AUTOPLAY_DELAY = 3000;
    let activeIndex = 0;
    let autoplayTimer = 0;
    let hasStarted = false;
    let isInView = false;
    let isPausedByHover = false;
    let isAnimating = false;
    let queuedIndex = null;
    let transitionTimer = 0;
    const TRANSITION_MS = 720;

    carousel.classList.add("is-coverflow");
    if (hint) hint.textContent = "自动轮播 / 悬停暂停 / 点击卡片查看案例";

    const wrapIndex = (index) => (index + items.length) % items.length;

    const getOffset = (index) => {
      let offset = index - activeIndex;
      const half = items.length / 2;
      if (offset > half) offset -= items.length;
      if (offset < -half) offset += items.length;
      return offset;
    };

    const getState = (offset) => {
      const side = Math.sign(offset) || 1;
      const abs = Math.abs(offset);
      if (offset === 0) {
        return { x: 0, scale: 1, rotate: 0, opacity: 1, z: 10 };
      }
      if (abs === 1) {
        return { x: 430 * side, scale: 0.86, rotate: -4 * side, opacity: 0.64, z: 6 };
      }
      if (abs === 2) {
        return { x: 760 * side, scale: 0.72, rotate: -6 * side, opacity: 0.26, z: 3 };
      }
      return { x: 1050 * side, scale: 0.64, rotate: -6 * side, opacity: 0, z: 1 };
    };

    const updateProgress = () => {
      if (!progress) return;
      progress.style.width = `${((activeIndex + 1) / items.length) * 100}%`;
    };

    const scrollMobileActiveIntoView = () => {
      if (!mobileQuery.matches) return;
      items[activeIndex]?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
    };

    const applyCoverflowState = () => {
      items.forEach((item, index) => {
        const offset = getOffset(index);
        const abs = Math.abs(offset);
        const state = getState(offset);
        item.style.setProperty("--cf-x", `${state.x}px`);
        item.style.setProperty("--cf-scale", state.scale.toFixed(3));
        item.style.setProperty("--cf-rotate", `${state.rotate}deg`);
        item.style.setProperty("--cf-opacity", state.opacity.toFixed(3));
        item.style.setProperty("--cf-z", String(state.z));
        item.dataset.coverflowOffset = String(offset);
        item.classList.toggle("is-active", offset === 0);
        item.classList.toggle("is-near", abs === 1);
        item.classList.toggle("is-far", abs === 2);
        item.classList.toggle("is-hidden", abs >= 3);
      });
      updateProgress();
      scrollMobileActiveIntoView();
    };

    const stopAutoplay = () => {
      if (!autoplayTimer) return;
      window.clearInterval(autoplayTimer);
      autoplayTimer = 0;
    };

    const startAutoplay = () => {
      if (prefersReducedMotion || mobileQuery.matches || !isInView || isPausedByHover || items.length <= 1) return;
      stopAutoplay();
      autoplayTimer = window.setInterval(() => {
        if (isAnimating) return;
        setActive(activeIndex + 1, { userAction: false });
      }, AUTOPLAY_DELAY);
    };

    const resetAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    function setActive(index, options = {}) {
      const isUserAction = options.userAction === true;
      const normalized = wrapIndex(index);
      if (normalized === activeIndex) return;

      if (isAnimating) {
        if (isUserAction) queuedIndex = normalized;
        return;
      }

      isAnimating = true;
      stopAutoplay();
      activeIndex = normalized;
      carousel.classList.add("is-switching");
      applyCoverflowState();

      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => {
        carousel.classList.remove("is-switching");
        isAnimating = false;

        if (queuedIndex !== null && queuedIndex !== activeIndex) {
          const nextIndex = queuedIndex;
          queuedIndex = null;
          setActive(nextIndex, { userAction: true });
          return;
        }

        queuedIndex = null;
        if (!document.hidden && isInView && !isPausedByHover) {
          startAutoplay();
        }
      }, prefersReducedMotion || mobileQuery.matches ? 0 : TRANSITION_MS);
    }

    const nextSlide = () => setActive(activeIndex + 1, { userAction: true });
    const prevSlide = () => setActive(activeIndex - 1, { userAction: true });

    items.forEach((item, index) => {
      item.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (mobileQuery.matches && link) {
          stopAutoplay();
          return;
        }
        const isActive = index === activeIndex;
        if (link && isActive) {
          stopAutoplay();
          return;
        }
        if (!isActive) {
          event.preventDefault();
          event.stopPropagation();
          setActive(index, { userAction: true });
        }
      });
    });

    carousel.addEventListener("click", (event) => {
      const prevButton = event.target.closest("[data-ppt-prev]");
      const nextButton = event.target.closest("[data-ppt-next]");
      if (!prevButton && !nextButton) return;
      event.preventDefault();
      event.stopPropagation();
      if (prevButton) {
        prevSlide();
      } else {
        nextSlide();
      }
    }, true);

    prev?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      prevSlide();
    });
    next?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      nextSlide();
    });
    carousel.addEventListener("pointerenter", () => {
      isPausedByHover = true;
      stopAutoplay();
    });
    carousel.addEventListener("pointerleave", () => {
      isPausedByHover = false;
      startAutoplay();
    });
    carousel.addEventListener("focusin", () => {
      isPausedByHover = true;
      stopAutoplay();
    });
    carousel.addEventListener("focusout", () => {
      isPausedByHover = false;
      startAutoplay();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        isInView = Boolean(entry?.isIntersecting);
        carousel.classList.toggle("is-inview", isInView);
        if (isInView) {
          if (!hasStarted) {
            hasStarted = true;
            carousel.classList.add("has-started");
          }
          startAutoplay();
        } else {
          stopAutoplay();
        }
      }, { threshold: 0.35 });
      observer.observe(carousel);
    } else {
      isInView = true;
      carousel.classList.add("is-inview", "has-started");
      startAutoplay();
    }

    mobileQuery.addEventListener?.("change", () => {
      applyCoverflowState();
      resetAutoplay();
    });

    applyCoverflowState();
  });
};

initMorePptCoverflow();

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

  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("fade-in");
    revealObserver.observe(section);
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target.closest("[data-aigc-bridge]")) return;

      const targetHash = entry.target.id === "business-proof" ? "#profile" : `#${entry.target.id}`;
      const hasNavTarget = Array.from(navLinks).some((link) => link.getAttribute("href") === targetHash);
      if (!hasNavTarget) return;

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === targetHash;
        link.classList.toggle("is-active", isActive);
      });
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);

sections.forEach((section) => {
  sectionObserver.observe(section);
});

const initNavActiveState = () => {
  if (!navLinks.length) return;

  const bridge = document.querySelector("[data-aigc-bridge]");
  const navTargets = Array.from(navLinks)
    .map((link) => {
      const hash = link.getAttribute("href");
      return hash?.startsWith("#") ? { hash, target: document.querySelector(hash) } : null;
    })
    .filter((item) => item?.target);

  const setActive = (hash) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === hash);
    });
  };

  const getBridgeHash = () => {
    if (!bridge) return "";
    const top = bridge.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, bridge.offsetHeight - window.innerHeight);
    const y = window.scrollY;
    if (y < top - 4 || y > top + scrollable + 4) return "";
    const progress = Math.min(1, Math.max(0, (y - top) / scrollable));
    if (progress < 0.25) return "#home";
    if (progress < 0.72) return "#skills";
    return "#deliverables";
  };

  const getRegularHash = () => {
    const markerY = window.scrollY + window.innerHeight * 0.48;
    const candidates = navTargets
      .filter(({ hash, target }) => !target.closest("[data-aigc-bridge]") && hash !== "#home")
      .map(({ hash, target }) => ({
        hash,
        top: target.getBoundingClientRect().top + window.scrollY
      }));

    const businessProof = document.querySelector("#business-proof");
    if (businessProof && navLinks.length) {
      candidates.push({
        hash: "#profile",
        top: businessProof.getBoundingClientRect().top + window.scrollY
      });
    }

    const visibleCandidates = candidates
      .filter(({ top }) => top <= markerY)
      .sort((a, b) => b.top - a.top);
    return visibleCandidates[0]?.hash || "#home";
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    setActive(getBridgeHash() || getRegularHash());
  };
  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  window.addEventListener("load", requestUpdate, { once: true });
};

initNavActiveState();

document.querySelectorAll("img[data-fallback]").forEach((image) => {
  const markMissing = () => {
    const slot = image.closest(".image-slot");
    if (slot) {
      slot.classList.add("is-missing");
    } else {
      image.hidden = true;
    }
  };

  image.addEventListener("error", markMissing);
  image.addEventListener("load", () => {
    const slot = image.closest(".image-slot");
    if (slot) {
      slot.classList.remove("is-missing");
    } else {
      image.hidden = false;
    }
  });

  if (image.complete && image.naturalWidth === 0) {
    markMissing();
  }
});

document.querySelectorAll(".intro-video-section").forEach((section) => {
  const video = section.querySelector("video");
  if (!video) {
    section.classList.add("is-video-missing");
    return;
  }

  const markIntroVideoReady = () => {
    section.classList.add("is-video-ready");
    section.classList.remove("is-video-missing", "is-video-paused");
  };

  const markIntroVideoMissing = () => {
    section.classList.remove("is-video-ready");
    section.classList.add("is-video-missing");
  };

  if (prefersReducedMotion) {
    video.pause();
    section.classList.add("is-video-paused");
    return;
  }

  if (video.readyState >= 3) {
    markIntroVideoReady();
  }

  video.addEventListener("canplay", markIntroVideoReady, { once: true });
  video.addEventListener("playing", markIntroVideoReady, { once: true });
  video.addEventListener("error", markIntroVideoMissing);
  video.querySelectorAll("source").forEach((source) => {
    source.addEventListener("error", markIntroVideoMissing);
  });

  setTimeout(() => {
    if (video.readyState === 0) {
      markIntroVideoMissing();
    }
  }, 1400);
});

const openContactModal = (panelName) => {
  if (!contactModal) return;

  contactPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.contactPanel === panelName);
  });

  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
};

const closeContactModal = () => {
  if (!contactModal) return;
  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
};

document.querySelectorAll("[data-contact-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openContactModal(button.dataset.contactOpen);
  });
});

document.querySelectorAll("[data-contact-close]").forEach((button) => {
  button.addEventListener("click", closeContactModal);
});

const educationProofData = {
  title: "教育背景",
  subtitle: "浙江师范大学行知学院｜国际经济与贸易（与英语复合）本科",
  tags: [
    "连续两年浙江省政府奖学金",
    "校企合作工作室「励新工坊」成员"
  ],
  media: [
    { src: "assets/proof-scholarship-01.jpg", alt: "浙江省政府奖学金证明 01", label: "奖学金证明 01" },
    { src: "assets/proof-scholarship-02.jpg", alt: "浙江省政府奖学金证明 02", label: "奖学金证明 02" }
  ]
};

const renderEducationProofMedia = () => {
  if (!educationProofMedia || educationProofMedia.dataset.rendered === "true") return;
  educationProofMedia.innerHTML = "";

  educationProofData.media.forEach((item) => {
    const card = document.createElement("button");
    card.className = "education-proof-media-card";
    card.type = "button";
    card.setAttribute("aria-label", `放大查看${item.alt}`);

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt || "教育背景证明图片";
    image.loading = "lazy";
    image.decoding = "async";

    const label = document.createElement("span");
    label.textContent = item.label || item.alt || "奖学金证明";

    image.addEventListener("error", () => {
      card.classList.add("is-missing");
      card.innerHTML = `
        <div class="education-proof-placeholder">
          <span>图片暂未加载</span>
        </div>
      `;
    }, { once: true });

    card.appendChild(image);
    card.appendChild(label);
    card.addEventListener("click", () => {
      if (card.classList.contains("is-missing")) return;
      openImageLightbox(item.src, item.alt);
    });
    educationProofMedia.appendChild(card);
  });

  educationProofMedia.dataset.rendered = "true";
};

const openScholarshipDrawer = () => {
  if (!scholarshipDrawer) return;
  renderEducationProofMedia();
  scholarshipDrawer.classList.add("is-open");
  scholarshipDrawer.setAttribute("aria-hidden", "false");
};

const closeScholarshipDrawer = () => {
  if (!scholarshipDrawer) return;
  scholarshipDrawer.classList.remove("is-open");
  scholarshipDrawer.setAttribute("aria-hidden", "true");
};

document.querySelectorAll("[data-scholarship-open]").forEach((button) => {
  button.addEventListener("click", openScholarshipDrawer);
});

document.querySelectorAll("[data-scholarship-close]").forEach((button) => {
  button.addEventListener("click", closeScholarshipDrawer);
});

const copyText = async (value, trigger) => {
  if (!value) return;
  const isWechatCopy = value === "zz19700958350";

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    const originalText = trigger?.textContent;
    if (trigger) {
      trigger.textContent = "已复制";
      setTimeout(() => {
        trigger.textContent = originalText;
      }, 1400);
    }
    showToast(isWechatCopy ? `微信号已复制：${value}` : "已复制到剪贴板");
  } catch (error) {
    showToast(isWechatCopy ? `微信号：${value}` : "复制失败，请手动复制");
  }
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => {
    copyText(button.dataset.copy, button);
  });
});



const initHeroLanyard = () => {
  const cards = document.querySelectorAll("[data-lanyard-card]");
  if (!cards.length) return;

  cards.forEach((card) => {
    const setPressed = (value) => {
      card.classList.toggle("is-flipped", value);
      card.setAttribute("aria-pressed", String(value));
    };

    card.addEventListener("click", () => {
      setPressed(!card.classList.contains("is-flipped"));
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setPressed(!card.classList.contains("is-flipped"));
    });

    if (prefersReducedMotion) return;

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--lanyard-tilt-x", `${(-y * 4.5).toFixed(2)}deg`);
      card.style.setProperty("--lanyard-tilt-y", `${(x * 6.5).toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--lanyard-tilt-x", "0deg");
      card.style.setProperty("--lanyard-tilt-y", "0deg");
    });
  });
};

initHeroLanyard();

window.addEventListener("scroll", () => {
  backToTop?.classList.toggle("is-visible", window.scrollY > 500);
  lockToGate();
});

backToTop?.addEventListener("click", () => {
  scrollToSection(introSection, "intro", "#intro");
});

document.querySelectorAll(".preview-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("is-missing")) return;

    const image = button.querySelector("img");
    if (!image || !lightbox || !lightboxImage) return;

    lightboxImage.src = button.dataset.full || image.src;
    lightboxImage.alt = image.alt || "作品大图预览";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

const workflowPreviewData = {
  poster: {
    title: "海报",
    desc: "借助 Image-2，快速生成多版海报方案。",
    items: [
      { type: "image", src: "assets/poster-1.jpg", alt: "A4 产品宣传海报 01" },
      { type: "image", src: "assets/poster-2.jpg", alt: "A4 产品宣传海报 02" },
      { type: "image", src: "assets/poster-3.jpg", alt: "A4 产品宣传海报 03" },
      { type: "image", src: "assets/workflow-poster-4.jpg", alt: "A4 产品宣传海报 04" }
    ]
  },
  ppt: {
    title: "PPT",
    desc: "快速统一封面、内页与路演视觉。",
    items: [
      { type: "image", src: "assets/ppt-1.webp", alt: "产品宣讲 PPT 视觉 01" },
      { type: "image", src: "assets/ppt-2.webp", alt: "产品宣讲 PPT 视觉 02" },
      { type: "image", src: "assets/ppt-3.webp", alt: "产品宣讲 PPT 视觉 03" },
      { type: "video", src: "assets/workflow-ppt-4.mp4", poster: "assets/ppt-3.webp", preload: "metadata", alt: "产品宣讲 PPT 动态演示 01" },
      { type: "video", src: "assets/workflow-ppt-5.mp4", alt: "产品宣讲 PPT 动态演示 02" }
    ]
  },
  web: {
    title: "网页",
    desc: "快速搭建展示页面，提升呈现效率。",
    items: [
      { type: "video", src: "assets/web-1.mp4", alt: "网页界面动态预览 01" }
    ]
  },
  motion: {
    title: "动态演示",
    desc: "快速输出镜头感与演示氛围画面。",
    items: [
      { type: "video", src: "assets/motion-1.mp4", poster: "assets/workflow-step-04.webp", preload: "metadata", alt: "动态演示素材 01" }
    ]
  },
  material: {
    title: "展示物料",
    desc: "快速延展手册、展板与展示物料。",
    items: [
      { type: "image", src: "assets/material-1-browser.webp", alt: "展示物料视觉 01" }
    ]
  }
};

const workflowWrapper = document.querySelector("[data-workflow-hotspots]");
const workflowPanel = document.querySelector("[data-workflow-preview-panel]");
const workflowTitle = document.querySelector("[data-workflow-preview-title]");
const workflowDesc = document.querySelector("[data-workflow-preview-desc]");
const workflowMedia = document.querySelector("[data-workflow-preview-media]");
const workflowHotspots = document.querySelectorAll("[data-workflow-type]");
const workflowTabs = document.querySelectorAll("[data-workflow-tab]");
if (workflowPanel && workflowPanel.parentElement !== document.body) {
  document.body.appendChild(workflowPanel);
}
let activeWorkflowType = "";
let workflowMediaSuppressClick = false;

const pauseWorkflowVideos = () => {
  workflowMedia?.querySelectorAll("video").forEach((video) => {
    video.pause();
  });
};

const renderWorkflowPreview = (type) => {
  const data = workflowPreviewData[type];
  if (!data || !workflowPanel || !workflowTitle || !workflowDesc || !workflowMedia) return;

  pauseWorkflowVideos();
  workflowMedia.classList.add("is-switching");
  workflowTitle.textContent = data.title;
  workflowDesc.textContent = data.desc;
  workflowMedia.dataset.workflowLayout = type === "poster" ? "poster" : "landscape";
  workflowMedia.classList.remove("is-poster", "is-ppt", "is-web", "is-motion", "is-material");
  workflowMedia.classList.add(`is-${type}`);
  workflowMedia.innerHTML = "";

  data.items.forEach((entry, index) => {
    const src = typeof entry === "string" ? entry : entry.src;
    const itemType = typeof entry === "string"
      ? (/\.(mp4|webm)$/i.test(entry) ? "video" : data.mediaType || "image")
      : entry.type || (/\.(mp4|webm)$/i.test(entry.src) ? "video" : "image");
    const alt = typeof entry === "string" ? `${data.title}素材 ${index + 1}` : entry.alt || `${data.title}素材 ${index + 1}`;
    if (!src) return;

    const item = document.createElement("button");
    const isPoster = type === "poster";
    item.className = `workflow-preview-item ${isPoster ? "workflow-preview-item-a4" : "workflow-preview-item-16x9"}`;
    item.dataset.workflowType = type;
    item.dataset.workflowKind = type;
    item.dataset.mediaType = itemType;
    item.dataset.workflowAspect = isPoster ? "a4" : "16x9";
    item.type = "button";

    if (itemType === "video") {
      item.setAttribute("aria-label", `放大预览${alt}`);
      const video = document.createElement("video");
      video.className = "workflow-preview-video";
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = entry.preload || "metadata";
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", alt);
      video.src = src;
      if (entry.poster) {
        video.poster = entry.poster;
      }
      if (entry.preload) {
        video.preload = entry.preload;
        video.setAttribute("preload", entry.preload);
      }
      if (!prefersReducedMotion) {
        video.autoplay = true;
        video.setAttribute("autoplay", "");
      }
      item.appendChild(video);
      item.addEventListener("click", () => openVideoLightbox(src));
      if (!prefersReducedMotion) {
        requestAnimationFrame(() => video.play().catch(() => {}));
      }
    } else {
      item.setAttribute("aria-label", `放大预览${alt}`);
      const image = document.createElement("img");
      image.src = src;
      image.alt = alt;
      image.loading = "lazy";
      image.decoding = "async";
      item.appendChild(image);
      item.addEventListener("click", () => openImageLightbox(src, image.alt));
    }

    workflowMedia.appendChild(item);
  });

  workflowMedia.scrollLeft = 0;
  requestAnimationFrame(() => {
    workflowMedia.classList.remove("is-switching");
  });
};

const openWorkflowPreview = (type) => {
  if (!workflowPanel || !workflowPreviewData[type]) return;
  renderWorkflowPreview(type);
  activeWorkflowType = type;
  document.body.classList.add("is-workflow-preview-open");
  workflowPanel.classList.add("is-open");
  workflowPanel.setAttribute("aria-hidden", "false");
  workflowHotspots.forEach((hotspot) => {
    hotspot.classList.toggle("is-active", hotspot.dataset.workflowType === type);
  });
  workflowTabs.forEach((tab) => {
    const isActive = tab.dataset.workflowTab === type;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-current", isActive ? "true" : "false");
  });
};

const closeWorkflowPreview = () => {
  if (!workflowPanel) return;
  pauseWorkflowVideos();
  activeWorkflowType = "";
  workflowPanel.classList.remove("is-open");
  workflowPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-workflow-preview-open");
  workflowHotspots.forEach((hotspot) => hotspot.classList.remove("is-active"));
  workflowTabs.forEach((tab) => {
    tab.classList.remove("is-active");
    tab.removeAttribute("aria-current");
  });
};

workflowHotspots.forEach((hotspot) => {
  hotspot.addEventListener("click", (event) => {
    event.stopPropagation();
    const type = hotspot.dataset.workflowType;
    if (activeWorkflowType === type) {
      closeWorkflowPreview();
      return;
    }
    openWorkflowPreview(type);
  });

  hotspot.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    hotspot.click();
  });
});

document.querySelector("[data-workflow-preview-close]")?.addEventListener("click", closeWorkflowPreview);

workflowTabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.stopPropagation();
    const type = tab.dataset.workflowTab;
    if (!type || !workflowPreviewData[type]) return;
    openWorkflowPreview(type);
  });
});

workflowWrapper?.addEventListener("click", (event) => {
  if (!workflowPanel?.classList.contains("is-open")) return;
  if (event.target.closest(".workflow-preview-panel") || event.target.closest("[data-workflow-type]")) return;
  closeWorkflowPreview();
});

document.addEventListener("click", (event) => {
  if (!workflowPanel?.classList.contains("is-open")) return;
  if (event.target.closest(".workflow-preview-panel") || event.target.closest("[data-workflow-type]")) return;
  closeWorkflowPreview();
});

if (workflowMedia) {
  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  const endWorkflowMediaDrag = (event) => {
    if (!isPointerDown) return;
    if (isDragging) {
      workflowMediaSuppressClick = true;
      window.setTimeout(() => {
        workflowMediaSuppressClick = false;
      }, 140);
    }
    isPointerDown = false;
    isDragging = false;
    workflowMedia.classList.remove("is-dragging");
    try {
      if (event?.pointerId !== undefined) {
        workflowMedia.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture can already be released by the browser.
    }
  };

  workflowMedia.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    isPointerDown = true;
    isDragging = false;
    startX = event.clientX;
    startScrollLeft = workflowMedia.scrollLeft;
    workflowMedia.classList.add("is-dragging");
    try {
      workflowMedia.setPointerCapture(event.pointerId);
    } catch {
      // Some touch browsers do not expose capture here.
    }
  });

  workflowMedia.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 6) {
      isDragging = true;
      workflowMedia.scrollLeft = startScrollLeft - deltaX;
      event.preventDefault();
    }
  });

  workflowMedia.addEventListener("pointerup", endWorkflowMediaDrag);
  workflowMedia.addEventListener("pointercancel", endWorkflowMediaDrag);
  workflowMedia.addEventListener("pointerleave", endWorkflowMediaDrag);

  workflowMedia.addEventListener("click", (event) => {
    if (!workflowMediaSuppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

const openImageLightbox = (src, alt = "作品大图预览") => {
  if (window.__enteringPortfolio || Date.now() < suppressLightboxUntil || document.body.classList.contains("gate-intro")) return;
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
};

const openVideoLightbox = (src) => {
  if (window.__enteringPortfolio || Date.now() < suppressLightboxUntil || document.body.classList.contains("gate-intro")) return;
  if (!videoLightbox || !videoLightboxVideo) return;
  videoLightboxVideo.src = src;
  videoLightboxVideo.muted = true;
  videoLightboxVideo.loop = true;
  videoLightboxVideo.playsInline = true;
  videoLightboxVideo.preload = "metadata";
  videoLightboxVideo.autoplay = !prefersReducedMotion;
  videoLightbox.classList.add("is-open");
  videoLightbox.setAttribute("aria-hidden", "false");
  if (!prefersReducedMotion) {
    videoLightboxVideo.controls = false;
    videoLightboxVideo.play().catch(() => {});
  } else {
    videoLightboxVideo.controls = true;
  }
};

const closeVideoLightbox = () => {
  if (!videoLightbox || !videoLightboxVideo) return;
  videoLightbox.classList.remove("is-open");
  videoLightbox.setAttribute("aria-hidden", "true");
  videoLightboxVideo.pause();
  videoLightboxVideo.controls = false;
  videoLightboxVideo.removeAttribute("src");
  videoLightboxVideo.load();
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
};

const businessProofData = {
  education: {
    kicker: "背景记录",
    title: "教育背景｜专业成绩与语言能力",
    actions: ["专业成绩证明", "语言能力证明", "奖学金材料"],
    proof: "学习基础｜语言能力｜持续稳定",
    media: [
      { src: "assets/proof-scholarship-01.jpg", alt: "浙江省政府奖学金奖状 01" },
      { src: "assets/proof-scholarship-02.jpg", alt: "浙江省政府奖学金奖状 02" }
    ]
  },
  tech: {
    kicker: "参与记录 01",
    title: "企业验收资料整理",
    actions: ["技术摘要整理", "目录校对", "项目清单归档"],
    proof: "信息提取｜文档结构化｜交付整理",
    media: []
  },
  operation: {
    kicker: "参与记录 02",
    title: "产品宣讲材料",
    actions: ["卖点提炼", "宣讲页排版", "展板内容整理"],
    proof: "产品理解｜卖点转译｜展示表达",
    media: []
  },
  presentation: {
    kicker: "参与记录 03",
    title: "企业侧汇报与商业展示",
    actions: ["汇报材料整理", "投屏内容准备", "展示物料统筹"],
    proof: "汇报表达｜现场协同｜展示交付",
    media: [
      { src: "assets/business-presentation-1.webp", alt: "现场照片" },
      { src: "assets/business-presentation-2.jpg", alt: "投屏画面" },
      { src: "assets/business-presentation-3.webp", alt: "交付节选" }
    ]
  },
  trade: {
    kicker: "参与记录 04",
    title: "外贸客户沟通",
    actions: ["邮件处理", "规格信息整理", "进度跟进"],
    proof: "客户理解｜规格转译｜沟通跟进",
    media: []
  }
};

const businessProofWrapper = document.querySelector("[data-business-proof-wrapper]");
const businessProofBackdrop = document.querySelector("[data-business-proof-backdrop]");
const businessProofDrawer = document.querySelector("[data-business-proof-drawer]");
const businessDrawerKicker = document.querySelector("[data-business-drawer-kicker]");
const businessDrawerTitle = document.querySelector("[data-business-drawer-title]");
const businessDrawerActions = document.querySelector("[data-business-drawer-actions]");
const businessDrawerMedia = document.querySelector("[data-business-drawer-media]");
const businessDrawerProof = document.querySelector("[data-business-drawer-proof]");
const businessProofHotspots = document.querySelectorAll("[data-business-proof-type]");
const businessRecordTabs = document.querySelectorAll("[data-business-record-tab]");
const businessRecordTypes = ["tech", "operation", "presentation", "trade"];
let activeBusinessProofType = "";
let businessDrawerSuppressClick = false;
let businessRenderToken = 0;

const renderBusinessProof = (type) => {
  const data = businessProofData[type];
  if (!data || !businessProofDrawer || !businessDrawerKicker || !businessDrawerTitle || !businessDrawerActions || !businessDrawerMedia || !businessDrawerProof) return;
  businessRenderToken += 1;

  businessDrawerKicker.textContent = data.kicker || "";
  businessDrawerTitle.textContent = data.title;
  businessDrawerProof.textContent = data.proof || "";
  businessDrawerActions.innerHTML = "";
  businessDrawerMedia.classList.add("is-switching");
  businessDrawerMedia.classList.toggle("is-text-only-mode", !data.media?.length);
  businessDrawerMedia.replaceChildren();

  (data.actions || []).forEach((action) => {
    const item = document.createElement("li");
    item.textContent = action;
    businessDrawerActions.appendChild(item);
  });

  if (!data.media?.length) {
    const textCard = document.createElement("div");
    textCard.className = "business-proof-drawer-media-card is-text-only";
    textCard.innerHTML = `<span><strong>${data.title}</strong><small>${data.proof || ""}</small></span>`;
    businessDrawerMedia.appendChild(textCard);
    requestAnimationFrame(() => {
      businessDrawerMedia.classList.remove("is-switching");
    });
    return;
  }

  data.media.forEach(({ src, alt }) => {
    const item = document.createElement("button");
    item.className = "business-proof-drawer-media-card";
    item.type = "button";
    item.setAttribute("aria-label", `放大查看${alt}`);

    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      item.classList.add("is-missing");
    }, { once: true });
    item.appendChild(image);
    const fallback = document.createElement("span");
    fallback.textContent = alt;
    item.appendChild(fallback);
    item.addEventListener("click", () => openImageLightbox(src, alt));

    businessDrawerMedia.appendChild(item);
  });
    requestAnimationFrame(() => {
      businessDrawerMedia.classList.remove("is-switching");
    });
};

const openBusinessProofPanel = (type) => {
  if (type === "education") {
    closeBusinessProofPanel();
    openScholarshipDrawer(0);
    return;
  }
  if (!businessRecordTypes.includes(type) || !businessProofDrawer || !businessProofBackdrop || !businessProofData[type]) return;
  renderBusinessProof(type);
  activeBusinessProofType = type;
  document.body.classList.add("business-proof-open");
  businessProofDrawer.classList.add("is-open");
  businessProofBackdrop.classList.add("is-open");
  businessProofDrawer.setAttribute("aria-hidden", "false");
  businessProofHotspots.forEach((hotspot) => {
    hotspot.classList.toggle("is-active", hotspot.dataset.businessProofType === type);
    hotspot.classList.toggle("is-dim", hotspot.dataset.businessProofType !== type && hotspot.dataset.businessProofType !== "education");
  });
  businessRecordTabs.forEach((tab) => {
    const isActive = tab.dataset.businessRecordTab === type;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-current", isActive ? "true" : "false");
  });
};

const closeBusinessProofPanel = () => {
  if (!businessProofDrawer || !businessProofBackdrop) return;
  activeBusinessProofType = "";
  document.body.classList.remove("business-proof-open");
  businessProofDrawer.classList.remove("is-open");
  businessProofBackdrop.classList.remove("is-open");
  businessProofDrawer.setAttribute("aria-hidden", "true");
  businessProofHotspots.forEach((hotspot) => hotspot.classList.remove("is-active", "is-dim"));
  businessRecordTabs.forEach((tab) => {
    tab.classList.remove("is-active");
    tab.removeAttribute("aria-current");
  });
};

businessProofHotspots.forEach((hotspot) => {
  hotspot.addEventListener("click", (event) => {
    event.stopPropagation();
    const type = hotspot.dataset.businessProofType;
    if (activeBusinessProofType === type) {
      closeBusinessProofPanel();
      return;
    }
    openBusinessProofPanel(type);
  });
});

document.querySelector("[data-business-proof-drawer-close]")?.addEventListener("click", closeBusinessProofPanel);
businessProofBackdrop?.addEventListener("click", closeBusinessProofPanel);

businessRecordTabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.stopPropagation();
    const type = tab.dataset.businessRecordTab;
    if (!type || !businessRecordTypes.includes(type) || !businessProofData[type]) return;
    openBusinessProofPanel(type);
  });
});

businessProofWrapper?.addEventListener("click", (event) => {
  if (!businessProofDrawer?.classList.contains("is-open")) return;
  if (event.target.closest("[data-business-proof-type]") || event.target.closest("[data-scholarship-open]")) return;
});

if (businessDrawerMedia) {
  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  const endBusinessProofMediaDrag = (event) => {
    if (!isPointerDown) return;
    if (isDragging) {
      businessDrawerSuppressClick = true;
      window.setTimeout(() => {
        businessDrawerSuppressClick = false;
      }, 140);
    }
    isPointerDown = false;
    isDragging = false;
    businessDrawerMedia.classList.remove("is-dragging");
    try {
      if (event?.pointerId !== undefined) {
        businessDrawerMedia.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture can already be released by the browser.
    }
  };

  businessDrawerMedia.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    isPointerDown = true;
    isDragging = false;
    startX = event.clientX;
    startScrollLeft = businessDrawerMedia.scrollLeft;
    businessDrawerMedia.classList.add("is-dragging");
    try {
      businessDrawerMedia.setPointerCapture(event.pointerId);
    } catch {
      // Some touch browsers do not expose capture here.
    }
  });

  businessDrawerMedia.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 6) {
      isDragging = true;
      businessDrawerMedia.scrollLeft = startScrollLeft - deltaX;
      event.preventDefault();
    }
  });

  businessDrawerMedia.addEventListener("pointerup", endBusinessProofMediaDrag);
  businessDrawerMedia.addEventListener("pointercancel", endBusinessProofMediaDrag);
  businessDrawerMedia.addEventListener("pointerleave", endBusinessProofMediaDrag);

  businessDrawerMedia.addEventListener("click", (event) => {
    if (!businessDrawerSuppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.querySelector("[data-video-lightbox-close]")?.addEventListener("click", closeVideoLightbox);
videoLightbox?.addEventListener("click", (event) => {
  if (event.target === videoLightbox) {
    closeVideoLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeWorkflowPreview();
    closeBusinessProofPanel();
    closeVideoLightbox();
    closeLightbox();
    closeContactModal();
    closeScholarshipDrawer();
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});
