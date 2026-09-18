import { nanoid } from "nanoid";

export function newCheckId(): string {
  return nanoid(12);
}
