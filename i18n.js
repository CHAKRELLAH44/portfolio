// Bilingual support: English is written in the HTML, French lives in I18N_FR.
// Mark text with data-i18n="key", and attributes with data-i18n-attr="attr:key;attr:key".
const I18N_FR = {
  // Header, navigation, footer
  "nav.about": "À propos",
  "nav.projects": "Projets",
  "nav.hidden": "Côté perso",
  "nav.contact": "Contact",
  "nav.cv": "Télécharger mon CV",
  "header.available": "DISPONIBLE",
  "header.cvAria": "Télécharger mon CV",
  "footer.title": "PORTFOLIO d'Imanska",
  "footer.tagline": "Construire la tech, avec le sourire",
  "common.returnHome": "RETOUR À L'ACCUEIL",
  "common.backHome": "RETOUR À L'ACCUEIL",

  // Home page
  "index.pageTitle": "Imanska - Portfolio d'ingénieure logiciel",
  "hero.im": "JE SUIS",
  "hero.tagline": "CONSTRUIRE LA TECH, AVEC LE SOURIRE.",
  "hero.based": "Basée à Rabat, Maroc",
  "hero.freelance": "Disponibilité freelance",
  "hero.limited": "HEURES LIMITÉES",
  "about.label": "À propos",
  "about.text": "Je suis ingénieure, mais aussi passionnée de tech et toujours partante pour un défi. Mon objectif ? Améliorer le monde, un bug à la fois. Ou au moins le rendre un peu plus fun grâce à la tech !",
  "about.hiddenBtn": "DÉCOUVRIR MON CÔTÉ PERSO",
  "about.cvBtn": "TÉLÉCHARGER MON CV",
  "stats.aria": "Chiffres clés",
  "stats.projects": "Projets",
  "stats.domains": "Domaines",
  "stats.certs": "Certifications",
  "exp.label": "Expérience",
  "exp.heading": "MON PARCOURS",
  "exp.1.date": "Février 2026 – Août 2026 · Casablanca, Maroc",
  "exp.1.title": "Système d'information achats – Procure-to-Pay",
  "exp.1.role": "Stagiaire consultante &amp; développeuse Salesforce – D&amp;A Technologies",
  "exp.1.p1": "Participation à l'étude et au développement d'un système d'information achats : conception et réalisation d'un système Procure-to-Pay axé qualité pour un client grand compte, et modélisation des processus métier en BPMN au sein d'un cabinet de conseil Salesforce.",
  "exp.1.p2": "Développement de la logique back-end, des workflows d'approbation et de Lightning Web Components (LWC) en Apex et SOQL, livraison de fonctionnalités destinées aux fournisseurs sur Experience Cloud, et participation aux tests unitaires et d'intégration dans un environnement Agile.",
  "exp.2.date": "Juillet 2025 – Septembre 2025 · Paris, France",
  "exp.2.title": "Agent d'automatisation Twitter",
  "exp.2.role": "Stagiaire AIOps &amp; automatisation – PROVIROLL",
  "exp.2.p1": "Création du Twitter Automation Agent, un agent IA qui automatise la création et la publication de contenu sur Twitter/X, avec ElizaOS pour orchestrer le comportement de l'agent et intégrer l'API Twitter.",
  "exp.2.p2": "Utilisation de snscrape/Tweepy pour collecter et constituer des jeux de données de tweets, et de modèles NLP Hugging Face pour générer un contenu cohérent et adapté au contexte.",
  "exp.3.date": "Juillet 2024 – Août 2024 · Rabat, Maroc",
  "exp.3.title": "Application Coffee Shop",
  "exp.3.role": "Stagiaire développeuse full-stack – LUMINALINK",
  "exp.3.p1": "Développement de la Coffee Shop App, un système full-stack et serverless de commande de café sur AWS, avec un front-end Angular.",
  "exp.3.p2": "Mise en œuvre de la logique back-end avec AWS Lambda, des API REST avec API Gateway, du stockage NoSQL avec DynamoDB et de l'hébergement statique avec S3.",
  "exp.more": "Voir le détail",
  "exp.less": "Masquer le détail",
  "projects.unveil": "VOIR MES PROJETS",
  "projects.recent": "Derniers",
  "projects.projects": "PROJETS",
  "skills.title": "MES SUPER-POUVOIRS",
  "notFound.pageTitle": "Page introuvable - Imanska",
  "notFound.title": "Cette page est partie en pause café",
  "notFound.hint": "Suggestion : essaie plutôt une de ces routes.",
  "notFound.home": "Retour à l'accueil",
  "share.label":"Partager mon portfolio",
  "share.text": "Découvre le portfolio d'Imane : ingénieure logiciel, Salesforce & DevOps.",
  "share.copied": "Lien copié, merci pour le partage !",
  "form.chars": "caractères",
  "testi.label": "Ils en parlent",
  "testi.heading": "ON A TRAVAILLÉ ENSEMBLE",
  "testi.loading": "Chargement des remarques…",
  "testi.empty": "Pas encore de remarque… sois la première personne à en laisser une !",
  "testi.error": "Impossible de charger les remarques pour le moment.",
  "testi.open": "On a déjà travaillé ensemble ? Laisse-moi une remarque",
  "testi.name": "Ton nom",
  "testi.role": "Poste &amp; entreprise <em>(facultatif)</em>",
  "testi.rolePh": "Lead Developer · Entreprise",
  "testi.relation": "On a travaillé ensemble en tant que…",
  "testi.rel.colleague": "Collègue",
  "testi.rel.manager": "Manager",
  "testi.rel.client": "Client·e",
  "testi.rel.teammate": "Coéquipier·ère",
  "testi.message": "Ta remarque",
  "testi.submit": "ENVOYER MA REMARQUE",
  "testi.disclaimer": "Les remarques apparaissent sur le site après une rapide relecture.",
  "testi.sending": "Envoi en cours…",
  "testi.thanks": "Merci beaucoup ! Ta remarque apparaîtra dès qu'elle sera validée.",
  "testi.invalid": "Indique ton nom et une remarque d'au moins 20 caractères.",
  "testi.failed": "L'envoi a échoué. Réessaie dans un instant.",
  "testi.tooSoon": "Tu viens déjà d'envoyer une remarque, merci !",
  "testi.notReady": "Les remarques ne sont pas encore activées.",
  "skills.longPressHint": "Appui long sur un logo pour voir où je l'ai utilisé",
  "skills.usedIn": "Utilisé dans",
  "skills.everyday": "Fait partie de ma boîte à outils au quotidien.",
  "skills.seeProjects": "Voir mes projets →",
  "skills.close": "Fermer",
  "skills.filterAria": "Filtrer les compétences par domaine",
  "skills.data": "Bases de données",
  "skills.tools": "Outils &amp; Design",
  "skills.count": "technologies dans ma boîte à outils",

  // Contact
  "contact.pageTitle": "Contact - Imanska",
  "contact.lets": "RESTONS",
  "contact.connect": "EN CONTACT",
  "contact.line1": "ENVOYEZ-MOI DES BUGS",
  "contact.line2": "(OU DES MOTS ",
  "contact.line3": "        DOUX)",
  "contact.name": "VOTRE NOM",
  "contact.email": "VOTRE ADRESSE E-MAIL",
  "contact.message": "COMMENT PUIS-JE VOUS AIDER ?",
  "contact.send": "ENVOYER",
  "contact.findMe": "RETROUVEZ-MOI SUR",
  "contact.sent": "Merci ! Votre message a bien été envoyé. Je vous réponds très vite.",

  // Hidden me
  "hidden.pageTitle": "Côté perso - Imanska",
  "hidden.navAria": "Chapitres",
  "hidden.nav.tech": "Technologie",
  "hidden.nav.football": "Football",
  "hidden.nav.baking": "Pâtisserie",
  "hidden.nav.music": "Musique",
  "hidden.flipAria": "Retourner la photo pour voir les fun facts",
  "hidden.facts": "Fun facts",
  "hidden.tech.alt": "Illustration lumineuse d'un circuit imprimé",
  "hidden.tech.f1": "Chaque bug est une leçon déguisée.",
  "hidden.tech.f2": "Objectif : rendre la vie plus simple, plus intelligente et plus fun.",
  "hidden.tech.f3": "43 technologies dans ma boîte à outils, de Salesforce à Kubernetes.",
  "hidden.speed.alt": "Lewis Hamilton, pilote de Formule 1",
  "hidden.speed.f1": "Pilote préféré : Lewis Hamilton.",
  "hidden.speed.f2": "7 titres mondiaux, et autant de leçons.",
  "hidden.speed.f3": "Devise : « La vie est faite de leçons, pas de perfection. »",
  "hidden.game.play": "Jouer",
  "hidden.game.close": "Fermer le jeu",
  "hidden.f1.title": "Lights out : es-tu aussi rapide qu'un pilote ?",
  "hidden.f1.start": "Touche pour démarrer",
  "hidden.f1.wait": "Attends que les feux s'éteignent…",
  "hidden.f1.go": "GO ! Touche !",
  "hidden.f1.again": "Touche pour rejouer",
  "hidden.f1.jump": "Faux départ ! Pénalité drive-through.",
  "hidden.f1.best": "Record",
  "hidden.f1.pro": "Pilotes F1 : ~0,200 s",
  "hidden.f1.great": "Niveau pilote F1 !",
  "hidden.f1.good": "Pas mal, presque prête pour la F2 !",
  "hidden.f1.slow": "Encore un peu d'entraînement au simulateur.",
  "hidden.football.alt": "FC Barcelone",
  "hidden.football.f1": "Club : le FC Barcelone, pour la vie.",
  "hidden.football.f2": "Fan depuis que je sais taper dans un ballon.",
  "hidden.football.f3": "Ce que le terrain m'a appris : l'esprit d'équipe et la persévérance.",
  "hidden.pen.title": "Penalty Lab : vise, dose la puissance, bats le modèle",
  "hidden.pen.aria": "Penalty : flèches pour viser, Entrée pour verrouiller puis tirer",
  "hidden.pen.heat": "Heatmap xG",
  "hidden.pen.power": "PUISSANCE",
  "hidden.pen.helpAim": "Déplace la souris pour viser, puis clique pour verrouiller la cible.",
  "hidden.pen.helpAimTouch": "Touche le but pour choisir ta cible.",
  "hidden.pen.helpPower": "Touche encore pour arrêter la jauge. Trop fort = moins précis !",
  "hidden.pen.helpFlight": "Ballon en l'air…",
  "hidden.pen.helpOver": "Séance terminée : regarde ta carte des tirs, puis relance une séance.",
  "hidden.pen.speed": "Vitesse",
  "hidden.pen.flight": "Temps de vol",
  "hidden.pen.outcome": "Résultat",
  "hidden.pen.xgTotal": "xG cumulé",
  "hidden.pen.vsModel": "vs modèle",
  "hidden.pen.off": "À côté : au-dessus ou hors cadre.",
  "hidden.pen.post": "Sur le poteau !",
  "hidden.pen.r.goal": "But",
  "hidden.pen.r.saved": "Arrêté",
  "hidden.pen.r.off": "Raté",
  "hidden.pen.r.post": "Poteau",
  "hidden.pen.goal": "BUT ! Visca el Barça !",
  "hidden.pen.saved": "Arrêté par le gardien…",
  "hidden.pen.score": "Buts",
  "hidden.pen.reset": "Nouvelle séance",
  "hidden.pen.done": "Séance terminée !",
  "hidden.baking.alt": "Pâtisserie maison",
  "hidden.baking.f1": "Spécialité : le classique gâteau au chocolat.",
  "hidden.baking.f2": "Toujours en train de tester de nouvelles saveurs.",
  "hidden.baking.f3": "Le meilleur moment : le partager.",
  "hidden.music.alt": "Musique",
  "hidden.music.f1": "Il y a une playlist pour chaque moment.",
  "hidden.music.f2": "La bande-son pour coder, pâtisser et me détendre.",
  "hidden.music.f3": "La musique rapproche les gens là où les mots n'y arrivent pas.",
  "hidden.tech.title": "Ma passion pour la technologie",
  "hidden.tech.text": "L'ingénierie informatique n'est pas seulement mon métier. J'adore résoudre des problèmes, écrire du code et explorer de nouvelles technologies. Pour moi, chaque bug est une occasion d'apprendre et chaque nouveau projet une chance d'innover. J'aime créer des solutions qui rendent la vie plus simple, plus intelligente et un peu plus fun. Envie de connaître mon parcours ? Téléchargez mon CV.",
  "hidden.speed.title": "Le goût de la vitesse",
  "hidden.speed.text": "Le sport automobile est ma dose d'adrénaline, et la Formule 1 mon obsession. Ma passion pour la course est profonde, surtout pour Lewis Hamilton, septuple champion du monde. J'admire la détermination et le talent des pilotes qui repoussent leurs limites à chaque course. « La vie est faite de leçons, pas de perfection. » – Lewis Hamilton",
  "hidden.football.title": "Le beau jeu",
  "hidden.football.text": "Le football est bien plus qu'un sport pour moi : c'est une passion de toujours. Fan inconditionnelle du FC Barcelone, je suis l'équipe depuis que je sais taper dans un ballon. Le foot fait partie de ma vie depuis l'enfance ; c'est là que j'ai appris l'esprit d'équipe, la persévérance et le plaisir de viser des buts (au sens propre comme au figuré).",
  "hidden.baking.title": "Ma passion pour la pâtisserie",
  "hidden.baking.text": "La pâtisserie est mon espace de créativité. Des gâteaux aux cookies, j'adore expérimenter de nouvelles saveurs et techniques. C'est une façon délicieuse de décompresser et de partager de la joie. Qu'il s'agisse d'un classique gâteau au chocolat ou d'une nouvelle recette, la pâtisserie est toujours une douce aventure.",
  "hidden.music.title": "Le langage universel",
  "hidden.music.text": "La musique est ma compagne de tous les jours, la bande-son de ma vie. Je crois qu'elle dépasse les frontières et rapproche les gens comme les mots ne peuvent pas le faire. Comme on dit : « La musique est un langage que tout le monde comprend. » Que je code, que je pâtisse ou que je me détende, il y a toujours une playlist pour le moment. Curieux ? Jetez un œil à mon compte Spotify.",

  // Projects page
  "projectsPage.pageTitle": "Projets - Imanska",
  "projectsPage.all": "TOUS LES PROJETS",
  "certs.eyebrow": "Apprentissage",
  "certs.title": "CERTIFICATIONS &amp; COURS",
  "certs.completed": "cours et certifications",
  "certs.carouselAria": "Carrousel des formations",
  "certs.previous": "Slide précédente",
  "certs.next": "Slide suivante",
  "certs.chooseSlide": "Choisir une slide",
  "certs.slide": "Slide",
  "certs.status": "100 % terminé",
  "certs.credential": "Certification",
  "certs.homeInvite": "Découvrir mes 30 certifications et cours",
  "certs.pageHint": "Mes certifications et cours se trouvent en bas de cette page.",
  "certs.pageLink": "Voir les certifications ↓",
  "filters.aria": "Filtrer les projets par domaine",
  "filters.all": "Tous",
  "filters.devops": "DevOps &amp; Cloud",
  "filters.data": "Data &amp; ML",
  "filters.web": "Web",
  "filters.mobile": "Mobile",
  "cat.eyebrow": "Projets",
  "cat.devops": "Ingénierie DevOps &amp; Cloud",
  "cat.data": "Data Engineering &amp; Machine Learning",
  "cat.web": "Développement Web",
  "cat.mobile": "Développement Mobile",
  "proj.tools": "Outils :",
  "modal.description": "Description",

  "proj.cicd.title": "Automatisation d'un pipeline CI/CD",
  "proj.cicd.long": "Mise en place d'un pipeline CI/CD complet pour automatiser le déploiement et la mise à l'échelle des applications. Le dispositif assure une livraison rapide, des charges de travail conteneurisées et une observabilité complète grâce à des tableaux de bord de supervision. Kubernetes (Minikube) pour l'orchestration et le cluster, Jenkins pour le pipeline CI et l'automatisation, ArgoCD pour le déploiement continu GitOps, Docker pour la conteneurisation, GitHub pour la gestion de versions, et Prometheus + Grafana pour la collecte et la visualisation des métriques.",
  "proj.ansible.title": "Déploiement automatisé de paquets",
  "proj.ansible.long": "Création d'un système automatisé pour installer et configurer des paquets sur plusieurs serveurs, supprimant le travail manuel et garantissant une configuration homogène. Mise en place d'une infrastructure multi-VM reproductible pour les tests. Ansible pour les playbooks, l'inventaire et l'automatisation, SSH pour l'exécution distante sécurisée, et VirtualBox/Vagrant pour l'environnement de développement multi-machines.",
  "proj.dmz.title": "Architecture réseau virtuelle avec DMZ",
  "proj.dmz.long": "Conception d'une architecture DMZ sécurisée avec segmentation, règles de pare-feu et NAT pour exposer les services externes en toute sécurité. Vérification de l'isolation et du contrôle des flux entre toutes les zones réseau. Proxmox pour la virtualisation et la configuration réseau, pfSense pour le pare-feu, le NAT et le routage, des ponts réseau pour isoler les interfaces, et Windows Server IIS pour l'hébergement et la validation du service web.",
  "proj.twitter.title": "PROVIROLL – Agent d'automatisation Twitter",
  "proj.twitter.short": "Agent d'automatisation Twitter",
  "proj.twitter.long": "Développement d'un agent IA capable de créer, planifier et publier automatiquement des tweets cohérents. Constitution de jeux de données et fine-tuning de modèles NLP pour un contenu généré de qualité. ElizaOS pour l'orchestration de l'agent, l'API Twitter pour la publication automatique, snscrape/Tweepy pour la collecte de données, et Hugging Face pour le fine-tuning des modèles NLP.",
  "proj.coffee.title": "LUMINALINK – Coffee Shop",
  "proj.coffee.long": "Création d'une plateforme de commande entièrement serverless pour automatiser les commandes d'un café, avec une interface Angular moderne. Le système est scalable, peu coûteux et exécute le back-end en temps réel. AWS Lambda pour la logique serverless, API Gateway pour le routage de l'API REST, DynamoDB pour le stockage NoSQL, S3 pour les fichiers statiques et les sauvegardes, et Angular pour l'interface.",
  "proj.health.title": "IA Santé – Prédire la survie des patients",
  "proj.health.short": "IA Santé – Prédiction",
  "proj.health.long": "Conception d'un modèle prédictif estimant la survie des patients à partir de données médicales, avec une interface interactive pour les cliniciens. Traitement des données simplifié grâce à des pipelines ETL. Scikit-learn pour les modèles de ML classiques, TensorFlow pour le deep learning, Streamlit pour l'interface web, Power BI pour la visualisation et le reporting, et l'ETL pour le nettoyage et la transformation des données.",
  "proj.reco.title": "Système de recommandation – E-commerce",
  "proj.reco.long": "Mise en œuvre d'un moteur de recommandation hybride combinant filtrage collaboratif et analyse de contenu pour des suggestions de produits personnalisées. Intégration d'une indexation en temps réel pour une recherche rapide. PySpark + MLlib (ALS) pour le filtrage collaboratif, Kafka pour les flux de données en temps réel, et Elasticsearch pour l'indexation et la recherche.",
  "proj.bank.title": "Système de gestion bancaire",
  "proj.bank.long": "Développement d'une application web sécurisée de gestion bancaire : gestion des clients, création de comptes, suivi des soldes, historique des transactions et virements. Mise en place d'un contrôle d'accès par rôles et d'une authentification JWT pour sécuriser les API REST et gérer les permissions des clients et des agents bancaires.",
  "proj.ecom.title": "Plateforme e-commerce en microservices",
  "proj.ecom.long": "Développement d'une plateforme e-commerce en microservices pour la gestion des produits et des commandes avec Spring Boot et Spring Cloud. Mise en place des opérations CRUD, d'une configuration centralisée, de la découverte de services, du routage via API Gateway, de la répartition de charge et de la tolérance aux pannes (timeouts et mécanismes de repli). Intégration d'un front-end React.js et documentation des API REST avec Swagger/OpenAPI.",
  "proj.echstore.title": "Ech Store – Site web JEE",
  "proj.echstore.long": "Développement d'un site e-commerce en JEE avec opérations CRUD complètes, authentification et gestion du catalogue produits. Architecture back-end rapide et sécurisée. Jakarta EE (JEE) pour les servlets, JDK 17 pour l'environnement Java, et Tomcat 10 pour le déploiement.",
  "proj.movie.title": "Système de gestion de films",
  "proj.movie.long": "Création d'une plateforme de gestion de films et d'acteurs avec CRUD complet, composée d'un front-end React moderne et d'un back-end .NET robuste connecté à une base SQL. C# (.NET) pour la logique back-end, SQL pour la base relationnelle, et React + Vite pour l'interface.",
  "proj.taxi.title": "Système de réservation de taxi en ligne",
  "proj.taxi.long": "Création d'un système de réservation de taxi en ligne avec authentification sécurisée et gestion des courses. Interface responsive adaptée à l'ordinateur comme au mobile. Django pour le back-end et l'authentification, HTML/CSS pour le front-end, et SQL pour la persistance des données.",
  "proj.faith.title": "FAITH Quran – PWA de lecture du Coran",
  "proj.faith.long": "Progressive Web App de lecture du Coran : les 114 sourates en arabe avec traductions française et anglaise. Chaque sourate est accompagnée d'une explication générée par IA (contexte de révélation, thème principal, message clé, vertus) en arabe, français ou anglais. Les utilisateurs peuvent ajouter des favoris et suivre leur progression de lecture, et un tableau de bord admin affiche des statistiques globales et permet d'envoyer des notifications. Installable sur mobile et ordinateur, utilisable hors ligne. Next.js + React + Tailwind CSS pour le front-end, Supabase (PostgreSQL) pour les données, l'API Groq (LLaMA 3.3 70B) pour les explications, l'API Al-Quran Cloud pour le texte, et Netlify pour le déploiement.",
  "proj.ora.title": "Entraînement Oral – Coach linguistique IA",
  "proj.ora.long": "Application web d'entraînement linguistique en trois modules : expression orale, écrite et lecture. L'utilisateur s'enregistre sur un sujet aléatoire ou en décrivant une image ; l'audio est transcrit avec Whisper puis corrigé par IA. Les textes écrits reçoivent une correction grammaticale, et après la lecture d'un livre, l'utilisateur rédige un résumé évalué par l'IA. L'application suit aussi l'historique et les séries quotidiennes, est disponible en français, anglais et espagnol, et comprend une page d'administration. Next.js (App Router) + TypeScript + Tailwind CSS pour l'application, les routes API Next.js pour le back-end, Groq (Whisper large-v3-turbo et LLM) pour la transcription et la correction, et Supabase pour l'authentification et le stockage.",
  "proj.hotelJava.title": "Système de gestion hôtelière (Java)",
  "proj.hotelJava.long": "Application de réception hôtelière écrite en Java. Elle couvre la gestion des réservations, le suivi des clients, la génération de factures et un module pour les services annexes (spa, restauration).",
  "proj.hotelCpp.title": "Système de gestion hôtelière (C++)",
  "proj.hotelCpp.long": "Application C++ optimisée pour la gestion opérationnelle d'un hôtel. Elle propose des routines rapides pour l'attribution des chambres, la gestion des disponibilités et des tarifs, avec export CSV des rapports.",
  "proj.exams.title": "Application mobile – Examens en ligne",
  "proj.exams.long": "Développement d'une application Android permettant de créer, partager et passer des quiz, avec un historique détaillé. Interface épurée et synchronisation des données en temps réel. Java pour la logique et les composants d'interface, Android Studio comme environnement de développement, et Firebase pour l'authentification et la base de données en temps réel.",

  "proj.carRental.title": "Application de location de voitures",
  "proj.carRental.long": "Application mobile multiplateforme de location de voitures développée avec Flutter. Une seule base de code Dart cible Android et iOS, avec Firebase comme back-end pour les données et la configuration d'hébergement.",

  "proj.p2p.title": "Système d'information achats – Procure-to-Pay",
  "proj.p2p.long": "Système Procure-to-Pay développé sur Salesforce pour un client grand compte pendant mon stage chez D&amp;A Technologies. J'ai modélisé les processus métier en BPMN, développé la logique back-end et les workflows d'approbation en Apex et SOQL, créé des Lightning Web Components et livré des fonctionnalités destinées aux fournisseurs sur Experience Cloud.",
  "proj.confidential": "Les captures d'écran sont confidentielles et appartiennent à l'entreprise cliente.",
  "proj.featured": "À la une",
  "proj.reportTitle": "Lire le rapport du projet",

  // Labels used by script.js
  "ui.themeToLight": "Activer le mode clair",
  "ui.themeToDark": "Activer le mode sombre",
  "ui.menuOpen": "Ouvrir le menu",
  "ui.menuClose": "Fermer le menu",
  "ui.discordCopied": "Pseudo Discord copié :",
};

const LANG_STORAGE_KEY = "portfolio-lang";
let currentLang = "en";

const FLAG_FR = '<svg class="flag" viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>';
const FLAG_UK = '<svg class="flag" viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" stroke-width="4"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="12"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="7"/></svg>';

// Translate a label used from JavaScript; falls back to the English text.
function t(key, english) {
  return currentLang === "fr" && I18N_FR[key] != null ? I18N_FR[key] : english;
}

function getLanguage() {
  return currentLang;
}

function applyLanguage(lang) {
  currentLang = lang === "fr" ? "fr" : "en";
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el.dataset.i18nEn === undefined) el.dataset.i18nEn = el.innerHTML;
    el.innerHTML = t(el.dataset.i18n, el.dataset.i18nEn);
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((part) => part.trim());
      if (!attr || !key) return;
      const store = "i18nEn" + attr.replace(/[^a-z]/gi, "");
      if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) || "";
      el.setAttribute(attr, t(key, el.dataset[store]));
    });
  });

  // The flag shows the language you can switch to.
  document.querySelectorAll(".lang-toggle").forEach((btn) => {
    const label = currentLang === "fr" ? "Switch to English" : "Passer en français";
    btn.innerHTML = currentLang === "fr" ? FLAG_UK : FLAG_FR;
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  });

  document.dispatchEvent(new CustomEvent("portfolio:languagechange", { detail: { lang: currentLang } }));
}

function toggleLanguage() {
  const next = currentLang === "fr" ? "en" : "fr";
  try {
    localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch (err) {}
  applyLanguage(next);
}

function initLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem(LANG_STORAGE_KEY);
  } catch (err) {}
  applyLanguage(saved === "fr" ? "fr" : "en");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLanguage);
} else {
  initLanguage();
}
