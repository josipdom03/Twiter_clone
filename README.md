# <img src="https://abs.twimg.com/favicons/twitter.2.ico" width="30"> Twitter Clone

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/tailwind%20css-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
<<<<<<< HEAD
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

---

## 🎯 O projektu

Ova aplikacija predstavlja napredni **Twitter (X) klon** razvijen prvenstveno kao demonstracija stručnog poznavanja modernih tehnologija za izradu web aplikacija. Projekt služi kao vizualni i funkcionalni dokaz sposobnosti integracije kompleksnog **frontend-a** s robusnim **backend** sustavom, uz implementaciju baza podataka u containeriziranom okruženju pomoću **Dockera**.

---

## 📸 Pregled aplikacije

<p align="center">
  <img src="Foto1.png" alt="Twitter Clone Mockup" width="100%">
</p>

---

## 🔥 Ključne Značajke

Aplikacija replicira srž Twitter korisničkog iskustva, koristeći moderne tehnologije za rad u stvarnom vremenu:

* **📝 Interaktivno objavljivanje:** Korisnici mogu kreirati, uređivati i brisati tekstualne i slikovne objave (tweetove), s automatskim ažuriranjem feeda.
* **✉️ DM Komunikacija (WebSockets):** Implementiran je sustav direktnih poruka (Direct Messages) koji omogućuje instantnu komunikaciju između korisnika bez potrebe za osvježavanjem stranice.
* **👤 Upravljanje profilima:** Svaki korisnik ima prilagodljiv profil. Sustav omogućuje posjećivanje tuđih profila, pregled njihovih objava te dinamičku interakciju.
* **🤝 Sustav praćenja (Follow):** Korisnici mogu pratiti druge profile, što direktno utječe na sadržaj njihovog glavnog "Početna" feeda.

---

## 🛠️ Tehnički Stack

- **Frontend:** React.js s Tailwind CSS-om za moderan i responzivan dizajn.
- **Backend:** Node.js / Express (integriran s WebSocket protokolom).
- **Baza podataka:** Firebase / MongoDB (ovisno o tvojoj trenutnoj implementaciji).
- **Infrastruktura:** Docker za laku portabilnost i postavljanje razvojnog okruženja.

---

## 🛠️ API Dokumentacija (Backend)

Sve API rute počinju s `/api`. Većina ruta je zaštićena `JWT authMiddleware`-om.

### 🔐 Autentifikacija (`/auth`)
| Metoda | Ruta | Opis | Autentifikacija |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Registracija novog korisnika | ❌ |
| `POST` | `/login` | Klasična prijava (JWT) | ❌ |
| `GET` | `/google` | Google OAuth prijava | ❌ |
| `GET` | `/verify-email` | Verifikacija putem emaila | ❌ |

### 🐦 Tweetovi & Interakcije (`/tweets`, `/likes`, `/comments`)
| Metoda | Ruta | Opis | Autentifikacija |
| :--- | :--- | :--- | :---: |
| `GET` | `/tweets` | Dohvaćanje feeda (javno/opcionalno) | 🔓 |
| `POST` | `/tweets` | Kreiranje tweeta (podržava do 4 slike) | ✅ |
| `GET` | `/tweets/following` | Feed samo od ljudi koje pratite | ✅ |
| `POST` | `/tweets/:id/retweet` | Retweet funkcionalnost | ✅ |
| `POST` | `/likes/tweet/:id/like` | Lajkanje/Uklanjanje lajka s tweeta | ✅ |
| `POST` | `/comments` | Dodavanje komentara na tweet | ✅ |

### 👥 Korisnici & Praćenje (`/users`, `/follow`)
| Metoda | Ruta | Opis | Autentifikacija |
| :--- | :--- | :--- | :---: |
| `GET` | `/users/profile` | Dohvaćanje vlastitog profila | ✅ |
| `PUT` | `/users/profile` | Ažuriranje profila (avatar upload) | ✅ |
| `GET` | `/users/u/:username` | Pretraga korisnika po username-u | ✅ |
| `POST` | `/follow/:id` | Zaprati korisnika (ili pošalji zahtjev) | ✅ |
| `GET` | `/follow/requests` | Lista zahtjeva za privatne profile | ✅ |

### 💬 Poruke & Notifikacije (`/message`, `/notifications`)
| Metoda | Ruta | Opis | Autentifikacija |
| :--- | :--- | :--- | :---: |
| `POST` | `/message/send` | Slanje DM poruke | ✅ |
| `GET` | `/message/conversations` | Lista svih razgovora | ✅ |
| `GET` | `/notifications` | Dohvaćanje svih obavijesti | ✅ |
| `PATCH` | `/notifications/read-all`| Označavanje svih obavijesti pročitanim | ✅ |

### 🔍 Ostalo (`/suggestions`)
| Metoda | Ruta | Opis | Autentifikacija |
| :--- | :--- | :--- | :---: |
| `GET` | `/suggestions` | Prijedlozi ljudi za praćenje | ✅ |
| `GET` | `/suggestions/mentions` | Prijedlozi za @mention kod tipkanja | ✅ |

---


## 🛣️ Frontend Rute (Klijent)

Aplikacija je izgrađena kao **Single Page Application (SPA)** koristeći `react-router-dom`. Većina ruta je zaštićena i dostupna samo prijavljenim korisnicima.

### 🔓 Javne rute
| Ruta | Komponenta | Opis |
| :--- | :--- | :--- |
| `/login` | `<Login />` | Stranica za autentifikaciju korisnika. |
| `/register` | `<Register />` | Kreiranje novog korisničkog računa. |
| `/verify-email` | `<VerifyEmail />` | Stranica za potvrdu email adrese. |
| `/login-success`| `<LoginSuccess />` | Callback stranica nakon Google OAuth prijave. |

### 🔐 Zaštićene rute (Potrebna prijava)
| Ruta | Komponenta | Opis |
| :--- | :--- | :--- |
| `/` | `<Home />` | Glavni feed s tweetovima i formom za objavu. |
| `/notifications` | `<Notifications />` | Pregled svih interakcija i obavijesti. |
| `/messages` | `<Messages />` | Popis svih aktivnih razgovora (Direct Messages). |
| `/messages/:userId`| `<ChatDetail />` | Privatni chat s određenim korisnikom (WebSockets). |
| `/profile` | `<Profile />` | Pregled i uređivanje vlastitog profila. |
| `/profile/:username`| `<Profile />` | Pregled profila drugih korisnika. |
| `/search` | `<Search />` | Globalna pretraga korisnika i sadržaja. |

---

## 🏗️ Arhitektura Frontenda

* **State Management:** Korišten je **MobX** (`AuthStore`) za reaktivno upravljanje stanjem autentifikacije i korisničkim podacima.
* **Layout:** Sustav stupaca (Sidebar, Main Content, Right Panel) koji se dinamički prilagođava ovisno o statusu prijave.
* **UX Features:**
    * **Conditional Rendering:** Sidebar i RightPanel se prikazuju samo autentificiranim korisnicima.
    * **Smooth Scroll:** Implementiran "Scroll to Top" gumb koji se pojavljuje nakon 400px skrolanja.
    * **Auth Guards:** Automatsko preusmjeravanje neovlaštenih korisnika na `/login`.


---

## 🚀 Instalacija i Pokretanje

1. Kloniraj repozitorij:
   ```bash
   git clone [https://github.com/josipdom03/Twiter_clone.git](https://github.com/josipdom03/Twiter_clone.git)
=======
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
>>>>>>> 9d049cb09e4585744971cbd3b5bc5ce27fb1b7d4
