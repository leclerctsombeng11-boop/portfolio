/* ===== CONTENU DU SITE : modifiez uniquement ce fichier ===== */
const SITE = {
  name: "Leclerc",
  role: "Étudiant en informatique & enseignant",
  city: "Yaoundé, Cameroun",
  tagline: "Étudiant en Licence 3 Informatique à l’Université de Yaoundé 1, j’enseigne l’informatique et les mathématiques et je conçois des applications utiles : plateformes d’apprentissage, outils de gestion et jeux traditionnels numérisés.",
  about: [
    "Je combine mes études d’informatique à l’Université de Yaoundé 1 avec l’enseignement des mathématiques et de l’informatique, de la 6e à la Terminale.",
    "Je m’intéresse au développement logiciel, à l’intelligence artificielle et à la valorisation du patrimoine culturel africain par le numérique. Mon objectif : poursuivre un doctorat en IA."
  ],
  email: "votre.email@exemple.com",
  github: "", linkedin: "", whatsapp: "",   // ex. github: "https://github.com/votre-nom", whatsapp: "237600000000"
  cv: "assets/docs/CV-Leclerc.pdf",          // déposez votre CV PDF à cet emplacement
  skills: {
    "Développement": ["Java", "PHP", "JavaScript", "Python", "HTML/CSS"],
    "Données & IA": ["MySQL", "Data mining", "Calcul scientifique"],
    "Systèmes & réseaux": ["Réseaux LAN/Ethernet", "Linux (Ubuntu)", "Windows"],
    "Enseignement": ["Mathématiques", "Informatique", "Création de TD et de supports"]
  },
  projects: [
    { title: "Songo numérique", cat: "Jeu", status: "En cours", year: "2026", featured: true,
      desc: "Implémentation numérique du Songo, jeu de société traditionnel Ekang du Cameroun de type mancala, pour préserver et faire jouer ce patrimoine.",
      stack: ["Jeu", "Culture"], link: "", repo: "" },
    { title: "LMS — plateforme d’apprentissage", cat: "Web", status: "Terminé", year: "2026", featured: true,
      desc: "Système de gestion de l’apprentissage construit à partir d’un code PHP/MySQL audité, corrigé et amélioré.",
      stack: ["PHP", "MySQL"], link: "", repo: "" },
    { title: "Gestion d’établissement scolaire", cat: "Desktop", status: "En cours", year: "2026", featured: true,
      desc: "Application de bureau Java pour Windows et Ubuntu : élèves, matricules, notes, bulletins PDF et statistiques.",
      stack: ["Java", "PDF"], link: "", repo: "" },
    { title: "Plateforme sociale d’apprentissage UY1", cat: "Web", status: "Conception", year: "2026", featured: false,
      desc: "Réseau social étudiant pour apprendre l’informatique : groupes, partage et éditeurs de code intégrés.",
      stack: ["Web", "Communauté"], link: "", repo: "" }
  ],
  certs: [
    { title: "Nom de votre certification", org: "Organisme émetteur", date: "2026", id: "", link: "", img: "" },
    { title: "Nom de votre certification", org: "Organisme émetteur", date: "2025", id: "", link: "", img: "" }
  ],
  education: [
    { title: "Licence 3 Informatique", where: "Université de Yaoundé 1", date: "En cours", text: "Réseaux, fouille de données, calcul scientifique, génie logiciel." }
  ],
  experience: [
    { title: "Enseignant d’informatique et de mathématiques", where: "Complexe Scolaire Bilingue Linda et les Anges", date: "6e – Terminale", text: "Cours, travaux dirigés et suivi des élèves." },
    { title: "Enseignant de soutien", where: "Centre de répétition affilié", date: "", text: "Cours de renforcement en informatique et mathématiques." }
  ]
};
