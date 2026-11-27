// SparkAudit Frontend Logic — Zero Dependencies
(function () {
  const CFG = window.CONFIG || {
    APP_NAME: "SparkAudit",
    GUMROAD_PRODUCT_URL: "https://gumroad.com/",
    API_ENDPOINT: "/api/analyze"
  };

  const STORAGE_UNLOCK_KEY = "sparkaudit_lifetime_unlocked";
  const STORAGE_OPENER_KEY = "sparkaudit_free_opener_unlocked";
  const STORAGE_LAST_INPUT_KEY = "sparkaudit_last_input";
  const STORAGE_LAST_MODE_KEY = "sparkaudit_last_mode";

  let currentMode = "chat";
  let lastResult = null;

  // DOM elements
  const tabChat = document.getElementById("tabChat");
  const tabBio = document.getElementById("tabBio");
  const inputLabel = document.getElementById("inputLabel");
  const userInput = document.getElementById("userInput");
  const charCount = document.getElementById("charCount");
  const sampleChatBtn = document.getElementById("sampleChatBtn");
  const sampleBioBtn = document.getElementById("sampleBioBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const analyzeBtnText = document.getElementById("analyzeBtnText");
  const analyzeSpinner = document.getElementById("analyzeSpinner");
  const errorBox = document.getElementById("errorBox");

  const resultsSection = document.getElementById("resultsSection");
  const scoreCircle = document.getElementById("scoreCircle");
  const scoreValue = document.getElementById("scoreValue");
  const diagnosisHeadline = document.getElementById("diagnosisHeadline");
  const hopeSummary = document.getElementById("hopeSummary");
  const mistakesList = document.getElementById("mistakesList");

  const shareScoreBtn = document.getElementById("shareScoreBtn");
  const shareUnlockOpenerBtn = document.getElementById("shareUnlockOpenerBtn");
  const freeOpenerBox = document.getElementById("freeOpenerBox");
  const freeOpenerText = document.getElementById("freeOpenerText");
  const freeOpenerWhy = document.getElementById("freeOpenerWhy");
  const copyFreeOpenerBtn = document.getElementById("copyFreeOpenerBtn");

  const unlockedBadge = document.getElementById("unlockedBadge");
  const paywallStatusPill = document.getElementById("paywallStatusPill");
  const premiumContent = document.getElementById("premiumContent");
  const paywallOverlay = document.getElementById("paywallOverlay");
  const premiumOverhaulText = document.getElementById("premiumOverhaulText");
  const premiumRepliesList = document.getElementById("premiumRepliesList");
  const gumroadUnlockBtn = document.getElementById("gumroadUnlockBtn");

  const yearNow = document.getElementById("yearNow");
  if (yearNow) yearNow.textContent = new Date().getFullYear();

  function isUnlocked() {
    return localStorage.getItem(STORAGE_UNLOCK_KEY) === "true";
  }

  function applyUnlockState() {
    const unlocked = isUnlocked();
    if (unlocked) {
      unlockedBadge.classList.remove("hidden");
      paywallStatusPill.textContent = "✓ Lifetime Unlocked";
      paywallStatusPill.className =
        "text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
      premiumContent.classList.remove("blurred-paywall-content");
      premiumContent.classList.add("unlocked-content");
      paywallOverlay.classList.add("hidden");
    } else {
      unlockedBadge.classList.add("hidden");
      paywallStatusPill.textContent = "🔒 Locked ($19 One-Time)";
      premiumContent.classList.add("blurred-paywall-content");
      premiumContent.classList.remove("unlocked-content");
      paywallOverlay.classList.remove("hidden");
    }
  }

  function wireGumroadLink() {
    const url = CFG.GUMROAD_PRODUCT_URL || "https://gumroad.com/";
    gumroadUnlockBtn.href = url;
    if (url.includes("gumroad.com/l/")) {
      gumroadUnlockBtn.setAttribute("data-gumroad-overlay-checkout", "true");
    }
  }

  function setMode(mode) {
    currentMode = mode === "bio" ? "bio" : "chat";
    if (currentMode === "chat") {
      tabChat.classList.add("tab-active");
      tabChat.classList.remove("border-slate-700/70", "bg-slate-900/50", "text-slate-300");
      tabBio.classList.remove("tab-active");
      tabBio.classList.add("border-slate-700/70", "bg-slate-900/50", "text-slate-300");
      inputLabel.textContent = "Paste the last 2–4 messages where she stopped replying:";
      userInput.placeholder =
        "Example:\nMe: Hey! How was your weekend?\nHer: Pretty good just relaxed\nMe: Nice haha what do you do for work?\n(Left on read for 2 days)";
    } else {
      tabBio.classList.add("tab-active");
      tabBio.classList.remove("border-slate-700/70", "bg-slate-900/50", "text-slate-300");
      tabChat.classList.remove("tab-active");
      tabChat.classList.add("border-slate-700/70", "bg-slate-900/50", "text-slate-300");
      inputLabel.textContent = "Paste your Tinder, Bumble, or Hinge bio:";
      userInput.placeholder =
        "Example:\n6'0, love to travel, gym rat, foodie, fluent in sarcasm. Looking for my partner in crime who loves dogs and Netflix.";
    }
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function clearError() {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }

  function updateScoreGauge(score) {
    const circumference = 263.89;
    const clamped = Math.max(0, Math.min(100, score));
    const offset = circumference - (clamped / 100) * circumference;
    scoreCircle.style.strokeDashoffset = String(offset);

    if (clamped < 35) {
      scoreCircle.style.stroke = "#f43f5e";
    } else if (clamped < 55) {
      scoreCircle.style.stroke = "#f59e0b";
    } else {
      scoreCircle.style.stroke = "#10b981";
    }

    scoreValue.textContent = `${clamped}%`;
  }

  function renderResults(data) {
    lastResult = data;
    resultsSection.classList.remove("hidden");

    updateScoreGauge(data.score);
    diagnosisHeadline.textContent = data.headline;
    hopeSummary.textContent = data.hopeSummary;

    // 3 Mistakes
    mistakesList.innerHTML = "";
    (data.mistakes || []).forEach((m) => {
      const card = document.createElement("div");
      card.className = "p-4 rounded-xl bg-slate-900/80 border border-slate-800";
      card.innerHTML = `
        <div class="text-sm font-bold text-rose-300 mb-1"></div>
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed"></p>
      `;
      card.querySelector("div").textContent = m.title;
      card.querySelector("p").textContent = m.detail;
      mistakesList.appendChild(card);
    });

    // Free Opener
    if (data.freeOpener) {
      freeOpenerText.textContent = `"${data.freeOpener.text}"`;
      freeOpenerWhy.textContent = `Why it works: ${data.freeOpener.why}`;
      if (localStorage.getItem(STORAGE_OPENER_KEY) === "true") {
        freeOpenerBox.classList.remove("hidden");
      }
    }

    // Premium Content
    if (data.premium) {
      premiumOverhaulText.textContent = data.premium.overhaul;
      premiumRepliesList.innerHTML = "";
      (data.premium.replies || []).forEach((r) => {
        const item = document.createElement("div");
        item.className = "p-4 rounded-xl bg-slate-900/90 border border-slate-700/80";
        item.innerHTML = `
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-xs font-bold text-emerald-300"></span>
            <button type="button" class="copy-reply-btn text-[11px] font-semibold text-amber-300 hover:text-amber-200 cursor-pointer">Copy</button>
          </div>
          <p class="reply-text text-sm text-white font-medium mb-1.5"></p>
          <p class="reply-psych text-xs text-slate-400"></p>
        `;
        item.querySelector("span").textContent = r.label;
        item.querySelector(".reply-text").textContent = `"${r.text}"`;
        item.querySelector(".reply-psych").textContent = `Psychology: ${r.psychology}`;
        const copyBtn = item.querySelector(".copy-reply-btn");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(r.text).then(() => {
            copyBtn.textContent = "Copied ✓";
            setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
          });
        });
        premiumRepliesList.appendChild(item);
      });
    }

    applyUnlockState();
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Local zero-dependency fallback engine (identical psychology scoring if static-hosted without /api/analyze)
  function analyzeLocally(rawText, mode) {
    const text = String(rawText || "").trim();
    const lower = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const questionMarks = (text.match(/\?/g) || []).length;

    const interviewPhrases = [
      "how was your weekend", "how are you", "how's it going", "hows it going",
      "what do you do", "where are you from", "how was your day", "what are you up to",
      "wyd", "any plans", "tell me about yourself", "how's your week"
    ];
    const clicheBioPhrases = [
      "love to travel", "foodie", "gym", "sarcasm", "partner in crime", "netflix",
      "tacos", "margaritas", "dogs", "laid back", "easy going", "work hard play hard",
      "just ask", "not good at bios", "6ft", "6'0", "looking for"
    ];
    const needyOrFlatPhrases = [
      "haha", "lol", "lmao", "sorry", "just checking", "hope you're",
      "hope you are", "nice!", "cool!", "awesome", "hey!", "hi there", "left on read"
    ];

    const matchedInterview = interviewPhrases.filter((p) => lower.includes(p));
    const matchedCliche = clicheBioPhrases.filter((p) => lower.includes(p));
    const matchedNeedy = needyOrFlatPhrases.filter((p) => lower.includes(p));
    const hasHumor = /bet|trouble|unpopular opinion|hot take|debate|bribe|guilty|secret|worst|illegal|dealbreaker|plot twist/i.test(text);
    const hasHook = /coffee|espresso|vinyl|ramen|pasta|hike|concert|bar|cocktail|sushi|book|movie|paris|tokyo|beach|road trip|cooking|guitar|dog/i.test(text);

    let score = 46;
    if (mode === "chat") {
      score -= matchedInterview.length * 11 + matchedNeedy.length * 6;
      if (questionMarks >= 2) score -= 9;
      if (wordCount > 65) score -= 8;
      if (wordCount < 6) score -= 12;
    } else {
      score -= matchedCliche.length * 9 + matchedNeedy.length * 5;
      if (wordCount > 80) score -= 10;
      if (wordCount < 10) score -= 10;
    }
    if (hasHumor) score += 16;
    if (hasHook) score += 8;
    score = Math.max(14, Math.min(76, Math.round(score)));

    let bottleneck = "Low Emotional Tension Makes Replying Feel Like a Chore";
    if (mode === "chat" && (matchedInterview.length > 0 || questionMarks >= 2)) {
      bottleneck = "Your 'Interview-Style' Texting Is Killing Her Curiosity";
    } else if (mode === "bio" && matchedCliche.length > 0) {
      bottleneck = "Your 'Safe Cliché' Bio Blends Into 90% of Other Guys";
    } else if (matchedNeedy.length > 0) {
      bottleneck = "Over-Polite Filler Words Are Draining Your Emotional Tension";
    } else if (wordCount > 65) {
      bottleneck = "Over-Explaining Removes All Mystery Before She Even Replies";
    }

    const topicMatch = text.match(/\b(coffee|travel|gym|dog|dogs|music|food|pasta|sushi|wine|hiking|weekend|work|movie|movies|books|cooking|beach|bar|drinks|concert|tacos)\b/i);
    const topic = topicMatch ? topicMatch[1].toLowerCase() : null;

    const mistakes = mode === "chat"
      ? [
          {
            title: matchedInterview.length > 0 || questionMarks >= 2 ? "1. Job-Interview Question Loop" : "1. Missing Playful Push-Pull Tension",
            detail: matchedInterview.length > 0 || questionMarks >= 2
              ? `Lines like "${matchedInterview[0] || "back-to-back questions"}" force her to do mental work to answer. She gets that exact message 15 times a day.`
              : "Your message stays completely neutral and agreeable. Without a light tease or bold assumption, there's no emotional spark pulling her back."
          },
          {
            title: matchedNeedy.length > 0 ? "2. Low-Stakes Filler & Validation Cushioning" : "2. No Easy 'Bait Hook' for Her to Reply To",
            detail: matchedNeedy.length > 0
              ? `Using safe fillers ("${matchedNeedy[0]}") softens your personality into background noise. Confident texting drops the filler.`
              : "Even if she likes you, your last line doesn't give her an effortless, fun hook to bounce off."
          },
          {
            title: "3. Zero Mystery or Story Momentum",
            detail: "Her brain replies fastest to unfinished loops (a playful hypothesis about her, a light challenge, or a mini-story)."
          }
        ]
      : [
          {
            title: matchedCliche.length > 0 ? "1. Copy-Paste Bio Clichés" : "1. Resume Facts Instead of Emotional Vibe",
            detail: matchedCliche.length > 0
              ? `Mentioning "${matchedCliche[0]}" puts you in the exact same mental bucket as 8 out of 10 profiles she just swiped past.`
              : "Listing neutral facts doesn't make her feel what hanging out with you is like. Show a playful quirk or humorous boundary instead."
          },
          {
            title: "2. Zero Playful Tension or Challenge",
            detail: "A bio with no playful disqualifier or lighthearted debate feels too safe. Give her something fun to tease you about."
          },
          {
            title: "3. Missing a Built-In Reply Trigger",
            detail: "Great bios do half the texting for you by ending with an irresistible, low-friction prompt she can answer in 3 seconds."
          }
        ];

    return {
      ok: true,
      mode,
      score,
      headline: `⚠️ REPLY PROBABILITY: ${score}% — Not a Looks Issue: ${bottleneck}`,
      hopeSummary: mode === "chat"
        ? "Good news: when a conversation stalls here, it almost never means she lost attraction to your photos. Swap safe questions for playful intrigue and you can revive this chat tonight."
        : "Good news: you don't need model photos to 3x your matches. Adding one playful opinion + a curiosity hook instantly separates you from 90% of guys in her queue.",
      mistakes,
      freeOpener: mode === "chat"
        ? {
            text: topic
              ? `Alright, I just realized we never settled the most important question about ${topic} — and my entire impression of you depends on your answer.`
              : "Okay wait — I just had a wildly accurate theory about your vibe, and I can’t decide if it’s a green flag or mild trouble.",
            why: "Creates an instant open curiosity loop with zero pressure. She almost has to ask 'Wait, what is it?'"
          }
        : {
            text: "Unpopular opinion: the best first date isn’t dinner — it’s judging terrible art together and then getting overpriced dessert. Tell me your most controversial food take so I know if we’d survive.",
            why: "Signals fun, low-pressure date energy while handing her an effortless 3-second reply hook."
          },
      premium: {
        overhaul: mode === "bio"
          ? `Option A (Playful & High-Intrigue):\n"Certified over-tipper, undefeated at Mario Kart (allegly), and strongly against boring 'how was your week' small talk.${topic ? ` Bonus points if you have strong opinions about ${topic}.` : ""} Tell me the pettiest dealbreaker you secretly stand by."\n\nOption B (Confident Mystery — Zero Clichés):\n"I cook a dangerously good pasta, remember weirdly specific details, and will absolutely judge your Spotify queue in a loving way. Fair warning: I'm terrible at small talk and great at spontaneous Tuesday plans."`
          : `Your New Texting Frame (Drop Interview Mode → Spark Curiosity):\nInstead of asking how her week/work is going, use a 1-line playful assumption + open loop.\n\nBest 1-Shot Revival Lead:\n${topic ? `"Random thought — you strike me as someone who takes ${topic} way too seriously, and honestly I respect the commitment."` : `"I’m convinced you’re either the most organized person on this app or currently surviving on iced coffee and vibes. No in-between."`}`,
        replies: mode === "chat"
          ? [
              { label: "Reply #1 — The Zero-Needy Revival (Best for 24–72h Ghost)", text: "Well, I was going to invite you to be my accomplice for the world's most spontaneous coffee run, so it's a shame you went into witness protection.", psychology: "Playfully acknowledges the silence with humor instead of guilt or 'just checking in'." },
              { label: "Reply #2 — The Curiosity Loop (Highest Reply Rate)", text: "Quick pause — I just noticed something in your profile that completely changes my first impression of you.", psychology: "Triggers the Zeigarnik effect (unfinished curiosity loop). She replies just to find out what you noticed." },
              { label: "Reply #3 — The Playful Assumption", text: topic ? `Be honest: on a scale of 1 to 10, how competitive do you actually get about ${topic}?` : "Be honest: are you actually sweet and innocent, or are you the friend who convinces everyone to stay out way too late?", psychology: "Replaces boring factual questions with a fun identity game she enjoys answering." },
              { label: "Reply #4 — The Low-Pressure Date Pivot", text: "Alright, we’ve officially passed the small-talk stage. You owe me one wildly opinionated drink recommendation this week — Thursday or Friday?", psychology: "Moves off the app smoothly with confident, playful leadership and an easy binary choice." },
              { label: "Reply #5 — The Dry-Text Pattern Interrupt", text: "Whoa, slow down with all that enthusiasm — I can barely keep up with these novels you’re writing me.", psychology: "Light, teasing call-out for one-word replies. Shows self-respect and flips her into chasing your approval." }
            ]
          : [
              { label: "Opener #1 — Instant Curiosity Hook", text: "Important compatibility check before we waste each other's time: what's a completely harmless hill you're willing to die on?", psychology: "Stands out instantly from 'Hey' and sparks an opinionated, fun back-and-forth." },
              { label: "Opener #2 — The Playful Green-Flag Tease", text: "Your profile gives off 'great taste in music, terrible at picking a restaurant' energy. How close am I?", psychology: "Cold-read assumptions get 3x more replies than compliments because she loves telling you if you're right." },
              { label: "Opener #3 — The Two-Truths Micro-Game", text: "Two truths and a lie about you just from your photos: you love spontaneous trips, you steal fries, and you're secretly super competitive.", psychology: "Flattering, playful, and takes her 3 seconds to respond to." },
              { label: "Opener #4 — High-Intrigue First-Date Frame", text: "If we skipped the awkward interview phase and went straight to a 10/10 first date, what are we doing?", psychology: "Fast-forwards past boring small talk and gets her imagining a great date with you." },
              { label: "Opener #5 — The Confident Pattern Interrupt", text: "Okay I have a very serious question — and I promise it's 100x better than 'how was your weekend.' Ready?", psychology: "Directly mocks boring dating app norms and builds anticipation before you even ask." }
            ]
      }
    };
  }

  async function runAudit() {
    clearError();
    const text = userInput.value.trim();
    if (text.length < 5) {
      showError("Paste your dating bio or at least one message (5+ characters) to run the audit.");
      return;
    }

    localStorage.setItem(STORAGE_LAST_INPUT_KEY, text);
    localStorage.setItem(STORAGE_LAST_MODE_KEY, currentMode);

    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = "Analyzing Emotional Tension & Curiosity Gap...";
    analyzeSpinner.classList.remove("hidden");

    try {
      const resp = await fetch(CFG.API_ENDPOINT || "/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: currentMode, text })
      });
      const contentType = resp.headers.get("content-type") || "";
      if (!resp.ok || !contentType.includes("application/json")) {
        throw new Error("FALLBACK_LOCAL");
      }
      const data = await resp.json();
      if (!data.ok) {
        throw new Error(data.error || "Could not analyze right now.");
      }
      renderResults(data);
    } catch (err) {
      // Seamless local fallback if deployed on static hosting without serverless runtime
      renderResults(analyzeLocally(text, currentMode));
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "Run Free Reply-Probability Audit";
      analyzeSpinner.classList.add("hidden");
    }
  }

  function openXShare(tweetText) {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=480");
  }

  // Event listeners
  tabChat.addEventListener("click", () => setMode("chat"));
  tabBio.addEventListener("click", () => setMode("bio"));

  userInput.addEventListener("input", () => {
    charCount.textContent = `${userInput.value.length} / 2000`;
  });

  sampleChatBtn.addEventListener("click", () => {
    setMode("chat");
    userInput.value =
      "Me: Hey! How was your weekend?\nHer: Pretty good just relaxed\nMe: Nice haha what do you do for work?\n(Left on read for 2 days)";
    charCount.textContent = `${userInput.value.length} / 2000`;
  });

  sampleBioBtn.addEventListener("click", () => {
    setMode("bio");
    userInput.value =
      "6'0, love to travel, gym rat, foodie, fluent in sarcasm. Looking for my partner in crime who loves dogs and Netflix.";
    charCount.textContent = `${userInput.value.length} / 2000`;
  });

  analyzeBtn.addEventListener("click", runAudit);

  shareScoreBtn.addEventListener("click", () => {
    const score = lastResult ? lastResult.score : 22;
    const siteUrl = window.location.origin;
    const tweet = `Just audited my dating texts with SparkAudit and got a ${score}% Reply Probability Score 😅\n\nTurns out it wasn't my looks — it was boring "interview-style" texting killing curiosity.\n\nTest yours free: ${siteUrl}`;
    openXShare(tweet);
  });

  shareUnlockOpenerBtn.addEventListener("click", () => {
    const score = lastResult ? lastResult.score : 22;
    const siteUrl = window.location.origin;
    const tweet = `PSA for guys getting ghosted on Hinge/Tinder: I scored ${score}% on SparkAudit because of safe "job interview" texts. Just unlocked a high-curiosity revival line free here: ${siteUrl}`;
    openXShare(tweet);
    localStorage.setItem(STORAGE_OPENER_KEY, "true");
    freeOpenerBox.classList.remove("hidden");
  });

  copyFreeOpenerBtn.addEventListener("click", () => {
    if (!lastResult || !lastResult.freeOpener) return;
    navigator.clipboard.writeText(lastResult.freeOpener.text).then(() => {
      copyFreeOpenerBtn.textContent = "Copied ✓";
      setTimeout(() => (copyFreeOpenerBtn.textContent = "Copy Text"), 1500);
    });
  });

  // Check ?unlocked=true redirect from Gumroad
  const params = new URLSearchParams(window.location.search);
  if (params.get("unlocked") === "true") {
    localStorage.setItem(STORAGE_UNLOCK_KEY, "true");
    // Clean URL without losing state
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  wireGumroadLink();
  applyUnlockState();

  // If user just returned unlocked and had a previous audit input, auto-run it so they see their unlocked results immediately
  const savedInput = localStorage.getItem(STORAGE_LAST_INPUT_KEY);
  const savedMode = localStorage.getItem(STORAGE_LAST_MODE_KEY);
  if (savedMode) setMode(savedMode);
  if (savedInput) {
    userInput.value = savedInput;
    charCount.textContent = `${savedInput.length} / 2000`;
    if (isUnlocked()) {
      runAudit();
    }
  }
})();
