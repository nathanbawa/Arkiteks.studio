const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const backupPath = path.join(__dirname, 'index.backup.html');

if (!fs.existsSync(indexPath)) {
    console.error('Error: index.html not found.');
    process.exit(1);
}

const raw = fs.readFileSync(indexPath, 'utf8');

// Guard against applying twice
if (raw.indexOf('/* === PATCH-TYPOGRAPHY-CARDO-INTER === */') !== -1) {
    console.log('patch-typography.js has already been applied. Skipping.');
    process.exit(0);
}

const content = raw.replace(/\r\n/g, '\n');

// Define unique anchors to verify before touching the file
const ANCHOR_FONTS_LINK = '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">';
const ANCHOR_BODY_RULE = "body{\n    font-family:'Inter',sans-serif;\n    background:#F9F7F2;\n    color:#222;\n    overflow-x:hidden;\n    -webkit-font-smoothing: antialiased;\n}";
const ANCHOR_SECTION_TAG = ".section-tag{\n    font-size:10px;\n    letter-spacing:4px;\n    text-transform:uppercase;\n    color:#777;\n    margin-bottom:15px;\n    font-weight:500;\n}";
const ANCHOR_STYLE_CLOSE = '</style>';

const anchors = [
    { name: 'ANCHOR_FONTS_LINK', value: ANCHOR_FONTS_LINK },
    { name: 'ANCHOR_BODY_RULE', value: ANCHOR_BODY_RULE },
    { name: 'ANCHOR_SECTION_TAG', value: ANCHOR_SECTION_TAG },
    { name: 'ANCHOR_STYLE_CLOSE', value: ANCHOR_STYLE_CLOSE }
];

for (let i = 0; i < anchors.length; i++) {
    if (content.indexOf(anchors[i].value) === -1) {
        console.error('Error: Unique anchor not found: ' + anchors[i].name + '. Aborting without writing.');
        process.exit(1);
    }
}

// Create index.backup.html if it does not already exist
if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, raw, 'utf8');
    console.log('Saved backup to index.backup.html');
}

// 1. Replace Google Fonts <link> (remove IBM Plex Sans, load Cardo 400;700 + Inter 400;500;600)
const NEW_FONTS_LINK = [
'<!-- Option par defaut : Cardo (titres) + Inter (texte) -->',
'<!-- Variante B : family=Manrope:wght@700;800&family=Inter:wght@400;500;600 -->',
'<!-- Variante C : family=DM+Serif+Display&family=Inter:wght@400;500;600 -->',
'<link href="https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">'
].join('\n');

let updated = content.replace(ANCHOR_FONTS_LINK, NEW_FONTS_LINK);

// 2. Replace body rule to use var(--font-body) and optimizeLegibility
const NEW_BODY_RULE = [
'body{',
'    font-family:var(--font-body);',
'    font-size:var(--fs-body);',
'    line-height:1.7;',
'    font-weight:400;',
'    background:#F9F7F2;',
'    color:#222;',
'    overflow-x:hidden;',
'    -webkit-font-smoothing: antialiased;',
'    text-rendering: optimizeLegibility;',
'}'
].join('\n');

updated = updated.replace(ANCHOR_BODY_RULE, NEW_BODY_RULE);

// 3. Replace .section-tag
const NEW_SECTION_TAG = [
'.section-tag{',
'    font-family:var(--font-body);',
'    font-size:var(--fs-label);',
'    letter-spacing:0.12em;',
'    text-transform:uppercase;',
'    color:#a70c39;',
'    margin-bottom:14px;',
'    font-weight:600;',
'}'
].join('\n');

updated = updated.replace(ANCHOR_SECTION_TAG, NEW_SECTION_TAG);

// 4. Remove hardcoded font-family declarations inside <style> and replace with variables
const styleStart = updated.indexOf('<style>');
const styleEnd = updated.indexOf('</style>');
let styleBlock = updated.slice(styleStart, styleEnd);

styleBlock = styleBlock
    .replace(/font-family:\s*'IBM Plex Sans'[^;]*;/g, 'font-family: var(--font-body);')
    .replace(/font-family:\s*"IBM Plex Sans"[^;]*;/g, 'font-family: var(--font-heading);')
    .replace(/font-family:\s*'Inter'[^;]*;/g, 'font-family: var(--font-body);')
    .replace(/font-family:\s*"Inter"[^;]*;/g, 'font-family: var(--font-body);');

updated = updated.slice(0, styleStart) + styleBlock + updated.slice(styleEnd);

// 5. Clean up inline typography styles in #services and #studio so CSS rules govern them cleanly
updated = updated
    .replace('<h3 style="font-size: 22px; font-weight: 500; margin-bottom: 8px;">How It Works</h3>', '<h3 class="subsection-heading">How It Works</h3>')
    .replace('<h3 style="font-size: 22px; font-weight: 500; margin-bottom: 18px;">Frequently Asked Questions</h3>', '<h3 class="subsection-heading">Frequently Asked Questions</h3>')
    .replace('<h3 style="font-size: 26px; font-weight: 600; margin-bottom: 6px; color: #111;">Nathan Bawa</h3>', '<h3>Nathan Bawa</h3>')
    .replace('<p style="font-size: 14px; color: #666; margin-bottom: 14px;">Founder &amp; 3D Artist — Toronto, Ontario</p>', '<p class="studio-bio__role">Founder &amp; 3D Artist — Toronto, Ontario</p>')
    .replace('<p style="font-size: 16px; line-height: 1.75; color: #333; max-width: 720px;">Nathan Bawa focuses on helping interior designers, architects, and developers communicate spaces emotionally before construction begins.</p>', '<p class="studio-bio__desc">Nathan Bawa focuses on helping interior designers, architects, and developers communicate spaces emotionally before construction begins.</p>');

// 6. Comprehensive Typography System Block appended right before </style>
const TYPOGRAPHY_SYSTEM_CSS = [
'',
'/* === PATCH-TYPOGRAPHY-CARDO-INTER === */',
':root {',
'    /* Familles de polices (modifier uniquement --font-heading pour changer de variante) */',
'    /* Option par defaut : Cardo (titres) + Inter (texte) */',
'    /* Variante B : "Manrope", system-ui, -apple-system, sans-serif */',
'    /* Variante C : "DM Serif Display", Georgia, serif */',
'    --font-heading: "Cardo", Georgia, serif;',
'    --font-body: "Inter", system-ui, -apple-system, sans-serif;',
'',
'    /* Echelle typographique stricte */',
'    --fs-h1: clamp(2.8rem, 6vw, 5rem);',
'    --fs-h2: clamp(2rem, 4vw, 3rem);',
'    --fs-h3: clamp(1.375rem, 2vw, 1.625rem); /* 22px a 26px */',
'    --fs-lead: clamp(1.125rem, 1.3vw, 1.25rem); /* 18px a 20px (Paragraphe taille 1 : intro) */',
'    --fs-body: 1.0625rem; /* 17px (Paragraphe taille 2 : courant) */',
'    --fs-secondary: 1rem; /* 16px (Paragraphe taille 3 : secondaire) */',
'    --fs-label: 0.78125rem; /* 12.5px (12 a 13px : etiquettes, boutons, nav, footer) */',
'}',
'',
'/* H1 : Cardo 700, clamp(2.8rem, 6vw, 5rem), line-height 1.05, letter-spacing -0.01em, #111 */',
'h1,',
'.split-hero__headline,',
'.hero-text h1 {',
'    font-family: var(--font-heading);',
'    font-weight: 700;',
'    font-size: var(--fs-h1);',
'    line-height: 1.05;',
'    letter-spacing: -0.01em;',
'    color: #111;',
'}',
'',
'/* H2 : Cardo 700, clamp(2rem, 4vw, 3rem), line-height 1.1, sans letter-spacing negatif serre, #111 */',
'h2,',
'.section-title,',
'.about-text-centered h2,',
'.pm-title {',
'    font-family: var(--font-heading);',
'    font-weight: 700;',
'    font-size: var(--fs-h2);',
'    line-height: 1.1;',
'    letter-spacing: 0;',
'    color: #111;',
'}',
'',
'/* H3 : Cardo 700, 22 a 26px, line-height 1.2, #111 */',
'h3,',
'.project-content h3,',
'.profile-centered h3,',
'.service-card h3,',
'.studio-award-detail h3,',
'.studio-bio h3,',
'.subsection-heading {',
'    font-family: var(--font-heading);',
'    font-weight: 700;',
'    font-size: var(--fs-h3);',
'    line-height: 1.2;',
'    letter-spacing: 0;',
'    color: #111;',
'}',
'.subsection-heading {',
'    margin-bottom: 14px;',
'}',
'',
'/* Sous-titre / Texte d introduction : Inter 400, 18 a 20px, line-height 1.65, #444 */',
'.split-hero__desc,',
'.intro-content p {',
'    font-family: var(--font-body);',
'    font-weight: 400;',
'    font-size: var(--fs-lead);',
'    line-height: 1.65;',
'    color: #444;',
'    max-width: 62ch;',
'}',
'',
'/* Paragraphe courant : Inter 400, 16 a 17px, line-height 1.7, #222 */',
'.project-content p,',
'.about-text-centered p,',
'.profile-centered p,',
'.pm-subtitle,',
'.pm-story__block p,',
'.service-card__row,',
'.how-step p,',
'.needs-list,',
'.faq-answer,',
'.studio-bio__desc,',
'.studio-award-detail p,',
'.testimonial-card p {',
'    font-family: var(--font-body);',
'    font-weight: 400;',
'    font-size: var(--fs-body);',
'    line-height: 1.7;',
'    color: #222;',
'    max-width: 62ch;',
'}',
'',
'.studio-bio__role,',
'.profile-centered p {',
'    font-family: var(--font-body);',
'    font-weight: 400;',
'    font-size: var(--fs-secondary);',
'    line-height: 1.6;',
'    color: #444;',
'    margin-bottom: 12px;',
'}',
'',
'.pm-fact__value,',
'.how-step__title,',
'.faq-question {',
'    font-family: var(--font-body);',
'    font-size: var(--fs-secondary);',
'    font-weight: 600;',
'    line-height: 1.5;',
'    color: #111;',
'}',
'',
'/* Etiquettes de section : Inter 600, 12 a 13px, majuscules, letter-spacing 0.12em, #a70c39 */',
'.section-tag,',
'.split-hero__eyebrow,',
'.how-step__num {',
'    font-family: var(--font-body);',
'    font-weight: 600;',
'    font-size: var(--fs-label);',
'    text-transform: uppercase;',
'    letter-spacing: 0.12em;',
'    color: #a70c39;',
'}',
'',
'/* Legendes et etiquettes secondaires : Inter 600, 12 a 13px, majuscules, letter-spacing 0.12em, #444 */',
'.split-hero__caption,',
'.pm-fact__label,',
'.pm-story__block h4,',
'.service-card__label,',
'.needs-box h4,',
'.contact-form label,',
'.award-strip__inner,',
'.award-strip__link,',
'.pm-topbar__title,',
'.logo-placeholder {',
'    font-family: var(--font-body);',
'    font-weight: 600;',
'    font-size: var(--fs-label);',
'    text-transform: uppercase;',
'    letter-spacing: 0.12em;',
'    color: #444;',
'}',
'',
'/* Boutons : Inter 600, 12 a 13px, majuscules, letter-spacing 0.1em */',
'.quick-btn,',
'.split-hero__btn,',
'.badge-360,',
'.filter-btn,',
'.pm-close-btn,',
'.pm-tab,',
'.project-card__badge,',
'.hero-scroll-btn {',
'    font-family: var(--font-body);',
'    font-weight: 600;',
'    font-size: var(--fs-label);',
'    text-transform: uppercase;',
'    letter-spacing: 0.1em;',
'}',
'.filter-btn {',
'    color: #444;',
'}',
'',
'/* Logo texte et Footer : Inter 600, 12 a 13px, majuscules, letter-spacing 0.1em, footer en #555 */',
'.logo-text {',
'    font-family: var(--font-body);',
'    font-weight: 600;',
'    font-size: var(--fs-label);',
'    text-transform: uppercase;',
'    letter-spacing: 0.1em;',
'    color: #111;',
'}',
'footer {',
'    font-family: var(--font-body);',
'    font-weight: 600;',
'    font-size: var(--fs-label);',
'    text-transform: uppercase;',
'    letter-spacing: 0.1em;',
'    color: #555;',
'}',
'',
'/* Texte de l overlay 360 ("Drag to rotate", "Loading") et badges sur media sombre : Inter 500, 12 a 13px, letter-spacing 0.1em */',
'#vr-loading,',
'.prompt-text,',
'.pm-counter,',
'.ba-slider__label {',
'    font-family: var(--font-body);',
'    font-weight: 500;',
'    font-size: var(--fs-label);',
'    text-transform: uppercase;',
'    letter-spacing: 0.1em;',
'    color: #fff;',
'}',
'',
'/* Champs de formulaire */',
'.contact-form input,',
'.contact-form select,',
'.contact-form textarea {',
'    font-family: var(--font-body);',
'    font-size: var(--fs-secondary);',
'    color: #111;',
'}',
'',
'/* Responsive mobile (< 900px et < 640px) : aucun paragraphe sous 16px, aucune etiquette sous 12px */',
'@media (max-width: 900px) {',
'    :root {',
'        --fs-h1: clamp(2.4rem, 7vw, 3.6rem);',
'        --fs-h2: clamp(1.85rem, 5vw, 2.5rem);',
'        --fs-h3: clamp(1.375rem, 3.5vw, 1.5rem);',
'        --fs-body: 1rem; /* 16px minimum */',
'    }',
'}',
'@media (max-width: 640px) {',
'    :root {',
'        --fs-h1: clamp(2.25rem, 9vw, 3rem);',
'        --fs-h2: clamp(1.75rem, 6.5vw, 2.25rem);',
'        --fs-body: 1rem; /* 16px minimum */',
'        --fs-label: 0.75rem; /* 12px minimum */',
'    }',
'    .quick-btn {',
'        font-size: var(--fs-label);',
'        letter-spacing: 0.08em;',
'    }',
'}'
].join('\n');

updated = updated.replace(ANCHOR_STYLE_CLOSE, TYPOGRAPHY_SYSTEM_CSS + '\n' + ANCHOR_STYLE_CLOSE);

fs.writeFileSync(indexPath, updated, 'utf8');
console.log('Successfully applied typography system to index.html!');
