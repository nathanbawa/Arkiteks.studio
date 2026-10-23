const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const backupPath = path.join(__dirname, 'index.backup.html');

if (!fs.existsSync(indexPath)) {
    console.error('Error: index.html not found.');
    process.exit(1);
}

const raw = fs.readFileSync(indexPath, 'utf8');

// Idempotency guard: do not apply twice
if (raw.indexOf('/* === PATCH-NO-RED-AND-AWARD === */') !== -1 || raw.indexOf('Entrepreneurial Skills Passport') !== -1) {
    console.log('patch.js has already been applied. Skipping.');
    process.exit(0);
}

const content = raw.replace(/\r\n/g, '\n');

// Verify unique anchors before modifying anything
const ANCHOR_QUICK_BTN = '--hover-bg: #a70c39;';
const ANCHOR_QUICK_ACTIVE = '.quick-btn.active {\n    background: red;\n    color: #fff;\n    border-color: red;\n}';
const ANCHOR_HERO_VAR = '--hero-accent-hover: #a70c39;';
const ANCHOR_TODO = '.todo {\n    color: #a70c39 !important;\n    font-weight: 500;\n}';
const ANCHOR_AWARD_HTML = [
'<!-- AWARD STRIP (SHORT VERSION UNDER HERO) -->',
'<div class="award-strip">',
'    <div class="award-strip__inner">',
'        <div class="award-strip__badge">',
'            <span class="award-strip__dot"></span>',
'            <span>Award Recognition: <span class="todo">[Competition Name — Year]</span></span>',
'        </div>',
'        <a href="#studio" class="award-strip__link">Read Award Details &#8594;</a>',
'    </div>',
'</div>'
].join('\n');
const ANCHOR_STYLE_CLOSE = '</style>';

const anchors = [
    { name: 'ANCHOR_QUICK_BTN', value: ANCHOR_QUICK_BTN },
    { name: 'ANCHOR_QUICK_ACTIVE', value: ANCHOR_QUICK_ACTIVE },
    { name: 'ANCHOR_HERO_VAR', value: ANCHOR_HERO_VAR },
    { name: 'ANCHOR_TODO', value: ANCHOR_TODO },
    { name: 'ANCHOR_AWARD_HTML', value: ANCHOR_AWARD_HTML },
    { name: 'ANCHOR_STYLE_CLOSE', value: ANCHOR_STYLE_CLOSE }
];

for (let i = 0; i < anchors.length; i++) {
    if (content.indexOf(anchors[i].value) === -1) {
        console.error('Error: Unique anchor not found: ' + anchors[i].name + '. Aborting without writing.');
        process.exit(1);
    }
}

// Create backup if it doesn't exist yet
if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, raw, 'utf8');
    console.log('Saved backup to index.backup.html');
}

let updated = content;

// 1. Replace all red colors in CSS with neutral tones (#3a3a3a, #111, #555, #666)
updated = updated
    .replace(
        '.section-tag{\n    font-family:var(--font-body);\n    font-size:var(--fs-label);\n    letter-spacing:0.12em;\n    text-transform:uppercase;\n    color:#a70c39;\n    margin-bottom:14px;\n    font-weight:600;\n}',
        '.section-tag{\n    font-family:var(--font-body);\n    font-size:var(--fs-label);\n    letter-spacing:0.12em;\n    text-transform:uppercase;\n    color:#555;\n    margin-bottom:14px;\n    font-weight:600;\n}'
    )
    .replace(ANCHOR_QUICK_BTN, '--hover-bg: #3a3a3a;')
    .replace(
        ANCHOR_QUICK_ACTIVE,
        '.quick-btn.active {\n    background: #ffffff;\n    color: #111111;\n    border: 1px solid #111111;\n}'
    )
    .replace(ANCHOR_HERO_VAR, '--hero-accent-hover: #3a3a3a;')
    .replace(
        ANCHOR_TODO,
        '.todo {\n    color: #666666 !important;\n    font-style: italic;\n    font-weight: 400;\n}'
    )
    .replace(
        '.award-strip__dot {\n    width: 7px;\n    height: 7px;\n    background: #a70c39;\n    display: inline-block;\n}',
        '.award-strip__dot {\n    width: 7px;\n    height: 7px;\n    background: #111;\n    display: inline-block;\n}'
    )
    .replace(
        '.award-strip__link:hover {\n    color: #a70c39;\n    border-color: #a70c39;\n}',
        '.award-strip__link:hover {\n    color: #3a3a3a;\n    border-color: #3a3a3a;\n}'
    )
    .replace(
        '.filter-btn.is-active {\n    color: #a70c39;\n    border-bottom-color: #a70c39;\n    font-weight: 600;\n}',
        '.filter-btn.is-active {\n    color: #111111;\n    border-bottom-color: #111111;\n    font-weight: 600;\n}'
    )
    .replace(
        '.project-card:hover .project-card__badge {\n    background: #a70c39;\n}',
        '.project-card:hover .project-card__badge {\n    background: #3a3a3a;\n}'
    )
    .replace(
        '.pm-close-btn:hover {\n    background: #a70c39;\n    border-color: #a70c39;\n    transform: translate(-0.15rem, -0.15rem);\n    box-shadow: 0.15rem 0.15rem #000;\n}',
        '.pm-close-btn:hover {\n    background: #3a3a3a;\n    border-color: #3a3a3a;\n    transform: translate(-0.15rem, -0.15rem);\n    box-shadow: 0.15rem 0.15rem #000;\n}'
    )
    .replace(
        '.pm-arrow:hover {\n    background: #a70c39;\n}',
        '.pm-arrow:hover {\n    background: #3a3a3a;\n}'
    )
    .replace(
        '.pm-thumb.is-active, .pm-thumb:hover {\n    opacity: 1;\n    border-color: #a70c39;\n}',
        '.pm-thumb.is-active, .pm-thumb:hover {\n    opacity: 1;\n    border-color: #111111;\n}'
    )
    .replace(
        '/* Etiquettes de section : Inter 600, 12 a 13px, majuscules, letter-spacing 0.12em, #a70c39 */\n.section-tag,\n.split-hero__eyebrow,\n.how-step__num {\n    font-family: var(--font-body);\n    font-weight: 600;\n    font-size: var(--fs-label);\n    text-transform: uppercase;\n    letter-spacing: 0.12em;\n    color: #a70c39;\n}',
        '/* Etiquettes de section : Inter 600, 12 a 13px, majuscules, letter-spacing 0.12em, #555 */\n.section-tag,\n.split-hero__eyebrow,\n.how-step__num {\n    font-family: var(--font-body);\n    font-weight: 600;\n    font-size: var(--fs-label);\n    text-transform: uppercase;\n    letter-spacing: 0.12em;\n    color: #555;\n}'
    );

// 2. Add CSS for the rebuilt #award section right before </style>
const AWARD_CSS = [
'',
'/* === PATCH-NO-RED-AND-AWARD === */',
'#award.award-strip {',
'    width: 100%;',
'    background: #F2EFE7;',
'    border-top: 1px solid rgba(0, 0, 0, 0.08);',
'    border-bottom: 1px solid rgba(0, 0, 0, 0.08);',
'    padding: 32px 0;',
'}',
'#award .award-strip__container {',
'    width: 94%;',
'    max-width: 1800px;',
'    margin: 0 auto;',
'    display: flex;',
'    flex-direction: column;',
'    align-items: flex-start;',
'    gap: 14px;',
'}',
'#award .section-tag {',
'    margin-bottom: 0;',
'    color: #555;',
'}',
'.award-list {',
'    display: flex;',
'    flex-direction: column;',
'    gap: 24px;',
'    width: 100%;',
'}',
'.award-item {',
'    display: inline-flex;',
'    align-items: center;',
'    justify-content: flex-start;',
'    gap: clamp(16px, 2.5vw, 32px);',
'    flex-wrap: nowrap;',
'    max-width: 100%;',
'}',
'.award-item__text {',
'    display: flex;',
'    flex-direction: column;',
'    gap: 6px;',
'    min-width: 0;',
'}',
'.award-item__title {',
'    font-family: var(--font-heading);',
'    font-size: clamp(20px, 2.4vw, 30px);',
'    font-weight: 700;',
'    line-height: 1.15;',
'    color: #111;',
'    margin: 0;',
'}',
'.award-item__desc {',
'    font-family: var(--font-body);',
'    font-size: var(--fs-secondary);',
'    line-height: 1.55;',
'    color: #666;',
'    font-style: italic;',
'    margin: 0;',
'}',
'.award-item__circle {',
'    width: 88px;',
'    height: 88px;',
'    flex: 0 0 88px;',
'    border-radius: 50%;',
'    border: 1px solid #ccc;',
'    background: #ffffff;',
'    overflow: hidden;',
'    position: relative;',
'    display: flex;',
'    align-items: center;',
'    justify-content: center;',
'}',
'.award-item__img {',
'    width: 100%;',
'    height: 100%;',
'    object-fit: cover;',
'    display: block;',
'    position: relative;',
'    z-index: 2;',
'}',
'.award-item__fallback {',
'    position: absolute;',
'    z-index: 1;',
'    font-family: var(--font-body);',
'    font-size: 11px;',
'    font-weight: 600;',
'    letter-spacing: 0.1em;',
'    text-transform: uppercase;',
'    color: #666;',
'    pointer-events: none;',
'}',
'@media (max-width: 640px) {',
'    .award-item__circle {',
'        width: 68px;',
'        height: 68px;',
'        flex: 0 0 68px;',
'    }',
'}'
].join('\n');

updated = updated.replace(ANCHOR_STYLE_CLOSE, AWARD_CSS + '\n' + ANCHOR_STYLE_CLOSE);

// 3. Replace the Award strip HTML with the rebuilt #award section
const NEW_AWARD_HTML = [
'<!-- SECTION AWARD & RECOGNITION (SOUS LE HERO) -->',
'<section class="award-strip" id="award">',
'    <div class="award-strip__container">',
'        <div class="section-tag">Award &amp; Recognition</div>',
'        <div class="award-list">',
'            <!-- Copier ce bloc .award-item pour ajouter un autre prix plus tard -->',
'            <div class="award-item">',
'                <div class="award-item__text">',
'                    <h3 class="award-item__title">Entrepreneurial Skills Passport</h3>',
'                    <p class="award-item__desc todo">[Short line: what it is, the year, and what Arkiteks Studio achieved.]</p>',
'                </div>',
'                <div class="award-item__circle">',
'                    <!-- Changer le nom du fichier image de Genial ici (ex: images/genial.png) -->',
'                    <img src="images/genial.png" alt="Génial" class="award-item__img" onerror="this.style.display=\'none\';">',
'                    <span class="award-item__fallback">Logo</span>',
'                </div>',
'            </div>',
'            <!-- Fin du bloc .award-item reutilisable -->',
'        </div>',
'    </div>',
'</section>'
].join('\n');

updated = updated.replace(ANCHOR_AWARD_HTML, NEW_AWARD_HTML);

fs.writeFileSync(indexPath, updated, 'utf8');
console.log('Successfully applied patch.js to index.html!');
