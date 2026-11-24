# Copy/paste the following into VS Code Codex (Agent Mode)

You are working on my university group project named **SkillSwap**, located in the currently opened VS Code workspace. **Do not create a separate app or rewrite the interface into a generic website.** Inspect and continue the existing Rails application. If the folder is empty, generate an idiomatic Rails app using Ruby 3.3, Rails 8.1 and the requirements below. If there is already code, reuse and improve it. Do not delete working code.

## LECTURER REQUIREMENTS — MANDATORY
1. Group of six students.
2. Interactive **web application** with HTML, CSS and JavaScript; visually similar to the SkillSwap Figma interface, not a simple marketing website.
3. Every significant operation must interact with real JSON REST APIs, Rails controllers and a persistent MySQL database, **not hardcoded mock objects**.
4. Use the real **Rails MVC** pattern: models, views, controllers, routes, service objects and migrations.
5. App and database **MUST run in Docker Linux containers**, deployable to an **Ubuntu Server**.
6. Proposal Week 09 (Wednesday): title and exactly 3 objectives.
7. Submission before Week 14: GitHub source code and README/article with YouTube demo URL, plus a running deployment on Ubuntu Docker.

## AGREED TECHNOLOGY STACK — DO NOT CHANGE
- Ruby 3.3, Ruby on Rails 8.1, mysql2 adapter.
- Oracle MySQL 8.4 in its own Docker container. **NO PostgreSQL, MariaDB, SQLite, Flask or PHP/XAMPP**.
- Frontend HTML + CSS + vanilla JavaScript, ERB page shell, fetch() JSON API.
- Dockerfile and compose.yaml, named MySQL persistent volume, .env.example for secrets.
- Development using VS Code on Windows + Docker Desktop/WSL2, deployed in Ubuntu Docker.
- Do not add React, Next.js, payment systems, AI matching, subscription modules, or video calling.

## IMPORTANT DESIGN SOURCE
- Follow the existing student and admin SkillSwap interface in `Untitled (2).pdf` if the file is present under `reference/Untitled (2).pdf`. It is a 130-page prototype; don't commit the large reference PDF.
- Important original PDF screens: student Dashboard p1; Explore Skills p2; My Skills p3; My Matches p4; Skill Partner p5; Exchange Requests p6–8; Schedule Session p9; My Sessions p10–11; Notifications p12; My Profile/Edit p13–14; Admin Dashboard/Users/Categories/Monitor/Reports p15–19; Login/Register p20–21; Onboarding p22–24; empty/loading/filter states p25 onward; design system and prototype guidance p130.
- Look and feel: SkillSwap purple (#6C4CE4), teal (#19B8A8), white cards, very light lavender background (#F8F7FC), Inter/Poppins styling, consistent dashboard sidebar/topbar/mobile navigation, pill badges, rounded cards, hover/focus/loading/empty/success/error states.
- Use realistic *sample* data: Afiqah teaches Canva/wants Python; Ali teaches Python/wants Canva → mutual; Mei Lin is a partial match; students can have multiple skills.

## WORKFLOWS — IMPLEMENT AND TEST ALL

### Student account
- Register/login/logout with server-side secure password hashing, authentication sessions, email validation, optional university-domain restrictions.
- Student cannot self-create Admin. Admin account is seeded securely via environment variable.
- Add secure Forgot Password flow if practical (time-limited hashed reset token or built-in Rails password reset flow). If SMTP is not configured, keep demo clearly marked and document it; never claim it works when not implemented.
- Step onboarding: profile (name/university/programme/year/bio), skills I can teach with proficiency, skills I want to learn. Require both before finish.
- Edit profile; never return password digest through API; only authenticated owner can change it.

### Skills and discovery
- Category and Skill catalogue with meaningful sample skills and IDs.
- Offered skills / wanted skills: create, update, delete, server validations and owned-record authorization.
- Explore Skills: search by name/skill, filter by category/level, matching student cards; empty/loading states.
- Rule-based matching in `app/services/skill_matcher.rb`: MUTUAL only when user's wanted skill overlaps partner's offered AND user's offered overlaps partner's wanted; PARTIAL if one direction; NONE otherwise. Never call this AI.
- Match cards and partner detail page with offered/wanted skills, reviews and match explanation.

### Exchange requests
- Sender selects a skill they can teach and a partner skill they want to learn, sends optional message, sees Sent Requests.
- Receiver gets Received Request and notification; may Accept or Reject.
- Sender may Cancel a Pending request; any other status change should be forbidden and tested.
- Accepted Exchanges tab allows scheduling. Prevent duplicates/self-exchanges. Enforce authenticated participants and valid status transitions.

### Sessions, reviews and notifications
- Schedule ONLY accepted exchanges. Validate future times, end > start, method (Online/In Person), nonblank link/location and optional notes.
- Prevent overlapping active sessions for either participant; handle race conditions where practical.
- Session tabs Upcoming/Completed/Cancelled; only participants may access/update them.
- Mark completed only after end time; cancelled sessions cannot be reviewed.
- Each participant may submit at most one rating (1–5) and feedback per completed session; review is associated with the *other partner*.
- Persist notifications for request/accept/reject/session/review; unread count and mark read/all read; links navigate to correct pages.

### Admin (separate workspace)
- Admin-only Dashboard: total students, skills, exchanges, completed exchanges and charts.
- Manage Users: view/search, activate/deactivate (not public self-service).
- Manage Skill Categories: add/edit/delete only if safe; protect related skills.
- Monitor Exchanges: filter by status and display participants/session info.
- Reports: real counts and popular skills from MySQL, not fake totals from static PDF.

## DATABASE MODELS / MIGRATIONS
- users (student/admin, password_digest, active, onboarded, bio and university details)
- categories
- skills
- user_skills (user, skill, kind teach/learn, proficiency)
- exchanges (sender, receiver, offer_skill, learn_skill, status and message)
- learning_sessions (exchange, scheduled_by, starts_at/ends_at, method, detail, status)
- reviews (session, reviewer, reviewee, rating, feedback)
- notifications (user, title, message, target, is_read)
- Add foreign keys, indexes and unique constraints; avoid plaintext passwords, duplicate ratings, unauthorized cross-user queries and invalid status transitions.

## API ENDPOINTS
- /api/auth/register, /api/auth/login, /api/auth/logout, /api/me, /api/csrf
- /api/profile, /api/onboarding/complete
- /api/categories, /api/skills, /api/my-skills
- /api/explore, /api/matches, /api/partners/:id
- /api/exchanges, /api/exchanges/:id
- /api/sessions, /api/sessions/:id, /api/sessions/:id/reviews
- /api/notifications, /api/notifications/read-all
- /api/dashboard
- /api/admin/overview, /api/admin/users, /api/admin/categories, /api/admin/exchanges, /api/admin/reports
- Use Rails authenticity tokens for JSON writes, with same-origin cookies. Return useful HTTP codes/errors (400/401/403/404/409/422) and JSON messages. Do not disable CSRF to make requests "work".

## MANDATORY DEVELOPMENT PROCESS — NO SKIPPED STEPS
1. Inspect all current files and list missing components; summarize architecture and current blockers.
2. Verify Gemfile, routes, config, all models/controllers/services/views/JS/CSS; fix bugs without discarding PDF UI.
3. Confirm Dockerfile uses Ruby Linux image and mysql2 dependencies, compose uses official mysql:8.4, named volume, healthcheck, environment passwords, and that the web waits for db.
4. Make database migrations and seeds idempotent. Seed Afiqah, Ali, Mei Lin, Daniel, Sara, Haziq, Priya, plus seeded-only admin Nur Izzati. Ensure demo credentials are environment-configured, not hardcoded into public repo.
5. Implement remaining workflows. Validate matching, ownership, authorization and exchange/session state transitions server-side.
6. Improve accessibility, mobile responsiveness, error/loading/empty states and form validation.
7. Run `docker compose config`, `docker compose up -d --build`, `docker compose ps`, `docker compose logs web`, `docker compose exec web bundle exec rails db:prepare`, `docker compose exec web bundle exec rails db:seed`, and test Rails routes and API responses. If Docker unavailable in Codex environment, clearly say which commands were NOT actually run.
8. Write unit and integration tests: skill matcher (mutual/partial/none), auth, own-record access, admin permissions, request transitions, schedule validation, reviews.
9. Manually verify two browser sessions (Afiqah and Ali) send/receive and accept an exchange, schedule, notification, progress and persistence through refresh.
10. Update README with exact Windows+WSL2 instructions, Docker commands, database connection, Ubuntu deployment commands, 3-objective proposal, GitHub article outline, six-member division, full test checklist and YouTube video demo script.
11. Review source for exposed secrets, insecure endpoints, broken routes, misleading buttons and UI text that claims verification or completion when not actually implemented.
12. At the end, report **Files changed**, **Commands actually run and outputs**, **All passed tests**, **Remaining incomplete features**, and **Next exact commands I should run**. Do NOT claim full success without running tests. If a command fails, diagnose and fix, then re-run it. Do not skip any stage silently.

**Start now by auditing the existing workspace, then implement and test the first missing prerequisite. Do not just explain what I should do—edit code directly where your tools allow it.**
