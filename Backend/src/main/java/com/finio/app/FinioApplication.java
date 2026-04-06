package com.finio.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinioApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinioApplication.class, args);
    }
}