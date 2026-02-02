package com.quarkusproject;

import java.util.List;

public class LogResponse {
    private List<LogData> data;
    private long totalCount;

    public LogResponse(List<LogData> data, long totalCount) {
        this.data = data;
        this.totalCount = totalCount;
    }

    public List<LogData> getData() { return data; }
    public void setData(List<LogData> data) { this.data = data; }
    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
}