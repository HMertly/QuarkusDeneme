package com.quarkusproject;

public class StatDTO {
    public String name;  // Örn: WEB, MOBILE, AUTH_FAIL
    public long value;   // Örn: 150

    public StatDTO(String name, long value) {
        this.name = name;
        this.value = value;
    }
}