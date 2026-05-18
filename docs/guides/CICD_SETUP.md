# CI/CD — GitHub Actions

| Workflow | Fichier | Où ça tourne | Déclencheur |
|----------|---------|--------------|-------------|
| **CI** | `ci.yml` | GitHub (cloud) | Push / PR sur `main` ou `develop` |
| **Deploy préprod** | `deploy-preprod.yml` | **Runner self-hosted** (chez toi) | Push sur `develop` |
| **Deploy prod** | `deploy-prod.yml` | **Runner self-hosted** (chez toi) | Push sur `main` |

La préprod est en `192.168.0.x` : les runners **cloud** ne peuvent pas s’y connecter. Le **runner self-hosted** est le « client » installé sur ton réseau local.

---

## 1. Installer le runner self-hosted (une fois)

Sur une machine **toujours disponible** sur le LAN (petit LXC Debian, PC fixe, etc.) — **pas obligatoirement** le LXC préprod lui-même.

1. GitHub → dépôt **gestion-conges** → **Settings** → **Actions** → **Runners**
2. **New self-hosted runner** → **Linux** → **x64**
3. Suivre les commandes affichées (téléchargement + `./config.sh`)

Lors de la configuration, ajouter le label personnalisé :

```bash
./config.sh --labels gestion-conges
```

(Si le label est déjà passé par l’interface GitHub, vérifier qu’il contient bien `gestion-conges`.)

4. Installer en service (recommandé) :

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

5. Vérifier : l’état du runner doit être **Idle** (vert) dans **Settings → Actions → Runners**.

Les workflows deploy utilisent :

```yaml
runs-on: [self-hosted, gestion-conges]
```

---

## 2. Prérequis sur chaque serveur (préprod + prod)

Dans `/opt/gestion-conges` (ou le chemin indiqué par les secrets) :

- **`.env.docker`** configuré
- **Docker** + **docker compose**
- **Git** : `git fetch origin` fonctionne (deploy key si dépôt privé)

### Deploy key GitHub (dépôt privé)

Sur **chaque** LXC cible, utilisateur SSH du déploiement (ex. `root`) :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_gestion_conges -N ""
cat ~/.ssh/github_gestion_conges.pub
```

GitHub → **Settings** → **Deploy keys** → coller la clé, **lecture seule**.

```bash
# ~/.ssh/config sur le serveur
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_gestion_conges
  IdentitiesOnly yes
```

Test : `cd /opt/gestion-conges && git fetch origin`

---

## 3. Clé SSH (runner → serveurs)

Même clé que pour tester depuis ton PC :

- **Privée** → secret `SSH_PRIVATE_KEY`
- **Publique** → `~/.ssh/authorized_keys` sur **préprod** et **prod**

Test depuis le PC (clé sans mot de passe une fois OK) :

```powershell
ssh -i $env:USERPROFILE\.ssh\gha_gestion_conges root@192.168.0.50
```

Le runner self-hosted utilise les mêmes secrets ; il doit pouvoir joindre les IP des serveurs.

---

## 4. Secrets GitHub (Actions)

**Settings** → **Secrets and variables** → **Actions**

### Obligatoires

| Secret | Exemple | Rôle |
|--------|---------|------|
| `SSH_PRIVATE_KEY` | contenu de `gha_gestion_conges` | Auth SSH |
| `SSH_USER` | `root` | Utilisateur SSH |
| `PREPROD_SSH_HOST` | `192.168.0.50` | IP LAN du LXC préprod |
| `PROD_SSH_HOST` | IP LAN prod **ou** hostname si joignable depuis le runner | Voir note ci-dessous |

### Optionnels

| Secret | Défaut si absent | Rôle |
|--------|------------------|------|
| `SSH_PORT` | `22` | Port SSH |
| `PREPROD_DEPLOY_PATH` | `/opt/gestion-conges` | Dossier git sur préprod |
| `PROD_DEPLOY_PATH` | `/opt/gestion-conges` | Dossier git sur prod |

### `PROD_SSH_HOST` : quelle valeur ?

- Prod sur le **même LAN** que le runner → IP locale (ex. `192.168.0.51`) ou hostname local.
- Prod **uniquement** sur Internet → hostname public **seulement si** le runner peut l’atteindre (même réseau, VPN, ou prod aussi en local).

Le runner ne sort pas forcément par Internet : une IP `192.168.0.x` est **correcte** pour préprod **et** prod si tout est chez toi sur Proxmox.

### Ce que tu as déjà configuré

| Secret | Statut |
|--------|--------|
| `SSH_PRIVATE_KEY` | OK |
| `SSH_USER` | OK |
| `SSH_PORT` | OK (souvent `22`) |
| `PROD_DEPLOY_PATH` | OK si ton chemin prod ≠ défaut ; sinon optionnel |
| `PREPROD_SSH_HOST` | **À ajouter** (ex. `192.168.0.50`) |
| `PROD_SSH_HOST` | **À ajouter** (IP ou hostname prod) |
| `PREPROD_DEPLOY_PATH` | Optionnel (défaut `/opt/gestion-conges`) |

Rien à **supprimer** parmi ce que tu as mis.

---

## 5. Environnements GitHub (optionnel)

**Settings** → **Environments**

- **`preproduction`** — workflow Deploy preprod
- **`production`** — approbation manuelle possible pour la prod

---

## 6. Flux quotidien

```text
feature/*  →  develop  →  CI (cloud) + deploy préprod (runner maison)
              tests OK
              merge → main  →  CI (cloud) + deploy prod (runner maison)
```

Déploiement manuel : **Actions** → **Deploy preprod** ou **Deploy production** → **Run workflow**.

---

## 7. Dépannage

| Problème | Piste |
|----------|--------|
| Job deploy « en attente » longtemps | Runner éteint ou label `gestion-conges` manquant |
| `Permission denied (publickey)` | `SSH_PRIVATE_KEY` + `authorized_keys` sur le bon serveur |
| `git fetch` échoue | Deploy key sur le LXC cible |
| `PREPROD_SSH_HOST` / `PROD_SSH_HOST` vide | Ajouter les secrets manquants |
| CI échoue | Migrations / tests — voir logs **CI** (cloud) |

---

## 8. Sécurité

- Runner self-hosted : ne pas exécuter de workflows de PR inconnus sans règle de protection (**Settings** → **Actions** → **Fork pull request workflows**).
- Secrets JWT et `.env.docker` différents entre préprod et prod.
- Clé deploy GitHub en lecture seule uniquement.
