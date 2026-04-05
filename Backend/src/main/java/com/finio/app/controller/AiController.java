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

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT =
        "You are Finio AI, a personal finance advisor built into the Finio finance app. " +
        "You specialize in helping users apply the 50-30-20 budgeting rule to their finances.\n\n" +
        "The 50-30-20 rule:\n" +
        "- 50% → Needs (rent, groceries, utilities, transport, minimum debt payments)\n" +
        "- 30% → Wants (dining out, entertainment, subscriptions, shopping)\n" +
        "- 20% → Savings & Investments (emergency fund, retirement, investments, extra debt payments)\n\n" +
        "When a user tells you their income, calculate specific rupee amounts for each category. " +
        "Be warm, practical, and specific. Give concrete actionable advice. " +
        "Keep responses concise (2-4 sentences max unless doing a full breakdown). " +
        "Format currency as ₹X,XX,XXX using Indian number formatting. " +
        "If you do a full breakdown, use this format:\n" +
        "**Your 50-30-20 Breakdown**\n" +
        "• Needs (50%) — ₹X,XXX\n" +
        "• Wants (30%) — ₹X,XXX\n" +
        "• Savings (20%) — ₹X,XXX\n\n" +
        "Always end with one actionable tip.";

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "AI service not configured. Add gemini.api.key to application.properties.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        }

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> incomingMessages = (List<Map<String, Object>>) body.get("messages");

            List<Map<String, Object>> contents = new ArrayList<>();

            // Gemini has no system role — inject as first user/model exchange
            Map<String, Object> sysPart = new HashMap<>();
            sysPart.put("text", SYSTEM_PROMPT);
            List<Object> sysParts = new ArrayList<>();
            sysParts.add(sysPart);
            Map<String, Object> sysContent = new HashMap<>();
            sysContent.put("role", "user");
            sysContent.put("parts", sysParts);
            contents.add(sysContent);

            Map<String, Object> sysReplyPart = new HashMap<>();
            sysReplyPart.put("text", "Understood! I am Finio AI, ready to help with 50-30-20 budgeting advice.");
            List<Object> sysReplyParts = new ArrayList<>();
            sysReplyParts.add(sysReplyPart);
            Map<String, Object> sysReplyContent = new HashMap<>();
            sysReplyContent.put("role", "model");
            sysReplyContent.put("parts", sysReplyParts);
            contents.add(sysReplyContent);

            // Convert incoming messages
            if (incomingMessages != null) {
                for (Map<String, Object> msg : incomingMessages) {
                    String role = "assistant".equals(msg.get("role")) ? "model" : "user";
                    Map<String, Object> part = new HashMap<>();
                    part.put("text", String.valueOf(msg.get("content")));
                    List<Object> parts = new ArrayList<>();
                    parts.add(part);
                    Map<String, Object> content = new HashMap<>();
                    content.put("role", role);
                    content.put("parts", parts);
                    contents.add(content);
                }
            }

            Map<String, Object> genConfig = new HashMap<>();
            genConfig.put("maxOutputTokens", 1000);
            genConfig.put("temperature", 0.7);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);
            requestBody.put("generationConfig", genConfig);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            System.out.println("Sending to Gemini: " + jsonBody.substring(0, Math.min(200, jsonBody.length())));

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("Gemini response: " + response.statusCode() + " " + response.body());

            @SuppressWarnings("unchecked")
            Map<String, Object> geminiResponse = objectMapper.readValue(response.body(), Map.class);

            if (response.statusCode() >= 400) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(geminiResponse);
            }

            String replyText = extractGeminiText(geminiResponse);

            // Return in Anthropic-style format so frontend needs no changes
            Map<String, Object> textBlock = new HashMap<>();
            textBlock.put("type", "text");
            textBlock.put("text", replyText);
            List<Object> contentList = new ArrayList<>();
            contentList.add(textBlock);
            Map<String, Object> frontendResponse = new HashMap<>();
            frontendResponse.put("content", contentList);

            return ResponseEntity.ok(frontendResponse);

        } catch (Exception e) {
            System.out.println("AiController exception: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", "AI service unavailable: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(err);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<String, Object> geminiResponse) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) geminiResponse.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "Sorry, I could not generate a response.";
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return "Sorry, I could not generate a response.";
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return "Sorry, I could not generate a response.";
            return String.valueOf(parts.get(0).get("text"));
        } catch (Exception e) {
            return "Sorry, I had trouble reading the response.";
        }
    }
}