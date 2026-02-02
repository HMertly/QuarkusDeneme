package com.quarkusproject;
import java.util.List;

public class DashboardResponse {
    public List<StatDTO> kaynakDagilimi;
    public List<StatDTO> hataDagilimi;

    public DashboardResponse(List<StatDTO> kaynakDagilimi, List<StatDTO> hataDagilimi) {
        this.kaynakDagilimi = kaynakDagilimi;
        this.hataDagilimi = hataDagilimi;
    }
}