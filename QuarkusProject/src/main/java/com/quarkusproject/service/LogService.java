package com.quarkusproject.service;

import com.quarkusproject.dto.DashboardResponse;
import com.quarkusproject.dto.LogData;
import com.quarkusproject.dto.LogResponse;
import com.quarkusproject.repository.LogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.sql.SQLException;
import java.util.UUID;

@ApplicationScoped
public class LogService {

    @Inject
    LogRepository logRepository;

    public LogResponse getLogs(int page, int size) {
        // İş Kuralı: Sayfa numarası kontrolü burada da yapılabilir ama Validation daha iyi.
        int offset = (page - 1) * size;
        var logs = logRepository.findAll(size, offset);
        var total = logRepository.getTotalCount();
        return new LogResponse(logs, total);
    }

    public LogResponse searchLogs(String term, int page, int size) throws IOException {
        int offset = (page - 1) * size;
        var result = logRepository.searchInElastic(term, size, offset);
        return new LogResponse(result.logs(), result.total());
    }

    public DashboardResponse getDashboardStats() {
        var kaynakDagilimi = logRepository.getStats("kaynak", false);
        var hataDagilimi = logRepository.getStats("sebep", true);
        return new DashboardResponse(kaynakDagilimi, hataDagilimi);
    }

    public LogData getLogById(String id) throws IOException {
        return logRepository.findByIdInElastic(id);
    }

    public LogData createLog(LogData log) throws SQLException {
        // İş Kuralı: ID yoksa ata (Resource'tan buraya taşıdık)
        LogData logToSave = log;
        if (log.id() == null) {
            logToSave = new LogData(UUID.randomUUID(), log.zaman(), log.kaynak(), log.sebep(), log.mesaj(), log.ip());
        }
        logRepository.save(logToSave);
        return logToSave;
    }
}