---
name: create-witness-wedding-invitation
description: Create, validate, and optionally publish a personalized witness-mode mobile wedding invitation with a secret letter, identity confirmation, recipient-specific letter, continuous photo projection, witness mission, and effect-only task acceptance. Use for 见证者模式、神秘来信、专属宾客信件、见证任务 or a personalized interactive wedding invitation. Do not use for the separate classic four-screen exhibition invitation.
---

# Create Witness Wedding Invitation

Create a mobile-first static invitation that treats the guest as a participant in the wedding story. Use the bundled template as a faithful configurable replica of the latest `wedding-invitation-classic/witness.html`; do not redesign or simplify its visual language, content rhythm, interactions, or sequence unless the user explicitly asks. Preserve: secret letter → identity check and reveal animation → personal letter → continuous draggable photo projection → witness mission → effect-only task acceptance → mission accepted.

## Conversation

Open like a thoughtful invitation designer, not a form. Briefly describe the experience the user will get, reassure them that a general version can be previewed and adjusted, then ask one easy question. For example: “我们一起做一封有仪式感的婚礼来信吧。我先做一份所有亲友都能看的版本，做好后给你预览，喜欢的地方保留，不合适的地方再调。请柬上想写哪两位新人的名字？” Vary the wording naturally; do not recite this as a fixed script.

Continue conversationally: acknowledge information already given, ask only for the next missing decision, and let the user answer in ordinary language. After learning both names, if the user has not explicitly chosen their display order, ask naturally: “请柬上想把谁的名字放在前面？” Do not infer display order from who is the groom or bride, or merely from the order in which the names were supplied. If the user already specified the display order, do not ask again. Collect date/time and venue after names; request photos, music preferences or personal wording when they become useful, allowing them to be added later. Do not open with a field checklist, JSON schema, relationship codes, deployment choices or technical terms. If the user supplies several facts at once, use them and do not ask again. After showing the general version, ask for feedback. When introducing relationship-specific letters after that, first explain what carries over and what changes; do not make it sound like the user must start the invitation over.

## Workflow

1. Inspect the destination and supplied photos/music. Never overwrite an existing invitation without approval.
2. Collect the shared couple, event, copy, media and mission details using [references/input-schema.md](references/input-schema.md). Make the first site a general invitation: use the `通用亲友` letter (`00`), with `recipient.name` set to `亲友` and `recipient.verifyName` set to `false` unless the user already supplied a specific recipient. Do not ask about relationship-specific versions yet.
3. Create a UTF-8 JSON configuration, then run:

   ```bash
   python3 scripts/create_witness_invitation.py --config /absolute/path/invitation.json --output /absolute/path/output
   ```

4. Run `python3 scripts/validate_witness_invitation.py /absolute/path/output`; fix errors and explain warnings.
5. Open the bundled template's `assets/witness-template/index.html` directly and verify its sanitized demo flow can reach identity confirmation without a server. Then preview the generated general invitation over HTTP and test the full story on a phone viewport. Verify sequential scene unlocking, successful and rejected identity paths, the rejected-path hidden passphrase easter egg (wrong answer and “百无禁忌” success), name propagation, personal letter, continuous gallery movement and dragging, lightbox, mission details, effect-only acceptance, music pause/resume and one-screen proportions. Show the general version to the user and refine it until they confirm the structure is usable; this is not approval to package or publish.
6. Ask what photos and other remaining materials the user wants to add. Integrate them into the general version and recheck the full phone-sized experience, especially gallery movement, image crops, readable placeholders and page proportions. If the user wants a photo-free final invitation, confirm that choice explicitly. Do not treat a placeholder preview as a finished invitation.
7. Once the general structure is approved, introduce relationship-specific letters by explaining that the existing design, photos, music, date and venue are reused; the recipient's name, greeting and letter wording are personalized, and each person gets a separate version (and separate link if published). No need to repeat the earlier setup or re-upload common materials. Then ask whether the user wants any such versions. If yes, offer relationship names with optional codes from [references/relation-letters.json](references/relation-letters.json), collect each recipient's name and relationship, review the wording with the user, and generate a separate validated site per recipient. Lead with names such as “家人（01）” rather than raw codes.
8. Only after the user confirms all intended materials and wording are final, validate and package each completed version:

   ```bash
   python3 scripts/package_witness_invitation.py /absolute/path/output --output /absolute/path/invitation.zip
   ```

9. After final approval, offer optional publishing in plain language: a public link opens on guests' phones without sending files, while names, event details, photos and recipient-specific letters become publicly reachable and may be copied or indexed. Explain that the identity check is theatrical, not access protection. Ask whether to publish or keep the invitation local; do not repeat a choice already made. Follow [references/deployment.md](references/deployment.md) for local viewing, Cloudflare Pages direct upload, account handoff, privacy and post-publication checks. Publishing remains opt-in.

## Rules

- If a user explicitly supplies or selects material whose authorization is unverified, record that status and mark it “严禁商用，授权状态未确认” in its materials notice. This label is not a license grant. Do not apply it to this skill's documented CC0 or CC BY 4.0 defaults.

- Preserve corrected names, date, time, venue and user-chosen display order everywhere. Never default to groom-first or bride-first when the user has not chosen. Do not invent guest relationships, shared memories, task items or RSVP responses.
- Relationship codes 00–14 are an internal selection aid. Accept either a relationship name or its code; use the user's exact relationship choice. Handwritten letter fields override the selected template. If the user has not chosen a relationship, use the general letter. Review relation-specific wording with the user before publishing.
- A strict identity check is theatrical personalization, not authentication or access control. Static HTML cannot securely protect the letter. Say so before public hosting.
- The first deliverable is the general invitation. After the user approves it, generate one separate site per recipient for any requested relationship-specific versions. If batch generation is requested, keep recipient outputs separate and confirm the intended sharing method; never expose the batch guest list inside one public page.
- Keep task acceptance as an effect-only button. Do not request attendance choice, companion count or blessings; do not store or submit any response. The button only transitions to the mission-accepted scene.
- Show the mission timeline only when the user has supplied distinct, confirmed schedule items. Do not fill an otherwise empty timeline with a one-line wedding-time placeholder; the mission card's Date, Time and Venue fields already carry the core event details.
- Use supplied portraits only. Missing photos render an explicit placeholder; never borrow another couple's images. Check every photo slot on a phone viewport, including the mission-accepted polaroid: the “照片待添加” label must remain clearly visible and must not be cropped by its frame.
- In the photo lightbox, show a title or caption only when the user supplied meaningful, photo-specific wording. If either is absent, hide that element; if both are absent, show the image alone without a generic “照片” title or empty text area. Keep descriptive alt text for accessibility separate from visible copy.
- A generated preview and a validated site may still be a draft. Do not create a hosting ZIP or publish while photo placeholders remain unless the user explicitly chooses a photo-free final version. Even with photos, wait for the user's final ready-to-share confirmation.
- Preserve the latest original witness-mode structure and behavior: clickable envelope and ornate rose seal, sequential scene unlocking, identity reveal and rejected path, the clickable “!” seal with its “天官赐福 / 百无禁忌” hidden passphrase easter egg, paper letter, continuously moving draggable film strip and lightbox, classified mission paper, effect-only acceptance, and the accepted scene. Treat the pulled upstream implementation as the reference; change only configurable content and explicitly requested behavior.
- Use the bundled `assets/paper-warm.jpg` through `--witness-paper-texture`: it is rebuilt from documented CC0 ambientCG papers to retain the warm vintage appearance. Preserve the paper texture, palette and grain; do not restore retired upstream images. Verify the texture in an actual phone-sized screenshot. Read [references/materials.md](references/materials.md) when changing assets or packaging.
- The default classic BGM loops and can be paused. The default is Kevin MacLeod's Canon in D Major under CC BY 4.0. Preserve its author credit, license link and modification notice via the visible materials link, materials.html, NOTICES.txt and full license texts in every site and release ZIP; do not add a non-commercial restriction. An explicit empty `media.music` disables it; a permitted replacement overrides it.
- Keep private data out of reusable skill assets. The bundled template contains no real couple, recipient, address or guest list.
- For link previews, use the bundled newly drawn sealed-envelope image by default, independent of gallery photos; do not ask for a share image unless the user wants to replace it. Before sharing a published recipient link, follow [references/deployment.md](references/deployment.md) to regenerate with that version's HTTPS URL and verify the public `og:image`. Do not claim the identity prompt protects a public letter.
- Never add a user's Cloudflare email, account ID, credentials, session data, tokens, authorization URLs, deployment history, or personal site links to this skill or its bundled assets. Keep account handling confined to the current user task; see [references/deployment.md](references/deployment.md).
- Keep the bundled template directly previewable: its `config.js` must contain sanitized demo data between the `WITNESS_CONFIG_START` and `WITNESS_CONFIG_END` markers. The generator replaces only that marked block. Never ship an unresolved placeholder that prevents the opening interaction from running.

## Bundled resources

- `assets/witness-template/`: sanitized witness-mode HTML/CSS/JS template and decorative assets.
- `scripts/create_witness_invitation.py`: builds a recipient-specific static site.
- `scripts/validate_witness_invitation.py`: validates facts, media and effect-only acceptance constraints.
- `scripts/package_witness_invitation.py`: validates and creates a hosting ZIP.
- `references/input-schema.md`: configuration contract and personalization/privacy guidance.
- `references/relation-letters.json`: user-facing relationship names, internal codes, and neutral starter letters.
- `references/deployment.md`: optional local-preview and Cloudflare Pages publishing procedure; read only when discussing or performing publication.
