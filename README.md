# SkillSwap

SkillSwap is a university project that helps students teach and learn from one another. Its objectives are to make peer learning easier to discover, support the full exchange from request to feedback, and give administrators a view of participation across the platform.

The classroom demonstration ran on a local Ubuntu Server virtual machine in Oracle VirtualBox. The application used Rails production mode and was accessed from Windows through an SSH tunnel.

## Implemented features

| Student area | What students can do |
| --- | --- |
| Account and onboarding | Register, sign in and out, and select at least one skill to teach and one to learn. |
| Dashboard | See exchange activity, upcoming sessions, and summary counts. |
| My Skills | Add, edit, and remove teaching and learning skills. Set proficiency for teaching skills. |
| Explore, Matches, and partner profiles | Search and filter by skill, category, and proficiency. Find mutual or partial matches and view partner profiles, skills, and ratings or feedback when available. |
| Exchange Requests | Send a proposed skill swap with a message, view sent and received requests, accept or reject incoming requests, and cancel outgoing pending requests. |
| Learning Sessions | Schedule an accepted exchange with start and end times, an online link or in-person location, and optional notes. View session details, cancel a scheduled session, or complete it after it ends. |
| Reviews | Give a partner a one-to-five-star rating and written feedback after a completed session. View received reviews on My Profile with the reviewer's name, stars, feedback, and date when available. |
| Notifications | View in-app updates about requests, sessions, and received reviews. Mark individual notifications or all notifications as read. |
| My Profile | View and edit profile details, see the completed exchange count, and open exchange history. |

| Admin area | What administrators can do |
| --- | --- |
| Overview | View totals for students, skill entries, exchanges, completed sessions, pending requests, and categories. |
| Manage Students | Search by name, email, or university, filter by account status, and inspect profile details, skills, and activity counts. Activate or deactivate student accounts. |
| Manage Categories | Create and rename categories. Delete categories that contain no skills. |
| Monitor Exchanges | Inspect exchange participants, offered and requested skills, request status, and linked session status. |
| Reports | View request and acceptance totals, scheduled and completed session counts, the most popular learning skills, and the average review rating. |

## Technology stack and architecture

- **Backend:** Ruby 3.3, Ruby on Rails 8.1, Puma, and Rails JSON API controllers.
- **Frontend:** ERB views, HTML, CSS, and vanilla JavaScript using the Fetch API.
- **Database:** Oracle MySQL 8.4, Active Record, and the mysql2 adapter.
- **Deployment:** Docker Engine and Docker Compose on Ubuntu Server, with Docker Desktop and WSL 2 for Windows development.

Rails routes in `config/routes.rb` direct page and API requests to controllers. The **views** provide the sign-in, registration, and workspace shells. The browser loads the interactive UI from `public/assets/` and calls `/api/*` endpoints for data and actions. The **controllers** authenticate users, enforce roles and record access, and return JSON. The **models** use Active Record to validate data and persist it in MySQL. The `SkillMatcher` service compares teaching and learning skill sets.

## Database structure

| Table | Purpose and relationships |
| --- | --- |
| `users` | Student and admin profiles with unique email addresses, password digests, roles, and account status. |
| `categories` | Groups the skill catalogue. One category has many skills. |
| `skills` | Catalogue entries. Each skill belongs to a category. |
| `user_skills` | Links users and skills. A user can associate a skill once per kind, teaching or learning. |
| `exchanges` | Links sending and receiving users, an offered skill, and a requested skill. Stores request status and the optional message. |
| `learning_sessions` | Each session belongs to one exchange and records who scheduled it, when and where it takes place, and its status. An exchange can have at most one session. |
| `reviews` | Links a learning session, reviewer, and review recipient. Each reviewer can submit at most one review per session. |
| `notifications` | Each notification belongs to one user and stores its message, navigation target, and read status. |

The migration under `db/migrate/` defines the tables, foreign keys, and unique indexes. Named Docker volumes persist MySQL data across container restarts.

## Project structure

```text
app/
  controllers/       Rails page, student API, and admin API controllers
  models/            Active Record models and validations
  services/          Skill-matching rules
  views/             ERB sign-in, registration, and workspace templates
config/              Routes, database settings, and Rails environment settings
db/
  migrate/           MySQL schema definitions
  seeds.rb           Skill catalogue and optional classroom demo data
docs/                Assignment materials and acceptance checklist
public/assets/       Browser JavaScript and CSS
test/services/       Skill-matching unit tests
Dockerfile           Windows development container image
compose.yaml         Development web and database services
Dockerfile.production
compose.production.yaml
.env.example
.env.production.example
```

`UI_PREVIEW_ONLY.html` is the standalone static prototype. Open the Rails application to demonstrate the database-backed workflows.

## Windows development setup

1. Install Git and Docker Desktop with the WSL 2 Linux engine. Start Docker Desktop and open PowerShell in the project directory. [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
2. For a fresh checkout, create and edit the development environment file.

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Replace the example database passwords with distinct strong values. To create demo accounts, replace the demo password placeholder with a new temporary password of at least 12 characters, including a digit. Leave `DEMO_PASSWORD` blank for a catalogue-only installation.
3. Start the services and open [the local application](http://localhost:3000).

   ```powershell
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail=80 web
   ```

4. For a fresh demo database, run `docker compose exec web bundle exec rails db:seed` after setting the demo password. If the development container was already running when you edited `.env`, rerun `docker compose up -d` first to apply the environment change.

The web container connects to MySQL at `db:3306`. Optional Windows database clients can connect to `127.0.0.1:3307` with the development database settings from `.env`. Docker supplies the Ruby and MySQL runtimes.

## Classroom deployment on Ubuntu Server

The following versions and record counts were supplied from the project's verified classroom deployment.

| Component | Verified environment |
| --- | --- |
| Guest operating system | Ubuntu Server 26.04.1 LTS |
| Virtualisation | Oracle VirtualBox |
| Docker Engine | 29.1.3 |
| Docker Compose | 2.40.3 |
| Rails | 8.1 |
| MySQL | 8.4 |

### Start the production-mode services

1. On the Ubuntu VM, install Docker Engine and the Compose plugin. Confirm the installed versions with `docker --version` and `docker compose version`. Enable the OpenSSH server for tunnel access. [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
2. Put a clean checkout of the project on the VM. For a fresh deployment, create a private environment file from the template.

   ```bash
   umask 077
   cp .env.production.example .env.production
   chmod 600 .env.production
   nano .env.production
   ```

   Set strong, distinct values for `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD`. Generate `SECRET_KEY_BASE` with `openssl rand -hex 64` in a private Ubuntu terminal, then copy the generated value into `.env.production`. Keep the file outside Git and avoid capturing it in screenshots or the demo video. Keep the same key across restarts so existing session cookies remain valid.
3. From the project directory, use the production Compose file with the production environment file.

   ```bash
   docker compose --env-file .env.production -f compose.production.yaml up -d --build
   docker compose --env-file .env.production -f compose.production.yaml ps
   docker compose --env-file .env.production -f compose.production.yaml logs --tail=80 web
   curl -I http://127.0.0.1:3001/
   ```

   Compose builds the web service using `Dockerfile.production`, waits for MySQL to become healthy, and starts Rails after running `db:prepare`. The database uses a named volume and has no published port in production Compose. The web service publishes container port `3000` to the Ubuntu VM's loopback port `3001`.

### Open the application from Windows through SSH

With VirtualBox NAT networking, configure a **TCP** forwarding rule from Windows host `127.0.0.1:2222` to SSH port `22` on the Ubuntu guest. Run this command in Windows PowerShell, replacing `ubuntu_username` with the VM account name.

```powershell
ssh -N -o ExitOnForwardFailure=yes -p 2222 -L 127.0.0.1:3002:127.0.0.1:3001 ubuntu_username@127.0.0.1
```

Keep the SSH session open and visit [the classroom demo](http://127.0.0.1:3002). The Windows browser connects to local port `3002`, and SSH carries the traffic to Ubuntu loopback port `3001`. The VM is a classroom demonstration accessed through the tunnel.

### Seed a fresh classroom database

Use `db/seeds.rb` on a fresh, isolated demo database. The seed script creates the catalogue and, when given a valid temporary `DEMO_PASSWORD`, creates sample student and admin accounts, teaching and learning skills, and sample activity. The admin account comes from the seed script. Public registration creates student accounts only. Account identifiers are listed in the seed source.

For the production-mode classroom stack, pass the password only to a one-off seed container. The prompt below keeps the password out of shell history and hides it while typing. Use a fresh temporary value of at least 12 characters that includes a digit.

```bash
(
  read -rsp 'Temporary demo password: ' DEMO_PASSWORD
  printf '\n'
  export DEMO_PASSWORD
  docker compose --env-file .env.production -f compose.production.yaml run --rm -e DEMO_PASSWORD web bundle exec rails db:seed
)
```

Use the sample accounts only in the isolated demo. They share the temporary seed password when first created. Seeding again can update sample profiles or reactivate sample accounts and will not replace existing account passwords. A fresh installation can demonstrate the workflows directly from seed data, without importing a private SQL backup or reproducing the counts from the manually exercised VM.

## Verified database snapshot

These counts describe the classroom VM after manual use.

| Record type | Count |
| --- | ---: |
| Users | 8 |
| Skills | 14 |
| Categories | 8 |
| Exchanges | 6 |
| Learning sessions | 3 |
| Reviews | 2 |

## Security measures

- Rails stores bcrypt password digests and resets the session during registration, login, and logout. Inactive accounts cannot authenticate or continue using authenticated endpoints.
- JSON write requests are subject to Rails CSRF protection. The session cookie uses `SameSite=Lax`.
- Student and admin endpoints enforce role checks. Exchange and session actions check participation. The own-profile reviews endpoint uses the signed-in student as the review recipient.
- Partner profile responses omit email addresses. The own-profile review response exposes only the reviewer's name, rating, feedback, and date. The browser escapes review names and feedback before rendering.
- Environment files hold deployment credentials. Git and Docker ignore the private environment files, Rails key files, and local backup directory. The production classroom stack keeps the web service on guest loopback and MySQL on the Compose network.

## Manual testing and reproducible checks

Manual deployment and Admin testing were completed on the classroom VM, as reported by the project owner. The deployment record includes the production-mode stack, SSH tunnel from Windows, and database snapshot above. The Admin screens available for demonstration are Overview, Manage Students, Manage Categories, Monitor Exchanges, and Reports. See the [manual acceptance checklist](docs/ACCEPTANCE_TESTS.md) for repeatable test cases.

On the development stack, run the matching unit tests and inspect routes and migration status with these commands.

```powershell
docker compose exec web ruby -Itest test/services/skill_matcher_test.rb
docker compose exec web bundle exec rails routes
docker compose exec web bundle exec rails db:migrate:status
```

## Current limitations

- The Forgot Password control does not send a password reset email. Registration validates email format and supports an optional domain restriction, but does not verify mailbox ownership.
- Notifications appear inside the application. Session scheduling supports one session per exchange, with no cross-exchange conflict check or built-in video calls.
- Automated tests cover the matching service. The deployment and application workflows use manual browser checks.
- The classroom Compose setup uses HTTP over the SSH tunnel with Rails SSL enforcement disabled and no Rails host allowlist. Internet hosting would require separate HTTPS, host restrictions, secure-cookie configuration, and operational controls.

## Submission materials

| Item | Placeholder |
| --- | --- |
| Team members | Add the six team members' names and contributions with their permission. |
| Screenshots | Add student dashboard, My Profile reviews, Admin Reports, and the Ubuntu deployment. Remove private data from screenshots. |
| GitHub repository | Add the final repository URL. |
| YouTube demonstration | Add the final demonstration URL. |

Keep environment files, SQL dumps, original design assets with restricted access, and oversized files outside the submission. GitHub blocks ordinary Git files larger than 100 MiB. [GitHub file size limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
