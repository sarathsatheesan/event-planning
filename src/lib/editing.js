import { createContext, useContext } from 'react'

/**
 * Whether the person looking at the page may change it.
 *
 * Editing was once open to everyone, with signed-out changes kept in
 * localStorage. That quietly destroyed work: Firestore is authoritative in
 * cloud mode, so anything edited before signing in was discarded the moment
 * you did, without warning. Rather than reconcile two sources of truth, the
 * page is read-only until you are a signed-in committee member.
 *
 * Defaults to false so a component rendered outside the provider is read-only
 * rather than accidentally editable.
 */
const EditableContext = createContext(false)

export const EditableProvider = EditableContext.Provider

export function useEditable() {
  return useContext(EditableContext)
}
