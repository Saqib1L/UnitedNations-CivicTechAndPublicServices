# Estate Unlock UI guidelines

Reviewed 21 October 2026. These guidelines are informed by Malaysia Government Design System (MYDS) principles, adapt GOV.UK service-design patterns to estate collaboration and use WCAG 2.2 AA as an accessibility target. GOV.UK patterns are design guidance, not Malaysian legal requirements. Applying them does not establish WCAG conformance; test the resulting interface with users and assistive technology.

[MYDS](https://design.digital.gov.my/en/docs/design) provides a local reference for consistent, simple and inclusive public-service portals. Its [login template](https://design.digital.gov.my/en/docs/develop/login) illustrates a centred, responsive sign-in form; its [accessibility guidance](https://design.digital.gov.my/en/docs/develop/accessibility) covers keyboard access, focus, labels and contrast. Estate Unlock follows these principles using its existing components and system fonts. It does not adopt the MYDS component library, claim full MYDS compliance or use official government branding. The MYDS login example is a design template; Estate Unlock's authentication remains its own working implementation.

## Direction

Families may be grieving, unfamiliar with legal terms and using a phone. The interface should make the next useful action obvious. Lawyers and officers need efficient review queues, with the same clear language and accessibility. Preserve the legal workflow and server permissions while reducing how much appears at once.

| Researched principle | Estate Unlock application | Source |
| --- | --- | --- |
| Consistent, simple and inclusive service patterns. | Use familiar controls, predictable navigation and a centred single-column sign-in form; retain Estate Unlock branding and system fonts. | [MYDS overview](https://design.digital.gov.my/en/docs/design), [login template](https://design.digital.gov.my/en/docs/develop/login) |
| Show tasks with clear completion states. | Lead family case overview with their next request, then a short list of remaining tasks. Waiting is a meaningful state: name who acts next. | [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/) |
| Avoid competing main actions. | Use one visually dominant action in the current task area; use secondary controls for supporting operations. Button labels describe the result, such as Upload document. | [GOV.UK button](https://design-system.service.gov.uk/components/button/) |
| Reveal information needed only by some users. | Put full process history, extended case facts and detailed explanations behind named disclosures. Keep blockers, required evidence, due appointments and simulation notices visible where relevant. | [GOV.UK details](https://design-system.service.gov.uk/components/details/) |
| Start forms with one question or decision per page and ask only necessary questions. | Keep intake in focused steps with save/resume and a confirmation step. Preserve uncertainty answers such as I don't know. Group related fields only when they support one understandable task. | [GOV.UK form structure](https://www.gov.uk/service-manual/design/form-structure) |
| Specialists also need clear, accessible services. | Keep lawyer/officer queues and document-review tools; remove decorative statistics and duplicated explanations. Use dense layouts only where they help repeated review. | [GOV.UK internal services](https://www.gov.uk/service-manual/design/services-for-government-users) |
| Use short, familiar wording. | Say What you need to do and Waiting for your lawyer. Explain necessary terms such as distribution order in context. BM/English labels must have the same meaning. | [GOV.UK interface writing](https://www.gov.uk/service-manual/design/writing-for-user-interfaces) |

## Information hierarchy

Use this order on family overview:

1. Estate identity and a short current-stage statement.
2. The family's next action, owner and specific evidence needed; if there is none, identify who is handling the case.
3. Upcoming appointment when one exists.
4. A small number of useful links to tasks, documents and assets.
5. Optional process detail, recent activity and case facts.

The six-stage model remains Prepare → Legal review → Submit → Agency review/hearing → Order issued → Asset release. Show the current stage in plain text; the full journey can be expanded. Do not replace unresolved asset work with a completed order badge. Show counts such as 1 of 4 assets released instead of a percentage implying predictable duration.

Family global navigation contains Your estates and Updates. Estate cards show their task count and one View estate action; pending enquiries offer resume. Case sections are Overview, My tasks, Documents, Assets and Updates. These are ordinary wrapped navigation links/buttons with a current-page indicator, not a tab widget requiring arrow-key behavior.

Professional dashboards begin with work requiring attention and a case/application queue. Case workspaces retain domain sections and review controls. A quieter dashboard must not remove access to fees, people, liabilities, hearings, decisions or historical submission revisions.

## Layout and components

These are project choices informed by the research, not numeric requirements imposed by GOV.UK:

- Use a single reading column for family guidance and forms; use tables/split review panes for professional work that benefits from them.
- Keep a small, stable role-specific navigation. Label sections with familiar nouns and mark the current page.
- Use a system font, readable body text, generous line height, solid light content surfaces, subtle borders and restrained navy accents. Avoid large decorative hero panels, repeated icon tiles and dashboard metrics that do not lead to an action.
- Reserve colour for emphasis and state. Pair each status colour with text; green alone must not imply an estate is legally complete.
- Keep immediate press/pending feedback from `design-skill-command.md`. Use movement sparingly and respect reduced-motion settings. No motion is needed to understand or complete a task.
- Keep demo account shortcuts available in an optional section on sign-in. Explain simulations at the relevant action and preserve a clear demo label without repeating lengthy disclaimers throughout the page.
- Use dialogs for a focused review or action, with a clear title, keyboard dismissal and restored focus. Long intake belongs in steps, not a crowded modal.

## Accessibility targets

| Target | Project rule and distinction | Source |
| --- | --- | --- |
| Form labels | Visible, descriptive labels explicitly associated with controls; optional hints remain associated. Placeholder text does not replace a label. | [W3C labels tutorial](https://www.w3.org/WAI/tutorials/forms/labels/) |
| Text contrast | Aim for at least 4.5:1 for normal text; WCAG permits 3:1 for qualifying large text, with stated exceptions. Check the actual foreground/background combinations. | [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Keyboard focus | Visible focus indicator; logical order, no trapped keyboard navigation outside a modal. Restore focus when a dialog closes. | [WCAG 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) |
| Reflow | Check normal content at 320 CSS px and 400% zoom without lost controls or page-wide horizontal scrolling. Essential tables/document previews may need their own scroll area. | [WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |
| Touch targets | Project preference: at least 44px control height for common family actions. WCAG 2.2 AA minimum is 24×24 CSS px, with spacing and other exceptions; 44px is our usability choice. | [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| Status feedback | Announce save/upload/error outcomes appropriately without forcing focus onto every update; preserve useful task context. | [WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) |

## Review checklist

Walk through family correction, lawyer publication, officer query, family response, resubmission, order and asset release. At every handoff, a first-time user should be able to identify the current stage, required action, responsible person and what happens afterward. Test both enquiry and invitation entry paths.

Check keyboard-only completion, dialog focus, visible errors, BM/English labels, 320px/390px widths and desktop review. Confirm private documents and unpublished revisions remain protected even when navigation becomes simpler. Automated walkthroughs provide regression evidence; they do not replace usability sessions with families or a full accessibility audit. Completed checks belong in [verification.md](verification.md), not in this design target document.

## Sources

All sources accessed **21 October 2026**:

- [GOV.UK Design System: Task list](https://design-system.service.gov.uk/components/task-list/)
- [MYDS: Design overview](https://design.digital.gov.my/en/docs/design)
- [MYDS: Login template](https://design.digital.gov.my/en/docs/develop/login)
- [MYDS: Accessibility guidance](https://design.digital.gov.my/en/docs/develop/accessibility)
- [GOV.UK Design System: Button](https://design-system.service.gov.uk/components/button/)
- [GOV.UK Design System: Details](https://design-system.service.gov.uk/components/details/)
- [GOV.UK Service Manual: Structuring forms](https://www.gov.uk/service-manual/design/form-structure)
- [GOV.UK Service Manual: Services for government users](https://www.gov.uk/service-manual/design/services-for-government-users)
- [GOV.UK Service Manual: Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)
- [W3C WAI: Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/)
- [W3C: Understanding contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C: Understanding focus visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [W3C: Understanding reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [W3C: Understanding target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [W3C: Understanding status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
