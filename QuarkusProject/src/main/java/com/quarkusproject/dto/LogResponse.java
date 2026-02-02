package com.quarkusproject.dto;

import java.util.List;

public record LogResponse(List<LogData> data, long totalCount) {}