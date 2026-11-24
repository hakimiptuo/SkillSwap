# Six-person team allocation

| Person | Primary ownership | Files/modules | Demo evidence |
|---|---|---|---|
| 1 | Authentication and profiles | `auth_controller.rb`, `profile_controller.rb`, user model, login/register/onboarding | Register + login + edit profile |
| 2 | UI framework and dashboard | `public/assets/css/style.css`, dashboard JS, responsive layouts | Dashboard renders in mobile/desktop |
| 3 | Skill CRUD + search | `my_skills_controller.rb`, `catalog_controller.rb`, skill/category models | Create/edit/delete skill; search + filter |
| 4 | Rule-based matches + requests | `skill_matcher.rb`, matches/exchanges controllers | Mutual vs partial; send/accept/reject |
| 5 | Scheduling, notifications and reviews | sessions/notifications controllers, review model | Schedule, complete and review |
| 6 | Admin, MySQL and Ubuntu deployment | admin controllers, migrations, seeds, Dockerfile, compose, CI/tests | Admin management, Docker logs, MySQL records |

**Shared responsibility for everyone:** code review, integration, testing, GitHub commits, documentation and YouTube presentation.

Each member must create meaningful commits; do not put all modifications on one account. Use feature branches and pull requests.
