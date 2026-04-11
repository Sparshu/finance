import styles from './HelpLink.module.css'

const HELP_EMAIL   = 'finiofinance@gmail.com'
const HELP_SUBJECT = 'Help Request – Finio Finance'
const HELP_BODY    = 'Hi Finio Support,\n\nI need help with:\n\n[Describe your issue here]\n\nThanks'

/**
 * HelpLink
 *
 * Props:
 *   variant  – 'sidebar' | 'auth' | 'footer' | 'profile'  (controls layout/size)
 */
export default function HelpLink({ variant = 'footer' }) {
  const mailto = `mailto:${HELP_EMAIL}?subject=${encodeURIComponent(HELP_SUBJECT)}&body=${encodeURIComponent(HELP_BODY)}&from=${encodeURIComponent(HELP_EMAIL)}`

  if (variant === 'sidebar') {
    return (
      <a href={mailto} className={styles.sidebarLink} title="Contact Help Centre">
        <span className={styles.sidebarIcon}>?</span>
        Help Centre
      </a>
    )
  }

  if (variant === 'auth') {
    return (
      <div className={styles.authHelp}>
        Need help?{' '}
        <a href={mailto} className={styles.authHelpLink}>
          Contact Support
        </a>
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className={styles.profileHelp}>
        <div className={styles.profileHelpIcon}>💬</div>
        <div>
          <div className={styles.profileHelpTitle}>Help Centre</div>
          <div className={styles.profileHelpSub}>
            Having an issue? Our support team is here for you.
          </div>
        </div>
        <a href={mailto} className={styles.profileHelpBtn}>
          Email Support
        </a>
      </div>
    )
  }

  // default: 'footer'
  return (
    <div className={styles.footerHelp}>
      <span className={styles.footerIcon}>?</span>
      <span>Need help?</span>
      <a href={mailto} className={styles.footerLink}>
        {HELP_EMAIL}
      </a>
    </div>
  )
}