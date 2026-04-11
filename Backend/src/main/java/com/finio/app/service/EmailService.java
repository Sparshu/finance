package com.finio.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── Auth emails ───────────────────────────────────────────────────────────

    public void sendLoginOtp(String toEmail, String userName, String otp) {
        String subject = "Your Finio Login OTP";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>
                  <h2 style="margin:0 0 8px;font-size:20px">Your login OTP</h2>
                  <p style="color:#aaa;font-size:14px">Hi %s, use the code below to sign in to your account.</p>
                  <div style="background:#1e1e2e;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
                    <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#00d2a8">%s</div>
                    <div style="color:#666;font-size:12px;margin-top:8px">Valid for 10 minutes</div>
                  </div>
                  <p style="color:#666;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
                </div>
                """.formatted(userName, otp);
        send(toEmail, subject, html);
    }

    public void sendPasswordResetLink(String toEmail, String userName, String token) {
        String resetUrl = baseUrl + "/reset-password?token=" + token;
        String subject  = "Reset your Finio password";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>
                  <h2 style="margin:0 0 8px;font-size:20px">Reset your password</h2>
                  <p style="color:#aaa;font-size:14px">Hi %s, click the button below to set a new password.</p>
                  <div style="text-align:center;margin:28px 0">
                    <a href="%s" style="background:#00d2a8;color:#0f0f1a;text-decoration:none;padding:14px 36px;
                              border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                      Reset Password
                    </a>
                  </div>
                  <p style="color:#666;font-size:12px">This link expires in <strong>30 minutes</strong>.</p>
                  <hr style="border:none;border-top:1px solid #1e1e2e;margin:20px 0">
                  <p style="color:#444;font-size:11px;word-break:break-all">Or copy: %s</p>
                </div>
                """.formatted(userName, resetUrl, resetUrl);
        send(toEmail, subject, html);
    }

    // ── Bill reminder ─────────────────────────────────────────────────────────

    public void sendBillReminder(String toEmail, String userName,
                                  String billName, String billIcon,
                                  BigDecimal amount, int dueDay, int daysLeft) {
        String dueSoon   = daysLeft == 0 ? "due TODAY" : "due in " + daysLeft + " day" + (daysLeft == 1 ? "" : "s");
        String subject   = "⏰ Bill " + dueSoon + " – " + billName;
        String urgencyColor = daysLeft <= 3 ? "#ff9f43" : "#00d2a8";
        String badgeLabel   = daysLeft == 0 ? "Due TODAY" : daysLeft + " day" + (daysLeft == 1 ? "" : "s") + " left";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>

                  <h2 style="margin:0 0 8px;font-size:20px">Bill Due Reminder</h2>
                  <p style="color:#aaa;font-size:14px;margin-bottom:24px">Hi %s, don't forget — you have a bill coming up.</p>

                  <div style="background:#1e1e2e;border-radius:12px;padding:20px 24px;margin-bottom:20px;
                              border-left:4px solid %s">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                      <span style="font-size:28px">%s</span>
                      <div>
                        <div style="font-size:17px;font-weight:600;color:#fff">%s</div>
                        <div style="font-size:12px;color:#888;margin-top:2px">Due on day %d of this month</div>
                      </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div style="font-size:24px;font-weight:700;color:#fff">₹%s</div>
                      <div style="background:%s;color:#0f0f1a;padding:6px 14px;border-radius:20px;
                                  font-size:12px;font-weight:700">
                        %s
                      </div>
                    </div>
                  </div>

                  <p style="color:#666;font-size:12px">Log in to Finio to mark it paid once done.</p>
                </div>
                """.formatted(
                userName, urgencyColor,
                billIcon != null ? billIcon : "📄", billName, dueDay,
                amount.toPlainString(),
                urgencyColor, badgeLabel
        );
        send(toEmail, subject, html);
    }

    // ── Budget overspend alert ────────────────────────────────────────────────

    public void sendBudgetOverspendAlert(String toEmail, String userName,
                                          String category,
                                          BigDecimal limit, BigDecimal spent) {
        String subject = "🚨 Budget exceeded – " + category;
        BigDecimal overage = spent.subtract(limit);
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>

                  <h2 style="margin:0 0 8px;font-size:20px;color:#ff6b6b">Budget Exceeded</h2>
                  <p style="color:#aaa;font-size:14px;margin-bottom:24px">
                    Hi %s, your <strong style="color:#fff">%s</strong> budget has been exceeded this month.
                  </p>

                  <div style="background:#1e1e2e;border-radius:12px;padding:20px 24px;margin-bottom:20px;
                              border-left:4px solid #ff6b6b">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                      <span style="color:#888;font-size:13px">Budget Limit</span>
                      <span style="color:#fff;font-weight:600">₹%s</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                      <span style="color:#888;font-size:13px">Amount Spent</span>
                      <span style="color:#ff6b6b;font-weight:600">₹%s</span>
                    </div>
                    <div style="border-top:1px solid #2e2e3e;padding-top:10px;
                                display:flex;justify-content:space-between">
                      <span style="color:#888;font-size:13px">Over by</span>
                      <span style="color:#ff6b6b;font-weight:700;font-size:16px">₹%s</span>
                    </div>
                    <!-- Progress bar -->
                    <div style="margin-top:16px;background:#2e2e3e;border-radius:4px;height:6px;overflow:hidden">
                      <div style="background:#ff6b6b;width:100%%;height:100%%"></div>
                    </div>
                  </div>

                  <p style="color:#666;font-size:12px">
                    Consider reviewing your spending in Finio to get back on track.
                  </p>
                </div>
                """.formatted(
                userName, category,
                limit.toPlainString(), spent.toPlainString(), overage.toPlainString()
        );
        send(toEmail, subject, html);
    }

    // ── Goal milestone celebration ────────────────────────────────────────────

    public void sendGoalMilestone(String toEmail, String userName,
                                   String goalName, String goalIcon,
                                   BigDecimal saved, BigDecimal target,
                                   int milestonePercent) {
        boolean isComplete = milestonePercent >= 100;
        String subject = isComplete
                ? "🎉 Goal reached! – " + goalName
                : "🎯 " + milestonePercent + "% milestone reached – " + goalName;
        String accentColor = isComplete ? "#ffd700" : "#00d2a8";
        String headline    = isComplete ? "Goal Completed! 🎉" : milestonePercent + "% Milestone Reached!";
        String message     = isComplete
                ? "Incredible work, %s! You've fully reached your <strong style=\"color:#fff\">%s</strong> goal. Time to celebrate! 🥳"
                : "Great progress, %s! You've hit the <strong style=\"color:#fff\">%d%%</strong> milestone on your <strong style=\"color:#fff\">%s</strong> goal. Keep it up!";

        String formattedMessage = isComplete
                ? message.formatted(userName, goalName)
                : message.formatted(userName, milestonePercent, goalName);

        int barWidth = Math.min(milestonePercent, 100);

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>

                  <h2 style="margin:0 0 8px;font-size:20px;color:%s">%s</h2>
                  <p style="color:#aaa;font-size:14px;margin-bottom:24px">%s</p>

                  <div style="background:#1e1e2e;border-radius:12px;padding:20px 24px;margin-bottom:20px">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                      <span style="font-size:32px">%s</span>
                      <div style="font-size:17px;font-weight:600;color:#fff">%s</div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span style="color:#888;font-size:13px">Saved</span>
                      <span style="color:#fff;font-weight:600">₹%s of ₹%s</span>
                    </div>
                    <!-- Progress bar -->
                    <div style="background:#2e2e3e;border-radius:4px;height:8px;overflow:hidden">
                      <div style="background:%s;width:%d%%;height:100%%;border-radius:4px;
                                  transition:width 0.3s ease"></div>
                    </div>
                    <div style="text-align:right;margin-top:6px;font-size:12px;color:%s;font-weight:700">
                      %d%%
                    </div>
                  </div>

                  <p style="color:#666;font-size:12px">Keep going — log in to Finio to track your progress.</p>
                </div>
                """.formatted(
                accentColor, headline, formattedMessage,
                goalIcon != null ? goalIcon : "🎯", goalName,
                saved.toPlainString(), target.toPlainString(),
                accentColor, barWidth,
                accentColor, milestonePercent
        );
        send(toEmail, subject, html);
    }

    // ── Internal sender ───────────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Finio Finance");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email to " + to + ": " + e.getMessage(), e);
        }
    }
}