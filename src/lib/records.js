/** Next free integer id for a list of records. Kept out of the component file
 *  so React Fast Refresh keeps working there. */
export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1
}
