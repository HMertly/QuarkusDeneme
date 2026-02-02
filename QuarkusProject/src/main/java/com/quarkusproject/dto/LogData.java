package com.quarkusproject.dto;

import java.util.UUID;

public record LogData(
        UUID id,
        String zaman,
        String kaynak,
        String sebep,
        String mesaj,
        String ip
) {}