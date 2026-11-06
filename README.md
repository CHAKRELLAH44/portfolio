# IMANSKA · Portfolio

> *Building tech, adding fun.*

### 👉 [chakrellah44.github.io/portfolio](https://chakrellah44.github.io/portfolio/)

I built this portfolio so that people outside my day-to-day circle can get to know me for real: my personality, my work, and the way I approach things. And maybe, who knows, it will be the start of a project we build together.

Most of the projects on the site explain themselves: what they do, why I built them, the stack behind them and screenshots of the result.

So if you are reading this, the best thing you can do is visit the site. Have a look around, play a little, and if something speaks to you, send me a message. I'd be happy to hear from you.

**[Visit my portfolio](https://chakrellah44.github.io/portfolio/)** · [LinkedIn](https://www.linkedin.com/in/chakrellah) · [GitHub](https://github.com/CHAKRELLAH44)

---

<details>
<summary><b>Version française</b></summary>

<br>

J'ai créé ce portfolio pour que les personnes extérieures puissent vraiment me connaître : ma personnalité, mon travail et ma façon d'aborder les choses. Et peut-être, pourquoi pas, que ce soit le début d'un projet que l'on construira ensemble.

La plupart des projets présentés sur le site s'expliquent d'eux-mêmes : ce qu'ils font, pourquoi je les ai réalisés, les technologies utilisées et des captures d'écran du résultat.

Alors si vous lisez ces lignes, le mieux est de visiter le site. Baladez-vous, amusez-vous un peu, et si quelque chose vous parle, envoyez-moi un message. Je serai ravie d'échanger avec vous.

**[Visiter mon portfolio](https://chakrellah44.github.io/portfolio/)**

</details>

---

### EmailJS contact form setup

The contact form sends email through EmailJS. Create an EmailJS email service and template, then set the
template's recipient to your inbox and use these variables in the template:

- `from_name` — sender's name
- `reply_to` — sender's email address (set this as the template's Reply-To address)
- `topic` — selected contact topic
- `subject` — email subject
- `message` — sender's message

The same template also receives testimonial notifications. For these, `reply_to` is empty, `topic` starts with
`Testimonial`, and `message` includes the role, working relationship, and moderation link.

Copy the EmailJS **Public Key**, **Service ID**, and **Template ID** into `js/emailjs-config.js`. These identifiers
are intended for browser use; never put a private key in the site. Restrict the public key to the portfolio's
production domain in the EmailJS dashboard. Until configured, the form displays its direct-email fallback rather
than claiming the message was sent.

---

<sub>© Imanska · Designed and built by Imane, one bug at a time.</sub>
