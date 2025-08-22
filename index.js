var answer;
var hintText;

var done = false
var tries = 1;

window.onload = () => {
    playGame();
};

const textInput = document.getElementById('answer');
textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && done !== true) {
        if (textInput.value === answer) {
            triggerShake({
                duration: 500,                 // ms or '0.5s'
                intensity: 0.1,                 // px
                tint: 'rgba(0, 255, 0, 0.18)'  // any CSS color
            });
            showPlayAgain();
            done = true;
        } else {
            if (tries >= 5) {

                showHint("La réponse était: " + answer)

                showPlayAgain();
                done = true;
            }
            else if (tries === 3) {
                showHint("Indice: " + hintText)
            }
            triggerShake();
            tries += 1;
        }
    }
});



function playGame() {
    var i = Math.floor(Math.random() * 71);

    answer = window.TREE_DATA.at(i).French;
    hintText = window.TREE_DATA.at(i).Taxon;

    loadPictures(window.TREE_DATA.at(i).Taxon);

    console.log(answer);
}

function loadPictures(Taxon) {
    var a = Taxon.split(" ");
    var image = a[0] + "_" + a[1] + "-";

    for (var i = 0; i <= 2; i++) {
        document.querySelectorAll(".slot img")[i].src = "data/images/" + image + (i+1) + ".png";
    }
}

function normalizeStr(s) {
    return s
        .toLowerCase()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")    // enlève les accents
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")        // retire ponctuation
        .replace(/\s+/g, " ")                                // espaces multiples -> simple
        .trim();
}

function levenshtein(a, b) {
    a = normalizeStr(a);
    b = normalizeStr(b);
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    if (a.length > b.length) [a, b] = [b, a]; // a = plus court

    const prev = new Array(a.length + 1);
    for (let i = 0; i <= a.length; i++) prev[i] = i;

    for (let j = 1; j <= b.length; j++) {
        let cur = j, prevDiag = j - 1;
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const ins = cur + 1;
            const del = prev[i] + 1;
            const sub = prevDiag + cost;
            prevDiag = prev[i];
            cur = Math.min(ins, del, sub);
            prev[i] = cur;
        }
    }
    return prev[a.length];
}

function isCloseMatch(input, answer, options = {}) {
    const { maxDistance } = options;

    if (typeof maxDistance === "number") {
        const d = levenshtein(input, answer);
        return d <= maxDistance;
    }

}

function matchesAny(input, answers, options) {
    return answers.some(ans => isCloseMatch(input, ans, options));
}

// --- Utilities (use yours if you already added them) ---
function normalizeStr(s) {
    return String(s ?? "")
        .toLowerCase()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}
function levenshtein(a, b) {
    a = normalizeStr(a); b = normalizeStr(b);
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    if (a.length > b.length) [a, b] = [b, a];
    const dp = new Array(a.length + 1);
    for (let i = 0; i <= a.length; i++) dp[i] = i;
    for (let j = 1; j <= b.length; j++) {
        let prevDiag = j - 1, cur = j;
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const ins = cur + 1, del = dp[i] + 1, sub = prevDiag + cost;
            prevDiag = dp[i]; cur = Math.min(ins, del, sub); dp[i] = cur;
        }
    }
    return dp[a.length];
}
function similarity(a, b) {
    const maxLen = Math.max(normalizeStr(a).length, normalizeStr(b).length) || 1;
    return 1 - (levenshtein(a, b) / maxLen); // 0..1
}

const CANDIDATES = (() => {
    const out = new Set();
    (window.TREE_DATA || []).forEach(row => {
        ["Taxon","French","French2","French3"].forEach(k => {
            const v = row?.[k];
            if (v && v !== "None") out.add(String(v));
        });
    });
    return [...out];
})();

const answerInput = document.getElementById("answer");
const suggestionsEl = document.getElementById("suggestions");
let activeIndex = -1;

function hideSuggestions() {
    suggestionsEl.classList.add("is-hidden");
    suggestionsEl.replaceChildren();
    activeIndex = -1;
}

function showSuggestions(list) {
    suggestionsEl.classList.remove("is-hidden");
    suggestionsEl.replaceChildren(...list.map((text, idx) => {
        const li = document.createElement("li");
        li.role = "option";
        li.textContent = text;
        li.dataset.value = text;
        li.addEventListener("mousedown", (e) => {
            // mousedown to fire before input blur
            answerInput.value = text;
            hideSuggestions();
        });
        return li;
    }));
}

answerInput.addEventListener("input", () => {
    const q = answerInput.value;
    if (normalizeStr(q).length < 2) { hideSuggestions(); return; }

    const scored = CANDIDATES
        .map(name => [name, similarity(q, name)])
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

    if (scored.length) showSuggestions(scored);
    else hideSuggestions();
});

answerInput.addEventListener("keydown", (e) => {
    const open = !suggestionsEl.classList.contains("is-hidden");
    const items = Array.from(suggestionsEl.querySelectorAll("li"));

    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && open) {
        e.preventDefault();
        if (!items.length) return;
        if (e.key === "ArrowDown") activeIndex = (activeIndex + 1) % items.length;
        else activeIndex = (activeIndex - 1 + items.length) % items.length;

        items.forEach((li, i) => li.classList.toggle("is-active", i === activeIndex));
        return;
    }

    if (e.key === "Enter" && open && activeIndex >= 0) {
        e.preventDefault();
        const picked = items[activeIndex]?.dataset.value;
        if (picked) answerInput.value = picked;
        hideSuggestions();
    }

    if (e.key === "Escape" && open) {
        e.preventDefault();
        hideSuggestions();
    }
});

// Hide on blur/click-away
document.addEventListener("click", (e) => {
    if (!suggestionsEl.contains(e.target) && e.target !== answerInput) {
        hideSuggestions();
    }
});




