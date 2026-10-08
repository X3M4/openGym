// The weekly deficit-alerts notification (Android/iOS app): when the app goes to the background
// with alerts not yet acknowledged, one notification is (re)scheduled for the next Monday at 09:00;
// with none left, it is cancelled. At most one a week, and never for alerts already seen.
import { MOBILE } from './mobile.js'
import { deficitAlerts, nextMonday9 } from './deficit-alerts.js'
import { weekStartOf, isoOf } from './format.js'
import { t } from './i18n.js'

export const ALERT_NOTIFICATION_ID = 2100

export async function syncAlertNotification(S, { interactive = false } = {}) {
  if (!MOBILE) return false
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: ALERT_NOTIFICATION_ID }] }).catch(() => {})
    if (!S?.alertsNotify) return true
    let perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted' && interactive) perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return false
    const { unseen } = deficitAlerts(S, isoOf(new Date()), weekStartOf(S))
    if (!unseen.length) return true
    await LocalNotifications.schedule({ notifications: [{
      id: ALERT_NOTIFICATION_ID,
      title: t('Training in a deficit'),
      body: t(unseen.length === 1 ? '1 alert about your strength or training volume.' : '{0} alerts about your strength or training volume.', unseen.length),
      schedule: { at: nextMonday9(new Date()), allowWhileIdle: true },
    }] })
    return true
  } catch { return false }
}

let started = false
/** Re-schedule whenever the app is hidden — the state is then at its latest. */
export function initAlertNotifications(getState) {
  if (!MOBILE || started) return
  started = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syncAlertNotification(getState().S).catch(() => {})
  })
}
