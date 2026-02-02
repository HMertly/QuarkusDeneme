package com.quarkusproject.dto;

import java.util.List;

public record DashboardResponse(
        List<StatDTO> kaynakDagilimi,
        List<StatDTO> hataDagilimi
) {}