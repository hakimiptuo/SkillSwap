# Required manual acceptance tests (must record PASS/FAIL)

1. `docker compose up -d --build` works from clean checkout (with .env).
2. `docker compose ps` shows `web` and `db` healthy/running.
3. Student registration creates user in MySQL, password stored as digest, never plaintext.
4. Login works, incorrect password fails, logout destroys session.
5. Student cannot visit/admin API endpoints (403).
6. New student onboarding requires at least one offered skill and one wanted skill.
7. Student can add/update/delete owned skills (not another student's).
8. Search filters by name/skill/category/level and has empty/loading states.
9. Afiqah offers Canva/wants Python; Ali offers Python/wants Canva → Mutual Match.
10. Only one-side match → Partial Match; no-match omitted from matches.
11. Student sends a request; recipient sees it on Received; sender sees it on Sent.
12. Recipient can accept/reject; sender can cancel pending; invalid transitions fail.
13. Accepted exchange can be scheduled; pending/rejected cannot.
14. End time must be later than start time; past times invalid.
15. Only participants can view/change their sessions; cancellation works.
16. Completed session can be reviewed once per participant; others cannot review.
17. Notifications appear for requests/status/session, read/unread counts update.
18. Admin can view students, disable/enable student account, categories, exchanges, reports.
19. Non-admin users cannot create or delete categories.
20. Refresh browser; data must persist in MySQL (not demo JavaScript-only state).
21. Run `docker compose exec web ruby -Itest test/services/skill_matcher_test.rb`.
22. Stop/start containers; database contents still exist (named volume).
23. Test responsive design against Figma PDF screenshots at desktop/mobile widths.
24. Deploy to Ubuntu Server; collect Docker commands, browser URL and screenshots.
25. GitHub README contains architecture, screenshots, Docker instructions, team, YouTube URL.

**Known first-pass follow-up:** Forgot Password currently shows an explanatory message (not yet implemented). Implement secure email-based reset if required for the final scope; never send passwords in plaintext.
