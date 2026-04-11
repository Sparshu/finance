package com.finio.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Sends emails via Brevo HTTP API (port 443 HTTPS).
 * Works on Render free tier unlike SMTP which is blocked.
 *
 * Required environment variables:
 *   BREVO_API_KEY  — your Brevo API key (starts with xkeysib-)
 *   MAIL_FROM      — sender email (e.g. finiofinance@gmail.com)
 *   APP_BASE_URL   — frontend URL for password reset links
 */
@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${mail.from}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

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
        send(toEmail, userName, subject, html);
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
        send(toEmail, userName, subject, html);
    }

    // ── Bill reminder ─────────────────────────────────────────────────────────

    public void sendBillReminder(String toEmail, String userName,
                                  String billName, String billIcon,
                                  BigDecimal amount, int dueDay, int daysLeft) {
        String dueSoon      = daysLeft == 0 ? "due TODAY" : "due in " + daysLeft + " day" + (daysLeft == 1 ? "" : "s");
        String subject      = "Bill " + dueSoon + " - " + billName;
        String urgencyColor = daysLeft <= 3 ? "#ff9f43" : "#00d2a8";
        String badgeLabel   = daysLeft == 0 ? "Due TODAY" : daysLeft + " day" + (daysLeft == 1 ? "" : "s") + " left";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>
                  <h2 style="margin:0 0 8px;font-size:20px">Bill Due Reminder</h2>
                  <p style="color:#aaa;font-size:14px;margin-bottom:24px">Hi %s, you have a bill coming up.</p>
                  <div style="background:#1e1e2e;border-radius:12px;padding:20px 24px;margin-bottom:20px;border-left:4px solid %s">
                    <div style="font-size:17px;font-weight:600;color:#fff;margin-bottom:8px">%s %s</div>
                    <div style="font-size:12px;color:#888;margin-bottom:12px">Due on day %d of this month</div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div style="font-size:24px;font-weight:700;color:#fff">Rs %s</div>
                      <div style="background:%s;color:#0f0f1a;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700">%s</div>
                    </div>
                  </div>
                  <p style="color:#666;font-size:12px">Log in to Finio to mark it paid.</p>
                </div>
                """.formatted(userName, urgencyColor,
                billIcon != null ? billIcon : "", billName, dueDay,
                amount.toPlainString(), urgencyColor, badgeLabel);
        send(toEmail, userName, subject, html);
    }

    // ── Budget overspend alert ────────────────────────────────────────────────

    public void sendBudgetOverspendAlert(String toEmail, String userName,
                                          String category,
                                          BigDecimal limit, BigDecimal spent) {
        String subject    = "Budget exceeded - " + category;
        BigDecimal overage = spent.subtract(limit);
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;
                            background:#0f0f1a;border-radius:16px;border:1px solid #1e1e2e;color:#e0e0e0">
                  <div style="font-size:28px;font-weight:700;color:#00d2a8;margin-bottom:4px">fin<span style="color:#fff">io</span></div>
                  <div style="font-size:12px;color:#666;margin-bottom:28px">Smart Finance Tracker</div>
                  <h2 style="margin:0 0 8px;font-size:20px;color:#ff6b6b">Budget Exceeded</h2>
                  <p style="color:#aaa;font-size:14px;margin-bottom:24px">Hi %s, your <strong style="color:#fff">%s</strong> budget has been exceeded.</p>
                  <div style="background:#1e1e2e;border-radius:12px;padding:20px 24px;margin-bottom:20px;border-left:4px solid #ff6b6b">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                      <span style="color:#888;font-size:13px">Budget Limit</span>
                      <span style="color:#fff;font-weight:600">Rs %s</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                      <span style="color:#888;font-size:13px">Amount Spent</span>
                      <span style="color:#ff6b6b;font-weight:600">Rs %s</span>
                    </div>
                    <div style="border-top:1px solid #2e2e3e;padding-top:10px;display:flex;justify-content:space-between">
                      <span style="color:#888;font-size:13px">Over by</span>
                      <span style="color:#ff6b6b;font-weight:700;font-size:16px">Rs %s</span>
                    </div>
                  </div>
                  <p style="color:#666;font-size:12px">Review your spending in Finio to get back on track.</p>
                </div>
                """.formatted(userName, category,
                limit.toPlainString(), spent.toPlainString(), overage.toPlainString());
        send(toEmail, userName, subject, html);
    }

    // ── Goal milestone ────────────────────────────────────────────────────────

    public void sendGoalMilestone(String toEmail, String userName,
                                   String goalName, String goalIcon,
                                   BigDecimal saved, BigDecimal target,
                                   int milestonePercent) {
        boolean isComplete  = milestonePercent >= 100;
        String subject      = isComplete ? "Goal reached! - " + goalName : milestonePercent + "% milestone - " + goalName;
        String accentColor  = isComplete ? "#ffd700" : "#00d2a8";
        String headline     = isComplete ? "Goal Completed!" : milestonePercent + "% Milestone Reached!";
        String message      = isComplete
                ? "Incredible work, %s! You've fully reached your <strong style=\"color:#fff\">%s</strong> goal!"
                : "Great progress, %s! You've hit the <strong style=\"color:#fff\">%d%%</strong> milestone on <strong style=\"color:#fff\">%s</strong>!";
        String formattedMsg = isComplete
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
                    <div style="font-size:17px;font-weight:600;color:#fff;margin-bottom:12px">%s %s</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span style="color:#888;font-size:13px">Saved</span>
                      <span style="color:#fff;font-weight:600">Rs %s of Rs %s</span>
                    </div>
                    <div style="background:#2e2e3e;border-radius:4px;height:8px;overflow:hidden">
                      <div style="background:%s;width:%d%%;height:100%%;border-radius:4px"></div>
                    </div>
                    <div style="text-align:right;margin-top:6px;font-size:12px;color:%s;font-weight:700">%d%%</div>
                  </div>
                  <p style="color:#666;font-size:12px">Log in to Finio to track your progress.</p>
                </div>
                """.formatted(accentColor, headline, formattedMsg,
                goalIcon != null ? goalIcon : "", goalName,
                saved.toPlainString(), target.toPlainString(),
                accentColor, barWidth, accentColor, milestonePercent);
        send(toEmail, userName, subject, html);
    }

    // ── Brevo HTTP API sender ─────────────────────────────────────────────────

    private void send(String toEmail, String toName, String subject, String html) {
        try {
            Map<String, Object> to   = Map.of("email", toEmail, "name", toName);
            Map<String, Object> from = Map.of("email", fromEmail, "name", "Finio Finance");

            Map<String, Object> body = new HashMap<>();
            body.put("sender", from);
            body.put("to", List.of(to));
            body.put("subject", subject);
            body.put("htmlContent", html);

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("Content-Type", "application/json")
                    .header("api-key", brevoApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                throw new RuntimeException("Brevo API error " + response.statusCode() + ": " + response.body());
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to send email to " + toEmail + ": " + e.getMessage(), e);
        }
    }
}