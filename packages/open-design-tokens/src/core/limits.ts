/**
 * Hard limits applied to every document. They exist so hostile input produces a
 * diagnostic instead of a crash. They are not configurable: raising them would
 * remove the protection, and no conforming DTCG file comes close to them.
 */

/** Maximum nesting depth of groups before `document.too-deep` is reported. */
export const MAX_DEPTH = 256;

/** Maximum length of a user-supplied string echoed into an issue message. */
export const MAX_MESSAGE_VALUE_LENGTH = 200;
