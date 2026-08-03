#!/usr/bin/env python3
"""Generate the Take One Visuals city landing pages.

One generator, two outputs, so shared chrome (nav / hero / reviews / CTA / footer)
can never drift between pages. Page-specific copy, venues, FAQs and film picks
live in the PAGES list at the bottom.
"""

import json
from urllib.parse import quote

SITE = "https://takeonevisuals.com"

# ---------------------------------------------------------------- film catalog
# yt id, display name, thumbnail stem, location label
FILMS = {
    "moriah-dane":     ("v3-MCgglKNg", "Moriah & Dane",     "Moriah & Dane",     "Clayton, WA"),
    "matt-alisia":     ("Kic7gRvoORU", "Matt & Alisia",     "Matt & Alisia",     "Spokane Valley, WA"),
    "seth-kylie":      ("QStccYBPTzQ", "Seth & Kylie",      "Seth & Kylie",      "Inland Northwest"),
    "brie-jeff":       ("DD-6arIteLc", "Brie & Jeff",       "Brie & Jeff",       "Colbert, WA"),
    "caleb-brianna":   ("H8bcZ1lSn34", "Caleb & Brianna",   "Caleb & Brianna",   "Deer Park, WA"),
    "alexa-jacob":     ("gFQUCnzsDJc", "Alexa & Jacob",     "Alexa & Jacob",     "Spokane, WA"),
    "gabby-robert":    ("OmcgvnItjRI", "Gabby & Robert",    "Gabby & Robert",    "Inland Northwest"),
    "devin-violet":    ("ZmiIU0AQfr8", "Devin & Violet",    "Devin & Violet",    "Coeur d'Alene, ID"),
    "reanna-brandon":  ("cc-6QVl4cFo", "Reanna & Brandon",  "Reanna & Brandon",  "Rathdrum, ID"),
    "ia-jared":        ("DqUxlTk3iJE", "Ia & Jared",        "Ia & Jared",        "Elk, WA"),
    "kelsie-davidson": ("QqT3lu_GqXE", "Kelsie & Davidson", "Kelsie & Davidson", "Inland Northwest"),
    "allie-alan":      ("JcW3eNwjRls", "Allie & Alan",      "Allie & Alan",      "Spokane, WA"),
}

LOCATIONS = [
    ("spokane-wedding-videographer.html", "Spokane"),
    ("coeur-dalene-wedding-videographer.html", "Coeur d'Alene"),
]


def esc(s):
    return s.replace("&", "&amp;")


def film_card(key):
    yt, name, stem, loc = FILMS[key]
    enc = quote(stem)
    return f"""      <article class="film reveal" data-yt="{yt}">
        <div class="film-frame">
          <picture>
            <source srcset="thumbnails-yt-picks/{enc}.webp" type="image/webp" />
            <img src="thumbnails-yt-picks/{enc}.jpg" alt="{esc(name)} wedding film thumbnail — {esc(loc)}" loading="lazy" />
          </picture>
          <div class="play-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
        <div class="film-meta">
          <h3>{esc(name)}</h3>
          <span class="location">{esc(loc)}</span>
        </div>
      </article>"""


def location_nav(active_file):
    links = []
    for href, label in LOCATIONS:
        cls = ' class="active"' if href == active_file else ""
        links.append(f'  <a href="{href}"{cls}>{esc(label)}</a>')
    return (
        '<nav class="location-links" aria-label="Nearby service areas">\n'
        + "\n".join(links)
        + "\n</nav>"
    )


def faq_schema(faqs):
    doc = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in faqs
        ],
    }
    body = json.dumps(doc, indent=2, ensure_ascii=False)
    return f'<script type="application/ld+json">\n{body}\n</script>'


def faq_html(faqs):
    out = []
    for q, a in faqs:
        out.append(
            f"""    <div class="faq-item">
      <h3>{esc(q)}</h3>
      <p>{esc(a)}</p>
    </div>"""
        )
    return "\n".join(out)


def venue_html(venues):
    lis = "\n".join(
        f"      <li><strong>{esc(n)}</strong><span>{esc(c)}</span></li>" for n, c in venues
    )
    return f'    <ul class="venue-list">\n{lis}\n    </ul>'


def build(p):
    f = p["file"]
    url = f"{SITE}/{f}"
    faqs = p["faqs"]

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{p['title']}</title>
<meta name="description" content="{p['meta_desc']}" />

<!-- Canonical -->
<link rel="canonical" href="{url}" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Take One Visuals" />
<meta property="og:title" content="{p['title']}" />
<meta property="og:description" content="{p['og_desc']}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{SITE}/images/inland-northwest-wedding-film.jpeg" />
<meta property="og:image:alt" content="A wedding film still by Take One Visuals — {esc(p['city'])}" />
<meta property="og:locale" content="en_US" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{p['title']}" />
<meta name="twitter:description" content="{p['og_desc']}" />
<meta name="twitter:image" content="{SITE}/images/inland-northwest-wedding-film.jpeg" />

<!-- Structured data: Service for this location -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Wedding Videography",
  "name": "{p['service_name']}",
  "description": "{p['service_desc']}",
  "provider": {{ "@id": "{SITE}/#business" }},
  "areaServed": {{ "@type": "City", "name": "{esc(p['city'])}", "containedInPlace": {{ "@type": "State", "name": "{p['state']}" }} }},
  "audience": {{ "@type": "Audience", "audienceType": "Engaged couples" }},
  "offers": [
    {{ "@type": "Offer", "name": "Ceremony", "price": "1000", "priceCurrency": "USD", "description": "Up to 2 hours. Full uncut ceremony video." }},
    {{ "@type": "Offer", "name": "Ceremony & Reception", "price": "1400", "priceCurrency": "USD", "description": "Up to 5 hours. Highlight film, uncut first dances and speeches, drone." }},
    {{ "@type": "Offer", "name": "Full Day", "price": "2000", "priceCurrency": "USD", "description": "Up to 10 hours. Getting-ready through last dance, extended highlight film." }}
  ]
}}
</script>

<!-- Structured data: breadcrumb -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{ "@type": "ListItem", "position": 1, "name": "Home", "item": "{SITE}/" }},
    {{ "@type": "ListItem", "position": 2, "name": "{esc(p['crumb'])}", "item": "{url}" }}
  ]
}}
</script>

<!-- Structured data: FAQ -->
{faq_schema(faqs)}

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />

<!-- Hero poster paints first while the video loads -->
<link rel="preload" as="image" href="videos/hero-poster.jpg" fetchpriority="high" />

<link rel="stylesheet" href="styles.css" />
</head>
<body>

<!-- ─── Nav ────────────────────────────────────────────── -->
<nav class="nav" id="nav">
  <a href="index.html" class="wordmark">Take One Visuals</a>
  <div class="nav-links">
    <a href="films.html">Films</a>
    <a href="index.html#about">About</a>
    <a href="index.html#reviews">Reviews</a>
    <a href="index.html#experience">Experience</a>
    <a href="index.html#inquire">Inquire</a>
  </div>
</nav>

<!-- ─── Hero ───────────────────────────────────────────── -->
<header class="hero">
  <!-- src set by the inline script below: media queries on <video><source> are ignored by browsers -->
  <video class="hero-media" autoplay muted loop playsinline preload="auto" poster="videos/hero-poster.jpg"
         data-src-desktop="videos/hero.mp4" data-src-mobile="videos/hero-mobile.mp4"></video>
  <script>
    (function () {{
      var v = document.querySelector('.hero-media');
      v.src = window.matchMedia('(max-width: 720px)').matches ? v.dataset.srcMobile : v.dataset.srcDesktop;
    }})();
  </script>
  <div class="hero-overlay"></div>
  <div class="hero-inner">
    <h1>{esc(p['h1'])}</h1>
  </div>
  <div class="hero-scroll">Scroll</div>
</header>

<!-- ─── Page intro ─────────────────────────────────────── -->
<section class="intro">
  <div class="container reveal">
    <p class="intro-positioning">{esc(p['intro'])}</p>
  </div>
</section>

{location_nav(f)}

<!-- ─── Copy ───────────────────────────────────────────── -->
<section class="page-copy">
  <div class="container reveal">
{p['body']}
  </div>
</section>

<!-- ─── City-specific films ────────────────────────────── -->
<section class="films" id="films">
  <div class="container reveal">
    <p class="eyebrow">{esc(p['films_eyebrow'])}</p>
    <div class="films-grid">
{chr(10).join(film_card(k) for k in p['films'])}
    </div>
    <p class="films-link"><a href="films.html">See every film →</a></p>
  </div>
</section>

<!-- ─── FAQ ────────────────────────────────────────────── -->
<section class="page-copy faq" id="faq">
  <div class="container reveal">
    <h2>{esc(p['faq_heading'])}</h2>
{faq_html(faqs)}
  </div>
</section>

<!-- ─── Reviews ────────────────────────────────────────── -->
<section class="reviews" id="reviews">
  <div class="container reveal">
    <p class="eyebrow">Kind Words</p>
    <div class="review-carousel" id="reviewCarousel" aria-roledescription="carousel" aria-label="Client reviews">
      <button class="carousel-arrow prev" id="carouselPrev" aria-label="Previous review">&#x2039;</button>
      <button class="carousel-arrow next" id="carouselNext" aria-label="Next review">&#x203A;</button>
      <blockquote class="review-slide active" aria-roledescription="slide">
        <p>I can't count how many times I've watched our video, but I cry every time. My family and friends say it's the most beautiful wedding video they've ever seen. I will cherish it forever.</p>
        <cite>Matt &amp; Alisia &nbsp;·&nbsp; Spokane Valley, WA</cite>
      </blockquote>
      <blockquote class="review-slide" aria-roledescription="slide">
        <p>Luke was absolutely wonderful to work with. Prompt, knew exactly where to be and when, and made sure to capture everything just how I wanted. We were able to have a same-day viewing of our wedding video.</p>
        <cite>Brianna &nbsp;·&nbsp; Deer Park, WA</cite>
      </blockquote>
      <blockquote class="review-slide" aria-roledescription="slide">
        <p>Cannot overstate how happy Luke made my husband and I on our wedding day. His professionalism and friendly demeanor made him the perfect videographer to capture the best day of our lives.</p>
        <cite>Moriah &nbsp;·&nbsp; Clayton, WA</cite>
      </blockquote>
      <blockquote class="review-slide" aria-roledescription="slide">
        <p>The editing blew our minds &mdash; the way he timed each shot with the most important songs, and the way he transitioned the music. His high quality and well-educated taste really showed.</p>
        <cite>Abbi</cite>
      </blockquote>
    </div>
    <div class="carousel-dots" id="carouselDots" role="tablist" aria-label="Choose review">
      <button class="carousel-dot active" data-slide="0" aria-label="Review 1"></button>
      <button class="carousel-dot" data-slide="1" aria-label="Review 2"></button>
      <button class="carousel-dot" data-slide="2" aria-label="Review 3"></button>
      <button class="carousel-dot" data-slide="3" aria-label="Review 4"></button>
    </div>
    <div class="reviews-google">
      <span class="reviews-google-stars">★★★★★ &nbsp;5.0 &middot; 14 reviews</span>
      <a href="https://www.google.com/search?q=luke+hegelund#mpd=~3154942165560091791/customers/reviews" class="reviews-google-link" target="_blank" rel="noopener">Read all on Google →</a>
    </div>
  </div>
</section>

<!-- ─── Final CTA ──────────────────────────────────────── -->
<section class="cta" id="inquire">
  <div class="container reveal">
    <p class="eyebrow">Begin</p>
    <h2>{esc(p['cta_heading'])}</h2>
    <p>{esc(p['cta_copy'])}</p>
    <p class="cta-contact">
      <a href="tel:+14255245565">(425) 524-5565</a>
      <span aria-hidden="true">·</span>
      <a href="mailto:luke@takeonevisuals.com">luke@takeonevisuals.com</a>
    </p>
    <div class="inquiry-form-wrap">
      <div class="hb-p-69bf22995cc4520007e98898-1"></div>
    </div>
  </div>
</section>

<!-- ─── Footer ─────────────────────────────────────────── -->
<footer>
  <div class="container">
    <div class="footer-wordmark">Take One Visuals</div>
    <div class="footer-rating">★★★★★ &nbsp;5.0 on Google</div>
    <div class="footer-links">
      <a href="films.html">Films</a>
      <a href="index.html#about">About</a>
      <a href="index.html#experience">Experience</a>
      <a href="index.html#inquire">Inquire</a>
      <a href="https://instagram.com/takeonevisuals" target="_blank" rel="noopener">Instagram</a>
    </div>
    <div class="footer-nap">
      Based in Post Falls, Idaho &nbsp;·&nbsp;
      <a href="tel:+14255245565">(425) 524-5565</a> &nbsp;·&nbsp;
      <a href="mailto:luke@takeonevisuals.com">luke@takeonevisuals.com</a>
    </div>
    <div class="footer-area">Spokane &middot; Coeur d'Alene &middot; the Inland Northwest</div>
    <div class="footer-copy">© Take One Visuals · Wedding films by Luke Hegelund</div>
  </div>
</footer>

<!-- ─── YouTube modal ──────────────────── -->
<div class="yt-modal" id="ytModal" role="dialog" aria-modal="true" aria-label="Wedding film player">
  <div class="yt-modal-frame">
    <button class="yt-close" id="ytClose" aria-label="Close player">Close ✕</button>
    <iframe id="ytIframe" title="Wedding film" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
  </div>
</div>

<script src="site.js"></script>

<!-- ─── Honeybook contact form loader ──────────────────── -->
<img height="1" width="1" style="display:none" src="https://www.honeybook.com/p.png?pid=69bf22995cc4520007e98898" alt="" />
<script>
  (function(h,b,s,n,i,p,e,t) {{
    h._HB_ = h._HB_ || {{}};h._HB_.pid = i;
    t=b.createElement(s);t.type="text/javascript";t.async=!0;t.src=n;
    e=b.getElementsByTagName(s)[0];e.parentNode.insertBefore(t,e);
  }})(window,document,"script","https://widget.honeybook.com/assets_users_production/websiteplacements/placement-controller.min.js","69bf22995cc4520007e98898");
</script>

</body>
</html>
"""


# ================================================================== PAGE CONTENT

SPOKANE_VENUES = [
    ("Manito Park", "Spokane"),
    ("The Glasshouse On Monroe", "Colbert"),
    ("Saltese Uplands", "Spokane Valley"),
    ("The Wild Rabbit", "Clayton"),
    ("Belle Gardens", "Deer Park"),
    ("Camden Ranch", "Elk"),
]

CDA_VENUES = [
    ("Twinlow Camp & Conference Center", "Rathdrum"),
    ("The Blackwell Boutique Hotel", "Coeur d'Alene"),
    ("St. Thomas Catholic Church", "Coeur d'Alene"),
    ("Settlers Creek", "Coeur d'Alene"),
]

PRICING_BLOCK = """    <h2>What a wedding film costs</h2>
    <p>Three packages, no hidden line items. Every one is filmed and edited by me — you are not handing your day to an associate shooter you have never met.</p>
    <ul>
      <li><strong>Ceremony — $1,000.</strong> Up to 2 hours. The full ceremony, uncut, with clean audio from the vows.</li>
      <li><strong>Ceremony &amp; Reception — $1,400.</strong> Up to 5 hours. A 2–5 minute highlight film, first dances and speeches uncut, drone when weather allows.</li>
      <li><strong>Full Day — $2,000.</strong> Up to 10 hours. Getting ready through the last dance, plus a 5–10 minute film.</li>
      <li><strong>Raw footage — add $200.</strong> Every unedited clip from the day.</li>
    </ul>"""

SPOKANE = {
    "file": "spokane-wedding-videographer.html",
    "city": "Spokane",
    "state": "Washington",
    "crumb": "Spokane Wedding Videographer",
    "h1": "Spokane Wedding Videographer",
    "title": "Spokane Wedding Videographer | Take One Visuals",
    "meta_desc": "Wedding films for Spokane couples by Luke Hegelund. Filmed at Manito Park, The Glasshouse On Monroe, Saltese Uplands and more. 5.0 stars, 14 Google reviews. No travel fee in Spokane.",
    "og_desc": "Story-driven wedding films for Spokane couples by Take One Visuals — filmed at Manito Park, The Glasshouse On Monroe, Saltese Uplands and more.",
    "service_name": "Spokane Wedding Videographer",
    "service_desc": "Heirloom-quality, story-driven wedding films for couples in Spokane, Washington, by Luke Hegelund of Take One Visuals.",
    "intro": "Cinematic, story-driven wedding films for couples getting married in Spokane and across Eastern Washington — shot and edited by hand, not templated.",
    "films_eyebrow": "Spokane-Area Films",
    "faq_heading": "Questions Spokane couples ask",
    "cta_heading": "Tell me about your Spokane wedding.",
    "cta_copy": "Every wedding I film starts with a real conversation. Share a few details and I'll be in touch within two days.",
    "films": ["moriah-dane", "alexa-jacob", "matt-alisia", "brie-jeff", "caleb-brianna", "allie-alan"],
    "body": """    <h2>Spokane venues I've actually filmed</h2>
    <p>Most location pages are a city name pasted into a template. This one is a list of rooms I've stood in. Knowing where the light falls at Manito Park in September, or how tight the ceremony space is at The Glasshouse On Monroe, is the difference between a videographer who is finding the shot and one who already knows it.</p>
"""
    + venue_html(SPOKANE_VENUES)
    + """
    <p>If your venue isn't on that list, it isn't a problem — I scout anywhere I haven't filmed before. It just means I'll ask you more questions up front.</p>

    <h2>A Spokane wedding film that actually feels like your day</h2>
    <p>I'm Luke Hegelund, and Take One Visuals is a one-person studio. I shoot your wedding, I cut your wedding, and I'm the person who answers when you email. That matters more than it sounds: the reason a film feels like <em>your</em> day is that the person editing it was standing there when your dad lost it during the toast.</p>
    <p>Spokane runs the full range — a downtown garden ceremony at Manito, a barn evening out toward Clayton, a small 10-person gathering on the Saltese Uplands trailhead. I don't shoot them the same way, because they aren't the same day.</p>

"""
    + PRICING_BLOCK
    + """
    <p><strong>No travel fee anywhere in the Spokane area.</strong> I'm based in Post Falls, about 35 minutes east, and I only charge travel on venues more than two hours out.</p>

    <h2>How the work actually goes</h2>
    <ul>
      <li><strong>We talk first.</strong> Before anything is signed, a real conversation about your day and what you'd hate to lose.</li>
      <li><strong>Fast turnaround.</strong> Several Spokane couples have watched a highlight the same night at their reception. The full film follows in about two weeks.</li>
      <li><strong>Drone when it's safe and legal.</strong> Included at no extra cost when weather and airspace allow.</li>
      <li><strong>One revision round, free.</strong> Reordering, audio, color — whatever it needs to land.</li>
    </ul>""",
    "faqs": [
        (
            "How far ahead should we book a Spokane wedding videographer?",
            "Peak Spokane dates from June through September tend to fill six to twelve months out. Off-season and weekday dates are usually available with much less notice.",
        ),
        (
            "Do you charge a travel fee for weddings in Spokane?",
            "No. I'm based in Post Falls, Idaho, roughly 35 minutes from downtown Spokane, and travel is only billed for venues more than a two-hour drive one way.",
        ),
        (
            "How much does a wedding videographer cost in Spokane?",
            "Take One Visuals packages run $1,000 for ceremony-only coverage up to 2 hours, $1,400 for ceremony and reception up to 5 hours, and $2,000 for full-day coverage up to 10 hours. Raw footage can be added for $200.",
        ),
        (
            "How quickly will we get our wedding film?",
            "A short highlight is often ready within days, and several couples have watched one the same night at their reception. The full wedding film is delivered in about two weeks.",
        ),
        (
            "Do you work with our photographer?",
            "Yes. I plan around the photographer rather than competing with them for angles, and I reach out before the day whenever you can share their contact.",
        ),
        (
            "Can we get the ceremony uncut, not just a highlight reel?",
            "Yes. Every package from Ceremony upward includes the full ceremony uncut with clean vow audio. Reception speeches and first dances come uncut in the Ceremony & Reception and Full Day packages.",
        ),
    ],
}

CDA = {
    "file": "coeur-dalene-wedding-videographer.html",
    "city": "Coeur d'Alene",
    "state": "Idaho",
    "crumb": "Coeur d'Alene Wedding Videographer",
    "h1": "Coeur d'Alene Wedding Videographer",
    "title": "Coeur d'Alene Wedding Videographer | Take One Visuals",
    "meta_desc": "Wedding films for Coeur d'Alene and North Idaho couples by Luke Hegelund of Take One Visuals. Based 20 minutes away in Post Falls — no travel fee. 5.0 stars, 14 Google reviews.",
    "og_desc": "Story-driven wedding films for Coeur d'Alene and North Idaho couples by Take One Visuals — based 20 minutes away in Post Falls.",
    "service_name": "Coeur d'Alene Wedding Videographer",
    "service_desc": "Heirloom-quality, story-driven wedding films for couples in Coeur d'Alene, Idaho, by Luke Hegelund of Take One Visuals.",
    "intro": "Cinematic, story-driven wedding films for couples getting married on Lake Coeur d'Alene and across North Idaho — filmed by someone who lives twenty minutes away.",
    "films_eyebrow": "North Idaho Films",
    "faq_heading": "Questions North Idaho couples ask",
    "cta_heading": "Tell me about your Coeur d'Alene wedding.",
    "cta_copy": "Every wedding I film starts with a real conversation. Share a few details and I'll be in touch within two days.",
    # Only films whose North Idaho location is confirmed. Seth & Kylie and
    # Gabby & Robert are deliberately excluded: their venues are unconfirmed,
    # so listing them under "North Idaho Films" would be a claim we can't back.
    "films": ["devin-violet", "reanna-brandon"],
    "body": """    <h2>A local videographer, not a drive-in vendor</h2>
    <p>I'm Luke Hegelund, and Take One Visuals is based in Post Falls — about twenty minutes from downtown Coeur d'Alene. That isn't a marketing detail. It means no travel fee, it means we can meet for coffee instead of a video call, and it means that if your ceremony moves up an hour, I'm not stuck on I-90 coming in from another state.</p>
    <p>It also means I know what the lake does to light. Golden hour on the water in late July is a genuinely different problem than golden hour in a Spokane field, and the timeline you build around it is different too. That's the kind of thing worth having someone local for.</p>

    <h2>North Idaho venues I've filmed or I'm booked at</h2>
"""
    + venue_html(CDA_VENUES)
    + """
    <p>Being straight with you: more of my delivered work sits on the Washington side of the border than the Idaho side, because that's simply where the bookings came from first. The North Idaho calendar is filling now — including a Blackwell Boutique Hotel wedding and a St. Thomas Catholic ceremony with a reception at Settlers Creek. If you want to see work from a venue I haven't filmed yet, ask and I'll tell you honestly rather than dress it up.</p>

    <h2>Catholic and church ceremonies</h2>
    <p>North Idaho has a lot of church weddings, and they come with rules a general-purpose videographer often learns the hard way. I've filmed a full Catholic cathedral ceremony, which means I already know to stay well off the communion ramp, to work from fixed positions rather than roaming the aisle, and to clear the plan with the parish ahead of time instead of at the door. If your ceremony is at St. Thomas or another parish, that conversation is already handled.</p>

"""
    + PRICING_BLOCK
    + """
    <p><strong>No travel fee anywhere in North Idaho.</strong> Coeur d'Alene, Hayden, Rathdrum, Post Falls and Sandpoint are all inside my home service area. Travel is only billed past a two-hour drive.</p>

    <h2>How the work actually goes</h2>
    <ul>
      <li><strong>We talk first.</strong> A real conversation about your day before anything gets signed.</li>
      <li><strong>Fast turnaround.</strong> Past couples have watched a highlight the same night at their reception; the full film follows in about two weeks.</li>
      <li><strong>Drone over the lake when it's legal.</strong> Included when weather and airspace allow — worth checking early, since parts of the shoreline are restricted.</li>
      <li><strong>One revision round, free.</strong> Included on every edited video.</li>
    </ul>""",
    "faqs": [
        (
            "Do you charge a travel fee for Coeur d'Alene weddings?",
            "No. Take One Visuals is based in Post Falls, about twenty minutes from downtown Coeur d'Alene, and all of North Idaho is inside the home service area. Travel is only billed for venues more than a two-hour drive one way.",
        ),
        (
            "How much does a wedding videographer cost in Coeur d'Alene?",
            "Packages run $1,000 for ceremony-only coverage up to 2 hours, $1,400 for ceremony and reception up to 5 hours, and $2,000 for full-day coverage up to 10 hours. Raw footage can be added for $200.",
        ),
        (
            "Can you film a Catholic ceremony at St. Thomas or another parish?",
            "Yes. I've filmed a full Catholic cathedral ceremony and work from fixed, discreet positions, staying clear of the communion ramp and clearing the plan with the parish in advance rather than at the door.",
        ),
        (
            "Can you fly a drone over Lake Coeur d'Alene?",
            "Drone footage is included when weather, airspace and venue rules allow. Some shoreline areas near the airport and downtown are restricted, so it's worth raising early in planning rather than on the day.",
        ),
        (
            "How far ahead should we book?",
            "Summer dates on the lake tend to fill six to twelve months out. Shoulder-season and weekday dates are usually available with far less notice.",
        ),
        (
            "Do you cover Hayden, Rathdrum, Post Falls and Sandpoint too?",
            "Yes. All of them are inside the no-travel-fee service area, along with Spirit Lake, Coeur d'Alene and the surrounding North Idaho communities.",
        ),
    ],
}

PAGES = [SPOKANE, CDA]

if __name__ == "__main__":
    for page in PAGES:
        html = build(page)
        with open(page["file"], "w", encoding="utf-8") as fh:
            fh.write(html)
        print(f"wrote {page['file']}  ({len(html.splitlines())} lines, {len(html)} bytes)")
