/** Window event that opens the hidden demo controls panel. */
export const DEMO_CONTROLS_EVENT = 'inline:demo-controls'

export function openDemoControls(): void {
  window.dispatchEvent(new CustomEvent(DEMO_CONTROLS_EVENT))
}
