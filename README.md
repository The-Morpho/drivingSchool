# 🚗 Système de Gestion d'Auto-École

## 📋 Présentation du Projet

Une application web complète de gestion d'auto-école développée avec une architecture moderne et scalable. Ce système permet de gérer tous les aspects d'une auto-école : clients, instructeurs, véhicules, leçons, paiements et communications en temps réel.

L'application utilise une architecture client-serveur avec une interface utilisateur réactive construite en React/TypeScript et un backend robuste basé sur Node.js/Express avec MongoDB comme base de données NoSQL.

---

## 🎯 Objectifs

- **Gestion centralisée** : Offrir une plateforme unique pour gérer toutes les opérations d'une auto-école
- **Automatisation** : Réduire les tâches manuelles et améliorer l'efficacité opérationnelle
- **Accessibilité** : Fournir un accès basé sur les rôles pour différents types d'utilisateurs
- **Communication** : Faciliter la communication en temps réel entre instructeurs et étudiants
- **Traçabilité** : Assurer un suivi complet des leçons, paiements et assignations
- **Scalabilité** : Concevoir une architecture capable de supporter la croissance de l'auto-école

---

## 🛠️ Technologies Utilisées

### Frontend
- **React 18.3** - Bibliothèque UI pour construire l'interface utilisateur
- **TypeScript 5.5** - Typage statique pour un code plus robuste
- **Vite 5.4** - Build tool moderne et rapide
- **React Router DOM 7.9** - Navigation et routage côté client
- **Tailwind CSS 3.4** - Framework CSS utility-first pour le styling
- **Axios 1.13** - Client HTTP pour les requêtes API
- **Socket.IO Client 4.8** - Communication en temps réel (WebSocket)
- **Lucide React** - Icônes modernes et élégantes

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express 5.1** - Framework web minimaliste
- **MongoDB (Mongoose 8.19)** - Base de données NoSQL et ODM
- **Socket.IO 4.8** - Communication bidirectionnelle en temps réel
- **Redis 4.7** - Cache et adaptateur pour Socket.IO
- **Bcrypt 6.0** - Hachage de mots de passe
- **JWT** - Authentification par tokens (via middleware)
- **CORS 2.8** - Gestion des requêtes cross-origin



---

## 📊 Besoins Fonctionnels

### 1. Gestion des Utilisateurs et Authentification
- Inscription et connexion sécurisée
- Gestion des rôles (Admin, Manager, Instructor, Customer)
- Profils utilisateurs personnalisables
- Réinitialisation de mot de passe

### 2. Gestion des Clients
- Enregistrement des nouveaux clients
- Consultation et modification des informations clients
- Suivi du statut de formation
- Historique des leçons et paiements

### 3. Gestion du Personnel (Staff)
- Gestion des instructeurs et staff administratif
- Assignation des instructeurs aux clients
- Suivi des disponibilités
- Historique des performances

### 4. Gestion des Véhicules
- Inventaire des véhicules de l'auto-école
- Informations détaillées (immatriculation, modèle, état)
- Planification de l'utilisation
- Suivi de la maintenance

### 5. Gestion des Leçons
- Planification des leçons de conduite
- Assignation instructeur-client-véhicule
- Suivi de la progression
- Calendrier des sessions

### 6. Gestion des Paiements
- Enregistrement des paiements clients
- Suivi des montants dus et payés
- Génération de reçus
- Historique des transactions

### 7. Gestion des Adresses
- Enregistrement des adresses multiples
- Localisation géographique
- Points de départ/arrivée des leçons

### 8. Assignations Staff-Client
- Attribution des instructeurs aux étudiants
- Gestion des relations instructeur-client
- Suivi des assignations actives

### 9. Système de Chat en Temps Réel
- Communication instantanée entre utilisateurs
- Salles de discussion privées
- Historique des messages
- Notifications en temps réel

### 10. Tableau de Bord et Statistiques
- Vue d'ensemble des activités
- Métriques et KPIs
- Rapports personnalisés par rôle

---

## 👥 Acteurs et Cas d'Utilisation

### 1. 👨‍💼 Administrateur (Admin)
**Accès complet au système**

#### Cas d'utilisation :
- ✅ Gérer tous les utilisateurs (création, modification, suppression)
- ✅ Configurer les rôles et permissions
- ✅ Superviser toutes les opérations de l'auto-école
- ✅ Accéder à tous les modules (clients, staff, véhicules, leçons, paiements)
- ✅ Générer des rapports globaux
- ✅ Gérer les assignations staff-client
- ✅ Consulter et modérer les chats
- ✅ Gérer les adresses et véhicules
- ✅ Surveiller les paiements et finances

---

### 2. 👨‍💻 Manager (Gestionnaire)
**Gestion opérationnelle quotidienne**

#### Cas d'utilisation :
- ✅ Gérer les clients (ajout, modification, consultation)
- ✅ Gérer le personnel (instructeurs et staff)
- ✅ Planifier et assigner les leçons
- ✅ Gérer les véhicules disponibles
- ✅ Suivre et enregistrer les paiements
- ✅ Créer et gérer les assignations instructeur-client
- ✅ Communiquer via le système de chat
- ✅ Consulter le tableau de bord opérationnel
- ✅ Gérer les adresses
- ❌ Ne peut pas modifier les configurations système

---

### 3. 🚗 Instructeur (Instructor)
**Enseignement et suivi des étudiants**

#### Cas d'utilisation :
- ✅ Consulter son emploi du temps de leçons
- ✅ Voir la liste de ses clients assignés
- ✅ Mettre à jour le statut des leçons
- ✅ Consulter les informations des véhicules
- ✅ Communiquer avec les étudiants via chat
- ✅ Voir son profil et ses statistiques
- ✅ Consulter le tableau de bord personnel
- ❌ Ne peut pas gérer les paiements
- ❌ Ne peut pas modifier les assignations
- ❌ Accès limité aux informations du personnel

---

### 4. 🎓 Client/Étudiant (Customer)
**Apprentissage et suivi de progression**

#### Cas d'utilisation :
- ✅ Consulter son calendrier de leçons
- ✅ Voir ses paiements effectués et à venir
- ✅ Communiquer avec son instructeur via chat
- ✅ Consulter son profil et progression
- ✅ Voir le tableau de bord personnel (leçons à venir, paiements)
- ❌ Accès limité uniquement à ses propres données
- ❌ Ne peut pas voir les autres clients
- ❌ Ne peut pas gérer les véhicules ou le personnel
- ❌ Ne peut pas modifier les leçons (consultation uniquement)

---

## 📁 Structure du Projet

```
project/
├── server/                    # Backend Node.js
│   ├── controllers/          # Logique métier
│   │   ├── addressController.js
│   │   ├── assignmentController.js
│   │   ├── crudController.js
│   │   ├── customerController.js
│   │   ├── lessonController.js
│   │   ├── managerController.js
│   │   ├── paymentController.js
│   │   ├── staffController.js
│   │   └── vehicleController.js
│   ├── models/              # Modèles MongoDB (Mongoose)
│   │   ├── Account.js
│   │   ├── Address.js
│   │   ├── ChatRoom.js
│   │   ├── Customer.js
│   │   ├── CustomerPayment.js
│   │   ├── Lesson.js
│   │   ├── Manager.js
│   │   ├── Message.js
│   │   ├── Staff.js
│   │   ├── StaffCustomerAssignment.js
│   │   ├── User.js
│   │   └── Vehicle.js
│   ├── routes/              # Routes API
│   │   ├── api.js
│   │   └── chatRoutes.js
│   ├── socket/              # Gestion WebSocket
│   │   └── socketHandler.js
│   ├── middleware/          # Authentification, validation
│   │   └── auth.js
│   ├── db.js                # Configuration MongoDB
│   └── server.js            # Point d'entrée serveur
├── src/                      # Frontend React
│   ├── components/          # Composants réutilisables
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   └── Table.tsx
│   ├── pages/               # Pages de l'application
│   │   ├── Addresses.tsx
│   │   ├── Chat.tsx
│   │   ├── Customers.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Lessons.tsx
│   │   ├── Login.tsx
│   │   ├── Payments.tsx
│   │   ├── Profile.tsx
│   │   ├── Staff.tsx
│   │   ├── StaffCustomerAssignment.tsx
│   │   └── Vehicles.tsx
│   ├── services/            # Services API et Socket
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── hooks/               # Hooks personnalisés
│   │   └── useFetch.ts
│   ├── utils/               # Utilitaires et permissions
│   │   └── rolePermissions.ts
│   ├── App.tsx              # Composant principal
│   ├── main.tsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── package.json             # Dépendances du projet
├── vite.config.ts           # Configuration Vite
├── tailwind.config.js       # Configuration Tailwind
└── tsconfig.json            # Configuration TypeScript
```

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v18 ou supérieur)
- MongoDB (local ou Atlas)
- Redis (optionnel, pour Socket.IO adapter)

### Configuration

Créer un fichier `.env` à la racine du projet :

```env
MONGODB_URI=mongodb://localhost:27017/driving-school
PORT=3000
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```
## 🔐 Système de Permissions

Le système utilise un contrôle d'accès basé sur les rôles (RBAC) :

| Route | Admin | Manager | Instructor | Customer |
|-------|-------|---------|------------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ | ❌ |
| Staff | ✅ | ✅ | ❌ | ❌ |
| Vehicles | ✅ | ✅ | ✅ | ❌ |
| Lessons | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ❌ | ✅ |
| Addresses | ✅ | ✅ | ❌ | ❌ |
| Assignments | ✅ | ✅ | ❌ | ❌ |
| Chat | ✅ | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ | ✅ |

---

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/logout` - Déconnexion

### Clients
- `GET /api/customers` - Liste des clients
- `POST /api/customers` - Créer un client
- `PUT /api/customers/:id` - Modifier un client
- `DELETE /api/customers/:id` - Supprimer un client

### Personnel
- `GET /api/staff` - Liste du personnel
- `POST /api/staff` - Ajouter un membre du personnel
- `PUT /api/staff/:id` - Modifier un membre
- `DELETE /api/staff/:id` - Supprimer un membre

### Véhicules
- `GET /api/vehicles` - Liste des véhicules
- `POST /api/vehicles` - Ajouter un véhicule
- `PUT /api/vehicles/:id` - Modifier un véhicule
- `DELETE /api/vehicles/:id` - Supprimer un véhicule

### Leçons
- `GET /api/lessons` - Liste des leçons
- `POST /api/lessons` - Créer une leçon
- `PUT /api/lessons/:id` - Modifier une leçon
- `DELETE /api/lessons/:id` - Annuler une leçon

### Paiements
- `GET /api/payments` - Liste des paiements
- `POST /api/payments` - Enregistrer un paiement
- `GET /api/payments/:id` - Détails d'un paiement

### Chat (WebSocket)
- `socket.on('join-room')` - Rejoindre une salle
- `socket.on('send-message')` - Envoyer un message
- `socket.on('receive-message')` - Recevoir un message

---

## 📊 Modèles de Données

### User
```javascript
{
  email: String,
  password: String,
  role: ['admin', 'manager', 'instructor', 'customer'],
  isActive: Boolean
}
```

### Customer
```javascript
{
  account_id: ObjectId,
  first_name: String,
  last_name: String,
  phone_number: String,
  date_of_birth: Date,
  license_status: String,
  enrollment_date: Date
}
```

### Lesson
```javascript
{
  customer_id: ObjectId,
  instructor_id: ObjectId,
  vehicle_id: ObjectId,
  lesson_date: Date,
  duration: Number,
  status: String,
  notes: String
}
```

### Payment
```javascript
{
  customer_id: ObjectId,
  amount: Number,
  payment_date: Date,
  payment_method: String,
  status: String
}
