/** Curly-brace alias to another token, e.g. `{color.primary}`. */
export type Alias = `{${string}}`;

/** JSON-pointer reference to a token value or one of its sub-values. */
export interface Reference {
  $ref: string;
}

/** A value of type `T`, or an alias/reference that resolves to one. */
export type AliasOr<T> = T | Alias | Reference;
