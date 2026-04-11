package com.finio.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finio.app.dto.TransactionRequest;
import com.finio.app.dto.TransactionResponse;
import com.finio.app.entity.Transaction.TransactionType;
import com.finio.app.entity.User;
import com.finio.app.service.TransactionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;

/**
 * Handles natural-language transaction creation via AI.
 * e.g. "I spent ₹500 on food today" → parses and creates a transaction.
 */
@RestController
@RequestMapping("/api/ai")
public class NaturalLanguageController {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private final TransactionService transactionService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NaturalLanguageController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * POST /api/ai/parse-transaction
     * Body: { "text": "I spent ₹500 on food today" }
     * Returns: { "parsed": { ...transactionFields }, "created": TransactionResponse }
     */
    @PostMapping("/parse-transaction")
    public ResponseEntity<Map<String, Object>> parseAndCreate(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        if (groqApiKey == null || groqApiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "AI service not configured."));
        }

        String text = body.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
        }

        try {
            String prompt = """
                    You are a transaction parser for an Indian personal finance app called Finio.
                    Parse the following natural language input and extract transaction details.
                    Today's date is %s.
                    
                    Respond ONLY with a valid JSON object — no explanation, no markdown, no extra text.
                    Use exactly this structure:
                    {
                      "name": "short description (max 40 chars)",
                      "amount": 500.00,
                      "type": "EXPENSE or INCOME",
                      "category": "one of: Food, Transport, Health, Shopping, Entertainment, Bills, Other, Income",
                      "date": "YYYY-MM-DD",
                      "note": "optional brief note"
                    }
                    
                    Rules:
                    - amount must be a positive number (no currency symbols)
                    - For income (salary, received, earned etc) use type INCOME and category Income
                    - For expenses use type EXPENSE
                    - If no date mentioned, use today: %s
                    - If no category is clear, use Other
                    - Return ONLY the JSON, nothing else.
                    
                    Input: "%s"
                    """.formatted(LocalDate.now(), LocalDate.now(), text);

            Map<String, Object> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("messages", List.of(userMsg));
            requestBody.put("max_tokens", 200);
            requestBody.put("temperature", 0.1);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            @SuppressWarnings("unchecked")
            Map<String, Object> groqResponse = objectMapper.readValue(response.body(), Map.class);

            if (response.statusCode() >= 400) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(groqResponse);
            }

            // Extract JSON text from Groq response
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) groqResponse.get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String jsonText = String.valueOf(message.get("content")).trim();

            // Strip markdown if present
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.replaceAll("```json", "").replaceAll("```", "").trim();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(jsonText, Map.class);

            // Build TransactionRequest and save it
            TransactionRequest txReq = new TransactionRequest(
                    String.valueOf(parsed.get("name")),
                    new BigDecimal(String.valueOf(parsed.get("amount"))),
                    TransactionType.valueOf(String.valueOf(parsed.get("type"))),
                    String.valueOf(parsed.get("category")),
                    LocalDate.parse(String.valueOf(parsed.get("date"))),
                    parsed.get("note") != null ? String.valueOf(parsed.get("note")) : null
            );

            TransactionResponse created = transactionService.create(txReq, user);

            Map<String, Object> result = new HashMap<>();
            result.put("parsed", parsed);
            result.put("created", created);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Failed to parse transaction: " + e.getMessage()));
        }
    }
}