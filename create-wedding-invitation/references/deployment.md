# Deployment

Always validate before packaging or publishing. Never publish based on an ambiguous request.

## Privacy gate

Before any public upload, tell the user that names, portraits, wedding time, venue, address, and embedded media can be downloaded by anyone with the URL. Confirm that the user wants a public deployment. Show the chosen account and review the exact release ZIP contents with the user; check photos for GPS/EXIF metadata and remove it before packaging when present. The packager rejects common EXIF/XMP markers but is not a complete metadata scrubber; manually review the optimized photos too. Do not upload if the user has not approved the included people, details, music and public visibility. `privacy.noindex` discourages search indexing but does not secure the site. Keep the original BGM and paper marked “严禁商用”. The reviewed ZIP must include materials.html and assets/NOTICES.txt; that restriction does not establish redistribution permission.

## Proactive delivery question

After the completed HTML passes its final visual check, explain the choice in plain language: a public HTTPS link opens on guests' phones without sending files, but names, photos, schedule, venue, address and music can be viewed or copied by anyone who reaches it; local-only avoids that upload but cannot be opened by remote guests through a localhost URL. Ask once whether to publish, use a personal Git repository, or keep files local. Do not ask again if the user already chose, declined or requested export only. A request to update this Skill is not permission to publish an existing invitation.

For free hosting, recommend Cloudflare Pages Direct Upload for this existing framework-free site. It does not require a Git repository. Confirm the account, project name and public access before creating a project or uploading. For personal Git, first clarify provider/repository, branch, public/private visibility, and whether the user wants source storage only or also a live webpage. Never infer that Git means GitHub or that a push enables hosting.

## Preferred paths

1. Preserve the user's selected hosting provider. If this is already a Sites-managed project, follow its available hosting Skill; do not migrate a completed portable invitation merely to offer hosting. Do not assume any provider or private access is free without checking its current plan.
2. Use Cloudflare Pages for a portable free static-hosting path when chosen. A Cloudflare account is required. Prefer available browser or computer-use tools to assist the user through Cloudflare sign-up/login and Workers & Pages → Create application → Pages / Direct Upload → project name → reviewed release ZIP upload → Deploy; inspect the live UI because labels change. Do not stop at instructions when the authenticated dashboard is accessible. The user personally enters passwords, verification codes, completes CAPTCHAs, and accepts terms; never ask them to send these in chat. Create the release ZIP with `package_invitation.py`; inspect its root for `index.html`, required CSS/JS and assets, and ensure it excludes `invitation.json`, private notes, credentials and unused originals. Do not upload the raw generated site folder. Wait for every asset to finish uploading. Wrangler accepts a folder, not a ZIP; `deploy_cloudflare.py` stages only the reviewed release files in a temporary folder for that path. No framework build step is needed for this static HTML site. Use the provider-assigned `pages.dev` HTTPS address; a purchased custom domain is optional, not required. Avoid broad CLI OAuth grants solely for this static upload.

   For assisted CLI deployment, run a preflight first:

   ```bash
   python3 scripts/deploy_cloudflare.py /absolute/path/invitation-site --project wedding-invite
   ```

   Create the Pages project once before the first CLI upload (for example, with `npx wrangler pages project create` in an authenticated terminal). The helper intentionally does not create remote resources during preflight.

   After explicit public-upload confirmation, run:

   ```bash
   python3 scripts/deploy_cloudflare.py /absolute/path/invitation-site --project wedding-invite --publish
   ```

   Use this CLI path only if the user chose it and the permission scope is appropriate; otherwise keep the browser upload path. Require an installed Wrangler CLI and an authenticated Cloudflare session. Do not place API tokens in command arguments, generated files, Git configuration, or chat output.
   The preflight validates local files and CLI availability, not account authentication, project existence or cloud quota. Check the authenticated account and target project separately, without exposing credentials. Direct Upload projects cannot later switch to built-in Git integration; choose Git integration initially if automatic redeployment from Git is desired, or explain that a new project would be needed.
3. If the user prefers Netlify Drop, check its current free-plan limits and account requirements before offering it as free. Upload through a browser only after confirmation of the public transfer and target account; never upgrade or attach paid services automatically.

## Local-only viewing

If the user declines deployment, give the absolute path to the generated `index.html` and, when practical, start the existing HTTP preview and provide its `http://127.0.0.1:<port>/` address. This address works only on the same computer while the preview server runs; it is not a link guests elsewhere can open. A phone on the same Wi-Fi can use the computer's LAN address only while that computer and server stay on; ask before exposing the preview to the local network. Offer PNG/PDF or the validated ZIP for viewing and later sharing, without calling any of them a public webpage.

## Account privacy

Keep account work confined to the current user task. Never copy a user's Cloudflare email, account ID, passwords, one-time codes, cookies, browser storage, OAuth callback URLs, API keys or tokens into this skill, template, invitation config, ZIP, repository, screenshots, notes or final answer. Do not extract credentials from a signed-in browser or create a persistent CLI token just for this workflow. If the agent initiated a temporary login, offer to sign out afterward; do not sign out of a pre-existing user session without asking. Browser and Cloudflare security logs or the user's saved-login settings are outside this skill's control, so do not promise that they disappear. The reusable skill must contain only generic instructions and sanitized assets.

## Personal Git and GitHub Pages

- Inspect the exact repository and working tree first. Confirm the target remote, branch, destination path and repository visibility; ask before creating a new remote repository. Do not change visibility, force-push or include unrelated parent-project files.
- Stage only reviewed invitation files; exclude secrets, `.env`, originals, guest data, development caches and previous exports unless explicitly requested. Build a clean release folder containing all referenced optimized assets; never upload the entire wedding workspace or delete original files to meet limits.
- A repository-only request ends with the verified repository link. It does not authorize Pages activation or deployment.
- For GitHub Pages, GitHub Free supports public repositories. Do not silently make a private repository public; offer Cloudflare Direct Upload or discuss the user's eligible plan instead. Repository privacy does not by itself make a published website private.
- For an approved static Pages deployment, put `index.html` at the selected publishing root (branch root or `/docs`), retain relative asset URLs for the repository subpath and use `.nojekyll` for plain static files when appropriate. Enable Settings → Pages for the confirmed source using available authenticated tools or guide the user through the UI. Check deployment status and the actual HTTPS URL, not just push success. Consult current official GitHub instructions for the chosen publishing mode.

## Free-plan and release checks

Official references checked 2026-09-15; recheck at deployment because plans and interfaces can change:

- [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/): dashboard upload supports 1,000 files, Wrangler up to 20,000; individual files up to 25 MiB. Upload optimized photos, not camera originals.
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/): verify current free quotas; never promise unlimited or permanent free service.
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): check repository eligibility, site size and traffic limits.
- [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site): follow the current publishing-source setup.

Stay within the free tier; stop and ask if a payment, upgrade or domain purchase is required. Test the deployed URL and media without the owner's login, then check mobile layout, gallery interaction and address navigation. Ask the user to try the link on their phone/mobile network and intended sharing app; a successful local preview or overseas-host check does not prove guest-network accessibility. Keep the PNG/PDF as a fallback.

For a newly assigned public URL, the first upload may still contain a relative `og:image`. Before asking guests to share the link, set `sharing.url` in the source configuration to the verified HTTPS invitation URL, regenerate into a new local folder, repeat validation and visual checks, and upload the reviewed release to the same project. Verify the final public HTML has an absolute HTTPS `og:image` and that the image itself loads without login. Do not present the first upload as share-card-ready.

## Handoff

Return the verified HTTPS URL, access level and update method, plus the repository link if requested. Do not present a predicted project URL as a successful deployment. If publishing fails or authentication is unavailable, keep the ZIP and exports as usable deliverables and report the smallest next step. Do not repeatedly retry authentication, create duplicate projects or switch providers without direction.
