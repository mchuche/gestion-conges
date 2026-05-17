# CI/CD — GitHub Actions

Deux types de workflows :

| Workflow | Fichier | Déclencheur | Effet |
|----------|---------|-------------|--------|
| **CI** | `.github/workflows/ci.yml` | Push / PR sur `main` ou `develop` | Build front + API, migrations Prisma, tests |
| **CD préprod** | `.github/workflows/deploy-preprod.yml` | Push sur `develop` | SSH → LXC préprod, `docker compose up --build` |
| **CD prod** | `.github/workflows/deploy-prod.yml` | Push sur `main` | SSH → serveur prod, même procédure |

---

## 1. Prérequis sur chaque serveur (préprod + prod)

Le dépôt doit déjà être cloné (ex. `/opt/gestion-conges`), avec :

- **`.env.docker`** configuré (non versionné)
- **Docker** + **docker compose**
- Accès **Git** au dépôt GitHub (clé deploy en lecture seule si dépôt privé)

### Clé GitHub « Deploy key » sur le serveur (dépôt privé)

Sur le LXC, en tant qu’utilisateur SSH (ex. `root`) :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_gestion_conges -N ""
cat ~/.ssh/github_gestion_conges.pub
```

1. GitHub → dépôt **gestion-conges** → **Settings** → **Deploy keys** → **Add deploy key**
2. Coller la clé publique, cocher **Allow read access** uniquement

```bash
# ~/.ssh/config
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_gestion_conges
  IdentitiesOnly yes
```

Tester : `cd /opt/gestion-conges && git fetch origin`

---

## 2. Clé SSH pour GitHub Actions → serveur

Sur **ton PC** (une fois) :

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\gha_gestion_conges -N '""'
```

- **Clé privée** → secret GitHub `SSH_PRIVATE_KEY` (contenu complet du fichier, y compris `BEGIN` / `END`)
- **Clé publique** → sur **chaque** LXC, dans `~/.ssh/authorized_keys` de l’utilisateur utilisé pour le déploiement

```bash
# Sur le LXC (préprod puis prod)
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "CONTENU_CLE_PUBLIQUE_GHA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Tester depuis le PC :

```bash
ssh -i ~/.ssh/gha_gestion_conges root@IP_DU_LXC
```

---

## 3. Secrets GitHub

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Obligatoire | Exemple / description |
|--------|-------------|------------------------|
| `SSH_PRIVATE_KEY` | oui | Clé privée ed25519 pour Actions → serveurs |
| `SSH_USER` | oui | `root` ou utilisateur dédié |
| `PREPROD_SSH_HOST` | oui | IP ou hostname du LXC préprod |
| `PROD_SSH_HOST` | oui | IP ou hostname du serveur prod |
| `SSH_PORT` | non | `22` par défaut |
| `PREPROD_DEPLOY_PATH` | non | `/opt/gestion-conges` (défaut) |
| `PROD_DEPLOY_PATH` | non | `/opt/gestion-conges` (défaut) |

---

## 4. Environnements GitHub (optionnel mais recommandé)

**Settings** → **Environments**

### `preproduction`

- Associé au workflow **Deploy preprod**
- Pas d’approbation obligatoire (déploiement auto sur `develop`)

### `production`

- Associé au workflow **Deploy production**
- Cocher **Required reviewers** si tu veux valider chaque mise en prod à la main

---

## 5. Flux de travail au quotidien

```text
feature/*  →  merge dans develop  →  CI + déploiement préprod auto
       tests OK sur préprod
       merge develop → main       →  CI + déploiement prod auto
```

Déploiement manuel : **Actions** → choisir **Deploy preprod** ou **Deploy production** → **Run workflow**.

---

## 6. Dépannage

| Problème | Piste |
|----------|--------|
| CI échoue sur migrations | Vérifier que les migrations dans `api/prisma/migrations/` sont commitées |
| Deploy : `Permission denied (publickey)` | `SSH_PRIVATE_KEY`, `SSH_USER`, clé publique dans `authorized_keys` |
| Deploy : `git fetch` échoue | Deploy key GitHub sur le serveur, remote `origin` en SSH |
| Deploy : `docker compose` introuvable | Installer Docker Compose plugin sur le LXC |
| `.env.docker` manquant | Créer sur le serveur avant le premier CD |
| Page blanche après deploy | `DOCKER_PUBLIC_API_URL` / `DOCKER_CORS_ORIGINS` dans `.env.docker` |

---

## 7. Sécurité

- Ne jamais commiter `SSH_PRIVATE_KEY`, `.env.docker`, `api/.env`
- Utiliser des **JWT différents** entre préprod et prod
- Limiter la clé deploy GitHub en **lecture seule**
- Préférer un utilisateur Linux non-root pour SSH quand c’est possible
