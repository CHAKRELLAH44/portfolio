# Icon sources

Every file here is one single-colour path in a 24 by 24 box. The pages colour it with CSS (`currentColor`), and
`tools/build_icons.py` copies the ones a page uses into that page's inline sprite (`<!-- icons:start -->`).

`brands.json` lists, for each icon, its brand colour (used on hover) and where the path came from.

| Source | Licence | Used for |
| --- | --- | --- |
| [Simple Icons](https://simpleicons.org) (pinned npm version per icon) | CC0 | Most skill logos, LinkedIn, GitHub, Discord, X, Spotify |
| [Devicon](https://devicon.dev) `plain` variants | MIT | Brands Simple Icons no longer carries (for example Azure) |
| Last Simple Icons release that still has the icon | CC0 | Adobe, AWS (see the `note` field) |

Brand names and logos belong to their owners.

Add or update an icon: edit `brands.json`, run `python tools/build_icons.py --fetch`, use
`<svg class="ico"><use href="#i-NAME"/></svg>` in the HTML, then run `python tools/build_icons.py`.
`python tools/check.py` fails if a page uses an icon its sprite does not hold.
