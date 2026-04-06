package com.finio.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String BASE_SYSTEM_PROMPT =
        "You are Finio AI, a personal finance advisor built into the Finio finance app. " +
        "You specialize in helping users manage their finances using the 50-30-20 budgeting rule.\n\n" +
        "The 50-30-20 rule:\n" +
        "- 50% Needs (rent, groceries, utilities, transport, minimum debt payments)\n" +
        "- 30% Wants (dining out, entertainment, subscriptions, shopping)\n" +
        "- 20% Savings and Investments (emergency fund, retirement, investments)\n\n" +
        "You have access to the user's REAL financial data shown below. " +
        "Use this data to give specific, personalized advice. " +
        "Reference actual amounts, categories and percentages from their data. " +
        "Be warm, practical and concise and also use simple language to suggest. Format all currency in Indian rupees (Rs X,XX,XXX).\n\n"+
        "Also keep the answer short and precise don't give long answers";
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "AI service not configured. Add groq.api.key to application.properties.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        }

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> incomingMessages = (List<Map<String, Object>>) body.get("messages");

            @SuppressWarnings("unchecked")
            Map<String, Object> context = (Map<String, Object>) body.get("context");

            // Build the system prompt with real user data injected
            String systemPrompt = BASE_SYSTEM_PROMPT + buildContextString(context);

            List<Map<String, Object>> messages = new ArrayList<>();

            Map<String, Object> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            if (incomingMessages != null) {
                for (Map<String, Object> msg : incomingMessages) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("role", msg.get("role"));
                    m.put("content", String.valueOf(msg.get("content")));
                    messages.add(m);
                }
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 1000);
            requestBody.put("temperature", 0.7);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            @SuppressWarnings("unchecked")
            Map<String, Object> groqResponse = objectMapper.readValue(response.body(), Map.class);

            if (response.statusCode() >= 400) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(groqResponse);
            }

            String replyText = extractGroqText(groqResponse);

            Map<String, Object> textBlock = new HashMap<>();
            textBlock.put("type", "text");
            textBlock.put("text", replyText);
            List<Object> contentList = new ArrayList<>();
            contentList.add(textBlock);
            Map<String, Object> frontendResponse = new HashMap<>();
            frontendResponse.put("content", contentList);

            return ResponseEntity.ok(frontendResponse);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", "AI service unavailable: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(err);
        }
    }

    @SuppressWarnings("unchecked")
    private String buildContextString(Map<String, Object> context) {
        if (context == null) return "No financial data available yet.\n";

        StringBuilder sb = new StringBuilder();
        sb.append("=== USER'S FINANCIAL DATA ===\n\n");

        // Transactions
        List<Map<String, Object>> txs = (List<Map<String, Object>>) context.get("txs");
        if (txs != null && !txs.isEmpty()) {
            double totalIncome  = 0, totalExpense = 0;
            Map<String, Double> categoryTotals = new LinkedHashMap<>();

            for (Map<String, Object> tx : txs) {
                double amount = toDouble(tx.get("amount"));
                String type   = String.valueOf(tx.get("type"));
                String cat    = String.valueOf(tx.get("category"));
                if ("INCOME".equals(type)) {
                    totalIncome += amount;
                } else {
                    totalExpense += amount;
                    categoryTotals.merge(cat, amount, Double::sum);
                }
            }

            sb.append("TRANSACTIONS (").append(txs.size()).append(" total):\n");
            sb.append("- Total Income:  Rs ").append(String.format("%,.0f", totalIncome)).append("\n");
            sb.append("- Total Expense: Rs ").append(String.format("%,.0f", totalExpense)).append("\n");
            sb.append("- Net Balance:   Rs ").append(String.format("%,.0f", totalIncome - totalExpense)).append("\n");

            if (!categoryTotals.isEmpty()) {
                sb.append("- Spending by Category:\n");
                final double finalIncome = totalIncome;
                categoryTotals.entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .forEach(e -> sb.append("  * ").append(e.getKey())
                        .append(": Rs ").append(String.format("%,.0f", e.getValue()))
                        .append(finalIncome > 0 ? " (" + String.format("%.0f", e.getValue() / finalIncome * 100) + "% of income)" : "")
                        .append("\n"));
            }
            sb.append("\n");
        } else {
            sb.append("TRANSACTIONS: None recorded yet.\n\n");
        }

        // Budgets
        List<Map<String, Object>> budgets = (List<Map<String, Object>>) context.get("budgets");
        if (budgets != null && !budgets.isEmpty()) {
            sb.append("BUDGETS (this month):\n");
            for (Map<String, Object> b : budgets) {
                double spent = toDouble(b.get("spent"));
                double limit = toDouble(b.get("limit"));
                int pct = limit > 0 ? (int)(spent / limit * 100) : 0;
                String status = pct > 100 ? " OVER BUDGET!" : pct > 85 ? " (near limit)" : "";
                sb.append("- ").append(b.get("category"))
                  .append(": Rs ").append(String.format("%,.0f", spent))
                  .append(" / Rs ").append(String.format("%,.0f", limit))
                  .append(" (").append(pct).append("%)").append(status).append("\n");
            }
            sb.append("\n");
        }

        // Goals
        List<Map<String, Object>> goals = (List<Map<String, Object>>) context.get("goals");
        if (goals != null && !goals.isEmpty()) {
            sb.append("SAVINGS GOALS:\n");
            for (Map<String, Object> g : goals) {
                sb.append("- ").append(g.get("name"))
                  .append(": Rs ").append(String.format("%,.0f", toDouble(g.get("savedAmount"))))
                  .append(" of Rs ").append(String.format("%,.0f", toDouble(g.get("targetAmount"))))
                  .append(" (").append(g.get("progressPercent")).append("% complete)\n");
            }
            sb.append("\n");
        }

        // Investments
        List<Map<String, Object>> investments = (List<Map<String, Object>>) context.get("investments");
        if (investments != null && !investments.isEmpty()) {
            double totalValue = investments.stream().mapToDouble(i -> toDouble(i.get("currentValue"))).sum();
            double totalGain  = investments.stream().mapToDouble(i -> toDouble(i.get("gainLoss"))).sum();
            sb.append("INVESTMENTS (").append(investments.size()).append(" holdings):\n");
            sb.append("- Portfolio Value: Rs ").append(String.format("%,.0f", totalValue)).append("\n");
            sb.append("- Total Gain/Loss: Rs ").append(String.format("%,.0f", totalGain)).append("\n");
            for (Map<String, Object> inv : investments) {
                sb.append("- ").append(inv.get("ticker")).append(" (").append(inv.get("name")).append(")")
                  .append(": Rs ").append(String.format("%,.0f", toDouble(inv.get("currentValue"))))
                  .append(" | ").append(inv.get("gainLossPercent")).append("% gain/loss\n");
            }
            sb.append("\n");
        }

        sb.append("=== END OF USER DATA ===\n");
        return sb.toString();
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        try { return Double.parseDouble(String.valueOf(val)); }
        catch (Exception e) { return 0.0; }
    }

    @SuppressWarnings("unchecked")
    private String extractGroqText(Map<String, Object> groqResponse) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) groqResponse.get("choices");
            if (choices == null || choices.isEmpty()) return "Sorry, I could not generate a response.";
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message == null) return "Sorry, I could not generate a response.";
            return String.valueOf(message.get("content"));
        } catch (Exception e) {
            return "Sorry, I had trouble reading the response.";
        }
    }
}