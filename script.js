/* ==========================================================================
   CyberSafe — front-end script
   --------------------------------------------------------------------------
   1. Helpers
   2. Theme (light / dark) and text size
   3. Mobile menu and active nav link
   4. Topic pop-up
   5. Flashcards
   6. Quiz

   The content below is kept as plain data so it is easy to extend later
   (for example by loading it from a backend or database).
   ========================================================================== */


/* 1. HELPERS ------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);

// Pad a number to two digits: 3 -> "03"
const pad = (n) => String(n).padStart(2, "0");

// localStorage can be blocked (private windows, strict settings), so never let it crash the page.
function saveSetting(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
}


/* 2. THEME AND TEXT SIZE ------------------------------------------------- */

const root = document.documentElement;

// --- Light / dark mode ---
function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const toggle = $("themeToggle");
  toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  toggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

$("themeToggle").addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  saveSetting("cybersafe-theme", next);
});
applyTheme(root.getAttribute("data-theme") || "light");

// --- Text size ---
// The whole page is sized in rem, so changing the root percentage scales everything.
const FONT_STEPS = [87.5, 100, 112.5, 125, 137.5];
let fontIndex = FONT_STEPS.indexOf(parseFloat(root.style.fontSize) || 100);
if (fontIndex === -1) fontIndex = 1; // fall back to 100%

function applyFontSize() {
  root.style.fontSize = FONT_STEPS[fontIndex] + "%";
  $("fontDown").disabled = fontIndex === 0;
  $("fontUp").disabled = fontIndex === FONT_STEPS.length - 1;
  saveSetting("cybersafe-font", FONT_STEPS[fontIndex]);
  fitHeader();
}

$("fontDown").addEventListener("click", () => { if (fontIndex > 0) { fontIndex--; applyFontSize(); } });
$("fontUp").addEventListener("click", () => { if (fontIndex < FONT_STEPS.length - 1) { fontIndex++; applyFontSize(); } });


/* 3. MOBILE MENU AND ACTIVE NAV LINK ------------------------------------- */

const nav = $("nav");
const menuToggle = $("menuToggle");

menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open);
});

// If the header contents don't fit on one line (small screen or large text),
// switch to the menu layout. Otherwise show the full navigation.
const topbar = document.querySelector(".topbar");
function fitHeader() {
  topbar.classList.remove("compact");
  if (topbar.scrollWidth > topbar.clientWidth + 1) topbar.classList.add("compact");
  else { nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); }
}
window.addEventListener("resize", fitHeader);

const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Highlight the nav link for whichever section is on screen while scrolling.
applyFontSize(); // also runs fitHeader()

const sections = [...navLinks].map((link) => document.querySelector(link.getAttribute("href")));
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
    });
  });
}, { rootMargin: "-40% 0px -55% 0px" });
sections.forEach((section) => section && spy.observe(section));


/* 4. TOPIC POP-UP -------------------------------------------------------- */

const topics = {
  phishing: {
    title: "Phishing & scams", icon: "i-mail",
    description: "Phishing is when someone pretends to be a person or company you trust, to trick you into sharing information, opening a harmful attachment, or visiting a fake website.",
    points: [
      "Check the sender's full email address, not just the display name.",
      "Be wary of urgent threats, surprise prizes, and requests for passwords or OTPs.",
      "Hover over links (or press and hold on mobile) to see where they really go.",
      "If in doubt, contact the organization through an official channel you already know."
    ],
    tip: "Never share your password or one-time password in reply to a message you didn't ask for."
  },
  passwords: {
    title: "Password safety", icon: "i-key",
    description: "A long, unique passphrase is usually easier to remember and much harder to guess than a short password that you use in many places.",
    points: [
      "Use a different password for every important account.",
      "Consider a password manager to create and store them for you.",
      "Turn on multi-factor authentication (MFA) wherever it is offered.",
      "Never share passwords, even with someone who says they are from support."
    ],
    tip: "With MFA on, a stolen password alone is not enough to get into your account."
  },
  malware: {
    title: "Malware basics", icon: "i-bug",
    description: "Malware is software built to disrupt, damage, spy on, or break into your devices and data. Common kinds include viruses, ransomware, spyware, and trojans.",
    points: [
      "Download software only from trusted, official sources.",
      "Think twice before opening unexpected attachments.",
      "Keep your operating system and apps up to date.",
      "Use reputable security software and keep backups."
    ],
    tip: "Ransomware locks your files and demands payment. Keep a backup somewhere it can't be reached from your main device."
  },
  privacy: {
    title: "Online privacy", icon: "i-eye",
    description: "Online privacy means understanding how websites, apps, and services collect and use your personal information, and having a say in it.",
    points: [
      "Review the privacy settings on your social media and apps.",
      "Share only the details a service really needs.",
      "Be careful about posting live location, travel plans, or ID documents.",
      "Check app permissions and remove access you no longer need."
    ],
    tip: "Assume anything you post publicly could be copied and shared with people you never intended."
  },
  wifi: {
    title: "Safe Wi-Fi", icon: "i-wifi",
    description: "Public Wi-Fi is handy, but an unfamiliar network can hide risks such as fake hotspots. HTTPS protects the data you send to many websites.",
    points: [
      "Ask the venue for the exact network name before you connect.",
      "Avoid banking and other sensitive tasks on networks you don't trust.",
      "Look for HTTPS and keep your device firewall on.",
      "Turn off automatic connection to open Wi-Fi networks."
    ],
    tip: "A network name that looks official is not proof that the hotspot is genuine."
  },
  updates: {
    title: "Updates & backups", icon: "i-refresh",
    description: "Software updates often fix security weaknesses. Backups let you recover your important files if a device is lost, damaged, or hit by malware.",
    points: [
      "Install updates for your operating system, browser, and apps.",
      "Turn on automatic updates when you can.",
      "Back up important files on a regular schedule.",
      "Every so often, check that you can actually restore from your backup."
    ],
    tip: "A backup only helps if it is recent and you know it can be restored."
  }
};

const modal = $("topicModal");

function openTopic(key) {
  const topic = topics[key];
  $("modalIcon").innerHTML = `<svg class="icon"><use href="#${topic.icon}"/></svg>`;
  $("modalTitle").textContent = topic.title;
  $("modalDescription").textContent = topic.description;
  $("modalPoints").innerHTML = topic.points.map((point) => `<li>${point}</li>`).join("");
  $("modalTip").textContent = topic.tip;
  modal.classList.add("open");
  $("modalDone").focus();
}

function closeModal() {
  modal.classList.remove("open");
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => openTopic(button.dataset.open));
});
$("closeModal").addEventListener("click", closeModal);
$("modalDone").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });


/* 5. FLASHCARDS ---------------------------------------------------------- */

const cards = [
  { category: "FOUNDATIONS",    q: "What is cybersecurity?",                       a: "The practice of protecting systems, networks, devices, and data from digital attacks, damage, or unauthorized access." },
  { category: "PHISHING",       q: "What is phishing?",                            a: "A deceptive attempt to trick people into revealing sensitive information or taking an unsafe action, often through email, texts, or fake websites." },
  { category: "PASSWORDS",      q: "What makes a password strong?",                a: "A long, unique password or passphrase that is hard to guess. Avoid common words and never reuse it across accounts." },
  { category: "ACCOUNT SAFETY", q: "What is multi-factor authentication (MFA)?",   a: "A sign-in method that asks for two or more kinds of proof, such as a password plus a code from an authenticator app." },
  { category: "MALWARE",        q: "What is malware?",                             a: "Malicious software designed to harm a device, disrupt operations, spy on users, or gain unauthorized access." },
  { category: "MALWARE",        q: "What does ransomware do?",                     a: "It locks or encrypts your data and demands payment. Reliable backups can help you recover." },
  { category: "PRIVACY",        q: "What is personal data?",                       a: "Information that identifies a person or can be linked to them, such as a name, address, phone number, or account ID." },
  { category: "SAFE BROWSING",  q: "What does HTTPS indicate?",                    a: "The connection to the website is encrypted. It does not, by itself, prove the website is trustworthy." },
  { category: "NETWORKS",       q: "What is a public Wi-Fi risk?",                 a: "A fake or poorly secured hotspot may expose you to scams or snooping. Verify the network and use secure connections." },
  { category: "SECURITY",       q: "Why are software updates important?",          a: "Updates often fix known security holes and bugs. Putting them off can leave your devices exposed." },
  { category: "RECOVERY",       q: "Why should you back up files?",                a: "Backups let you restore important data after accidental deletion, device failure, or some cyber incidents." },
  { category: "HABITS",         q: "What should you do with a suspicious link?",   a: "Don't open it. Check the message through an official channel and report it if appropriate." }
];

let cardIndex = 0;
let showingAnswer = false;

function renderCard() {
  const card = cards[cardIndex];
  $("cardCategory").textContent = card.category;
  $("cardNumber").textContent = pad(cardIndex + 1);
  $("cardText").textContent = showingAnswer ? card.a : card.q;
  $("answerLabel").textContent = showingAnswer ? "ANSWER" : "THINK ABOUT IT";
  $("flashCount").textContent = `${pad(cardIndex + 1)} / ${cards.length}`;
  $("flashProgress").style.width = `${((cardIndex + 1) / cards.length) * 100}%`;
  $("flashCard").classList.toggle("is-flipped", showingAnswer);
  $("flipButton").textContent = showingAnswer ? "Show question ↻" : "Reveal answer ↻";
}

function flipCard() {
  showingAnswer = !showingAnswer;
  renderCard();
}

// Move forwards (+1) or backwards (-1), wrapping around at either end.
function moveCard(step) {
  cardIndex = (cardIndex + step + cards.length) % cards.length;
  showingAnswer = false;
  renderCard();
}

$("flashCard").addEventListener("click", flipCard);
$("flipButton").addEventListener("click", flipCard);
$("prevCard").addEventListener("click", () => moveCard(-1));
$("nextCard").addEventListener("click", () => moveCard(1));
renderCard();


/* 6. QUIZ ---------------------------------------------------------------- */

const questions = [
  { q: "Which is a sign of a possible phishing email?",
    options: ["A message you expected", "An urgent request to verify your account", "A newsletter you subscribed to", "A receipt for a purchase you made"],
    answer: 1, why: "Unexpected urgency and requests to verify an account are classic phishing warning signs." },
  { q: "Which password habit is safer?",
    options: ["Use the same password everywhere", "Use your birthday", "Use a long, unique password for each account", "Share passwords with friends"],
    answer: 2, why: "Unique passwords limit the damage if one account is ever compromised." },
  { q: "What does MFA add to an account?",
    options: ["A second verification factor", "A public profile", "A faster internet connection", "An automatic backup"],
    answer: 0, why: "MFA asks for another proof of identity on top of your password." },
  { q: "What should you do before downloading an app?",
    options: ["Click the first ad", "Disable security settings", "Download from an unofficial mirror", "Check that the source is trusted"],
    answer: 3, why: "Official, trusted sources lower the risk of installing malicious software." },
  { q: "Why should you install security updates?",
    options: ["They make passwords public", "They often fix security weaknesses", "They remove the need for backups", "They guarantee zero risk"],
    answer: 1, why: "Updates patch known vulnerabilities, although no device is ever completely risk-free." }
];

let questionIndex = 0;
let score = 0;
let answered = false;

// The quiz screen is rebuilt from this template each time the quiz starts,
// so "Try again" always begins from a clean state.
function quizTemplate() {
  return `
    <div class="quiz-meta"><span id="quizStep"></span><span class="quiz-score">SCORE <b id="quizScore">0</b></span></div>
    <div class="quiz-progress"><span id="quizProgress"></span></div>
    <h3 id="questionText"></h3>
    <div class="options" id="options"></div>
    <div class="quiz-bottom">
      <span id="quizFeedback" aria-live="polite"></span>
      <button class="btn btn-primary" id="nextQuestion" type="button" disabled></button>
    </div>`;
}

function startQuiz() {
  questionIndex = 0;
  score = 0;
  $("quizMain").innerHTML = quizTemplate();
  showQuestion();
}

function showQuestion() {
  const current = questions[questionIndex];
  const isLast = questionIndex === questions.length - 1;
  answered = false;

  $("quizStep").textContent = `QUESTION ${pad(questionIndex + 1)} / ${pad(questions.length)}`;
  $("quizScore").textContent = score;
  $("quizProgress").style.width = `${(questionIndex / questions.length) * 100}%`;
  $("questionText").textContent = current.q;
  $("quizFeedback").textContent = "Choose one answer to continue.";
  $("nextQuestion").disabled = true;
  $("nextQuestion").textContent = isLast ? "See results →" : "Next question →";

  const list = $("options");
  list.innerHTML = "";
  current.options.forEach((text, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.dataset.index = index;
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span>`;
    button.append(text);
    list.appendChild(button);
  });
}

function chooseAnswer(choice) {
  if (answered) return;
  answered = true;

  const current = questions[questionIndex];
  document.querySelectorAll(".option").forEach((button, index) => {
    button.disabled = true;
    if (index === current.answer) button.classList.add("correct");
    if (index === choice && choice !== current.answer) button.classList.add("wrong");
  });

  if (choice === current.answer) {
    score++;
    $("quizFeedback").textContent = "Correct! " + current.why;
  } else {
    $("quizFeedback").textContent = "Not quite. " + current.why;
  }
  $("quizScore").textContent = score;
  $("nextQuestion").disabled = false;
}

function showResults() {
  const perfect = score === questions.length;
  $("quizMain").innerHTML = `
    <div class="quiz-result">
      <strong>${score} / ${questions.length}</strong>
      <h3>Quiz completed!</h3>
      <p>${perfect
        ? "Excellent recall. Keep up those safe digital habits."
        : "Thanks for practising. Look back over the lessons and try again to improve your score."}</p>
      <button class="btn btn-primary" id="restartQuiz" type="button">Try again ↻</button>
    </div>`;
}

// One listener on the quiz container handles every button inside it,
// including the ones that are re-created each time the quiz restarts.
$("quizMain").addEventListener("click", (event) => {
  const option = event.target.closest(".option");
  if (option) return chooseAnswer(Number(option.dataset.index));

  if (event.target.closest("#nextQuestion") && answered) {
    if (questionIndex < questions.length - 1) {
      questionIndex++;
      showQuestion();
    } else {
      showResults();
    }
    return;
  }

  if (event.target.closest("#restartQuiz")) startQuiz();
});

startQuiz();
