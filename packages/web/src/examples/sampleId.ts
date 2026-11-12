/** The id of a sample in its page URL (`/monaco/demo/hello-world-javascript/`): its title as a slug. */
export function sampleId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
