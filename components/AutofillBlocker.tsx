"use client";

import { useEffect } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Browsers largely ignore a plain autocomplete="off" on password/login fields
// (Chrome, Firefox etc. use their own heuristics instead), so this stamps
// browser-recognized "don't do this" values that are actually respected —
// new-password on password fields defeats the saved-credential heuristic,
// and off + spellcheck/autocorrect disables cover everything else (address,
// name, search suggestions, etc). Runs once on mount plus on every DOM
// mutation, since the CRM renders forms dynamically (modals, dialogs,
// client-side navigation) well after this component's own initial pass.
function blockField(field: Field) {
  if (field.dataset.autofillBlocked) return;
  field.dataset.autofillBlocked = "1";

  const type = field instanceof HTMLInputElement ? field.type : "";
  if (type === "hidden" || type === "checkbox" || type === "radio" || type === "submit" || type === "button") {
    return;
  }

  field.setAttribute("autocomplete", type === "password" ? "new-password" : "off");
  field.setAttribute("autocorrect", "off");
  field.setAttribute("autocapitalize", "off");
  field.setAttribute("spellcheck", "false");
  // LastPass/Dashlane/1Password icon suppression — ignored by browsers
  // themselves but respected by most password-manager extensions.
  field.setAttribute("data-lpignore", "true");
  field.setAttribute("data-1p-ignore", "true");
  field.setAttribute("data-form-type", "other");
}

function blockFieldsIn(node: ParentNode) {
  node.querySelectorAll<Field>("input, textarea, select").forEach(blockField);
  node.querySelectorAll("form").forEach((form) => form.setAttribute("autocomplete", "off"));
}

const FIELD_SELECTOR = "input, textarea, select";

export function AutofillBlocker() {
  useEffect(() => {
    blockFieldsIn(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(FIELD_SELECTOR)) blockField(node as Field);
          if (node.matches("form")) node.setAttribute("autocomplete", "off");
          blockFieldsIn(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
