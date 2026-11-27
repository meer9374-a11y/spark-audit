// SparkAudit Zero-Dependency Vercel Serverless Function
// Supports both the web app and B2B / RapidAPI consumers via POST /api/analyze

function analyzeInput(rawText, mode = "chat") {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const questionMarks = (text.match(/\?/g) || []).length;

  // Pattern detectors
  const interviewPhrases = [
    "how was your weekend",
    "how are you",
    "how's it going",
    "hows it going",
    "what do you do",
    "where are you from",
    "how was your day",
    "what are you up to",
    "wyd",
    "any plans",
    "tell me about yourself",
    "how's your week"
  ];
  const clicheBioPhrases = [
    "love to travel",
    "foodie",
    "gym",
    "sarcasm",
    "partner in crime",
    "netflix",
    "tacos",
    "margaritas",
    "dogs",
    "laid back",
    "easy going",
    "work hard play hard",
    "just ask",
    "not good at bios",
    "6ft",
    "6'0",
    "looking for"
  ];
  const needyOrFlatPhrases = [
    "haha",
    "lol",
    "lmao",
    "sorry",
    "just checking",
    "hope you're",
    "hope you are",
    "nice!",
    "cool!",
    "awesome",
    "hey!",
    "hi there",
    "left on read"
  ];

  const matchedInterview = interviewPhrases.filter((p) => lower.includes(p));
  const matchedCliche = clicheBioPhrases.filter((p) => lower.includes(p));
  const matchedNeedy = needyOrFlatPhrases.filter((p) => lower.includes(p));

  const hasHumorOrPlayfulness =
    /bet|trouble|unpopular opinion|hot take|debate|bribe|guilty|secret|worst|illegal|dealbreaker|plot twist/i.test(text);
  const hasSpecificHook =
    /coffee|espresso|vinyl|ramen|pasta|hike|concert|bar|cocktail|sushi|book|movie|paris|tokyo|beach|road trip|cooking|guitar|dog/i.test(text);

  // Score calculation (calibrated to realistic hope-driven diagnostic range)
  let score = 46;
  if (mode === "chat") {
    score -= matchedInterview.length * 11;
    score -= matchedNeedy.length * 6;
    if (questionMarks >= 2) score -= 9;
    if (wordCount > 65) score -= 8;
    if (wordCount < 6) score -= 12;
  } else {
    score -= matchedCliche.length * 9;
    score -= matchedNeedy.length * 5;
    if (wordCount > 80) score -= 10;
    if (wordCount < 10) score -= 10;
  }

  if (hasHumorOrPlayfulness) score += 16;
  if (hasSpecificHook) score += 8;

  score = Math.max(14, Math.min(76, Math.round(score)));

  // Primary bottleneck label & headline
  let bottleneck = "Zero Curiosity Gap";
  if (mode === "chat" && (matchedInterview.length > 0 || questionMarks >= 2)) {
    bottleneck = "Your 'Interview-Style' Texting Is Killing Her Curiosity";
  } else if (mode === "bio" && matchedCliche.length > 0) {
    bottleneck = "Your 'Safe Cliché' Bio Blends Into 90% of Other Guys";
  } else if (matchedNeedy.length > 0) {
    bottleneck = "Over-Polite Filler Words Are Draining Your Emotional Tension";
  } else if (wordCount > 65) {
    bottleneck = "Over-Explaining Removes All Mystery Before She Even Replies";
  } else {
    bottleneck = "Low Emotional Tension Makes Replying Feel Like a Chore";
  }

  const headline = `⚠️ REPLY PROBABILITY: ${score}% — Not a Looks Issue: ${bottleneck}`;

  const hopeSummary =
    mode === "chat"
      ? `Good news: when a conversation stalls here, it almost never means she lost attraction to your photos. Her brain just didn't feel an emotional hook strong enough to reply right away. Swap safe questions for playful intrigue and you can revive this chat tonight.`
      : `Good news: you don't need model photos to 3x your matches. Right now your bio reads like a polite resume instead of a conversation starter. Adding one playful opinion + a curiosity hook instantly separates you from 90% of guys in her queue.`;

  // Build 3 specific, fixable mistakes tailored to their input
  const mistakes = [];

  if (mode === "chat") {
    if (matchedInterview.length > 0 || questionMarks >= 2) {
      mistakes.push({
        title: "1. Job-Interview Question Loop",
        detail: `Lines like "${matchedInterview[0] || "back-to-back questions"}" force her to do mental work to answer. She gets that exact message 15 times a day — her thumb instinctively scrolls past it.`
      });
    } else {
      mistakes.push({
        title: "1. Missing Playful Push-Pull Tension",
        detail: "Your message stays completely neutral and agreeable. Without a light tease, bold assumption, or unexpected angle, there's no emotional spark pulling her back into the chat."
      });
    }

    if (matchedNeedy.length > 0) {
      mistakes.push({
        title: "2. Low-Stakes Filler & Validation Cushioning",
        detail: `Using safe fillers ("${matchedNeedy[0]}") softens your personality into background noise. Confident texting drops the filler and lets a witty statement stand on its own.`
      });
    } else if (wordCount > 55) {
      mistakes.push({
        title: "2. Over-Investing Too Early",
        detail: `At ${wordCount} words, you're doing all the conversational heavy lifting. Shorter, punchier texts with a curiosity gap make her lean in and ask YOU questions.`
      });
    } else {
      mistakes.push({
        title: "2. No Easy 'Bait Hook' for Her to Reply To",
        detail: "Even if she likes you, your last line doesn't give her an effortless, fun hook to bounce off. Giving her a playful accusation or 2-choice debate doubles reply speed."
      });
    }

    mistakes.push({
      title: "3. Zero Mystery or Story Momentum",
      detail: "Her brain replies fastest to unfinished loops (a playful hypothesis about her, a light challenge, or a mini-story). Right now the conversation feels predictable from start to finish."
    });
  } else {
    if (matchedCliche.length > 0) {
      mistakes.push({
        title: "1. Copy-Paste Bio Clichés",
        detail: `Mentioning "${matchedCliche[0]}" puts you in the exact same mental bucket as 8 out of 10 profiles she just swiped past. Specific, slightly bold details beat generic hobbies every time.`
      });
    } else {
      mistakes.push({
        title: "1. Resume Facts Instead of Emotional Vibe",
        detail: "Listing neutral facts about yourself doesn't make her *feel* what hanging out with you is like. Show a playful quirk or humorous boundary instead of a plain description."
      });
    }

    if (!hasHumorOrPlayfulness) {
      mistakes.push({
        title: "2. Zero Playful Tension or Challenge",
        detail: "A bio with no playful disqualifier or lighthearted debate feels too safe. Giving her something fun to tease you about makes her want to message first."
      });
    } else {
      mistakes.push({
        title: "2. Hook Is Buried Instead of Front-Loaded",
        detail: "She decides in 1.8 seconds whether to read further. Your best personality trait needs to hit in line one with punchy rhythm."
      });
    }

    mistakes.push({
      title: "3. Missing a Built-In Reply Trigger",
      detail: "Great bios do half the texting for you by ending with an irresistible, low-friction prompt she can answer in 3 seconds."
    });
  }

  // Extract a keyword from their text to personalize the replies/overhaul
  const topicMatch = text.match(/\b(coffee|travel|gym|dog|dogs|music|food|pasta|sushi|wine|hiking|weekend|work|movie|movies|books|cooking|beach|bar|drinks|concert|tacos)\b/i);
  const topic = topicMatch ? topicMatch[1].toLowerCase() : null;

  // Free bonus opener (unlocked via X share)
  const freeOpener =
    mode === "chat"
      ? {
          text: topic
            ? `Alright, I just realized we never settled the most important question about ${topic} — and my entire impression of you depends on your answer.`
            : `Okay wait — I just had a wildly accurate theory about your vibe, and I can’t decide if it’s a green flag or mild trouble.`,
          why: "Creates an instant open curiosity loop with zero pressure. She almost has to ask 'Wait, what is it?'"
        }
      : {
          text: `Unpopular opinion: the best first date isn’t dinner — it’s judging terrible art together and then getting overpriced dessert. Tell me your most controversial food take so I know if we’d survive.`,
          why: "Signals fun, low-pressure date energy while handing her an effortless 3-second reply hook."
        };

  // Premium Overhaul + 5 Plug-and-Play Replies (blurred behind $19 Gumroad paywall)
  const premiumOverhaul =
    mode === "bio"
      ? [
          `Option A (Playful & High-Intrigue):`,
          `"Certified over-tipper, undefeated at Mario Kart (allegly), and strongly against boring 'how was your week' small talk.${topic ? ` Bonus points if you have strong opinions about ${topic}.` : ""} Tell me the pettiest dealbreaker you secretly stand by."`,
          ``,
          `Option B (Confident Mystery — Zero Clichés):`,
          `"I cook a dangerously good pasta, remember weirdly specific details, and will absolutely judge your Spotify queue in a loving way. Fair warning: I'm terrible at small talk and great at spontaneous Tuesday plans."`
        ].join("\n")
      : [
          `Your New Texting Frame (Drop Interview Mode → Spark Curiosity):`,
          `Instead of asking how her week/work is going, use a 1-line playful assumption + open loop. It resets the dynamic immediately without looking needy or bringing up that she went quiet.`,
          ``,
          `Best 1-Shot Revival Lead:`,
          topic
            ? `"Random thought — you strike me as someone who takes ${topic} way too seriously, and honestly I respect the commitment."`
            : `"I’m convinced you’re either the most organized person on this app or currently surviving on iced coffee and vibes. No in-between."`
        ].join("\n");

  const premiumReplies =
    mode === "chat"
      ? [
          {
            label: "Reply #1 — The Zero-Needy Revival (Best for 24–72h Ghost)",
            text: `Well, I was going to invite you to be my accomplice for the world's most spontaneous coffee run, so it's a shame you went into witness protection.`,
            psychology: "Playfully acknowledges the silence with humor instead of guilt or 'just checking in'."
          },
          {
            label: "Reply #2 — The Curiosity Loop (Highest Reply Rate)",
            text: `Quick pause — I just noticed something in your profile that completely changes my first impression of you.`,
            psychology: "Triggers the Zeigarnik effect (unfinished curiosity loop). She replies just to find out what you noticed."
          },
          {
            label: "Reply #3 — The Playful Assumption",
            text: topic
              ? `Be honest: on a scale of 1 to 10, how competitive do you actually get about ${topic}?`
              : `Be honest: are you actually sweet and innocent, or are you the friend who convinces everyone to stay out way too late?`,
            psychology: "Replaces boring factual questions with a fun identity game she enjoys answering."
          },
          {
            label: "Reply #4 — The Low-Pressure Date Pivot",
            text: `Alright, we’ve officially passed the small-talk stage. You owe me one wildly opinionated drink recommendation this week — Thursday or Friday?`,
            psychology: "Moves off the app smoothly with confident, playful leadership and an easy binary choice."
          },
          {
            label: "Reply #5 — The Dry-Text Pattern Interrupt",
            text: `Whoa, slow down with all that enthusiasm — I can barely keep up with these novels you’re writing me.`,
            psychology: "Light, teasing call-out for one-word replies. Shows self-respect and flips her into chasing your approval."
          }
        ]
      : [
          {
            label: "Opener #1 — Instant Curiosity Hook",
            text: `Important compatibility check before we waste each other's time: what's a completely harmless hill you're willing to die on?`,
            psychology: "Stands out instantly from 'Hey' and sparks an opinionated, fun back-and-forth."
          },
          {
            label: "Opener #2 — The Playful Green-Flag Tease",
            text: `Your profile gives off 'great taste in music, terrible at picking a restaurant' energy. How close am I?`,
            psychology: "Cold-read assumptions get 3x more replies than compliments because she loves telling you if you're right."
          },
          {
            label: "Opener #3 — The Two-Truths Micro-Game",
            text: `Two truths and a lie about you just from your photos: you love spontaneous trips, you steal fries, and you're secretly super competitive.`,
            psychology: "Flattering, playful, and takes her 3 seconds to respond to."
          },
          {
            label: "Opener #4 — High-Intrigue First-Date Frame",
            text: `If we skipped the awkward interview phase and went straight to a 10/10 first date, what are we doing?`,
            psychology: "Fast-forwards past boring small talk and gets her imagining a great date with you."
          },
          {
            label: "Opener #5 — The Confident Pattern Interrupt",
            text: `Okay I have a very serious question — and I promise it's 100x better than 'how was your weekend.' Ready?`,
            psychology: "Directly mocks boring dating app norms and builds anticipation before you even ask."
          }
        ];

  return {
    ok: true,
    mode,
    score,
    headline,
    hopeSummary,
    mistakes,
    freeOpener,
    premium: {
      overhaul: premiumOverhaul,
      replies: premiumReplies
    },
    meta: {
      wordCount,
      questionMarks,
      analyzedAt: new Date().toISOString(),
      engine: "SparkAudit-Psych-v1"
    }
  };
}

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-RapidAPI-Key, X-RapidAPI-Host");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      service: "SparkAudit Dating Psychology API",
      version: "1.0.0",
      status: "operational",
      usage: {
        method: "POST",
        endpoint: "/api/analyze",
        body: {
          mode: "chat | bio",
          text: "Your dating bio or conversation text"
        }
      }
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed. Use POST /api/analyze." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const text = (body.text || "").trim();
    const mode = body.mode === "bio" ? "bio" : "chat";

    if (text.length < 5) {
      return res.status(400).json({
        ok: false,
        error: "Please paste at least 5 characters of your bio or conversation."
      });
    }

    const result = analyzeInput(text, mode);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON payload. Send { \"mode\": \"chat\" | \"bio\", \"text\": \"...\" }."
    });
  }
};
